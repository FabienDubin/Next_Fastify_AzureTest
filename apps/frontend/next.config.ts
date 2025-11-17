import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mode Hybrid Next.js pour Azure Static Web Apps
  // Supporte SSR, routes dynamiques, App Router
  output: "standalone", // Optimise le build pour le déploiement (réduit la taille)
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
