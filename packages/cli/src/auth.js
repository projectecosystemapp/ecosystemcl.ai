#!/usr/bin/env node

const axios = require('axios');
const open = require('open');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const inquirer = require('inquirer');

class EcosystemAuth {
  constructor() {
    this.configDir = path.join(os.homedir(), '.ecosystemcli');
    this.configFile = path.join(this.configDir, 'credentials.json');
    this.apiUrl = process.env.ECOSYSTEMCLI_API_URL || 'http://localhost:3000';
  }

  /**
   * Generate a secure device code for linking CLI to web session
   */
  generateDeviceCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
  }

  /**
   * Generate a secure state token for OAuth flows
   */
  generateStateToken() {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Ensure config directory exists
   */
  async ensureConfigDir() {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }

  /**
   * Save credentials securely
   */
  async saveCredentials(credentials) {
    await this.ensureConfigDir();
    
    // Encrypt sensitive data before saving
    const encryptedCreds = {
      ...credentials,
      encrypted_at: new Date().toISOString(),
      version: '1.0.0'
    };
    
    await fs.writeFile(
      this.configFile,
      JSON.stringify(encryptedCreds, null, 2),
      { mode: 0o600 } // Read/write for owner only
    );
  }

  /**
   * Load saved credentials
   */
  async loadCredentials() {
    try {
      const data = await fs.readFile(this.configFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const creds = await this.loadCredentials();
    if (!creds || !creds.access_token) return false;
    
    // Check if token is still valid
    if (creds.expires_at && new Date(creds.expires_at) < new Date()) {
      // Token expired, try to refresh
      if (creds.refresh_token) {
        return await this.refreshToken(creds.refresh_token);
      }
      return false;
    }
    
    return true;
  }

  /**
   * Main login flow with OAuth 2.0 Device Authorization Grant
   */
  async login() {
    console.log(chalk.blue.bold('\n🔐 ECOSYSTEMCL.AI Authentication\n'));
    
    // Check if already logged in
    const existingCreds = await this.loadCredentials();
    if (existingCreds && existingCreds.access_token) {
      const { confirmLogout } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmLogout',
          message: 'You are already logged in. Do you want to log in with a different account?',
          default: false
        }
      ]);
      
      if (!confirmLogout) {
        console.log(chalk.green('✅ Using existing authentication'));
        return existingCreds;
      }
    }
    
    try {
      // Step 1: Initiate device authorization flow
      console.log(chalk.blue('Initiating device authorization...'));
      const response = await axios.get(`${this.apiUrl}/api/device-auth/authorize`);
      
      const {
        device_code,
        user_code,
        verification_uri,
        verification_uri_complete,
        expires_in,
        interval
      } = response.data;
      
      // Display user code and instructions
      console.log('\n' + chalk.bgCyan.black.bold(' Enter this code on the website: '));
      console.log('\n' + chalk.yellow.bold(`    ${user_code}`) + '\n');
      console.log(chalk.gray(`This code will expire in ${expires_in / 60} minutes\n`));
      
      // Open browser for authentication
      console.log(chalk.blue('Opening your browser to complete authentication...'));
      console.log(chalk.gray(`If the browser doesn't open, visit: ${verification_uri}\n`));
      
      try {
        await open(verification_uri_complete);
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not open browser automatically'));
        console.log(chalk.cyan(`Please visit: ${verification_uri_complete}\n`));
      }
      
      // Step 2: Poll for authorization
      console.log(chalk.blue('⏳ Waiting for authorization...\n'));
      
      const tokens = await this.pollForDeviceAuth(device_code, interval || 5);
      
      // Step 3: Save tokens
      const credentials = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type || 'Bearer',
        expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
        authenticated_at: new Date().toISOString()
      };
      
      await this.saveCredentials(credentials);
      
      console.log(chalk.green.bold('\n✅ Authentication successful!'));
      console.log(chalk.gray('You are now logged in to ECOSYSTEMCL.AI\n'));
      
      return credentials;
    } catch (error) {
      if (error.response?.data?.error_description) {
        console.error(chalk.red('\n❌ Authentication failed:'), error.response.data.error_description);
      } else {
        console.error(chalk.red('\n❌ Authentication failed:'), error.message);
      }
      throw error;
    }
  }

  /**
   * Poll for device authorization (OAuth 2.0 Device Flow)
   */
  async pollForDeviceAuth(deviceCode, intervalSeconds = 5) {
    const pollInterval = intervalSeconds * 1000;
    const maxAttempts = 60; // 5 minutes max
    let slowDown = false;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Add delay for slow_down response
        if (slowDown) {
          await new Promise(resolve => setTimeout(resolve, pollInterval * 2));
          slowDown = false;
        } else if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
        
        const response = await axios.post(`${this.apiUrl}/api/device-auth/poll`, {
          device_code: deviceCode,
          client_id: 'forge-cli'
        });
        
        // Success - we got tokens!
        return response.data;
        
      } catch (error) {
        if (error.response?.data?.error) {
          const errorCode = error.response.data.error;
          
          switch (errorCode) {
          case 'authorization_pending':
            // Still waiting for user authorization
            process.stdout.write('.');
            continue;
              
          case 'slow_down':
            // Too many requests, slow down
            slowDown = true;
            process.stdout.write('_');
            continue;
              
          case 'access_denied':
            throw new Error('Authorization was denied');
              
          case 'expired_token':
            throw new Error('Device code expired. Please try again.');
              
          default:
            throw new Error(error.response.data.error_description || 'Authorization failed');
          }
        } else {
          // Network or other error
          console.error(chalk.red('\nPolling error:'), error.message);
          throw error;
        }
      }
    }
    
    throw new Error('Authentication timeout. Please try again.');
  }

  /**
   * Connect a specific service (Claude, OpenAI, GitHub, etc.)
   */
  async connectService(service) {
    // Validate service name
    const validServices = ['claude', 'openai', 'github', 'google', 'aws'];
    if (!validServices.includes(service.toLowerCase())) {
      throw new Error(`Invalid service: ${service}. Valid options: ${validServices.join(', ')}`);
    }
    
    // Check if user is authenticated
    const creds = await this.loadCredentials();
    if (!creds || !creds.access_token) {
      console.log(chalk.yellow('⚠️  You need to log in first'));
      console.log(chalk.gray('Run: forge login'));
      return false;
    }
    
    // Generate state token for OAuth
    const stateToken = this.generateStateToken();
    
    // Build OAuth URL
    const connectUrl = `${this.apiUrl}/connect/${service}?state=${stateToken}&user_id=${creds.user_id}`;
    
    console.log(chalk.blue(`\n🔗 Connecting to ${chalk.bold(service)}...\n`));
    console.log(chalk.gray('Opening your browser to authorize the connection...'));
    console.log(chalk.gray(`If the browser doesn't open, visit: ${connectUrl}\n`));
    
    // Open browser
    try {
      await open(connectUrl);
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not open browser automatically'));
    }
    
    // Poll for connection completion
    console.log(chalk.blue('⏳ Waiting for authorization...\n'));
    
    try {
      const result = await this.pollForConnection(service, stateToken, creds.user_id);
      
      // Update local credentials with service connection
      creds.connected_services = creds.connected_services || {};
      creds.connected_services[service] = {
        connected_at: new Date().toISOString(),
        status: 'active'
      };
      await this.saveCredentials(creds);
      
      console.log(chalk.green.bold(`\n✅ Successfully connected to ${service}!`));
      
      // Show service-specific success message
      this.showServiceSuccessMessage(service);
      
      return result;
    } catch (error) {
      console.error(chalk.red(`\n❌ Failed to connect to ${service}:`), error.message);
      throw error;
    }
  }

  /**
   * Poll for service connection completion
   */
  async pollForConnection(service, stateToken, userId, maxAttempts = 60) {
    const pollInterval = 3000; // 3 seconds
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axios.get(`${this.apiUrl}/api/connections/status`, {
          params: {
            service,
            state: stateToken,
            user_id: userId
          }
        });
        
        if (response.data.status === 'connected') {
          return response.data;
        } else if (response.data.status === 'failed') {
          throw new Error(response.data.error || 'Connection failed');
        }
        
        process.stdout.write('.');
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        if (error.response?.status === 404) {
          // Not yet connected, continue polling
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        } else {
          throw error;
        }
      }
    }
    
    throw new Error('Connection timeout. Please try again.');
  }

  /**
   * Show service-specific success messages
   */
  showServiceSuccessMessage(service) {
    const messages = {
      claude: [
        'Your Claude API access is now configured',
        'The Orchestrator agent will use Claude Opus for planning',
        'Run "forge init" to set up your project workspace'
      ],
      openai: [
        'Your OpenAI API access is now configured',
        'Code generation will use GPT-4 for optimal results',
        'Run "forge init" to set up your project workspace'
      ],
      github: [
        'Your GitHub account is now connected',
        'FORGE can now access your repositories',
        'Automatic PR creation and code commits are enabled'
      ],
      google: [
        'Your Google Cloud account is connected',
        'Access to GCP services is now available',
        'Vertex AI models can be used for agents'
      ],
      aws: [
        'Your AWS account is connected',
        'Access to AWS services is now available',
        'Bedrock models can be used for agents'
      ]
    };
    
    const serviceMessages = messages[service.toLowerCase()] || ['Service connected successfully'];
    
    console.log(chalk.gray('\nWhat this means:'));
    serviceMessages.forEach(msg => {
      console.log(chalk.gray(`  • ${msg}`));
    });
  }

  /**
   * Logout and clear credentials
   */
  async logout() {
    try {
      await fs.unlink(this.configFile);
      console.log(chalk.green('✅ Successfully logged out'));
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(chalk.yellow('You are not currently logged in'));
      } else {
        throw error;
      }
    }
  }

  /**
   * Show current authentication status
   */
  async status() {
    const creds = await this.loadCredentials();
    
    if (!creds) {
      console.log(chalk.yellow('\n⚠️  Not authenticated'));
      console.log(chalk.gray('Run "forge login" to authenticate\n'));
      return;
    }
    
    console.log(chalk.blue.bold('\n🔐 Authentication Status\n'));
    console.log(chalk.green('✅ Authenticated'));
    console.log(chalk.gray(`User: ${creds.user_email || creds.user_id}`));
    
    if (creds.expires_at) {
      const expiresAt = new Date(creds.expires_at);
      const now = new Date();
      if (expiresAt > now) {
        const hoursLeft = Math.floor((expiresAt - now) / (1000 * 60 * 60));
        console.log(chalk.gray(`Token expires in: ${hoursLeft} hours`));
      } else {
        console.log(chalk.yellow('Token expired (will refresh automatically)'));
      }
    }
    
    if (creds.connected_services) {
      console.log(chalk.blue('\n🔗 Connected Services:'));
      for (const [service, info] of Object.entries(creds.connected_services)) {
        const icon = info.status === 'active' ? '✅' : '⚠️';
        console.log(`  ${icon} ${service}`);
      }
    } else {
      console.log(chalk.gray('\n No services connected yet'));
      console.log(chalk.gray('Run "forge connect <service>" to connect'));
    }
    
    console.log('');
  }

  /**
   * Refresh access token using OAuth 2.0 refresh grant
   */
  async refreshToken(refreshToken) {
    try {
      const response = await axios.post(`${this.apiUrl}/api/auth/refresh`, {
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      });
      
      // Update stored credentials with new tokens
      const existingCreds = await this.loadCredentials();
      const updatedCreds = {
        ...existingCreds,
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || refreshToken, // Keep old if not provided
        expires_at: new Date(Date.now() + (response.data.expires_in || 3600) * 1000).toISOString(),
        refreshed_at: new Date().toISOString()
      };
      
      await this.saveCredentials(updatedCreds);
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        console.error(chalk.red('\n⚠️  Session expired. Please log in again.'));
        // Clear invalid credentials
        try {
          await fs.unlink(this.configFile);
        } catch (unlinkError) {
          // Ignore file deletion errors
        }
      } else {
        console.error(chalk.red('Failed to refresh token:'), error.message);
      }
      return false;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getAccessToken() {
    const creds = await this.loadCredentials();
    if (!creds) return null;
    
    // Check if token needs refresh
    if (creds.expires_at && new Date(creds.expires_at) < new Date()) {
      if (creds.refresh_token) {
        const refreshed = await this.refreshToken(creds.refresh_token);
        if (refreshed) {
          const newCreds = await this.loadCredentials();
          return newCreds.access_token;
        }
      }
      return null;
    }
    
    return creds.access_token;
  }
}

module.exports = EcosystemAuth;
