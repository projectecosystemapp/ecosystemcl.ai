import { defineAuth } from '@aws-amplify/backend';

/**
 * ECOSYSTEMCL.AI Authentication Configuration
 * Using AWS Cognito for fully native AWS authentication
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    // Support for external identity providers
    externalProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || 'placeholder',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder',
        scopes: ['email', 'profile'],
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || 'placeholder',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || 'placeholder',
        scopes: ['user:email', 'read:user'],
      },
      loginWithAmazon: false,
      facebook: false,
      apple: false,
    },
  },
  
  // Custom attributes for ECOSYSTEMCL.AI users
  userAttributes: {
    // Track user's organization
    'custom:organization': {
      dataType: 'String',
      mutable: true,
    },
    // Track user's role in the system
    'custom:role': {
      dataType: 'String',
      mutable: true,
      default: 'developer',
    },
    // Track API usage tier
    'custom:api_tier': {
      dataType: 'String',
      mutable: true,
      default: 'starter',
    },
    // Credit balance
    'custom:credits': {
      dataType: 'Number',
      mutable: true,
      default: '10000', // 10K free credits
    },
    // Connected services
    'custom:connected_services': {
      dataType: 'String', // JSON string
      mutable: true,
      default: '[]',
    },
    // Workspace IDs the user has access to
    'custom:workspaces': {
      dataType: 'String', // JSON array of workspace IDs
      mutable: true,
      default: '[]',
    },
  },
  
  // Multi-factor authentication
  multifactor: {
    mode: 'OPTIONAL',
    totp: true,
    sms: false, // Disable SMS for cost optimization
  },
  
  // Password policy
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: false, // More user-friendly
    tempPasswordValidity: 7, // 7 days for temp passwords
  },
  
  // Account recovery
  accountRecovery: 'EMAIL_ONLY',
  
  // User verification
  verificationEmailStyle: 'CODE',
  verificationEmailSubject: 'Welcome to ECOSYSTEMCL.AI - Verify Your Account',
  verificationEmailBody: (code) => `
    Welcome to ECOSYSTEMCL.AI!
    
    Your verification code is: ${code}
    
    This code will expire in 24 hours.
    
    If you didn't create an account, please ignore this email.
    
    Best regards,
    The ECOSYSTEMCL.AI Team
  `,
  
  // Groups for role-based access
  groups: [
    {
      name: 'admins',
      precedence: 1,
    },
    {
      name: 'developers',
      precedence: 2,
    },
    {
      name: 'enterprise',
      precedence: 3,
    },
    {
      name: 'free_tier',
      precedence: 10,
    },
  ],
  
  // Triggers for custom authentication flows
  triggers: {
    // Auto-confirm users from trusted domains
    preSignUp: async (event) => {
      const email = event.request.userAttributes.email;
      const trustedDomains = ['anthropic.com', 'amazonaws.com'];
      const domain = email?.split('@')[1];
      
      if (domain && trustedDomains.includes(domain)) {
        event.response.autoConfirmUser = true;
        event.response.autoVerifyEmail = true;
      }
      
      return event;
    },
    
    // Add user to default group after confirmation
    postConfirmation: async (event) => {
      // Add user to free_tier group by default
      const params = {
        GroupName: 'free_tier',
        UserPoolId: event.userPoolId,
        Username: event.userName,
      };
      
      // This would be implemented in the actual Lambda trigger
      console.log('Adding user to free_tier group:', params);
      
      return event;
    },
    
    // Custom message for device authentication
    customMessage: async (event) => {
      if (event.triggerSource === 'CustomMessage_AdminCreateUser') {
        event.response.emailSubject = 'Your ECOSYSTEMCL.AI CLI Access';
        event.response.emailMessage = `
          Welcome to ECOSYSTEMCL.AI!
          
          Your CLI device code is: ${event.request.codeParameter}
          
          To complete setup:
          1. Run: ecosystemcli login
          2. Enter this code when prompted
          3. Your CLI will be authenticated
          
          This code expires in 10 minutes.
        `;
      }
      return event;
    },
  },
  
  // Device tracking for CLI authentication
  deviceTracking: {
    challengeRequiredOnNewDevice: false,
    deviceOnlyRememberedOnUserPrompt: false,
  },
});