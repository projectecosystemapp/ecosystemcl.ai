import { supabase } from './supabase';

// The Consensus Phase: Multi-agent collaboration before execution
export interface ConsensusRequest {
  workspaceId: string;
  goal: string;
  userId: string;
}

export interface ConsensusResult {
  plan: PlanStep[];
  stateUpdates: Record<string, any>;
  reasoning: string;
}

export interface PlanStep {
  stepNumber: number;
  agentProfile: string;
  name: string;
  prompt: string;
  requiresApproval: boolean;
  estimatedTokens: number;
  dependencies: number[]; // Step numbers this depends on
}

/**
 * The Orchestrator's Consensus Phase
 * This simulates a "meeting" where all relevant agents discuss the goal
 * and create a coordinated plan
 */
export async function runConsensusPhase(
  request: ConsensusRequest
): Promise<ConsensusResult> {
  
  // 1. Fetch workspace state
  const { data: workspaceState } = await supabase
    .from('workspace_states')
    .select('state_data')
    .eq('workspace_id', request.workspaceId)
    .single();
  
  const currentState = workspaceState?.state_data || {};
  
  // 2. Fetch available agent profiles
  const { data: agentProfiles } = await supabase
    .from('agent_profiles')
    .select('name, description, capabilities');
  
  // 3. Construct the multi-persona consensus prompt
  const consensusPrompt = buildConsensusPrompt(
    request.goal,
    currentState,
    agentProfiles || []
  );
  
  // 4. Call powerful LLM (using orchestrator config)
  const { data: orchestratorConfig } = await supabase
    .rpc('get_agent_config', {
      p_user_id: request.userId,
      p_agent_profile_id: await getOrchestratorId(),
      p_tier: await getUserTier(request.userId)
    });
  
  // 5. Execute consensus discussion
  const llmResponse = await callLLM({
    provider: orchestratorConfig.provider,
    model: orchestratorConfig.model_name,
    apiKey: orchestratorConfig.api_key,
    prompt: consensusPrompt,
    temperature: 0.7,
    maxTokens: 4096,
  });
  
  // 6. Parse the structured response
  const result = parseConsensusResponse(llmResponse);
  
  // 7. Update workspace state with new decisions
  if (result.stateUpdates && Object.keys(result.stateUpdates).length > 0) {
    await updateWorkspaceState(request.workspaceId, result.stateUpdates);
  }
  
  return result;
}

function buildConsensusPrompt(
  goal: string,
  currentState: any,
  agentProfiles: any[]
): string {
  return `
You are a committee of expert AI software development agents having a planning meeting.
Your team must collaborate to create a comprehensive plan for the following goal.

PROJECT CONTEXT:
${JSON.stringify(currentState, null, 2)}

USER GOAL:
${goal}

AVAILABLE AGENTS:
${agentProfiles.map(a => `- ${a.name}: ${a.description}`).join('\n')}

INSTRUCTIONS:
1. Each relevant agent should propose their approach to this goal
2. Identify dependencies between different parts of the work
3. Discuss potential conflicts or issues
4. Reach consensus on the optimal approach
5. Consider the project's history and constraints

Simulate a discussion between the agents. Show their thinking process.
Then output a final plan in this exact JSON format:

{
  "reasoning": "Brief explanation of the consensus reached",
  "plan": [
    {
      "stepNumber": 1,
      "agentProfile": "agent_name",
      "name": "Step name",
      "prompt": "Detailed prompt for the agent",
      "requiresApproval": false,
      "estimatedTokens": 2000,
      "dependencies": []
    }
  ],
  "stateUpdates": {
    "decisions": ["New architectural decision made"],
    "entities": {"NewEntity": "Description"},
    "constraints": ["New constraint identified"]
  }
}

Begin the agent discussion now:
`;
}

function parseConsensusResponse(llmResponse: string): ConsensusResult {
  // Extract JSON from the response
  const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse consensus response');
  }
  
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      plan: parsed.plan || [],
      stateUpdates: parsed.stateUpdates || {},
      reasoning: parsed.reasoning || 'No reasoning provided',
    };
  } catch (error) {
    console.error('Failed to parse consensus JSON:', error);
    throw new Error('Invalid consensus response format');
  }
}

async function updateWorkspaceState(
  workspaceId: string,
  updates: Record<string, any>
): Promise<void> {
  const { data: current } = await supabase
    .from('workspace_states')
    .select('state_data, version')
    .eq('workspace_id', workspaceId)
    .single();
  
  const newState = {
    ...current?.state_data || {},
    ...updates,
    lastUpdated: new Date().toISOString(),
  };
  
  await supabase
    .from('workspace_states')
    .upsert({
      workspace_id: workspaceId,
      state_data: newState,
      version: (current?.version || 0) + 1,
      last_updated_at: new Date().toISOString(),
    });
}

async function getOrchestratorId(): Promise<string> {
  const { data } = await supabase
    .from('agent_profiles')
    .select('id')
    .eq('name', 'orchestrator')
    .single();
  
  return data?.id || '';
}

async function getUserTier(userId: string): Promise<string> {
  // In production, this would check the user's subscription
  // For now, return 'standard'
  return 'standard';
}

// LLM calling abstraction (supports multiple providers)
async function callLLM(config: {
  provider: string;
  model: string;
  apiKey: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
}): Promise<string> {
  const { provider, model, apiKey, prompt, temperature, maxTokens } = config;
  
  switch (provider) {
    case 'openai':
      return callOpenAI(apiKey, model, prompt, temperature, maxTokens);
    case 'anthropic':
      return callAnthropic(apiKey, model, prompt, temperature, maxTokens);
    case 'together':
      return callTogether(apiKey, model, prompt, temperature, maxTokens);
    case 'groq':
      return callGroq(apiKey, model, prompt, temperature, maxTokens);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// Provider-specific implementations
async function callOpenAI(
  apiKey: string,
  model: string,
  prompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callTogether(
  apiKey: string,
  model: string,
  prompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const response = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGroq(
  apiKey: string,
  model: string,
  prompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(
  apiKey: string,
  model: string,
  prompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });
  
  const data = await response.json();
  return data.content[0].text;
}