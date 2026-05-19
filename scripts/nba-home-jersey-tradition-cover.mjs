#!/usr/bin/env node

import sharp from "sharp";
import { writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const OUTPUT = resolve(
  __dirname,
  "../public/images/posts/nba-only-major-league-killed-home-jersey-tradition/cover.png"
);

const WIDTH = 1600;
const HEIGHT = 900;

async function build() {
  // Four-league composite: MLB | NFL | NHL | NBA (NBA emphasized as the focus)
  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1A1A2E"/>
        <stop offset="50%" stop-color="#0A0A14"/>
        <stop offset="100%" stop-color="#1D1D3A"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="#FF5910" stop-opacity="0.18"/>
        <stop offset="60%" stop-color="#FF5910" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="nbaAccent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#1D428A"/>
        <stop offset="100%" stop-color="#C8102E"/>
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <rect x="0" y="0" width="${WIDTH}" height="6" fill="url(#nbaAccent)"/>
    <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="url(#nbaAccent)"/>

    <!-- Editorial top eyebrow -->
    <text x="${WIDTH / 2}" y="160" text-anchor="middle"
          font-family="'Helvetica Neue', Arial, sans-serif"
          font-weight="700" font-size="28" letter-spacing="10"
          fill="#FF5910">EVERY UNIFORM. EVERY LOGO. EVERY DETAIL.</text>

    <!-- Four league wordmarks in a row -->
    <g font-family="'Helvetica Neue', Arial, sans-serif" font-weight="900" text-anchor="middle">
      <!-- MLB -->
      <text x="240" y="455" font-size="92" fill="#ffffff" opacity="0.55" letter-spacing="-2">MLB</text>
      <text x="240" y="500" font-size="14" fill="#ffffff" opacity="0.45" font-weight="600" letter-spacing="3">HOME WHITE</text>

      <!-- NFL -->
      <text x="640" y="455" font-size="92" fill="#ffffff" opacity="0.55" letter-spacing="-2">NFL</text>
      <text x="640" y="500" font-size="14" fill="#ffffff" opacity="0.45" font-weight="600" letter-spacing="3">HOME LOCKED</text>

      <!-- NHL -->
      <text x="1040" y="455" font-size="92" fill="#ffffff" opacity="0.55" letter-spacing="-2">NHL</text>
      <text x="1040" y="500" font-size="14" fill="#ffffff" opacity="0.45" font-weight="600" letter-spacing="3">HOME DARK</text>

      <!-- NBA (highlighted) -->
      <text x="1400" y="465" font-size="128" fill="#FF5910" letter-spacing="-3">NBA</text>
      <text x="1400" y="510" font-size="14" fill="#FF5910" font-weight="700" letter-spacing="3">NO HOME RULE</text>
    </g>

    <!-- Bottom title -->
    <text x="${WIDTH / 2}" y="720" text-anchor="middle"
          font-family="'Helvetica Neue', Arial, sans-serif"
          font-weight="900" font-size="68" fill="#ffffff" letter-spacing="-1">The Only Major League</text>
    <text x="${WIDTH / 2}" y="800" text-anchor="middle"
          font-family="'Helvetica Neue', Arial, sans-serif"
          font-weight="900" font-size="68" fill="#ffffff" letter-spacing="-1">Without a Home Jersey</text>
  </svg>`;

  const composed = await sharp(Buffer.from(bgSvg))
    .png()
    .toBuffer();

  const watermarkWidth = Math.max(240, Math.min(420, Math.round(WIDTH * 0.16)));
  const watermark = await sharp(WATERMARK_PATH)
    .resize(watermarkWidth, null, { fit: "inside" })
    .png()
    .toBuffer();
  const wmMeta = await sharp(watermark).metadata();

  const final = await sharp(composed)
    .composite([
      {
        input: watermark,
        left: WIDTH - wmMeta.width - 60,
        top: HEIGHT - wmMeta.height - 30,
      },
    ])
    .png()
    .toBuffer();

  await writeFile(OUTPUT, final);
  console.log(`Wrote ${OUTPUT} (${WIDTH}x${HEIGHT})`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
