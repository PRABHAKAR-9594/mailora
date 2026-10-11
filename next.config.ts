import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb", // Allow CSV + attachment uploads via server actions
    },
  },
};

export default nextConfig;
