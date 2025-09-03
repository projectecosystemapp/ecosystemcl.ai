import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test database URL - in production, use a dedicated test database
const TEST_SUPABASE_URL = process.env.TEST_SUPABASE_URL || 'https://test.supabase.co';
const TEST_SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY || 'test-anon-key';
const TEST_SUPABASE_SERVICE_KEY = process.env.TEST_SUPABASE_SERVICE_KEY || 'test-service-key';

describe('Database RLS Security Tests', () => {
  let serviceClient: any;
  let userAClient: any;
  let userBClient: any;
  
  let userAId: string;
  let userBId: string;
  let userAPlanId: string;
  let userAWorkspaceId: string;

  beforeAll(async () => {
    // Skip if no test database configured
    if (TEST_SUPABASE_URL === 'https://test.supabase.co') {
      console.warn('Skipping RLS tests - no test database configured');
      return;
    }

    // Service client can bypass RLS
    serviceClient = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_SERVICE_KEY);
    
    // Create test users
    const { data: userA } = await serviceClient.auth.admin.createUser({
      email: 'userA@test.com',
      password: 'password123',
    });
    userAId = userA?.user?.id || '';

    const { data: userB } = await serviceClient.auth.admin.createUser({
      email: 'userB@test.com',
      password: 'password123',
    });
    userBId = userB?.user?.id || '';

    // Create authenticated clients for each user
    const { data: sessionA } = await serviceClient.auth.signInWithPassword({
      email: 'userA@test.com',
      password: 'password123',
    });
    userAClient = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${sessionA?.session?.access_token}`,
        },
      },
    });

    const { data: sessionB } = await serviceClient.auth.signInWithPassword({
      email: 'userB@test.com',
      password: 'password123',
    });
    userBClient = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${sessionB?.session?.access_token}`,
        },
      },
    });

    // Create test data for User A
    const { data: workspace } = await serviceClient
      .from('workspaces')
      .insert({
        user_id: userAId,
        repo_url: 'https://github.com/userA/test-repo',
        repo_name: 'test-repo',
        repo_owner: 'userA',
      })
      .select()
      .single();
    userAWorkspaceId = workspace?.id;

    const { data: plan } = await serviceClient
      .from('plans')
      .insert({
        user_id: userAId,
        workspace_id: userAWorkspaceId,
        name: 'User A Test Plan',
        goal: 'Test goal for User A',
        status: 'queued',
      })
      .select()
      .single();
    userAPlanId = plan?.id;
  });

  afterAll(async () => {
    if (TEST_SUPABASE_URL === 'https://test.supabase.co') return;

    // Clean up test data
    await serviceClient.from('plans').delete().eq('user_id', userAId);
    await serviceClient.from('plans').delete().eq('user_id', userBId);
    await serviceClient.from('workspaces').delete().eq('user_id', userAId);
    await serviceClient.from('workspaces').delete().eq('user_id', userBId);
    
    // Delete test users
    await serviceClient.auth.admin.deleteUser(userAId);
    await serviceClient.auth.admin.deleteUser(userBId);
  });

  describe('Workspaces RLS', () => {
    it('User A can see their own workspaces', async () => {
      if (TEST_SUPABASE_URL === 'https://test.supabase.co') return;

      const { data, error } = await userAClient
        .from('workspaces')
        .select('*')
        .eq('id', userAWorkspaceId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0]?.id).toBe(userAWorkspaceId);
    });

    it('User B cannot see User A workspaces', async () => {
      if (TEST_SUPABASE_URL === 'https://test.supabase.co') return;

      const { data, error } = await userBClient
        .from('workspaces')
        .select('*')
        .eq('id', userAWorkspaceId);

      expect(error).toBeNull();
      expect(data).toHaveLength(0); // Should return empty array, not an error
    });

    it('User B cannot modify User A workspaces', async () => {
      if (TEST_SUPABASE_URL === 'https://test.supabase.co') return;

      const { data, error } = await userBClient
        .from('workspaces')
        .update({ repo_name: 'hacked' })
        .eq('id', userAWorkspaceId);

      expect(data).toBeNull();
      // RLS should prevent the update
      expect(error?.message).toContain('new row violates row-level security');
    });
  });

  describe('Plans RLS', () => {
    it('User A can see their own plans', async () => {
      if (TEST_SUPABASE_URL === 'https://test.supabase.co') return;

      const { data, error } = await userAClient
        .from('plans')
        .select('*')
        .eq('id', userAPlanId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0]?.name).toBe('User A Test Plan');
    });

    it('User B cannot see User A plans', async () => {
      if (TEST_SUPABASE_URL === 'https://test.supabase.co') return;

      const { data, error } = await userBClient
        .from('plans')
        .select('*')
        .eq('id', userAPlanId);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('User B cannot delete User A plans', async () => {
      if (TEST_SUPABASE_URL === 'https://test.supabase.co') return;

      const { data, error } = await userBClient
        .from('plans')
        .delete()
        .eq('id', userAPlanId);

      // Should not delete anything due to RLS
      expect(data).toHaveLength(0);
      
      // Verify plan still exists
      const { data: checkData } = await serviceClient
        .from('plans')
        .select('*')
        .eq('id', userAPlanId);
      
      expect(checkData).toHaveLength(1);
    });
  });

  describe('User Agent Configs RLS', () => {
    it('User A can create their own agent configs', async () => {
      if (TEST_SUPABASE_URL === 'https://test.supabase.co') return;

      const { data, error } = await userAClient
        .from('user_agent_configs')
        .insert({
          user_id: userAId,
          agent_profile_id: 'test-agent-id',
          provider: 'openai',
          model_name: 'gpt-4',
          encrypted_api_key: 'encrypted_test_key',
        })
        .select();

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('User B cannot see User A agent configs', async () => {
      if (TEST_SUPABASE_URL === 'https://test.supabase.co') return;

      const { data, error } = await userBClient
        .from('user_agent_configs')
        .select('*')
        .eq('user_id', userAId);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('User B cannot create configs for User A', async () => {
      if (TEST_SUPABASE_URL === 'https://test.supabase.co') return;

      const { data, error } = await userBClient
        .from('user_agent_configs')
        .insert({
          user_id: userAId, // Trying to create for User A
          agent_profile_id: 'test-agent-id',
          provider: 'openai',
          model_name: 'gpt-4',
          encrypted_api_key: 'malicious_key',
        });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('new row violates row-level security');
    });
  });
});