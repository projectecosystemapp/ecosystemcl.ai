import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { setupTestcontainersCloud } from './setup-testcontainers';

describe('Testcontainers Cloud Integration Example', () => {
  let container: StartedTestContainer;

  beforeAll(async () => {
    // Setup Testcontainers Cloud if configured
    await setupTestcontainersCloud();
  });

  afterAll(async () => {
    if (container) {
      await container.stop();
    }
  });

  test('should start a Redis container using Testcontainers Cloud', async () => {
    // Start a Redis container
    container = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .withName('test-redis')
      .start();

    // Get connection details
    const host = container.getHost();
    const port = container.getMappedPort(6379);

    expect(host).toBeDefined();
    expect(port).toBeGreaterThan(0);

    console.log(`Redis container started at ${host}:${port}`);
    
    // Verify container is running
    const isRunning = await container.exec(['redis-cli', 'ping']);
    expect(isRunning.output.trim()).toContain('PONG');
  });

  test('should start a DynamoDB Local container', async () => {
    const dynamoContainer = await new GenericContainer('amazon/dynamodb-local:latest')
      .withExposedPorts(8000)
      .withName('test-dynamodb')
      .start();

    const host = dynamoContainer.getHost();
    const port = dynamoContainer.getMappedPort(8000);

    expect(host).toBeDefined();
    expect(port).toBeGreaterThan(0);

    console.log(`DynamoDB Local container started at ${host}:${port}`);

    await dynamoContainer.stop();
  });
});