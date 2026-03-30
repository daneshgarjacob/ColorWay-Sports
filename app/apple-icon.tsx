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
          background: "#0021A5",
          borderRadius: "36px",
        }}
      >
        <svg
          width="140"
          height="140"
          viewBox="0 0 512 512"
        >
          <g transform="translate(256,380)">
            <rect x="-30" y="-300" width="60" height="220" rx="30" fill="#ffffff" transform="rotate(-24)"/>
            <rect x="-30" y="-300" width="60" height="220" rx="30" fill="#4A90D9" transform="rotate(-8)"/>
            <rect x="-30" y="-300" width="60" height="220" rx="30" fill="#FF5910" transform="rotate(8)"/>
            <rect x="-30" y="-300" width="60" height="220" rx="30" fill="#6B9E8F" transform="rotate(24)"/>
            <circle cx="0" cy="0" r="22" fill="#FF5910"/>
          </g>
        </svg>
      </div>
    ),
    { ...size }
  );
}
