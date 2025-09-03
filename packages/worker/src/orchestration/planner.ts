export const handler = async (_event: any) => {
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ result: 'planner placeholder' }),
  };
};

