import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Old WordPress URLs -- redirect to homepage
      {
        source: "/wp-content/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/wp-admin/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/wp-login.php",
        destination: "/",
        permanent: true,
      },
      {
        source: "/wp-includes/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/xmlrpc.php",
        destination: "/",
        permanent: true,
      },
      // Old WordPress feed and category URLs
      {
        source: "/category/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/comments/feed",
        destination: "/",
        permanent: true,
      },
      {
        source: "/feed",
        destination: "/",
        permanent: true,
      },
      {
        source: "/wp-:slug.php",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
