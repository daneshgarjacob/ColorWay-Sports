#!/usr/bin/env node

// Branded cover for the 2026 World Cup bracket predictor (/world-cup-rooting-guide).
// Replaces the old "Who Should I Root For?" cover with a "Fill Out Your Bracket" cover.
// 1600x1000 to match the homepage tracker card (62.5% aspect) and existing reference.

import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUT_DIR = resolve(__dirname, "../public/images");
const LOGO_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo-white.png");
const FIFA_LOGO_PATH = resolve(__dirname, "../public/logos/world-cup-2026.png");
const OUTPUT = resolve(OUT_DIR, "world-cup-rooting-guide-cover.jpg");

const WIDTH = 1600;
const HEIGHT = 1000;

async function build() {
  await mkdir(OUT_DIR, { recursive: true });

  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0a1f4d"/>
        <stop offset="52%" stop-color="#16307a"/>
        <stop offset="100%" stop-color="#091634"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="40%" r="62%">
        <stop offset="0%" stop-color="#FFC23C" stop-opacity="0.26"/>
        <stop offset="70%" stop-color="#FFC23C" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <rect x="0" y="0" width="${WIDTH}" height="8" fill="#FFC23C"/>
    <rect x="0" y="${HEIGHT - 8}" width="${WIDTH}" height="8" fill="#FFC23C"/>
  </svg>`;

  const textSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #FFC23C; letter-spacing: 11px; }
      .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -1.5px; }
      .sub { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #ffffff; opacity: 0.85; letter-spacing: 4px; }
    </style>
    <text x="${WIDTH / 2}" y="372" text-anchor="middle" class="eyebrow" font-size="29">2026 WORLD CUP · BRACKET PREDICTOR</text>
    <text x="${WIDTH / 2}" y="500" text-anchor="middle" class="title" font-size="100">Fill Out Your</text>
    <text x="${WIDTH / 2}" y="612" text-anchor="middle" class="title" font-size="100">Bracket</text>
    <text x="${WIDTH / 2}" y="724" text-anchor="middle" class="sub" font-size="26">PICK EVERY WINNER FROM THE ROUND OF 32 TO THE FINAL</text>
  </svg>`;

  // Official FIFA World Cup 2026 logo on a white badge, top-center (editorial use).
  const fifa = await sharp(FIFA_LOGO_PATH).resize(null, 196, { fit: "inside" }).png().toBuffer();
  const fifaMeta = await sharp(fifa).metadata();
  const padX = 46, padY = 26;
  const badgeW = fifaMeta.width + padX * 2;
  const badgeH = fifaMeta.height + padY * 2;
  const badgeSvg = `<svg width="${badgeW}" height="${badgeH}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${badgeW}" height="${badgeH}" rx="26" ry="26" fill="#ffffff"/></svg>`;
  const badge = await sharp(Buffer.from(badgeSvg)).png().toBuffer();
  const badgeLeft = Math.round((WIDTH - badgeW) / 2);
  const badgeTop = 70;

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([
      { input: badge, left: badgeLeft, top: badgeTop },
      { input: fifa, left: badgeLeft + padX, top: badgeTop + padY },
      { input: Buffer.from(textSvg), top: 0, left: 0 },
    ])
    .png()
    .toBuffer();

  const logo = await sharp(LOGO_PATH).resize(300, null, { fit: "inside" }).png().toBuffer();
  const logoMeta = await sharp(logo).metadata();

  const final = await sharp(composed)
    .composite([{ input: logo, left: Math.round((WIDTH - logoMeta.width) / 2), top: HEIGHT - logoMeta.height - 70 }])
    .jpeg({ quality: 90 })
    .toBuffer();

  await writeFile(OUTPUT, final);
  console.log(`Wrote ${OUTPUT} (${WIDTH}x${HEIGHT})`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
