#!/usr/bin/env node

import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const OUTPUT = resolve(
  __dirname,
  "../public/images/posts/mlb-armed-forces-day-2026/cover.jpg"
);

const WIDTH = 1600;
const HEIGHT = 900;

async function build() {
  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1a2412"/>
        <stop offset="50%" stop-color="#3d4a26"/>
        <stop offset="100%" stop-color="#1a2412"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="42%" r="55%">
        <stop offset="0%" stop-color="#c8d990" stop-opacity="0.28"/>
        <stop offset="60%" stop-color="#c8d990" stop-opacity="0"/>
      </radialGradient>
      <pattern id="camo" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
        <rect width="200" height="200" fill="#2d3a1f"/>
        <ellipse cx="40" cy="60" rx="55" ry="32" fill="#3d4a26" opacity="0.55"/>
        <ellipse cx="160" cy="120" rx="48" ry="28" fill="#4a5a2f" opacity="0.45"/>
        <ellipse cx="100" cy="170" rx="38" ry="22" fill="#1a2412" opacity="0.5"/>
      </pattern>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#camo)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" opacity="0.75"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <rect x="0" y="0" width="${WIDTH}" height="6" fill="#c8d990"/>
    <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="#c8d990"/>
  </svg>`;

  const flagSvg = `
  <svg width="280" height="160" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 160">
    <rect x="0" y="0" width="280" height="160" fill="#7a4a2a" opacity="0.3"/>
    <g fill="#c8d990" opacity="0.85">
      <rect x="0" y="0" width="280" height="12"/>
      <rect x="0" y="24" width="280" height="12"/>
      <rect x="0" y="48" width="280" height="12"/>
      <rect x="0" y="72" width="280" height="12"/>
      <rect x="0" y="96" width="280" height="12"/>
      <rect x="0" y="120" width="280" height="12"/>
      <rect x="0" y="144" width="280" height="12"/>
    </g>
    <rect x="0" y="0" width="110" height="84" fill="#1a2412"/>
    <g fill="#c8d990">
      <circle cx="20" cy="14" r="3"/><circle cx="40" cy="14" r="3"/><circle cx="60" cy="14" r="3"/><circle cx="80" cy="14" r="3"/><circle cx="100" cy="14" r="3"/>
      <circle cx="30" cy="28" r="3"/><circle cx="50" cy="28" r="3"/><circle cx="70" cy="28" r="3"/><circle cx="90" cy="28" r="3"/>
      <circle cx="20" cy="42" r="3"/><circle cx="40" cy="42" r="3"/><circle cx="60" cy="42" r="3"/><circle cx="80" cy="42" r="3"/><circle cx="100" cy="42" r="3"/>
      <circle cx="30" cy="56" r="3"/><circle cx="50" cy="56" r="3"/><circle cx="70" cy="56" r="3"/><circle cx="90" cy="56" r="3"/>
      <circle cx="20" cy="70" r="3"/><circle cx="40" cy="70" r="3"/><circle cx="60" cy="70" r="3"/><circle cx="80" cy="70" r="3"/><circle cx="100" cy="70" r="3"/>
    </g>
  </svg>`;

  const textSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #c8d990; letter-spacing: 8px; }
      .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -2px; }
      .subtitle { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #ffffff; opacity: 0.88; letter-spacing: 4px; }
    </style>
    <text x="${WIDTH / 2}" y="200" text-anchor="middle" class="eyebrow" font-size="28">2026 MLB ARMED FORCES DAY</text>
    <text x="${WIDTH / 2}" y="430" text-anchor="middle" class="title" font-size="108">CAPS &amp; HATS</text>
    <text x="${WIDTH / 2}" y="540" text-anchor="middle" class="title" font-size="92">RANKED</text>
    <text x="${WIDTH / 2}" y="620" text-anchor="middle" class="subtitle" font-size="22">ALL 30 TEAMS GRADED</text>
  </svg>`;

  const flagPng = await sharp(Buffer.from(flagSvg)).resize(280, 160).png().toBuffer();

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([
      {
        input: flagPng,
        left: Math.round((WIDTH - 280) / 2),
        top: 700,
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
        left: WIDTH - wmMeta.width - 50,
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
