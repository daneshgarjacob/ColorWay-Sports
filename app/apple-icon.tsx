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
          borderRadius: "36px",
        }}
      >
        {/* Navy C */}
        <svg
          width="140"
          height="140"
          viewBox="0 0 512 512"
          style={{ position: "absolute" }}
        >
          <path
            d="M330 120 A160 160 0 1 0 330 392"
            fill="none"
            stroke="#002D72"
            strokeWidth="76"
            strokeLinecap="round"
          />
          <circle cx="256" cy="256" r="42" fill="#FF5910" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
