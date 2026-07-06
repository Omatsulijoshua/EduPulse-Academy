import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  swcMinify: false,
  typescript: {
    // Skip build verification type checks if SWC WASM crashes during analysis
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip lint checks during build to make compiling faster
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
