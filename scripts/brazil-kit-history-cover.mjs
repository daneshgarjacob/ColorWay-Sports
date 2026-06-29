#!/usr/bin/env node

// Branded ColorWay cover for the Brazil World Cup kit history post.
// 1500x1000 (3:2) per the post cover spec. No third-party photo — fully ours.

import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUT_DIR = resolve(__dirname, "../public/images/posts/brazil-world-cup-kit-history");
const LOGO_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo-white.png");
const OUTPUT = resolve(OUT_DIR, "cover.jpg");

const WIDTH = 1500;
const HEIGHT = 1000;

async function build() {
  await mkdir(OUT_DIR, { recursive: true });

  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0a5c2e"/>
        <stop offset="55%" stop-color="#063b6e"/>
        <stop offset="100%" stop-color="#001a4d"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="40%" r="62%">
        <stop offset="0%" stop-color="#FFDF00" stop-opacity="0.22"/>
        <stop offset="70%" stop-color="#FFDF00" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <rect x="0" y="0" width="${WIDTH}" height="8" fill="#FFDF00"/>
    <rect x="0" y="${HEIGHT - 8}" width="${WIDTH}" height="8" fill="#009C3B"/>
  </svg>`;

  const textSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #FFDF00; letter-spacing: 10px; }
      .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -1.5px; }
      .sub { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #ffffff; opacity: 0.85; letter-spacing: 3px; }
    </style>
    <text x="${WIDTH / 2}" y="330" text-anchor="middle" class="eyebrow" font-size="27">BRAZIL · WORLD CUP KIT HISTORY</text>
    <text x="${WIDTH / 2}" y="470" text-anchor="middle" class="title" font-size="104">The Yellow Shirt</text>
    <text x="${WIDTH / 2}" y="600" text-anchor="middle" class="title" font-size="104">That Built a Nation</text>
    <text x="${WIDTH / 2}" y="700" text-anchor="middle" class="sub" font-size="24">FROM A 1950 DEFEAT TO THE MOST ICONIC KIT IN FOOTBALL</text>
  </svg>`;

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  const logo = await sharp(LOGO_PATH).resize(300, null, { fit: "inside" }).png().toBuffer();
  const logoMeta = await sharp(logo).metadata();

  const final = await sharp(composed)
    .composite([{ input: logo, left: Math.round((WIDTH - logoMeta.width) / 2), top: HEIGHT - logoMeta.height - 64 }])
    .jpeg({ quality: 90 })
    .toBuffer();

  await writeFile(OUTPUT, final);
  console.log(`Wrote ${OUTPUT} (${WIDTH}x${HEIGHT})`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
