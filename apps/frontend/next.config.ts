import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Mode Hybrid Next.js pour Azure Static Web Apps
  // Supporte SSR, routes dynamiques, App Router
  output: "standalone", // Optimise le build pour le déploiement (réduit la taille)

  // Fix pnpm workspace path issue with standalone output
  // Force Next.js to trace from monorepo root
  outputFileTracingRoot: path.join(__dirname, "../../"),

  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
