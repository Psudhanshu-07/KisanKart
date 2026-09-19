import type { NextConfig } from "next";

const backendUrl =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://farm2market-api.onrender.com"
    : "http://127.0.0.1:8000");

const cleanBackend = backendUrl.trim().replace(/\/+$/, "").replace(/\/api$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  // Support image domains or unoptimized for local demo
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${cleanBackend}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

