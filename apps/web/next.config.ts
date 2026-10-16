import type { NextConfig } from "next";

// Server-side only: where the storefront forwards /api/v1/* requests.
const API_PROXY_TARGET = process.env.API_PROXY_TARGET || "http://localhost:3001";

const nextConfig: NextConfig = {
  // Every storefront host serves the API from its own origin so the refresh
  // cookie stays first-party on platform subdomains and custom domains alike.
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_PROXY_TARGET.replace(/\/+$/, "")}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
