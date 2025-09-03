import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateTokenPair } from '@/lib/auth-tokens';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/auth/refresh - Refresh access token using refresh token
 * Standard OAuth 2.0 token refresh endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refresh_token, grant_type } = body;

    // Validate grant type
    if (grant_type && grant_type !== 'refresh_token') {
      return NextResponse.json(
        { error: 'unsupported_grant_type', error_description: 'Only refresh_token grant is supported' },
        { status: 400 }
      );
    }

    if (!refresh_token) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing refresh_token' },
        { status: 400 }
      );
    }

    // Verify the refresh token
    let tokenPayload;
    try {
      tokenPayload = await verifyToken(refresh_token);
    } catch (error) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Ensure it's a refresh token
    if (tokenPayload.type !== 'refresh') {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Token is not a refresh token' },
        { status: 401 }
      );
    }

    const userId = tokenPayload.sub;

    // Check if refresh token exists and is not revoked in database
    const { data: existingToken, error: tokenError } = await supabase
      .from('cli_tokens')
      .select('*')
      .eq('refresh_token', refresh_token)
      .is('revoked_at', null)
      .single();

    if (tokenError || !existingToken) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Refresh token not found or has been revoked' },
        { status: 401 }
      );
    }

    // Generate new token pair
    const { accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry } = 
      await generateTokenPair(userId);

    // Store new tokens in database (with reference to parent token)
    const { data: newTokenData, error: insertError } = await supabase
      .from('cli_tokens')
      .insert({
        user_id: userId,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: accessTokenExpiry.toISOString(),
        parent_token_id: existingToken.id,
        device_info: existingToken.device_info,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Auth Refresh] Failed to store new tokens:', insertError);
      return NextResponse.json(
        { error: 'server_error', error_description: 'Failed to generate new tokens' },
        { status: 500 }
      );
    }

    // Revoke the old refresh token
    await supabase
      .from('cli_tokens')
      .update({ 
        revoked_at: new Date().toISOString(),
        last_used_at: new Date().toISOString()
      })
      .eq('id', existingToken.id);

    // Log the refresh event
    await supabase.from('auth_audit_log').insert({
      user_id: userId,
      event_type: 'token_refreshed',
      token_id: newTokenData.id,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
      metadata: {
        parent_token_id: existingToken.id,
      },
    });

    // Return new tokens in OAuth 2.0 format
    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600, // 1 hour
    });

  } catch (error) {
    console.error('[Auth Refresh] Error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}