import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export class SecretsService {
  private static instance: SecretsService;
  private secretsClient: SecretsManagerClient;
  private secretsCache: Map<string, { value: any; expiry: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.secretsClient = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  public static getInstance(): SecretsService {
    if (!SecretsService.instance) {
      SecretsService.instance = new SecretsService();
    }
    return SecretsService.instance;
  }

  async getSecret(secretArn: string): Promise<any> {
    const cached = this.secretsCache.get(secretArn);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }

    try {
      const command = new GetSecretValueCommand({ SecretId: secretArn });
      const response = await this.secretsClient.send(command);
      
      let secretValue: any;
      if (response.SecretString) {
        try {
          secretValue = JSON.parse(response.SecretString);
        } catch {
          secretValue = response.SecretString;
        }
      } else if (response.SecretBinary) {
        secretValue = Buffer.from(response.SecretBinary).toString('utf-8');
      } else {
        throw new Error('Secret value is empty');
      }

      this.secretsCache.set(secretArn, {
        value: secretValue,
        expiry: Date.now() + this.cacheTTL,
      });

      return secretValue;
    } catch (error) {
      console.error(`Failed to retrieve secret ${secretArn}:`, error);
      throw new Error(`Failed to retrieve secret: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTestcontainersCloudCredentials(): Promise<{ apiKey: string }> {
    const secretArn = process.env.TCCLOUD_SECRET_ARN;
    if (!secretArn) {
      throw new Error('TCCLOUD_SECRET_ARN environment variable not set');
    }

    const secret = await this.getSecret(secretArn);
    
    if (typeof secret === 'string') {
      return { apiKey: secret };
    }
    
    if (secret.apiKey) {
      return { apiKey: secret.apiKey };
    }
    
    throw new Error('Invalid Testcontainers Cloud secret format');
  }

  clearCache(): void {
    this.secretsCache.clear();
  }
}