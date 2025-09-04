/**
 * Configuration Example for Whop Webhook Handler
 * Copy this file to config.ts and update with your actual Whop plan IDs
 */

import type { PlanTierMapping, TierCredits } from './types';

// Example Whop plan ID to tier mapping
// Replace these with your actual Whop plan IDs from your Whop dashboard
export const PLAN_TIER_MAPPING_EXAMPLE: PlanTierMapping = {
  // Developer tier plans
  'plan_dev_monthly_001': 'developer',
  'plan_dev_yearly_001': 'developer',
  
  // Architect tier plans  
  'plan_arch_monthly_001': 'architect',
  'plan_arch_yearly_001': 'architect',
  
  // Enterprise tier plans
  'plan_ent_monthly_001': 'enterprise',
  'plan_ent_yearly_001': 'enterprise',
};

// Example credit allocation per tier
// Adjust these values based on your pricing strategy
export const TIER_CREDITS_EXAMPLE: TierCredits = {
  developer: 50000,    // 50K credits - suitable for individual developers
  architect: 200000,   // 200K credits - for small teams and advanced users
  enterprise: 500000,  // 500K credits - for large teams and organizations
};

// Example environment variables needed for deployment
export const REQUIRED_ENV_VARS = {
  // Whop webhook secret - get this from your Whop app webhook settings
  WHOP_WEBHOOK_SECRET: 'whop_wh_secret_your_secret_here',
  
  // AWS/Amplify will automatically provide these:
  // - AWS_REGION
  // - AWS_ACCESS_KEY_ID  
  // - AWS_SECRET_ACCESS_KEY
  // - AMPLIFY_* variables
};

// Example Whop webhook configuration
export const WHOP_WEBHOOK_CONFIG = {
  // Your deployed webhook URL (will be available after deployment)
  webhookUrl: 'https://your-amplify-domain.amplifyapp.com/whop-webhook',
  
  // Events to subscribe to in Whop dashboard
  subscribedEvents: [
    'payment_succeeded',      // When payment completes successfully
    'payment_failed',         // When payment fails (optional - for logging)  
    'payment_cancelled',      // When payment is cancelled
    'subscription_created',   // When new subscription is created
    'subscription_updated',   // When subscription details change
    'subscription_cancelled', // When subscription is cancelled
    'subscription_renewed',   // When subscription renews
    'trial_ended',           // When trial period ends
  ],
  
  // Webhook settings in Whop
  settings: {
    // Enable signature verification (required for security)
    signatureVerification: true,
    // Recommended timeout (Whop default is usually 30 seconds)
    timeoutSeconds: 30,
    // Retry settings (Whop will retry failed webhooks)
    maxRetries: 3,
  }
};

/**
 * To use this configuration:
 * 
 * 1. Update PLAN_TIER_MAPPING with your actual Whop plan IDs
 * 2. Adjust TIER_CREDITS based on your pricing strategy
 * 3. Set WHOP_WEBHOOK_SECRET in your Amplify environment variables
 * 4. Deploy your Amplify app to get the webhook URL
 * 5. Configure the webhook in your Whop app dashboard
 * 6. Test the webhook with a test subscription
 */