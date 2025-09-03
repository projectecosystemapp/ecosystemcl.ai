import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Don't block production builds on ESLint errors
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  // Allow images from AWS S3 if needed
  images: {
    domains: [
      'ecosystemcl-ai.s3.amazonaws.com',
      'ecosystemcl-ai.s3.us-east-1.amazonaws.com'
    ],
  },
};

export default nextConfig;
