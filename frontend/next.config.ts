import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.7", "192.168.1.35"],
  turbopack: {
    root: "D:\\sns maps\\mapsns\\mapsns\\frontend",
  },
};

export default nextConfig;
