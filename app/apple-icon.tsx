import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        <svg width="152" height="152" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="37" fill="none" stroke="#003087" strokeWidth="2.6" />
          <circle cx="50" cy="50" r="31" fill="none" stroke="#003087" strokeWidth="1" opacity="0.4" />
          <g transform="translate(0,3)">
            <circle cx="40.8" cy="32" r="2.4" fill="#003087" />
            <rect x="39.6" y="33" width="2.6" height="33" rx="1.3" fill="#003087" />
            <path d="M42.2,36 L65,40.5 L55,46 L65,51.5 L42.2,54 Z" fill="#003087" />
          </g>
        </svg>
      </div>
    ),
    { ...size }
  );
}
