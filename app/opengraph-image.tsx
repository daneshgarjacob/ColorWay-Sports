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
          background: "linear-gradient(135deg, #0A1733 0%, #003087 55%, #1E54B0 100%)",
          position: "relative",
        }}
      >
        {/* Accent bar at top */}
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

        {/* Logo mark — Outline Stamp */}
        <svg width="150" height="150" viewBox="0 0 100 100" style={{ marginBottom: "28px" }}>
          <circle cx="50" cy="50" r="37" fill="none" stroke="#ffffff" strokeWidth="2.6" />
          <circle cx="50" cy="50" r="31" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.45" />
          <g transform="translate(0,3)">
            <circle cx="40.8" cy="32" r="2.4" fill="#ffffff" />
            <rect x="39.6" y="33" width="2.6" height="33" rx="1.3" fill="#ffffff" />
            <path d="M42.2,36 L65,40.5 L55,46 L65,51.5 L42.2,54 Z" fill="#ffffff" />
          </g>
        </svg>

        {/* Site name */}
        <div
          style={{
            display: "flex",
            fontSize: "78px",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-2px",
          }}
        >
          ColorWay Sports
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "26px",
            color: "#9FB6D6",
            marginTop: "14px",
            letterSpacing: "5px",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          Every Jersey. Every Logo. Every Detail.
        </div>

        {/* Accent bar at bottom */}
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
