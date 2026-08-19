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
      // ⚠️ DO NOT add a redirect for /ads.txt. Tried it 2026-08-19 (301 to
      // adstxt.mediavine.com) and it silently did NOT match — /ads.txt returned 404 in
      // production while every other rule in this array kept working. The docs say
      // redirects are checked before the filesystem, but a source with a file
      // extension did not resolve here. ads.txt is served as a real file from
      // public/ads.txt instead; see the header comment in that file for how to refresh it.
      // 2026-08-18: 12 thin NBA team scorebug one-offs consolidated into the ranked hub.
      // Each earned 0-2 clicks per 90 days and the hub already carried the same grade and
      // analysis for every team, so nothing was lost. Images are shared and stay in place.
      {
        source: "/stories/blazers-scorebug-2026",
        destination: "/stories/every-nba-local-tv-scorebug-2026-ranked",
        permanent: true,
      },
      {
        source: "/stories/bulls-scorebug-2026",
        destination: "/stories/every-nba-local-tv-scorebug-2026-ranked",
        permanent: true,
      },
      {
        source: "/stories/jazz-scorebug-2026",
        destination: "/stories/every-nba-local-tv-scorebug-2026-ranked",
        permanent: true,
      },
      {
        source: "/stories/knicks-scorebug-2026",
        destination: "/stories/every-nba-local-tv-scorebug-2026-ranked",
        permanent: true,
      },
      {
        source: "/stories/lakers-scorebug-2026",
        destination: "/stories/every-nba-local-tv-scorebug-2026-ranked",
        permanent: true,
      },
      {
        source: "/stories/mavericks-scorebug-2026",
        destination: "/stories/every-nba-local-tv-scorebug-2026-ranked",
        permanent: true,
      },
      {
        source: "/stories/nets-scorebug-2026",
        destination: "/stories/every-nba-local-tv-scorebug-2026-ranked",
        permanent: true,
      },
      {
        source: "/stories/nuggets-scorebug-2026",
        destination: "/stories/every-nba-local-tv-scorebug-2026-ranked",
        permanent: true,
      },
      {
        source: "/stories/pelicans-scorebug-2026",
        destination: "/stories/every-nba-local-tv-scorebug-2026-ranked",
        permanent: true,
      },
      {
        source: "/stories/raptors-scorebug-2026",
        destination: "/stories/every-nba-local-tv-scorebug-2026-ranked",
        permanent: true,
      },
      {
        source: "/stories/suns-scorebug-2026",
        destination: "/stories/every-nba-local-tv-scorebug-2026-ranked",
        permanent: true,
      },
      {
        source: "/stories/wizards-scorebug-2026",
        destination: "/stories/every-nba-local-tv-scorebug-2026-ranked",
        permanent: true,
      },
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
      // 8/13: the all-pewter post was folded into the Buccaneers schedule page
      // the same way. Schedule queries are what earn; a single-uniform post
      // would have orphaned against it.
      {
        source: "/stories/buccaneers-pewter-uniforms-2026",
        destination: "/stories/buccaneers-uniform-schedule-2026",
        permanent: true,
      },
      // 8/13: I duplicated an existing Netflix scorebug review. The new Field of
      // Dreams redesign coverage was folded into the original URL and this 301s.
      {
        source: "/stories/netflix-mlb-scorebug-2026",
        destination: "/stories/netflix-mlb-scorebug-2026-review",
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
