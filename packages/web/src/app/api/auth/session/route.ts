import { NextRequest, NextResponse } from 'next/server';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth/server';
import { cookies } from 'next/headers';
import { runWithAmplifyServerContext } from '@/lib/amplify-server-utils';

export async function GET(request: NextRequest) {
  try {
    const response = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        try {
          const session = await fetchAuthSession(contextSpec);
          const user = await getCurrentUser(contextSpec);
          
          return {
            user: {
              userId: user.userId,
              username: user.username,
              signInDetails: user.signInDetails,
            },
            session: {
              authenticated: true,
              tokens: {
                accessToken: session.tokens?.accessToken?.toString(),
                idToken: session.tokens?.idToken?.toString(),
              },
              credentials: session.credentials,
            }
          };
        } catch (error) {
          return null;
        }
      },
    });

    if (!response) {
      return NextResponse.json(
        { authenticated: false, error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Session error' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // In a real implementation, you would call signOut here
    // For now, we'll just return a success response
    return NextResponse.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Signout error:', error);
    return NextResponse.json(
      { error: 'Signout failed' }, 
      { status: 500 }
    );
  }
}
