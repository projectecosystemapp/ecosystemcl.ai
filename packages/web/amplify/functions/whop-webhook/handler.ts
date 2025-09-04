import type { APIGatewayProxyHandler } from 'aws-lambda';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';
import { createHmac, timingSafeEqual } from 'crypto';
import type {
  AnyWhopWebhookEvent,
  PaymentWebhookEvent,
  SubscriptionWebhookEvent,
  PaymentWebhookData,
  SubscriptionWebhookData,
  PlanTierMapping,
  TierCredits,
  WebhookProcessingResult,
  WebhookError
} from './types';

const client = generateClient<Schema>();

// Whop plan ID to tier mapping
const PLAN_TIER_MAPPING: PlanTierMapping = {
  // Add your Whop plan IDs and their corresponding tiers here
  // Example:
  // 'plan_xxxxx': 'developer',
  // 'plan_yyyyy': 'architect',
  // 'plan_zzzzz': 'enterprise',
};

// Default credits per tier
const TIER_CREDITS: TierCredits = {
  developer: 50000,
  architect: 200000,
  enterprise: 500000,
};

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hmac = createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = `sha256=${hmac.digest('hex')}`;
    
    // Use timing-safe comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    
    return sigBuffer.length === expectedBuffer.length && 
           timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

function getTierFromPlanId(planId: string): 'developer' | 'architect' | 'enterprise' {
  return PLAN_TIER_MAPPING[planId] || 'developer';
}

async function handleSubscriptionCreated(eventData: PaymentWebhookData | SubscriptionWebhookData): Promise<void> {
  console.log('Processing subscription created event:', eventData);
  
  const tier = getTierFromPlanId(eventData.plan_id);
  const credits = TIER_CREDITS[tier];
  
  // Find user by Whop user ID or email
  // First try to find by userId (assuming userId matches Whop user_id)
  let userProfiles = await client.models.UserProfile.list({
    filter: {
      userId: { eq: eventData.user_id }
    }
  });
  
  // If not found by userId and email is available, try email lookup
  if (userProfiles.data.length === 0 && eventData.email) {
    userProfiles = await client.models.UserProfile.list({
      filter: {
        email: { eq: eventData.email }
      }
    });
  }
  
  if (userProfiles.data.length === 0) {
    console.warn(`No user found for Whop user ID: ${eventData.user_id}${eventData.email ? ` or email: ${eventData.email}` : ''}`);
    // For subscription created events, we might need to create a new user profile
    // This could happen if the webhook arrives before the user signs up in our system
    throw new Error(`User not found for Whop user ID: ${eventData.user_id}`);
  }
  
  const userProfile = userProfiles.data[0];
  
  // Determine if this is a new subscription or upgrade
  const isNewSubscription = !userProfile.whopSubscriptionId || userProfile.whopSubscriptionId !== eventData.id;
  const currentCredits = userProfile.credits || 0;
  
  // Only add credits for new subscriptions, not updates
  const updatedCredits = isNewSubscription ? currentCredits + credits : currentCredits;
  
  await client.models.UserProfile.update({
    userId: userProfile.userId,
    whopSubscriptionId: eventData.id,
    subscriptionStatus: eventData.status === 'completed' ? 'active' : eventData.status,
    subscriptionTier: tier,
    credits: updatedCredits,
    trialEndsAt: eventData.trial_end ? new Date(eventData.trial_end * 1000).toISOString() : undefined,
    subscriptionEndsAt: eventData.valid_until ? new Date(eventData.valid_until * 1000).toISOString() : undefined,
  });
  
  console.log(`Updated user profile for subscription created: ${eventData.id}${isNewSubscription ? ` (added ${credits} credits)` : ' (no credits added - existing subscription)'}`);
}

async function handleSubscriptionUpdated(eventData: PaymentWebhookData | SubscriptionWebhookData): Promise<void> {
  console.log('Processing subscription updated event:', eventData);
  
  const tier = getTierFromPlanId(eventData.plan_id);
  
  // Find user by subscription ID
  const userProfiles = await client.models.UserProfile.list({
    filter: {
      whopSubscriptionId: { eq: eventData.id }
    }
  });
  
  if (userProfiles.data.length === 0) {
    console.warn(`No user found for subscription ID: ${eventData.id}`);
    return;
  }
  
  const userProfile = userProfiles.data[0];
  
  await client.models.UserProfile.update({
    userId: userProfile.userId,
    subscriptionStatus: eventData.status === 'completed' ? 'active' : eventData.status,
    subscriptionTier: tier,
    trialEndsAt: eventData.trial_end ? new Date(eventData.trial_end * 1000).toISOString() : undefined,
    subscriptionEndsAt: eventData.valid_until ? new Date(eventData.valid_until * 1000).toISOString() : undefined,
  });
  
  console.log(`Updated user profile for subscription updated: ${eventData.id}`);
}

async function handleSubscriptionCancelled(eventData: PaymentWebhookData | SubscriptionWebhookData): Promise<void> {
  console.log('Processing subscription cancelled event:', eventData);
  
  // Find user by subscription ID
  const userProfiles = await client.models.UserProfile.list({
    filter: {
      whopSubscriptionId: { eq: eventData.id }
    }
  });
  
  if (userProfiles.data.length === 0) {
    console.warn(`No user found for subscription ID: ${eventData.id}`);
    return;
  }
  
  const userProfile = userProfiles.data[0];
  
  await client.models.UserProfile.update({
    userId: userProfile.userId,
    subscriptionStatus: 'cancelled',
    subscriptionEndsAt: eventData.valid_until ? new Date(eventData.valid_until * 1000).toISOString() : undefined,
  });
  
  console.log(`Updated user profile for subscription cancelled: ${eventData.id}`);
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    console.log('Received Whop webhook event:', JSON.stringify(event, null, 2));
    
    // Verify webhook signature
    const signature = event.headers['X-Whop-Signature'] || event.headers['x-whop-signature'];
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('WHOP_WEBHOOK_SECRET environment variable is not set');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Webhook secret not configured' })
      };
    }
    
    if (!signature) {
      console.error('Missing webhook signature');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing webhook signature' })
      };
    }
    
    const payload = event.body || '';
    
    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid webhook signature' })
      };
    }
    
    // Parse webhook event
    const webhookEvent: AnyWhopWebhookEvent = JSON.parse(payload);
    
    // Handle different event types
    switch (webhookEvent.type) {
      case 'payment_succeeded':
      case 'subscription_created':
        await handleSubscriptionCreated(webhookEvent.data);
        break;
        
      case 'payment_updated':
      case 'subscription_updated':
        await handleSubscriptionUpdated(webhookEvent.data);
        break;
        
      case 'payment_cancelled':
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(webhookEvent.data);
        break;
        
      case 'trial_ended':
        // Handle trial ended - similar to subscription updated
        await handleSubscriptionUpdated(webhookEvent.data);
        break;
        
      default:
        console.log(`Unhandled webhook event type: ${webhookEvent.type}`);
    }
    
    const result: WebhookProcessingResult = {
      success: true,
      message: 'Webhook processed successfully',
      eventType: webhookEvent.type
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    };
    
  } catch (error) {
    console.error('Error processing Whop webhook:', error);
    
    const errorResult: WebhookError = {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(errorResult)
    };
  }
};