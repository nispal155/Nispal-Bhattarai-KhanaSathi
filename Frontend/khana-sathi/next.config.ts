import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["example.com"], // 👈 allow external images
  }
};

export default nextConfig;
