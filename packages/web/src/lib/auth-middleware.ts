import { NextRequest } from 'next/server';
import { verifyToken } from './auth-tokens';
import { supabase } from './supabase';

/**
 * Middleware to authenticate CLI requests using Bearer tokens
 * Falls back to Clerk auth if no Bearer token is present
 */
export async function authenticateRequest(request: NextRequest): Promise<{ userId: string } | null> {
  // Check for Bearer token in Authorization header
  const authHeader = request.headers.get('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      // Verify the JWT token
      const payload = await verifyToken(token);
      
      if (payload.type !== 'access') {
        return null;
      }
      
      // Check if token is still valid in database
      const { data: tokenRecord } = await supabase
        .from('cli_tokens')
        .select('user_id, revoked_at')
        .eq('access_token', token)
        .single();
      
      if (!tokenRecord || tokenRecord.revoked_at) {
        return null;
      }
      
      // Update last used timestamp
      await supabase
        .from('cli_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('access_token', token);
      
      return { userId: payload.sub };
    } catch (error) {
      console.error('[Auth Middleware] Token verification failed:', error);
      return null;
    }
  }
  
  return null;
}