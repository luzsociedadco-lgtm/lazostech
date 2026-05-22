import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  webpack: config => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;
