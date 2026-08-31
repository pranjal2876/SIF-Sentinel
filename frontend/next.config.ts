import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: "https://sif-sentinel.onrender.com/api/v1/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/command-center",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/emerging-patterns",
        destination: "/patterns",
        permanent: false,
      },
      {
        source: "/preventive-actions",
        destination: "/actions",
        permanent: false,
      },
      {
        source: "/dataset-ingestion",
        destination: "/reports/upload",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
