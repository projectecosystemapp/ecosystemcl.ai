# ECOSYSTEMCL.AI Deployment Guide

## Amplify Gen 2 Configuration

This project uses AWS Amplify Gen 2 with the following key components:

### Environment Variables Required

In your Amplify Console, configure these environment variables:

1. **WHOP_SECRET_API_KEY** - Your Whop API secret key for product provisioning
2. **WHOP_WEBHOOK_SECRET** - Secret for validating Whop webhook requests

### Build Process

The `amplify.yml` configuration includes:

1. **Product Provisioning**: During the backend preBuild phase, the system will:
   - Check if `WHOP_SECRET_API_KEY` is configured
   - If present, execute `provision_products.sh` to create ECOSYSTEMCL.AI product tiers
   - Handle failures gracefully without breaking the deployment

2. **Function Deployment**: The whop-webhook function will be deployed with:
   - Public Function URL for webhook access
   - Proper CORS configuration
   - Environment variables for webhook validation

### Webhook Configuration

After deployment, you'll need to:

1. Get the webhook URL from Amplify outputs: `WHOP_WEBHOOK_URL`
2. Configure this URL in your Whop dashboard for webhook events
3. Set the `WHOP_WEBHOOK_SECRET` environment variable for signature validation

### Troubleshooting

- If product provisioning fails, check the build logs for API key validation
- The deployment will continue even if product provisioning fails
- Webhook function should have a public URL accessible from Whop's systems