import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mode Hybrid Next.js pour Azure Static Web Apps
  // Supporte SSR, routes dynamiques, App Router
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
