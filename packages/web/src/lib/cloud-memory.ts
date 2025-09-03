import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';

export class CloudMemoryService {
  private supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  private redis = new Redis(process.env.REDIS_URL!);

  async storeArtifact(userId: string, workspaceId: string, key: string, data: Buffer) {
    const path = `${userId}/${workspaceId}/artifacts/${key}`;
    return this.supabase.storage.from('forge-artifacts').upload(path, data);
  }

  async cacheResult(userId: string, taskHash: string, result: any, ttl = 3600) {
    const key = `cache:${userId}:${taskHash}`;
    return this.redis.setex(key, ttl, JSON.stringify(result));
  }

  async getCachedResult(userId: string, taskHash: string) {
    const key = `cache:${userId}:${taskHash}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
}