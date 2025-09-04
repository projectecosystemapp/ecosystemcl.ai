import { LambdaClient, UpdateFunctionConfigurationCommand } from '@aws-sdk/client-lambda';

/**
 * Circuit Breaker Reset Lambda
 * Resets the CDC processor circuit breaker by updating function configuration
 */
export const handler = async () => {
  const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-west-2' });
  const functionName = process.env.CDC_FUNCTION_NAME!;
  
  try {
    // Update function configuration to reset circuit breaker state
    // This forces a cold start which clears the in-memory circuit breaker
    await lambdaClient.send(new UpdateFunctionConfigurationCommand({
      FunctionName: functionName,
      Timeout: 300, // 5 minutes
      Environment: {
        Variables: {
          CIRCUIT_BREAKER_RESET: Date.now().toString(),
        }
      }
    }));
    
    console.log(`Circuit breaker reset for function: ${functionName}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Circuit breaker reset successfully',
        functionName,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Failed to reset circuit breaker:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Circuit breaker reset failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};