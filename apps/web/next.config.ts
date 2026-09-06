import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  turbopack: {
    // `next build` can be invoked through pnpm from a nested workspace path.
    // Keep Turbopack anchored to this app so it resolves the app-local Next.js
    // installation instead of inferring `src/app` as the project root.
    root: new URL(".", import.meta.url).pathname,
  },
};

export default nextConfig;
