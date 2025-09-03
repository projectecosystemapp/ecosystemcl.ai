import { NextRequest, NextResponse } from 'next/server';
import { deviceCodeStore } from '../authorize/route';
import { RateLimiter } from '@/lib/auth-tokens';

// Rate limiter to prevent abuse
const rateLimiter = new RateLimiter(20, 60000); // 20 requests per minute per device

/**
 * POST /api/device-auth/poll - Poll for device authorization status
 * Called by CLI to check if user has authorized the device
 */
export async function POST(req: NextRequest) {
  try {
    const { device_code, client_id } = await req.json();

    if (!device_code) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing device_code' },
        { status: 400 }
      );
    }

    // Rate limiting
    if (!rateLimiter.isAllowed(device_code)) {
      return NextResponse.json(
        { error: 'slow_down', error_description: 'Too many requests' },
        { status: 429 }
      );
    }

    // Check device code status
    const deviceData = deviceCodeStore.get(device_code);
    
    if (!deviceData) {
      return NextResponse.json(
        { error: 'expired_token', error_description: 'Device code has expired or is invalid' },
        { status: 400 }
      );
    }

    // Check if expired
    if (deviceData.expiresAt < new Date()) {
      deviceCodeStore.delete(device_code);
      return NextResponse.json(
        { error: 'expired_token', error_description: 'Device code has expired' },
        { status: 400 }
      );
    }

    // Check authorization status
    switch (deviceData.status) {
      case 'pending':
        // Still waiting for user authorization
        return NextResponse.json(
          { error: 'authorization_pending', error_description: 'Waiting for user authorization' },
          { status: 400 }
        );
      
      case 'denied':
        // User denied the authorization
        deviceCodeStore.delete(device_code);
        return NextResponse.json(
          { error: 'access_denied', error_description: 'User denied the authorization request' },
          { status: 400 }
        );
      
      case 'expired':
        // Code has expired
        deviceCodeStore.delete(device_code);
        return NextResponse.json(
          { error: 'expired_token', error_description: 'Device code has expired' },
          { status: 400 }
        );
      
      case 'authorized':
        // Success! Return the tokens
        if (!deviceData.tokens) {
          return NextResponse.json(
            { error: 'invalid_grant', error_description: 'Authorization succeeded but tokens not found' },
            { status: 500 }
          );
        }
        
        // Clean up the device code after successful authorization
        deviceCodeStore.delete(device_code);
        rateLimiter.reset(device_code);
        
        // Return OAuth 2.0 compliant token response
        return NextResponse.json({
          access_token: deviceData.tokens.accessToken,
          refresh_token: deviceData.tokens.refreshToken,
          token_type: 'Bearer',
          expires_in: 3600, // 1 hour
        });
      
      default:
        return NextResponse.json(
          { error: 'invalid_grant', error_description: 'Invalid device code status' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('[Device Auth Poll] Error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}