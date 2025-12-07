import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
    ],
  },
  // Empty turbopack config to silence the warning
  // tldraw works with dynamic imports and SSR disabled
  turbopack: {},
};

export default nextConfig;
