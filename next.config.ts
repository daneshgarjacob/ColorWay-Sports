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
      // GSC 7/18: stray external links use /posts/<slug>; our pattern is /stories/<slug>
      {
        source: "/posts/:slug",
        destination: "/stories/:slug",
        permanent: true,
      },
      // GSC 7/18: crawled slug variant of the Ravens iridescent rumors post
      {
        source: "/stories/ravens-iridescent-rumors-2026",
        destination: "/stories/ravens-uniform-rumors-iridescent-2026",
        permanent: true,
      },
      // GSC 7/28: old slug for the Rangers/Globe Life roof-status post
      {
        source: "/stories/globe-life-field-roof-status-2026",
        destination: "/stories/rangers-roof-open-globe-life-field-2026",
        permanent: true,
      },
      // 8/12: Midnight Navy was published as its own post the morning Denver
      // announced it, then merged into the full Broncos uniform-schedule post.
      // Single-uniform posts measured ~0 clicks at position 9-14; the schedule
      // posts sit at 2-3. One deep URL per team.
      {
        source: "/stories/broncos-midnight-navy-2026",
        destination: "/stories/broncos-uniform-schedule-2026",
        permanent: true,
      },
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
