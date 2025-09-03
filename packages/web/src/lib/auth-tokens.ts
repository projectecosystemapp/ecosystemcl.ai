import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

// Get JWT secret from environment
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || process.env.CLERK_JWT_SECRET_KEY;
  if (!secret) {
    throw new Error('JWT_SECRET or CLERK_JWT_SECRET_KEY not configured');
  }
  return new TextEncoder().encode(secret);
};

export interface TokenPayload {
  sub: string; // user ID
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
  jti?: string; // JWT ID for tracking
}

/**
 * Generate access and refresh tokens for CLI authentication
 */
export async function generateTokenPair(userId: string) {
  const jwtSecret = getJwtSecret();
  const now = Math.floor(Date.now() / 1000);
  
  // Generate unique token IDs
  const accessTokenId = crypto.randomBytes(16).toString('hex');
  const refreshTokenId = crypto.randomBytes(16).toString('hex');
  
  // Access token - expires in 1 hour
  const accessToken = await new SignJWT({
    sub: userId,
    type: 'access',
    jti: accessTokenId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime('1h')
    .sign(jwtSecret);
  
  // Refresh token - expires in 30 days
  const refreshToken = await new SignJWT({
    sub: userId,
    type: 'refresh',
    jti: refreshTokenId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime('30d')
    .sign(jwtSecret);
  
  return {
    accessToken,
    refreshToken,
    accessTokenExpiry: new Date((now + 3600) * 1000), // 1 hour
    refreshTokenExpiry: new Date((now + 30 * 24 * 3600) * 1000), // 30 days
  };
}

/**
 * Verify and decode a token
 */
export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const jwtSecret = getJwtSecret();
    const { payload } = await jwtVerify(token, jwtSecret);
    return payload as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Generate secure random codes for device flow
 */
export function generateDeviceCodes() {
  // Device code - long, secure, not user-facing
  const deviceCode = crypto.randomBytes(32).toString('base64url');
  
  // User code - short, user-friendly (format: XXXX-YYYY)
  const userCodePart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const userCodePart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const userCode = `${userCodePart1}-${userCodePart2}`;
  
  return {
    deviceCode,
    userCode,
  };
}

/**
 * Rate limiting helper for polling endpoint
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  
  constructor(maxAttempts = 10, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);
    
    if (!record || record.resetTime < now) {
      this.attempts.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }
    
    if (record.count >= this.maxAttempts) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  reset(key: string) {
    this.attempts.delete(key);
  }
}