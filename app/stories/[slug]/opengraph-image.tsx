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
  const gradient = post.gradient || "linear-gradient(135deg, #003087 0%, #FF5910 100%)";

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
            background: "#FF5910",
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
          {/* Small CW logo */}
          <svg
            width="36"
            height="36"
            viewBox="0 0 512 512"
          >
            <path
              d="M330 120 A160 160 0 1 0 330 392"
              fill="none"
              stroke="#ffffff"
              strokeWidth="76"
              strokeLinecap="round"
            />
            <circle cx="256" cy="256" r="42" fill="#FF5910" />
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
            background: "#FF5910",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
