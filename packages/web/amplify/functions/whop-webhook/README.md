# Whop Webhook Handler

This AWS Lambda function handles webhook events from Whop for subscription management in ECOSYSTEMCL.AI.

## Features

- **Secure webhook verification** using HMAC SHA256 signatures
- **Comprehensive event handling** for all Whop subscription lifecycle events
- **Automatic user profile updates** in DynamoDB via Amplify DataStore
- **Type-safe implementation** with comprehensive TypeScript types
- **Error handling and logging** for production reliability
- **Configurable plan-to-tier mapping** for flexible subscription tiers

## Supported Webhook Events

| Event Type | Description | Action |
|------------|-------------|---------|
| `payment_succeeded` | Payment completed successfully | Create/update subscription, add credits |
| `payment_failed` | Payment failed | Log event (no user update) |
| `payment_cancelled` | Payment was cancelled | Update subscription status to cancelled |
| `subscription_created` | New subscription created | Create user subscription record |
| `subscription_updated` | Subscription details changed | Update user subscription details |
| `subscription_cancelled` | Subscription cancelled | Set subscription status to cancelled |
| `subscription_renewed` | Subscription renewed | Update subscription end date |
| `trial_ended` | Trial period ended | Update subscription status |

## Configuration

### Environment Variables

Set these environment variables in your Amplify backend:

- `WHOP_WEBHOOK_SECRET`: Your Whop webhook signing secret (required)

### Plan-to-Tier Mapping

Update the `PLAN_TIER_MAPPING` object in `handler.ts` to map your Whop plan IDs to subscription tiers:

```typescript
const PLAN_TIER_MAPPING: PlanTierMapping = {
  'plan_abc123': 'developer',    // Developer plan
  'plan_def456': 'architect',    // Architect plan  
  'plan_ghi789': 'enterprise',   // Enterprise plan
};
```

### Credit Allocation

Configure default credits per tier in the `TIER_CREDITS` object:

```typescript
const TIER_CREDITS: TierCredits = {
  developer: 50000,    // 50K credits for developer tier
  architect: 200000,   // 200K credits for architect tier
  enterprise: 500000,  // 500K credits for enterprise tier
};
```

## Webhook Setup in Whop

1. Go to your Whop app settings
2. Navigate to Webhooks section
3. Add a new webhook endpoint: `https://your-amplify-domain.com/whop-webhook`
4. Select the events you want to receive:
   - Payment events: `payment_succeeded`, `payment_failed`, `payment_cancelled`
   - Subscription events: `subscription_created`, `subscription_updated`, `subscription_cancelled`
   - Trial events: `trial_ended`
5. Copy the webhook secret and set it as `WHOP_WEBHOOK_SECRET` environment variable

## User Profile Updates

The function automatically updates user profiles with:

- **Subscription ID**: Links user to Whop subscription
- **Subscription status**: Current status (active, cancelled, etc.)
- **Subscription tier**: Maps plan to tier (developer/architect/enterprise)
- **Credits**: Adds credits based on tier when subscription created
- **Trial dates**: Tracks trial start/end if applicable
- **Subscription dates**: Tracks subscription validity period

## Error Handling

The function includes comprehensive error handling:

- **Signature verification**: Rejects invalid webhook signatures
- **Missing configuration**: Returns 500 if webhook secret not configured
- **Database errors**: Logs errors and returns appropriate status codes
- **Unknown event types**: Logs unhandled events but returns success

## Security

- **HMAC SHA256 signature verification** prevents unauthorized webhook calls
- **Timing-safe comparison** prevents timing attacks on signature verification
- **Environment variable protection** keeps webhook secrets secure
- **Input validation** ensures webhook payloads are properly formatted

## Monitoring and Logging

The function logs:

- All incoming webhook events (structured logging)
- Successful user profile updates
- Errors and warnings with context
- Unknown or unhandled event types

Use AWS CloudWatch to monitor function execution and debug issues.

## Testing

To test the webhook handler:

1. Use a tool like ngrok to expose your local Amplify dev environment
2. Set up a test webhook in Whop pointing to your ngrok URL
3. Create test subscriptions in Whop to trigger webhook events
4. Monitor CloudWatch logs for function execution

## Deployment

The function is automatically deployed when you deploy your Amplify backend:

```bash
npx ampx sandbox
# or
npx ampx deploy --branch main
```

## Function URL

After deployment, the function URL is available in the Amplify outputs as `WHOP_WEBHOOK_URL`. Use this URL when configuring webhooks in Whop.