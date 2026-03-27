import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
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

        {/* Logo mark - the C with dot */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 512 512"
          style={{ marginBottom: "24px" }}
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

        {/* Site name */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "0px",
          }}
        >
          <span
            style={{
              fontSize: "72px",
              fontWeight: 800,
              color: "#4a90d9",
              letterSpacing: "-2px",
            }}
          >
            Color
          </span>
          <span
            style={{
              fontSize: "72px",
              fontWeight: 800,
              color: "#FF5910",
              letterSpacing: "-2px",
            }}
          >
            Way
          </span>
          <span
            style={{
              fontSize: "72px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-2px",
              marginLeft: "16px",
            }}
          >
            Sports
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "28px",
            color: "#cccccc",
            marginTop: "12px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          Every Uniform. Every Logo. Every Detail.
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
