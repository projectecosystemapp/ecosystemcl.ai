import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Don't block production builds on ESLint errors
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  experimental: {
    // Ensure turbopack works in production
    turbo: {
      root: process.env.AMPLIFY_MONOREPO_APP_ROOT ? '../..' : undefined,
    },
  },
  // Allow images from Supabase storage if needed
  images: {
    domains: process.env.NEXT_PUBLIC_SUPABASE_URL 
      ? [new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname]
      : [],
  },
};

export default nextConfig;
