-- =============================================
-- Auth System Tables
-- =============================================

-- User agent configurations (CLI auth tokens) - table already exists in 001_initial_schema.sql

-- Connected services (OAuth tokens for Claude, OpenAI, GitHub, etc.)
CREATE TABLE IF NOT EXISTS connected_services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  access_token TEXT, -- Encrypted with pgsodium
  refresh_token TEXT, -- Encrypted with pgsodium
  expires_at TIMESTAMPTZ,
  scope TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_id, service_name)
);

-- Device codes for CLI authentication flow
CREATE TABLE IF NOT EXISTS device_codes (
  code TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  user_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API keys for service-to-service auth - table already exists in 001_initial_schema.sql

-- =============================================
-- Security - Row Level Security (RLS) Policies
-- =============================================

-- RLS already enabled in 001_initial_schema.sql for existing tables
ALTER TABLE connected_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_codes ENABLE ROW LEVEL SECURITY;

-- User agent configs policies already exist in 001_initial_schema.sql

-- Connected services policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'connected_services' AND policyname = 'Users can view own services') THEN
    CREATE POLICY "Users can view own services" ON connected_services
      FOR SELECT USING (user_id = auth.uid()::TEXT);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'connected_services' AND policyname = 'Users can manage own services') THEN
    CREATE POLICY "Users can manage own services" ON connected_services
      FOR ALL USING (user_id = auth.uid()::TEXT);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'connected_services' AND policyname = 'Service role can manage services') THEN
    CREATE POLICY "Service role can manage services" ON connected_services
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Device codes policies (public write for registration, authenticated read)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'device_codes' AND policyname = 'Anyone can create device codes') THEN
    CREATE POLICY "Anyone can create device codes" ON device_codes
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'device_codes' AND policyname = 'Service role can manage device codes') THEN
    CREATE POLICY "Service role can manage device codes" ON device_codes
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- API keys policies already exist in 001_initial_schema.sql

-- =============================================
-- Functions
-- =============================================

-- Function to clean up expired device codes
CREATE OR REPLACE FUNCTION cleanup_expired_device_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM device_codes 
  WHERE expires_at < NOW() OR status = 'expired';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate API key (modified to work with existing schema)
CREATE OR REPLACE FUNCTION validate_api_key(p_key TEXT)
RETURNS TABLE (
  user_id TEXT,
  scopes TEXT[],
  is_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ak.user_id,
    ak.scopes,
    (ak.status = 'active' AND (ak.expires_at IS NULL OR ak.expires_at > NOW()))::BOOLEAN as is_valid
  FROM api_keys ak
  WHERE ak.key = p_key
  LIMIT 1;
  
  -- Update last used timestamp
  UPDATE api_keys 
  SET last_used_at = NOW() 
  WHERE key = p_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Indexes
-- =============================================

-- Indexes for existing tables already created in 001_initial_schema.sql
CREATE INDEX IF NOT EXISTS idx_connected_services_user_service ON connected_services(user_id, service_name);
CREATE INDEX IF NOT EXISTS idx_device_codes_expires_at ON device_codes(expires_at);

-- =============================================
-- Triggers
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_agent_configs already exists in 001_initial_schema.sql

-- =============================================
-- Scheduled Jobs (using pg_cron if available)
-- =============================================

-- Schedule cleanup of expired device codes every hour
-- Note: Requires pg_cron extension
-- SELECT cron.schedule('cleanup-device-codes', '0 * * * *', 'SELECT cleanup_expired_device_codes();');