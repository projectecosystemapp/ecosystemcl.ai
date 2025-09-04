import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from 'aws-amplify/auth/server';
import { runWithAmplifyServerContext } from '@/lib/server-runner';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

// In-memory store for simplicity (use Redis in production)
// Note: This should be extracted to a separate module in production
let deviceCodeStore = new Map<string, {
  userCode: string;
  userId?: string;
  status: 'pending' | 'authorized' | 'denied' | 'expired';
  expiresAt: Date;
  tokens?: { accessToken: string; refreshToken: string; };
}>();

function generateDeviceCodes() {
  const deviceCode = randomBytes(32).toString('hex');
  const userCode = randomBytes(4).toString('hex').toUpperCase().match(/.{1,4}/g)?.join('-') || 'XXXX-XXXX';
  return { deviceCode, userCode };
}

/**
 * GET /api/device-auth/authorize - Initiate device authorization flow
 * Returns device code, user code, and verification URLs
 */
export async function GET(request: NextRequest) {
  try {
    const { deviceCode, userCode } = generateDeviceCodes();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUri = `${baseUrl}/device-auth`;
    const verificationUriComplete = `${baseUrl}/device-auth?user_code=${userCode}`;
    
    // Store in memory (simplified for consolidation)
    deviceCodeStore.set(deviceCode, {
      userCode,
      status: 'pending',
      expiresAt,
    });
    
    return NextResponse.json({
      device_code: deviceCode,
      user_code: userCode,
      verification_uri: verificationUri,
      verification_uri_complete: verificationUriComplete,
      expires_in: 900, // 15 minutes in seconds
      interval: 5, // Poll every 5 seconds
    });
    
  } catch (error) {
    console.error('[Device Auth] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/device-auth/authorize - Approve or deny device authorization
 * Called from the web UI when user approves/denies
 */
export async function POST(request: NextRequest) {
  try {
    const user = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => getCurrentUser(contextSpec)
    }).catch(() => null);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { user_code, action } = body;

    if (!user_code) {
      return NextResponse.json(
        { error: "Missing user_code" },
        { status: 400 }
      );
    }

    // Find device code by user code
    let deviceCode: string | null = null;
    let deviceData: any = null;
    
    for (const [code, data] of deviceCodeStore.entries()) {
      if (data.userCode === user_code && data.status === 'pending') {
        deviceCode = code;
        deviceData = data;
        break;
      }
    }
    
    if (!deviceCode || !deviceData) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 }
      );
    }

    // Check if code is expired
    if (deviceData.expiresAt < new Date()) {
      deviceData.status = 'expired';
      return NextResponse.json(
        { error: "Code has expired" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Generate simple token for CLI (simplified for consolidation)
      const accessToken = randomBytes(32).toString('hex');
      
      // Update in-memory store
      deviceData.status = 'authorized';
      deviceData.userId = user.userId;
      deviceData.tokens = { accessToken };

      return NextResponse.json({
        success: true,
        message: "Device authorized successfully",
      });
    } else if (action === "deny") {
      // Update in-memory store
      deviceData.status = 'denied';

      return NextResponse.json({
        success: true,
        message: "Device authorization denied",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Device Auth] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}