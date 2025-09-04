import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from 'aws-amplify/auth/server';
import { runWithAmplifyServerContext } from './lib/server-runner';
import awsConfig from './config';

const protectedRoutes = [
  '/dashboard',
  '/agents',
  '/download'
];

const publicApiRoutes = [
  '/api/device-auth',
  '/api/auth/refresh'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public API routes
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Check auth for protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    try {
      const user = await runWithAmplifyServerContext({
        nextServerContext: { 
          cookies: async () => {
            return {
              get: (name: string) => request.cookies.get(name),
              getAll: () => request.cookies.getAll(),
              has: (name: string) => request.cookies.has(name),
              set: () => {},  // No-op for middleware
              delete: () => {} // No-op for middleware
            } as any;
          }
        },
        operation: (contextSpec) => getCurrentUser(contextSpec)
      });
      
      if (!user) {
        return NextResponse.redirect(new URL('/auth', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};