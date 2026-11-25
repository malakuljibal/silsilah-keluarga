import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/silsilah",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
