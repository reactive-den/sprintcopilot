import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(), // Explicitly set the project root to silence workspace warning
  },
};

export default nextConfig;
