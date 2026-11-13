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
          background: "#FFFFFF",
        }}
      >
        <svg width="150" height="150" viewBox="92 92 840 840">
          <circle cx="512" cy="512" r="420" fill="#0B0B0F" />
          <circle cx="512" cy="512" r="392" fill="#FFFFFF" />
          <circle cx="512" cy="512" r="340" fill="none" stroke="#0B0B0F" strokeWidth="15" />
          <g fill="#0B0B0F">
            <circle cx="411" cy="345" r="26" />
            <rect x="398" y="345" width="29" height="373" rx="14" />
            <path d="M412,387 L427,390 L677,440 L567,500 L677,561 L427,588 L412,590 Z" />
          </g>
        </svg>
      </div>
    ),
    { ...size }
  );
}
