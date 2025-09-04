/**
 * Whop Webhook Event Types
 * Based on Whop's webhook documentation
 */

export interface WhopUser {
  id: string;
  email?: string;
  username?: string;
  avatar?: string;
  created_at: number;
}

export interface WhopPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billing_period?: 'monthly' | 'yearly' | 'one_time';
  created_at: number;
}

export interface WhopPayment {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'completed' | 'pending' | 'trialing' | 'cancelled' | 'past_due' | 'refunded';
  amount: number;
  currency: string;
  valid_until?: number;
  trial_end?: number;
  cancel_at_period_end?: boolean;
  created_at: number;
  updated_at: number;
  // Additional metadata that might be present
  metadata?: Record<string, any>;
}

export interface WhopSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'trialing' | 'cancelled' | 'past_due' | 'incomplete';
  current_period_start: number;
  current_period_end: number;
  trial_start?: number;
  trial_end?: number;
  cancel_at_period_end?: boolean;
  cancelled_at?: number;
  created_at: number;
  updated_at: number;
}

export type WhopWebhookEventType = 
  | 'payment_succeeded'
  | 'payment_failed'
  | 'payment_cancelled'
  | 'payment_updated'
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'subscription_trial_will_end'
  | 'subscription_renewed'
  | 'trial_ended'
  | 'user_created'
  | 'user_updated';

export interface WhopWebhookEvent<T = any> {
  id: string;
  type: WhopWebhookEventType;
  created_at: number;
  data: T;
  // Optional metadata
  metadata?: Record<string, any>;
}

// Specific event data types
export interface PaymentWebhookData extends WhopPayment {}
export interface SubscriptionWebhookData extends WhopSubscription {}
export interface UserWebhookData extends WhopUser {}

// Typed webhook events
export type PaymentWebhookEvent = WhopWebhookEvent<PaymentWebhookData>;
export type SubscriptionWebhookEvent = WhopWebhookEvent<SubscriptionWebhookData>;
export type UserWebhookEvent = WhopWebhookEvent<UserWebhookData>;

// Union type for all possible webhook events
export type AnyWhopWebhookEvent = 
  | PaymentWebhookEvent 
  | SubscriptionWebhookEvent 
  | UserWebhookEvent;

// Configuration types
export interface PlanTierMapping {
  [planId: string]: 'developer' | 'architect' | 'enterprise';
}

export interface TierCredits {
  developer: number;
  architect: number;
  enterprise: number;
}

export interface WebhookProcessingResult {
  success: boolean;
  message: string;
  eventType: string;
  userId?: string;
  subscriptionId?: string;
}

export interface WebhookError {
  error: string;
  message?: string;
  eventType?: string;
  details?: any;
}