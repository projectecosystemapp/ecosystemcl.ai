-- MCP System Database Schema
-- Adds support for Master Control Program, hierarchical agents, and tool system

-- Plans table: Stores generated execution plans
CREATE TABLE plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  
  goal TEXT NOT NULL,
  plan_type TEXT CHECK (plan_type IN ('fast', 'thorough', 'novel')) NOT NULL,
  
  -- Plan evaluation metrics
  estimated_cost INTEGER NOT NULL,
  estimated_time INTEGER NOT NULL, -- seconds
  risk_score DECIMAL(3,2) CHECK (risk_score >= 0 AND risk_score <= 1),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  -- Plan status
  status TEXT CHECK (status IN ('generated', 'approved', 'executing', 'completed', 'failed')) DEFAULT 'generated',
  
  -- Constraints applied
  constraints JSONB,
  
  -- Results
  actual_cost INTEGER,
  actual_time INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Plan steps: Individual steps within a plan
CREATE TABLE plan_steps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  
  step_order INTEGER NOT NULL,
  agent_id TEXT NOT NULL,
  task TEXT NOT NULL,
  
  -- Dependencies
  dependencies TEXT[], -- Array of step IDs this step depends on
  
  -- Authentication and model selection
  auth_config_id UUID, -- References user's auth configs
  model_override TEXT, -- Override default model for this step
  
  -- Cost estimation
  estimated_credits INTEGER NOT NULL,
  actual_credits INTEGER,
  
  -- Tool permissions
  allowed_tools TEXT[],
  
  -- Status
  status TEXT CHECK (status IN ('pending', 'ready', 'running', 'completed', 'failed')) DEFAULT 'pending',
  
  -- Results
  output TEXT,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- User authentication configurations
CREATE TABLE user_auth_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  config_name TEXT NOT NULL, -- e.g., "My OpenAI Key", "Company Claude Key"
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'google', 'forge_credits'
  
  -- Encrypted credentials
  encrypted_credentials TEXT, -- Encrypted API key or token
  
  -- Configuration
  default_model TEXT,
  rate_limits JSONB, -- Custom rate limits
  
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  
  UNIQUE(user_id, config_name)
);

-- Prompt templates for centralized prompt management
CREATE TABLE prompt_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  
  template TEXT NOT NULL,
  variables TEXT[], -- Variables that can be substituted
  
  -- Metadata
  metadata JSONB,
  
  -- Performance tracking for A/B testing
  usage_count INTEGER DEFAULT 0,
  avg_tokens INTEGER DEFAULT 0,
  success_rate DECIMAL(3,2) DEFAULT 0,
  avg_cost INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(agent_id, version)
);

-- Tool execution logs
CREATE TABLE tool_executions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  step_id UUID REFERENCES plan_steps(id) ON DELETE CASCADE,
  
  tool_name TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  
  -- Input/Output
  input_args JSONB NOT NULL,
  output_result JSONB,
  
  -- Execution details
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  execution_time INTEGER, -- milliseconds
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Sub-plans for hierarchical agent delegation
CREATE TABLE sub_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_step_id UUID REFERENCES plan_steps(id) ON DELETE CASCADE,
  child_plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  
  -- Delegation context
  delegation_reason TEXT,
  max_depth INTEGER DEFAULT 3,
  current_depth INTEGER DEFAULT 1,
  
  -- Budget allocation
  allocated_credits INTEGER,
  used_credits INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User credit transactions
CREATE TABLE credit_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  transaction_type TEXT CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus')) NOT NULL,
  amount INTEGER NOT NULL, -- Positive for credits added, negative for credits used
  
  -- Context
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  description TEXT,
  
  -- Balance tracking
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_plans_user_status ON plans(user_id, status);
CREATE INDEX idx_plan_steps_plan_order ON plan_steps(plan_id, step_order);
CREATE INDEX idx_plan_steps_status ON plan_steps(status);
CREATE INDEX idx_plan_steps_dependencies ON plan_steps USING GIN(dependencies);
CREATE INDEX idx_user_auth_configs_user ON user_auth_configs(user_id, is_active);
CREATE INDEX idx_prompt_templates_agent_active ON prompt_templates(agent_id, is_active);
CREATE INDEX idx_tool_executions_job ON tool_executions(job_id);
CREATE INDEX idx_sub_plans_parent ON sub_plans(parent_step_id);
CREATE INDEX idx_credit_transactions_user_date ON credit_transactions(user_id, created_at);

-- Update jobs table to reference plans
ALTER TABLE jobs ADD COLUMN plan_id UUID REFERENCES plans(id) ON DELETE SET NULL;
ALTER TABLE jobs ADD COLUMN step_id UUID REFERENCES plan_steps(id) ON DELETE SET NULL;
ALTER TABLE jobs ADD COLUMN auth_config_id UUID REFERENCES user_auth_configs(id) ON DELETE SET NULL;

-- RLS Policies
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_auth_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own plans
CREATE POLICY "Users can view own plans" ON plans
  FOR SELECT USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can view own plan steps" ON plan_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM plans 
      WHERE plans.id = plan_steps.plan_id 
      AND plans.user_id = auth.uid()::TEXT
    )
  );

CREATE POLICY "Users can view own auth configs" ON user_auth_configs
  FOR SELECT USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can view own tool executions" ON tool_executions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = tool_executions.job_id 
      AND jobs.user_id = auth.uid()::TEXT
    )
  );

CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid()::TEXT = user_id);

-- Prompt templates are readable by all (for now)
CREATE POLICY "Prompt templates are readable" ON prompt_templates
  FOR SELECT USING (true);

-- Functions for credit management
CREATE OR REPLACE FUNCTION deduct_user_credits(
  p_user_id TEXT,
  p_amount INTEGER,
  p_job_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT credits_remaining INTO current_balance
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  IF current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  -- Calculate new balance
  new_balance := current_balance - p_amount;
  
  -- Update user balance
  UPDATE user_profiles
  SET credits_remaining = new_balance,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO credit_transactions (
    user_id, transaction_type, amount, job_id, description,
    balance_before, balance_after
  ) VALUES (
    p_user_id, 'usage', -p_amount, p_job_id, p_description,
    current_balance, new_balance
  );
  
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to update prompt performance
CREATE OR REPLACE FUNCTION update_prompt_performance(
  p_template_id UUID,
  p_tokens INTEGER,
  p_success BOOLEAN,
  p_cost INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE prompt_templates
  SET 
    usage_count = usage_count + 1,
    avg_tokens = (avg_tokens * usage_count + p_tokens) / (usage_count + 1),
    success_rate = (success_rate * usage_count + CASE WHEN p_success THEN 1 ELSE 0 END) / (usage_count + 1),
    avg_cost = (avg_cost * usage_count + p_cost) / (usage_count + 1),
    updated_at = NOW()
  WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_auth_configs_updated_at BEFORE UPDATE ON user_auth_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_templates_updated_at BEFORE UPDATE ON prompt_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();