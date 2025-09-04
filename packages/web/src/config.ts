/**
 * AWS Configuration for ECOSYSTEMCL.AI
 * Terraform-managed infrastructure (us-east-1)
 * 
 * This configuration replaces amplify_outputs.json and provides
 * AWS Amplify-compatible configuration from Terraform outputs.
 */

// These values should be injected from Terraform outputs
// For now, using placeholder values that match the expected Terraform structure
const awsConfig = {
  Auth: {
    Cognito: {
      // User Pool configuration from terraform/modules/auth
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || 'us-east-1_PLACEHOLDER',
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || 'placeholder-client-id',
      identityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID || 'us-east-1:placeholder-identity-pool',
      
      loginWith: {
        email: true,
        phone: false,
        username: false,
      },
      
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: {
          required: true,
        },
      },
      
      allowGuestAccess: false,
      
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: false,
      },
    },
  },
  
  API: {
    REST: {
      ecosystem: {
        endpoint: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://api.placeholder.execute-api.us-east-1.amazonaws.com',
        region: 'us-east-1',
      },
    },
  },
  
  Storage: {
    S3: {
      bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'ecosystemcl-ai-bucket',
      region: 'us-east-1',
    },
  },
  
  region: 'us-east-1',
  
  // Additional AWS configuration
  aws_project_region: 'us-east-1',
  aws_cognito_region: 'us-east-1',
  aws_user_pools_id: process.env.NEXT_PUBLIC_USER_POOL_ID || 'us-east-1_PLACEHOLDER',
  aws_user_pools_web_client_id: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || 'placeholder-client-id',
  aws_cognito_identity_pool_id: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID || 'us-east-1:placeholder-identity-pool',
  
  // API Gateway
  aws_cloud_logic_custom: [
    {
      name: 'ecosystem-api',
      endpoint: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://api.placeholder.execute-api.us-east-1.amazonaws.com',
      region: 'us-east-1',
    },
  ],
  
  // S3 Storage
  aws_user_files_s3_bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'ecosystemcl-ai-bucket',
  aws_user_files_s3_bucket_region: 'us-east-1',
};

export default awsConfig;

/**
 * Type definitions for configuration
 */
export interface AwsConfig {
  Auth: {
    Cognito: {
      userPoolId: string;
      userPoolClientId: string;
      identityPoolId: string;
      loginWith: {
        email: boolean;
        phone: boolean;
        username: boolean;
      };
      signUpVerificationMethod: string;
      userAttributes: {
        email: {
          required: boolean;
        };
      };
      allowGuestAccess: boolean;
      passwordFormat: {
        minLength: number;
        requireLowercase: boolean;
        requireUppercase: boolean;
        requireNumbers: boolean;
        requireSpecialCharacters: boolean;
      };
    };
  };
  API: {
    REST: {
      [key: string]: {
        endpoint: string;
        region: string;
      };
    };
  };
  Storage: {
    S3: {
      bucket: string;
      region: string;
    };
  };
  region: string;
}

/**
 * Helper function to validate configuration
 */
export function validateConfig(config: typeof awsConfig): boolean {
  const requiredEnvVars = [
    'NEXT_PUBLIC_USER_POOL_ID',
    'NEXT_PUBLIC_USER_POOL_CLIENT_ID',
    'NEXT_PUBLIC_IDENTITY_POOL_ID',
    'NEXT_PUBLIC_API_GATEWAY_URL',
    'NEXT_PUBLIC_S3_BUCKET_NAME',
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('Missing environment variables for AWS configuration:', missingVars);
    console.warn('Using placeholder values. Configure these from Terraform outputs:');
    missingVars.forEach(varName => {
      console.warn(`  ${varName}=<value_from_terraform>`);
    });
    return false;
  }
  
  return true;
}

// Validate configuration on module load (only in browser)
if (typeof window !== 'undefined') {
  validateConfig(awsConfig);
}