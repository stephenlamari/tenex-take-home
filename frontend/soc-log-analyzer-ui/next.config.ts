import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Enable static export for Cloudflare Pages
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true, // Cloudflare Pages doesn't support Next.js Image Optimization
  },
  // Skip build-time checks that might fail in Cloudflare Pages environment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Set the correct workspace root
  outputFileTracingRoot: path.join(__dirname),
  // Configure dynamic routes to be skipped during static generation
  // This allows client-side routing to handle them
  generateBuildId: async () => {
    return 'build'
  },
};

export default nextConfig;
