import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runConsensusPhase } from '@/lib/consensus';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              state_data: {
                architecture: { type: 'microservices' },
                entities: { User: 'Main user entity' },
                constraints: ['Must support 10k users'],
              },
            },
          })),
        })),
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    })),
    rpc: vi.fn(() => Promise.resolve({
      data: {
        provider: 'openai',
        model_name: 'gpt-4',
        api_key: 'test-key',
      },
    })),
  },
}));

// Mock fetch for LLM calls
global.fetch = vi.fn();

describe('Consensus Phase Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a valid consensus prompt with workspace state', async () => {
    // Mock LLM response
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              reasoning: 'Based on the microservices architecture...',
              plan: [
                {
                  stepNumber: 1,
                  agentProfile: 'database_architect',
                  name: 'Design shopping cart schema',
                  prompt: 'Create tables for cart and cart_items',
                  requiresApproval: false,
                  estimatedTokens: 2000,
                  dependencies: [],
                },
                {
                  stepNumber: 2,
                  agentProfile: 'code_generator',
                  name: 'Generate API endpoints',
                  prompt: 'Create CRUD endpoints for cart',
                  requiresApproval: true,
                  estimatedTokens: 3000,
                  dependencies: [1],
                },
              ],
              stateUpdates: {
                entities: { Cart: 'Shopping cart entity', CartItem: 'Cart item entity' },
                decisions: ['Using Redis for cart session storage'],
              },
            }),
          },
        }],
      }),
    });

    const result = await runConsensusPhase({
      workspaceId: 'test-workspace-id',
      goal: 'Add shopping cart functionality',
      userId: 'test-user-id',
    });

    // Verify the result structure
    expect(result).toHaveProperty('plan');
    expect(result).toHaveProperty('stateUpdates');
    expect(result).toHaveProperty('reasoning');

    // Verify plan details
    expect(result.plan).toHaveLength(2);
    expect(result.plan[0].agentProfile).toBe('database_architect');
    expect(result.plan[1].agentProfile).toBe('code_generator');
    expect(result.plan[1].dependencies).toContain(1);

    // Verify state updates
    expect(result.stateUpdates.entities).toHaveProperty('Cart');
    expect(result.stateUpdates.decisions).toContain('Using Redis for cart session storage');

    // Verify fetch was called with correct structure
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-key',
        }),
        body: expect.stringContaining('microservices'), // Should include workspace state
      })
    );
  });

  it('handles malformed LLM responses gracefully', async () => {
    // Mock invalid LLM response
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        choices: [{
          message: {
            content: 'This is not valid JSON',
          },
        }],
      }),
    });

    await expect(
      runConsensusPhase({
        workspaceId: 'test-workspace-id',
        goal: 'Add feature',
        userId: 'test-user-id',
      })
    ).rejects.toThrow('Invalid consensus response format');
  });

  it('includes all agent profiles in the consensus prompt', async () => {
    let capturedPrompt = '';
    
    (global.fetch as any).mockImplementation(async (url: string, options: any) => {
      const body = JSON.parse(options.body);
      capturedPrompt = body.messages[0].content;
      
      return {
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                reasoning: 'Test',
                plan: [],
                stateUpdates: {},
              }),
            },
          }],
        }),
      };
    });

    await runConsensusPhase({
      workspaceId: 'test-workspace-id',
      goal: 'Test goal',
      userId: 'test-user-id',
    });

    // Verify the prompt includes agent roles
    expect(capturedPrompt).toContain('DatabaseArchitect');
    expect(capturedPrompt).toContain('CodeGenerator');
    expect(capturedPrompt).toContain('SecurityAuditor');
    expect(capturedPrompt).toContain('USER GOAL');
    expect(capturedPrompt).toContain('PROJECT CONTEXT');
  });

  it('correctly parses complex consensus responses', async () => {
    const complexResponse = {
      reasoning: 'Multi-step authentication implementation',
      plan: [
        {
          stepNumber: 1,
          agentProfile: 'security_auditor',
          name: 'Audit current auth',
          prompt: 'Review existing authentication',
          requiresApproval: false,
          estimatedTokens: 1500,
          dependencies: [],
        },
        {
          stepNumber: 2,
          agentProfile: 'database_architect',
          name: 'Design auth tables',
          prompt: 'Create session and token tables',
          requiresApproval: false,
          estimatedTokens: 2000,
          dependencies: [1],
        },
        {
          stepNumber: 3,
          agentProfile: 'code_generator',
          name: 'Implement OAuth',
          prompt: 'Add OAuth2 flow',
          requiresApproval: true,
          estimatedTokens: 5000,
          dependencies: [1, 2],
        },
      ],
      stateUpdates: {
        architecture: { auth: 'OAuth2 with JWT' },
        constraints: ['Must support SSO'],
        decisions: ['Using Passport.js for OAuth'],
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify(complexResponse),
          },
        }],
      }),
    });

    const result = await runConsensusPhase({
      workspaceId: 'test-workspace-id',
      goal: 'Add OAuth authentication',
      userId: 'test-user-id',
    });

    expect(result.plan).toHaveLength(3);
    expect(result.plan[2].dependencies).toEqual([1, 2]);
    expect(result.plan[2].requiresApproval).toBe(true);
    expect(result.stateUpdates.constraints).toContain('Must support SSO');
  });

  it('updates workspace state after successful consensus', async () => {
    const mockSupabase = (await import('@/lib/supabase')).supabase;
    
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              reasoning: 'Test',
              plan: [],
              stateUpdates: {
                newField: 'newValue',
              },
            }),
          },
        }],
      }),
    });

    await runConsensusPhase({
      workspaceId: 'test-workspace-id',
      goal: 'Test',
      userId: 'test-user-id',
    });

    // Verify workspace state was updated
    expect(mockSupabase.from).toHaveBeenCalledWith('workspace_states');
    expect(mockSupabase.from('').upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace_id: 'test-workspace-id',
        state_data: expect.objectContaining({
          newField: 'newValue',
        }),
      })
    );
  });
});