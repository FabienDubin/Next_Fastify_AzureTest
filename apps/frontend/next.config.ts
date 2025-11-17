import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // ⚠️ IMPORTANT pour Static Web Apps
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
