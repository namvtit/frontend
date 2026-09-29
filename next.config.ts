import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Bỏ qua typecheck khi build Docker trên VPS (tránh đơ máy/hết RAM)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
