// packages/web/src/config.ts

// Please fill in these values from your `terraform apply` output.
const terraformOutputs = {
  region: "us-east-1",
  app_name: "ecosystemcl",
  environment: "dev",
  cognito_user_pool_id: "us-east-1_iSpnb1xKq",
  cognito_user_pool_client_id: "13n3l79um7c95q3vaovn50n8j8",
  cognito_identity_pool_id: "us-east-1:1992c050-ad4f-4095-8ab1-bc2b0daa21a2",
  cognito_user_pool_domain: "ecosystemcl-dev-auth",
  api_gateway_url: "https://c1zyisi441.execute-api.us-east-1.amazonaws.com/dev",
  s3_bucket_name: "ecosystemcl-dev-storage",
};

// This section builds the final configuration object from your outputs.
export const awsconfig = {
  region: terraformOutputs.region,
  aws_project_region: terraformOutputs.region,
  Auth: {
    Cognito: {
      userPoolId: terraformOutputs.cognito_user_pool_id,
      userPoolClientId: terraformOutputs.cognito_user_pool_client_id,
      identityPoolId: terraformOutputs.cognito_identity_pool_id,
      loginWith: {
        email: true,
        username: false,
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: { required: true },
      },
      oauth: {
        domain: `${terraformOutputs.cognito_user_pool_domain}.auth.${terraformOutputs.region}.amazoncognito.com`,
        scope: ['email', 'openid', 'profile'],
        redirectSignIn: process.env.NODE_ENV === 'production' 
          ? 'https://ecosystemcl.ai/dashboard'
          : 'http://localhost:3006/dashboard',
        redirectSignOut: process.env.NODE_ENV === 'production'
          ? 'https://ecosystemcl.ai/'
          : 'http://localhost:3006/',
        responseType: 'code',
      },
    },
  },
  API: {
    REST: {
      "ecosystem-api": {
        endpoint: terraformOutputs.api_gateway_url,
        region: terraformOutputs.region,
      },
    },
  },
  Storage: {
    S3: {
      bucket: terraformOutputs.s3_bucket_name,
      region: terraformOutputs.region,
    }
  }
};