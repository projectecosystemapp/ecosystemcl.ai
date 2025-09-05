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
          const user = await getCurrentUser(contextSpec);
          const session = await fetchAuthSession(contextSpec);
          
          // Return user profile information
          return {
            userId: user.userId,
            username: user.username,
            email: user.signInDetails?.loginId,
            signInDetails: user.signInDetails,
            createdAt: new Date().toISOString(), // In real app, get from database
            updatedAt: new Date().toISOString(),
            preferences: {
              theme: 'dark',
              notifications: true,
              language: 'en',
            },
            subscription: {
              plan: 'free',
              creditsUsed: 0,
              creditsTotal: 1000,
            },
          };
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

    return NextResponse.json(response);
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        try {
          const user = await getCurrentUser(contextSpec);
          
          // In a real implementation, update user profile in database
          const updatedProfile = {
            userId: user.userId,
            ...body,
            updatedAt: new Date().toISOString(),
          };
          
          return updatedProfile;
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

    return NextResponse.json(response);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' }, 
      { status: 500 }
    );
  }
}
