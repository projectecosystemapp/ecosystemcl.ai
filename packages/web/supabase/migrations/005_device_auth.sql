-- Device Authentication Tables for OAuth 2.0 Device Authorization Grant

-- Device codes table
CREATE TABLE device_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_code VARCHAR(255) UNIQUE NOT NULL,
  user_code VARCHAR(12) UNIQUE NOT NULL,
  client_id VARCHAR(255) NOT NULL DEFAULT 'forge-cli',
  user_id VARCHAR(255), -- Clerk user ID, null until authorized
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  authorized_at TIMESTAMPTZ,
  poll_attempts INTEGER DEFAULT 0,
  last_poll_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  
  -- Verification URL info
  verification_uri TEXT NOT NULL,
  verification_uri_complete TEXT NOT NULL,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'expired', 'denied')),
  
  -- Indexes for fast lookups
  INDEX idx_device_code ON device_codes(device_code),
  INDEX idx_user_code ON device_codes(user_code),
  INDEX idx_status_expires ON device_codes(status, expires_at)
);

-- CLI tokens table for storing access/refresh tokens
CREATE TABLE cli_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  device_info JSONB,
  
  -- Track token lineage for refresh
  parent_token_id UUID REFERENCES cli_tokens(id),
  
  INDEX idx_user_tokens ON cli_tokens(user_id, revoked_at),
  INDEX idx_refresh_token ON cli_tokens(refresh_token) WHERE revoked_at IS NULL
);

-- Audit log for authentication events
CREATE TABLE auth_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  event_type VARCHAR(50) NOT NULL,
  device_code_id UUID REFERENCES device_codes(id),
  token_id UUID REFERENCES cli_tokens(id),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_audit_user ON auth_audit_log(user_id, created_at DESC),
  INDEX idx_audit_event ON auth_audit_log(event_type, created_at DESC)
);

-- Row Level Security
ALTER TABLE device_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cli_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;

-- Device codes are only accessible by the system
CREATE POLICY "Device codes are system only" ON device_codes
  FOR ALL USING (false);

-- CLI tokens are only accessible by their owner
CREATE POLICY "Users can view their own tokens" ON cli_tokens
  FOR SELECT USING (user_id = auth.uid()::text);

-- Audit logs are read-only for users
CREATE POLICY "Users can view their own audit logs" ON auth_audit_log
  FOR SELECT USING (user_id = auth.uid()::text);

-- Function to clean up expired device codes
CREATE OR REPLACE FUNCTION cleanup_expired_device_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM device_codes 
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate user-friendly code
CREATE OR REPLACE FUNCTION generate_user_code()
RETURNS VARCHAR(12) AS $$
DECLARE
  code VARCHAR(12);
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate format: XXXX-XXXX (8 chars + hyphen)
    code := UPPER(
      SUBSTR(md5(random()::text), 1, 4) || '-' ||
      SUBSTR(md5(random()::text), 1, 4)
    );
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM device_codes WHERE user_code = code) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate secure device code
CREATE OR REPLACE FUNCTION generate_device_code()
RETURNS VARCHAR(255) AS $$
DECLARE
  code VARCHAR(255);
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a secure random device code
    code := encode(gen_random_bytes(32), 'hex');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM device_codes WHERE device_code = code) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;