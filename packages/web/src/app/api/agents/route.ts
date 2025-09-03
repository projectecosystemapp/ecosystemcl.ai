import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const AGENTS = [
  {
    id: 'orchestrator',
    name: 'Orchestrator',
    description: 'Master planner that coordinates other agents',
    category: 'Core',
    tier: 'starter',
    capabilities: ['Task planning', 'Agent coordination'],
    pricing: '10 credits per plan',
    icon: '🎯'
  },
  {
    id: 'code-generator',
    name: 'Code Generator',
    description: 'Writes production-ready code',
    category: 'Development',
    tier: 'starter',
    capabilities: ['Multi-language support', 'Best practices'],
    pricing: '50 credits per file',
    icon: '⚡'
  },
  {
    id: 'security-auditor',
    name: 'Security Auditor',
    description: 'Scans code for vulnerabilities',
    category: 'Security',
    tier: 'pro',
    capabilities: ['OWASP scanning', 'Security recommendations'],
    pricing: '100 credits per audit',
    icon: '🛡️'
  }
];

export async function GET() {
  try {
    const { userId } = await auth();
    
    const availableAgents = AGENTS.map(agent => ({
      ...agent,
      available: userId ? true : agent.tier === 'starter'
    }));

    return NextResponse.json({
      agents: availableAgents
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}