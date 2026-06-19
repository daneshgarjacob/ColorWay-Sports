import { ImageResponse } from "next/og";
import { getPostBySlug, getAllPosts } from "@/lib/posts";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1a1a2e",
            color: "#ffffff",
            fontSize: "48px",
            fontWeight: 700,
          }}
        >
          ColorWay Sports
        </div>
      ),
      { ...size }
    );
  }

  // Parse the gradient to get a simple background
  // Gradients work in ImageResponse, so we can use them directly
  const gradient = post.gradient || "linear-gradient(135deg, #003087 0%, #2f6bed 100%)";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "60px",
          background: gradient,
          position: "relative",
        }}
      >
        {/* Orange accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "#2f6bed",
            display: "flex",
          }}
        />

        {/* Category tag */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <span
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.85)",
              textTransform: "uppercase",
              letterSpacing: "4px",
            }}
          >
            {post.category}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: post.title.length > 60 ? "48px" : "56px",
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.15,
            display: "flex",
            maxWidth: "900px",
          }}
        >
          {post.title}
        </div>

        {/* Bottom bar with branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: "32px",
            gap: "12px",
          }}
        >
          {/* Small logo — Outline Stamp */}
          <svg width="40" height="40" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="37" fill="none" stroke="#ffffff" strokeWidth="2.6" />
            <circle cx="50" cy="50" r="31" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.45" />
            <g transform="translate(0,3)">
              <circle cx="40.8" cy="32" r="2.4" fill="#ffffff" />
              <rect x="39.6" y="33" width="2.6" height="33" rx="1.3" fill="#ffffff" />
              <path d="M42.2,36 L65,40.5 L55,46 L65,51.5 L42.2,54 Z" fill="#ffffff" />
            </g>
          </svg>
          <span
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            ColorWay Sports
          </span>
        </div>

        {/* Orange accent bar at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "#2f6bed",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
