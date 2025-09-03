-- Migration 002: Evolve from Jobs to Multi-Agent Workflow Engine with BYOK
-- This transforms the single-job architecture into an intelligent multi-step plan system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For encryption
CREATE EXTENSION IF NOT EXISTS "pgsodium"; -- For secure key storage
CREATE EXTENSION IF NOT EXISTS "vector"; -- For embeddings

-- Enum for model providers
CREATE TYPE provider_type AS ENUM (
  'openai',
  'anthropic',
  'google',
  'groq',
  'together',
  'fireworks',
  'replicate',
  'forge_standard', -- Our platform-provided models
  'self_hosted'
);

-- Transform jobs to plans
ALTER TABLE jobs RENAME TO plans;
ALTER TABLE plans 
  ADD COLUMN name TEXT,
  ADD COLUMN goal TEXT NOT NULL DEFAULT 'No goal specified',
  ADD COLUMN total_steps INTEGER DEFAULT 0,
  ADD COLUMN completed_steps INTEGER DEFAULT 0,
  DROP COLUMN command CASCADE,
  DROP COLUMN args CASCADE,
  DROP COLUMN agent_type CASCADE,
  DROP COLUMN priority CASCADE;

-- Agent profiles: System-defined templates for specialized agents
CREATE TABLE agent_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  system_prompt TEXT, -- The base prompt for this agent type
  capabilities JSONB, -- What this agent can do
  required_context TEXT[], -- What context this agent needs
  max_tokens INTEGER DEFAULT 4096,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial agent profiles
INSERT INTO agent_profiles (name, description, system_prompt, capabilities) VALUES
  ('orchestrator', 'Breaks down goals into executable plans', 
   'You are an expert software architect. Analyze the goal and create a detailed plan.',
   '{"can_read_workspace_state": true, "can_update_workspace_state": true}'::jsonb),
  
  ('code_generator', 'Writes production-quality code',
   'You are an expert programmer. Write clean, efficient, well-documented code.',
   '{"languages": ["javascript", "typescript", "python", "sql"], "frameworks": ["react", "next", "fastapi"]}'::jsonb),
  
  ('database_architect', 'Designs and optimizes database schemas',
   'You are a database expert. Design efficient, normalized schemas with proper indexes.',
   '{"databases": ["postgresql", "mysql", "mongodb"], "can_optimize": true}'::jsonb),
  
  ('security_auditor', 'Identifies vulnerabilities and security issues',
   'You are a security expert. Identify vulnerabilities using OWASP guidelines.',
   '{"checks": ["sql_injection", "xss", "csrf", "auth"], "standards": ["owasp", "cwe"]}'::jsonb),
  
  ('code_reviewer', 'Reviews code for quality and best practices',
   'You are a senior code reviewer. Check for bugs, style, performance, and maintainability.',
   '{"review_types": ["functional", "performance", "style", "security"]}'::jsonb),
  
  ('codebase_embedder', 'Creates vector embeddings of entire codebases',
   'You chunk and embed codebases for semantic search.',
   '{"embedding_model": "text-embedding-3-small", "chunk_strategy": "ast"}'::jsonb),
  
  ('deep_analyzer', 'Performs complex codebase analysis using embeddings',
   'You analyze codebases using semantic search and dependency graphs.',
   '{"analysis_types": ["dependencies", "impact", "complexity", "patterns"]}'::jsonb);

-- User agent configurations: BYOK with encrypted API keys
CREATE TABLE user_agent_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Clerk user ID
  agent_profile_id UUID REFERENCES agent_profiles(id) ON DELETE CASCADE,
  
  -- Provider configuration
  provider provider_type NOT NULL,
  model_name TEXT, -- e.g., 'gpt-4o', 'claude-3-opus', 'llama-3-70b'
  api_base_url TEXT, -- For custom/open-source endpoints
  
  -- Encrypted API key (null for forge_standard tier)
  encrypted_api_key TEXT, -- Encrypted with pgsodium
  key_id UUID, -- Reference to pgsodium key
  
  -- Usage limits
  is_active BOOLEAN DEFAULT true,
  monthly_token_limit INTEGER, -- null = unlimited
  tokens_used_this_month INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, agent_profile_id, provider)
);

-- Create secure key storage function
CREATE OR REPLACE FUNCTION encrypt_api_key(key_text TEXT) 
RETURNS TABLE (encrypted_key TEXT, key_id UUID) AS $$
DECLARE
  key_uuid UUID;
  encrypted TEXT;
BEGIN
  -- Generate a new key ID
  key_uuid := gen_random_uuid();
  
  -- Encrypt using pgsodium (in production, use proper key management)
  encrypted := encode(
    pgsodium.crypto_secretbox(
      key_text::bytea,
      gen_random_bytes(24), -- nonce
      ('\x0000000000000000000000000000000000000000000000000000000000000000')::bytea -- Use proper key in production
    ),
    'base64'
  );
  
  RETURN QUERY SELECT encrypted, key_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Steps: Individual tasks within a plan
CREATE TABLE steps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  agent_profile_id UUID REFERENCES agent_profiles(id),
  step_number INTEGER NOT NULL,
  
  -- Step configuration
  name TEXT,
  prompt TEXT,
  requires_approval BOOLEAN DEFAULT false,
  timeout_seconds INTEGER DEFAULT 300,
  
  -- Input/Output
  input_data JSONB, -- From previous step or user
  output_data JSONB, -- Result of execution
  approval_data JSONB, -- User modifications if approved
  
  -- Execution tracking
  status job_status DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Cost tracking
  token_usage JSONB, -- {"prompt": 1024, "completion": 2048, "total": 3072}
  estimated_cost DECIMAL(10, 4), -- In USD
  
  -- Logs
  execution_logs TEXT,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, step_number)
);

-- Workspace state: The shared brain for agents
CREATE TABLE workspace_states (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- The evolving context
  state_data JSONB DEFAULT '{
    "architecture": {},
    "entities": {},
    "style_guide": {},
    "decisions": [],
    "constraints": [],
    "dependencies": {},
    "recent_changes": [],
    "known_issues": []
  }'::jsonb,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_by_plan_id UUID REFERENCES plans(id),
  
  -- Embeddings cache
  embeddings_generated_at TIMESTAMPTZ,
  embeddings_status TEXT CHECK (embeddings_status IN ('pending', 'processing', 'ready', 'failed'))
);

-- Codebase embeddings for semantic search
CREATE TABLE codebase_embeddings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- File/chunk identification
  file_path TEXT NOT NULL,
  chunk_type TEXT, -- 'function', 'class', 'module', 'comment'
  chunk_name TEXT, -- Function/class name
  start_line INTEGER,
  end_line INTEGER,
  
  -- Content and embedding
  content TEXT,
  embedding vector(1536), -- OpenAI's embedding dimension
  metadata JSONB, -- AST info, dependencies, etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for fast similarity search
  UNIQUE(workspace_id, file_path, start_line)
);

-- Create vector similarity search index
CREATE INDEX embeddings_vector_idx ON codebase_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Platform configurations for standard tier
CREATE TABLE platform_agent_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_profile_id UUID REFERENCES agent_profiles(id),
  tier TEXT NOT NULL, -- 'standard', 'premium'
  
  provider provider_type NOT NULL,
  model_name TEXT NOT NULL,
  api_base_url TEXT,
  
  -- Platform manages the key
  encrypted_api_key TEXT, -- Our keys, encrypted
  
  -- Limits per user
  monthly_tokens_per_user INTEGER,
  requests_per_minute INTEGER DEFAULT 10,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert standard tier configurations using open-source models
INSERT INTO platform_agent_configs (agent_profile_id, tier, provider, model_name, api_base_url, monthly_tokens_per_user) 
VALUES
  ((SELECT id FROM agent_profiles WHERE name = 'code_generator'), 
   'standard', 'together', 'codellama/CodeLlama-70b-Instruct-hf', 
   'https://api.together.xyz', 500000),
  
  ((SELECT id FROM agent_profiles WHERE name = 'orchestrator'),
   'standard', 'groq', 'mixtral-8x7b-32768',
   'https://api.groq.com', 200000),
  
  ((SELECT id FROM agent_profiles WHERE name = 'code_reviewer'),
   'standard', 'together', 'meta-llama/Llama-3-70b-chat-hf',
   'https://api.together.xyz', 300000);

-- Usage tracking for billing
CREATE TABLE usage_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id UUID REFERENCES plans(id),
  step_id UUID REFERENCES steps(id),
  
  event_type TEXT NOT NULL, -- 'api_call', 'embedding', 'container_runtime'
  provider provider_type,
  model_name TEXT,
  
  -- Quantities
  tokens_used INTEGER,
  compute_seconds DECIMAL(10, 2),
  
  -- Cost
  estimated_cost DECIMAL(10, 6),
  billing_status TEXT DEFAULT 'pending', -- 'pending', 'billed', 'credited'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_steps_plan_status ON steps(plan_id, status);
CREATE INDEX idx_steps_agent ON steps(agent_profile_id);
CREATE INDEX idx_user_configs_user ON user_agent_configs(user_id);
CREATE INDEX idx_embeddings_workspace ON codebase_embeddings(workspace_id);
CREATE INDEX idx_usage_user_date ON usage_events(user_id, created_at);

-- Row Level Security
ALTER TABLE user_agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE codebase_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own agent configs" ON user_agent_configs
  FOR ALL USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users access own workspace states" ON workspace_states
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE id = workspace_id AND user_id = auth.uid()::TEXT
    )
  );

CREATE POLICY "Users access own embeddings" ON codebase_embeddings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE id = workspace_id AND user_id = auth.uid()::TEXT
    )
  );

-- Function to get the best available agent config for a user
CREATE OR REPLACE FUNCTION get_agent_config(
  p_user_id TEXT,
  p_agent_profile_id UUID,
  p_tier TEXT DEFAULT 'standard'
) RETURNS TABLE (
  provider provider_type,
  model_name TEXT,
  api_base_url TEXT,
  api_key TEXT,
  is_platform_provided BOOLEAN
) AS $$
BEGIN
  -- First, try to get user's custom config
  RETURN QUERY
  SELECT 
    uac.provider,
    uac.model_name,
    uac.api_base_url,
    uac.encrypted_api_key, -- Would need decryption
    false AS is_platform_provided
  FROM user_agent_configs uac
  WHERE uac.user_id = p_user_id 
    AND uac.agent_profile_id = p_agent_profile_id
    AND uac.is_active = true
  LIMIT 1;
  
  -- If no custom config, use platform config
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      pac.provider,
      pac.model_name,
      pac.api_base_url,
      pac.encrypted_api_key, -- Platform's key
      true AS is_platform_provided
    FROM platform_agent_configs pac
    WHERE pac.agent_profile_id = p_agent_profile_id
      AND pac.tier = p_tier
      AND pac.is_active = true
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;