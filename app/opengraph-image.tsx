import { ImageResponse } from "next/og";
import { join } from "node:path";
import { readFile } from "node:fs/promises";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OgImage() {
  // Jake 10/6: link previews showed the old system-font wordmark. Use the real
  // lockup (flag badge + Hanken Grotesk wordmark + tagline), white on navy. 11/12: new brand, white on Royal 4.
  const lockup = `data:image/png;base64,${await readFile(join(process.cwd(), "public/brand/colorway-sports-logo-white.png"), "base64")}`;
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
          background: "#0025CC",
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
            background: "#8FB0FF",
            display: "flex",
          }}
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={lockup} width={900} height={136} alt="ColorWay Sports" />

        {/* Accent bar at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "#8FB0FF",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
