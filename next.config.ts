import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.VITE_GOOGLE_MAPS_API_KEY || "",
    NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID:
      process.env.VITE_GOOGLE_MAPS_MAP_ID || "",
  },
};

export default nextConfig;
