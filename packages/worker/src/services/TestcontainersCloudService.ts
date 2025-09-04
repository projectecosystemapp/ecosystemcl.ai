import { SecretsService } from './SecretsService';

export class TestcontainersCloudService {
  private static instance: TestcontainersCloudService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): TestcontainersCloudService {
    if (!TestcontainersCloudService.instance) {
      TestcontainersCloudService.instance = new TestcontainersCloudService();
    }
    return TestcontainersCloudService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const secretsService = SecretsService.getInstance();
      const { apiKey } = await secretsService.getTestcontainersCloudCredentials();
      
      // Set Testcontainers Cloud token in environment
      process.env.TC_CLOUD_TOKEN = apiKey;
      
      // Optional: Set other Testcontainers config
      process.env.TESTCONTAINERS_RYUK_DISABLED = 'true'; // Disable Ryuk for cloud environments
      process.env.TESTCONTAINERS_HOST_OVERRIDE = 'host.docker.internal'; // For Docker Desktop
      
      this.initialized = true;
      console.log('Testcontainers Cloud initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Testcontainers Cloud:', error);
      throw new Error(`Testcontainers Cloud initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getConfig(): Promise<{
    token: string;
    endpoint?: string;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    return {
      token: process.env.TC_CLOUD_TOKEN!,
      endpoint: process.env.TC_CLOUD_ENDPOINT,
    };
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  reset(): void {
    this.initialized = false;
    delete process.env.TC_CLOUD_TOKEN;
    delete process.env.TESTCONTAINERS_RYUK_DISABLED;
    delete process.env.TESTCONTAINERS_HOST_OVERRIDE;
  }
}