#!/usr/bin/env node

import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FINALS_LOGO = resolve(
  __dirname,
  "../public/images/posts/nba-playoffs-2026/NBA-Finals-Logo.svg.png"
);
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const OUTPUT = resolve(
  __dirname,
  "../public/images/posts/NBA-Playoffs-Jersey-Matchups/nba-finals-tracker-cover.jpg"
);

const WIDTH = 1600;
const HEIGHT = 900;

async function build() {
  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#006BB6"/>
        <stop offset="50%" stop-color="#000000"/>
        <stop offset="100%" stop-color="#D4A017"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stop-color="#ffcf5b" stop-opacity="0.30"/>
        <stop offset="60%" stop-color="#ffcf5b" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <rect x="0" y="0" width="${WIDTH}" height="6" fill="#FF5910"/>
    <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="#FF5910"/>
  </svg>`;

  const textSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #FF5910; letter-spacing: 16px; }
      .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -2px; }
      .subtitle { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #ffffff; opacity: 0.85; letter-spacing: 4px; }
    </style>
    <text x="${WIDTH / 2}" y="155" text-anchor="middle" class="eyebrow" font-size="34">2026</text>
    <text x="${WIDTH / 2}" y="700" text-anchor="middle" class="title" font-size="86">Jersey Tracker</text>
    <text x="${WIDTH / 2}" y="780" text-anchor="middle" class="subtitle" font-size="24">EVERY MATCHUP GRADED</text>
  </svg>`;

  const logoBuf = await readFile(FINALS_LOGO);
  const logoSized = await sharp(logoBuf)
    .resize(680, 460, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const logoMeta = await sharp(logoSized).metadata();

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([
      {
        input: logoSized,
        left: Math.round((WIDTH - logoMeta.width) / 2),
        top: 195,
      },
      { input: Buffer.from(textSvg), top: 0, left: 0 },
    ])
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
