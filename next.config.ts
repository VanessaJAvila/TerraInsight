import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Improve Windows compatibility for webpack caching
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable webpack cache on Windows to prevent ENOENT errors
      config.cache = false;
    }
    return config;
  },
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
