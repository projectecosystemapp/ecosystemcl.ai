import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/agents(.*)",
  "/download(.*)",
]);

const isPublicApiRoute = createRouteMatcher([
  "/api/device-auth/(.*)",
  "/api/auth/refresh",
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public API routes without authentication
  if (isPublicApiRoute(req)) {
    return;
  }
  
  // Protect specific routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};