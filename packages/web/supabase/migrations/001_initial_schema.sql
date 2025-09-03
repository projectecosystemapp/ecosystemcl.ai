-- ECOSYSTEMCL.AI SaaS Platform Database Schema
-- This creates the core tables for job orchestration and user workspace management

-- Enable UUID extension for proper ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types for status tracking
CREATE TYPE job_status AS ENUM (
  'queued',
  'preparing',
  'running',
  'completed',
  'failed',
  'cancelled',
  'timeout'
);

CREATE TYPE agent_type AS ENUM (
  'spec-architect',
  'tdd-implementer',
  'critical-code-reviewer',
  'legacy-modernization-specialist',
  'devops-build-manager',
  'ui-architect-typescript',
  'marketplace-design-expert'
);

-- Workspaces table: User's connected repositories
CREATE TABLE workspaces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Clerk user ID
  repo_url TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  repo_owner TEXT NOT NULL,
  github_installation_id BIGINT, -- GitHub App installation ID
  default_branch TEXT DEFAULT 'main',
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, repo_url)
);

-- Jobs table: Core job queue for forge commands
CREATE TABLE jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Clerk user ID
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Command details
  command TEXT NOT NULL, -- 'audit', 'task', 'migrate', etc.
  args JSONB, -- Command arguments and flags
  description TEXT,
  
  -- Execution details
  status job_status DEFAULT 'queued' NOT NULL,
  agent_type agent_type,
  priority INTEGER DEFAULT 0, -- Higher priority runs first
  
  -- Container/execution metadata
  container_id TEXT, -- Docker/Fargate container ID
  fargate_task_arn TEXT, -- AWS Fargate task ARN
  worker_id TEXT, -- ID of the worker processing this job
  
  -- Timing
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  timeout_seconds INTEGER DEFAULT 300, -- 5 minute default
  
  -- Results
  exit_code INTEGER,
  stdout TEXT, -- Full output log
  stderr TEXT, -- Error output
  structured_output JSONB, -- Parsed LOG BLOCKS
  
  -- Metadata
  metadata JSONB, -- Additional job-specific data
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job logs table: Real-time streaming logs
CREATE TABLE job_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  
  log_type TEXT CHECK (log_type IN ('stdout', 'stderr', 'system')),
  message TEXT NOT NULL,
  
  -- For structured LOG BLOCKS
  is_structured BOOLEAN DEFAULT false,
  block_type TEXT, -- 'thinking', 'reasoning', 'reference', 'action', 'result'
  block_content JSONB,
  
  sequence_number BIGSERIAL, -- Ensures correct ordering
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table: Forge session tracking (maps to .forge/sessions)
CREATE TABLE sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  
  session_id TEXT NOT NULL, -- Original forge session ID
  status TEXT NOT NULL,
  
  -- Progress tracking
  total_tasks INTEGER,
  completed_tasks INTEGER,
  current_task TEXT,
  
  -- Session data
  checkpoint_data JSONB, -- Full session checkpoint
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(session_id)
);

-- API keys table: Encrypted storage for user's API keys
CREATE TABLE api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'github', etc.
  key_name TEXT, -- User-friendly name
  encrypted_key TEXT NOT NULL, -- Encrypted with app-level encryption
  
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, provider, key_name)
);

-- Usage metrics table: For billing and analytics
CREATE TABLE usage_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  
  metric_type TEXT NOT NULL, -- 'api_call', 'container_runtime', 'storage', etc.
  provider TEXT, -- 'claude', 'openai', 'aws', etc.
  
  quantity DECIMAL(20, 6) NOT NULL,
  unit TEXT NOT NULL, -- 'tokens', 'seconds', 'bytes', etc.
  
  cost_usd DECIMAL(20, 6), -- Calculated cost
  
  metadata JSONB,
  
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_jobs_user_status ON jobs(user_id, status);
CREATE INDEX idx_jobs_workspace_status ON jobs(workspace_id, status);
CREATE INDEX idx_jobs_queued ON jobs(status, priority DESC, queued_at) WHERE status = 'queued';
CREATE INDEX idx_job_logs_job_sequence ON job_logs(job_id, sequence_number);
CREATE INDEX idx_workspaces_user ON workspaces(user_id);
CREATE INDEX idx_usage_metrics_user_date ON usage_metrics(user_id, recorded_at);

-- Row Level Security (RLS) policies
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own workspaces" ON workspaces
  FOR SELECT USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can view own jobs" ON jobs
  FOR SELECT USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can view own job logs" ON job_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_logs.job_id 
      AND jobs.user_id = auth.uid()::TEXT
    )
  );

CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can view own API keys" ON api_keys
  FOR SELECT USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can view own usage metrics" ON usage_metrics
  FOR SELECT USING (auth.uid()::TEXT = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
