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
  "../public/images/posts/cavs-troll-raptors-canada-game-7-2026/cavs-troll-cover.jpg"
);

const WIDTH = 1600;
const HEIGHT = 900;

async function build() {
  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1a0008"/>
        <stop offset="50%" stop-color="#6e0028"/>
        <stop offset="100%" stop-color="#1a0008"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="#FDBB30" stop-opacity="0.18"/>
        <stop offset="60%" stop-color="#FDBB30" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <rect x="0" y="0" width="${WIDTH}" height="6" fill="#FDBB30"/>
    <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="#FDBB30"/>
  </svg>`;

  const textSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #FDBB30; letter-spacing: 8px; }
      .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -2px; }
      .plus { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #FDBB30; }
      .subtitle { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #ffffff; opacity: 0.85; letter-spacing: 4px; }
    </style>
    <text x="${WIDTH / 2}" y="220" text-anchor="middle" class="eyebrow" font-size="28">CAVALIERS GAME 7 · ROUND 1 · 2026</text>
    <text x="${WIDTH / 2}" y="430" text-anchor="middle" class="title" font-size="180">USA</text>
    <text x="${WIDTH / 2}" y="500" text-anchor="middle" class="plus" font-size="48">+</text>
    <text x="${WIDTH / 2}" y="660" text-anchor="middle" class="title" font-size="160">FREE BIRD</text>
    <text x="${WIDTH / 2}" y="770" text-anchor="middle" class="subtitle" font-size="22">CAVS CROWD TROLLED CANADA, DRAKE, AND THE RAPTORS</text>
  </svg>`;

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  const watermarkWidth = Math.max(240, Math.min(420, Math.round(WIDTH * 0.18)));
  const watermark = await sharp(WATERMARK_PATH)
    .resize(watermarkWidth, null, { fit: "inside" })
    .png()
    .toBuffer();
  const wmMeta = await sharp(watermark).metadata();

  const final = await sharp(composed)
    .composite([
      {
        input: watermark,
        left: WIDTH - wmMeta.width - 140,
        top: HEIGHT - wmMeta.height - 50,
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
