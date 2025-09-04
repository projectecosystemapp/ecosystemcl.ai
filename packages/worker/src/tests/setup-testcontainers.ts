import { TestcontainersCloudService } from '../services/TestcontainersCloudService';

/**
 * Global test setup for Testcontainers Cloud integration
 * This file should be imported at the top of test files that use Testcontainers
 */

export async function setupTestcontainersCloud(): Promise<void> {
  // Skip if already initialized or in CI environment with token set
  if (process.env.TC_CLOUD_TOKEN) {
    console.log('Testcontainers Cloud token already set');
    return;
  }

  // Only initialize if we have AWS credentials
  if (process.env.AWS_REGION && process.env.TCCLOUD_SECRET_ARN) {
    try {
      const tcCloudService = TestcontainersCloudService.getInstance();
      await tcCloudService.initialize();
      console.log('Testcontainers Cloud setup complete');
    } catch (error) {
      console.warn('Failed to setup Testcontainers Cloud, falling back to local Docker:', error);
      // Tests will fall back to local Docker if TC Cloud is not available
    }
  } else {
    console.log('Testcontainers Cloud not configured - using local Docker');
  }
}

// For Jest global setup
export default setupTestcontainersCloud;