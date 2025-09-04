import type { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { goal, workspaceId } = JSON.parse(event.body || '{}');
  
  if (!goal) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Goal is required' })
    };
  }

  // Basic plan generation
  const plan = {
    id: `plan_${Date.now()}`,
    goal,
    workspaceId,
    status: 'pending',
    steps: [
      { id: 1, task: 'Analyze requirements', agent: 'analyzer' },
      { id: 2, task: 'Generate code', agent: 'coder' },
      { id: 3, task: 'Test implementation', agent: 'tester' }
    ],
    estimatedCredits: 100,
    estimatedTime: '5 minutes'
  };

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      plan,
      message: 'Plan generated successfully'
    })
  };
};