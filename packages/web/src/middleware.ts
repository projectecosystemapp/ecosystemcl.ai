import { NextRequest, NextResponse } from 'next/server';
import { runWithAmplifyServerContext } from 'aws-amplify/adapter-nextjs';
import { getCurrentUser } from 'aws-amplify/auth/server';
import outputs from '../amplify_outputs.json';

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
        nextServerContext: { cookies: request.cookies },
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