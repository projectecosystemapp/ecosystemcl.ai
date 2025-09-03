import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateDeviceCodes, generateTokenPair } from "@/lib/auth-tokens";

// In-memory store for simplicity (use Redis in production)
const deviceCodeStore = new Map<string, {
  userCode: string;
  userId?: string;
  status: 'pending' | 'authorized' | 'denied' | 'expired';
  expiresAt: Date;
  tokens?: { accessToken: string; refreshToken: string; };
}>();

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
    
    // Store in memory (in production, use database)
    deviceCodeStore.set(deviceCode, {
      userCode,
      status: 'pending',
      expiresAt,
    });
    
    // Also store in database for persistence
    const { data, error } = await supabase
      .from('device_codes')
      .insert({
        device_code: deviceCode,
        user_code: userCode,
        expires_at: expiresAt.toISOString(),
        verification_uri: verificationUri,
        verification_uri_complete: verificationUriComplete,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      })
      .select()
      .single();
    
    if (error) {
      console.error('[Device Auth] Failed to create device code:', error);
      // Continue anyway with in-memory store
    }
    
    // Return OAuth 2.0 Device Authorization Grant response
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
    const { userId } = await auth();
    if (!userId) {
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
      // Try database as fallback
      const { data: dbCode } = await supabase
        .from("device_codes")
        .select("*")
        .eq("user_code", user_code)
        .eq("status", "pending")
        .single();
      
      if (!dbCode) {
        return NextResponse.json(
          { error: "Invalid or expired code" },
          { status: 400 }
        );
      }
      
      deviceCode = dbCode.device_code;
      deviceData = {
        userCode: dbCode.user_code,
        status: dbCode.status,
        expiresAt: new Date(dbCode.expires_at),
      };
    }

    // Check if code is expired
    if (deviceData.expiresAt < new Date()) {
      deviceData.status = 'expired';
      
      await supabase
        .from("device_codes")
        .update({ status: "expired" })
        .eq("device_code", deviceCode);

      return NextResponse.json(
        { error: "Code has expired" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Generate tokens for the CLI
      const { accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry } = 
        await generateTokenPair(userId);
      
      // Update in-memory store
      deviceData.status = 'authorized';
      deviceData.userId = userId;
      deviceData.tokens = { accessToken, refreshToken };
      
      // Get user details from Clerk
      const user = await currentUser();
      
      // Store tokens in database
      const { data: tokenData, error: tokenError } = await supabase
        .from("cli_tokens")
        .insert({
          user_id: userId,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: accessTokenExpiry.toISOString(),
          device_info: {
            authorized_via: 'device_flow',
            user_email: user?.emailAddresses[0]?.emailAddress,
          }
        })
        .select()
        .single();
      
      if (tokenError) {
        console.error("[Device Auth] Token storage error:", tokenError);
      }
      
      // Update device code in database
      const { error: updateError } = await supabase
        .from("device_codes")
        .update({
          user_id: userId,
          status: "authorized",
          authorized_at: new Date().toISOString(),
        })
        .eq("device_code", deviceCode);

      if (updateError) {
        console.error("[Device Auth] Update error:", updateError);
      }

      // Log the authorization event
      await supabase.from("auth_audit_log").insert({
        user_id: userId,
        event_type: "device_authorized",
        token_id: tokenData?.id,
        ip_address: request.headers.get("x-forwarded-for") || 'unknown',
        user_agent: request.headers.get("user-agent") || 'unknown',
        metadata: {
          user_code,
          user_email: user?.emailAddresses[0]?.emailAddress,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Device authorized successfully",
      });
    } else if (action === "deny") {
      // Update in-memory store
      deviceData.status = 'denied';
      
      // Update device code as denied
      await supabase
        .from("device_codes")
        .update({ status: "denied" })
        .eq("device_code", deviceCode);

      // Log the denial event
      await supabase.from("auth_audit_log").insert({
        user_id: userId,
        event_type: "device_denied",
        ip_address: request.headers.get("x-forwarded-for") || 'unknown',
        user_agent: request.headers.get("user-agent") || 'unknown',
        metadata: { user_code },
      });

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

// Export for use in poll endpoint
export { deviceCodeStore };