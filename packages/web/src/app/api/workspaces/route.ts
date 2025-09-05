import { NextRequest, NextResponse } from 'next/server';
import { runWithAmplifyServerContext } from '@/lib/amplify-server-utils';
import { getCurrentUser } from 'aws-amplify/auth/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const response = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        try {
          const user = await getCurrentUser(contextSpec);
          
          // Return mock workspace data - in real app, fetch from DynamoDB
          return [
            {
              id: '1',
              name: 'Production App',
              description: 'Main production application workspace',
              status: 'active',
              createdAt: '2024-01-15T10:00:00Z',
              updatedAt: '2024-09-04T15:30:00Z',
              owner: user.userId,
              agents: 12,
              tasks: 45,
              lastActivity: '2 hours ago',
            },
            {
              id: '2', 
              name: 'Testing Environment',
              description: 'Automated testing and QA workspace',
              status: 'active',
              createdAt: '2024-02-01T14:20:00Z',
              updatedAt: '2024-09-04T12:15:00Z',
              owner: user.userId,
              agents: 8,
              tasks: 23,
              lastActivity: '5 hours ago',
            },
            {
              id: '3',
              name: 'ML Experiments',
              description: 'Machine learning model training workspace',
              status: 'paused',
              createdAt: '2024-03-10T09:45:00Z',
              updatedAt: '2024-08-28T16:20:00Z',
              owner: user.userId,
              agents: 4,
              tasks: 12,
              lastActivity: '1 week ago',
            }
          ];
        } catch (error) {
          return null;
        }
      },
    });

    if (!response) {
      return NextResponse.json(
        { error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    return NextResponse.json({ workspaces: response });
  } catch (error) {
    console.error('Workspaces fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        try {
          const user = await getCurrentUser(contextSpec);
          
          // In a real implementation, create workspace in DynamoDB
          const newWorkspace = {
            id: Date.now().toString(),
            name: body.name,
            description: body.description || '',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            owner: user.userId,
            agents: 0,
            tasks: 0,
            lastActivity: 'just now',
          };
          
          return newWorkspace;
        } catch (error) {
          return null;
        }
      },
    });

    if (!response) {
      return NextResponse.json(
        { error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Workspace creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create workspace' }, 
      { status: 500 }
    );
  }
}
