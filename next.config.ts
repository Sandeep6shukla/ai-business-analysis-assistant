import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ✅ Disable ESLint errors during builds (useful for hackathons / quick deploys)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;