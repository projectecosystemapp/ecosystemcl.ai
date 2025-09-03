#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

async function mockLogin() {
  console.log('🔐 Creating mock authentication...\n');
  
  // Create mock credentials
  const mockCredentials = {
    access_token: 'mock-access-token-' + Date.now(),
    refresh_token: 'mock-refresh-token-' + Date.now(),
    user_id: 'user_mocktest123',
    user_email: 'test@forge.app',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    connected_services: {
      claude: {
        connected_at: new Date().toISOString(),
        status: 'active'
      },
      openai: {
        connected_at: new Date().toISOString(),
        status: 'active'
      }
    },
    version: '1.0.0'
  };
  
  // Save to ~/.forge/credentials.json
  const forgeDir = path.join(os.homedir(), '.forge');
  const credsFile = path.join(forgeDir, 'credentials.json');
  
  try {
    await fs.mkdir(forgeDir, { recursive: true });
    await fs.writeFile(
      credsFile,
      JSON.stringify(mockCredentials, null, 2),
      { mode: 0o600 }
    );
    
    console.log('✅ Mock authentication created!\n');
    console.log('User: test@forge.app');
    console.log('Services connected: claude, openai');
    console.log(`Credentials saved to: ${credsFile}`);
    console.log('\nNow try running:');
    console.log('  forge status');
    console.log('  forge init');
    
  } catch (error) {
    console.error('❌ Failed to create mock auth:', error.message);
  }
}

mockLogin();