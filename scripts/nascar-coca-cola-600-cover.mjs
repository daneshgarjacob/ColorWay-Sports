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
  "../public/images/posts/nascar-coca-cola-600-memorial-day-2026/cover.png"
);

const WIDTH = 1600;
const HEIGHT = 900;

async function build() {
  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0a1a3d"/>
        <stop offset="50%" stop-color="#1a2a4d"/>
        <stop offset="100%" stop-color="#5c1f2e"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="42%" r="55%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/>
        <stop offset="60%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <rect x="0" y="0" width="${WIDTH}" height="6" fill="#c8102e"/>
    <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="#c8102e"/>
  </svg>`;

  const flagSvg = `
  <svg width="320" height="180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">
    <g fill="#ffffff" opacity="0.92">
      <rect x="0" y="0" width="320" height="14"/>
      <rect x="0" y="28" width="320" height="14"/>
      <rect x="0" y="56" width="320" height="14"/>
      <rect x="0" y="84" width="320" height="14"/>
      <rect x="0" y="112" width="320" height="14"/>
      <rect x="0" y="140" width="320" height="14"/>
      <rect x="0" y="168" width="320" height="12"/>
    </g>
    <g fill="#c8102e" opacity="0.92">
      <rect x="0" y="14" width="320" height="14"/>
      <rect x="0" y="42" width="320" height="14"/>
      <rect x="0" y="70" width="320" height="14"/>
      <rect x="0" y="98" width="320" height="14"/>
      <rect x="0" y="126" width="320" height="14"/>
      <rect x="0" y="154" width="320" height="14"/>
    </g>
    <rect x="0" y="0" width="128" height="98" fill="#1a2a4d"/>
    <g fill="#ffffff">
      <circle cx="14" cy="14" r="3.5"/><circle cx="30" cy="14" r="3.5"/><circle cx="46" cy="14" r="3.5"/><circle cx="62" cy="14" r="3.5"/><circle cx="78" cy="14" r="3.5"/><circle cx="94" cy="14" r="3.5"/><circle cx="110" cy="14" r="3.5"/>
      <circle cx="22" cy="28" r="3.5"/><circle cx="38" cy="28" r="3.5"/><circle cx="54" cy="28" r="3.5"/><circle cx="70" cy="28" r="3.5"/><circle cx="86" cy="28" r="3.5"/><circle cx="102" cy="28" r="3.5"/>
      <circle cx="14" cy="42" r="3.5"/><circle cx="30" cy="42" r="3.5"/><circle cx="46" cy="42" r="3.5"/><circle cx="62" cy="42" r="3.5"/><circle cx="78" cy="42" r="3.5"/><circle cx="94" cy="42" r="3.5"/><circle cx="110" cy="42" r="3.5"/>
      <circle cx="22" cy="56" r="3.5"/><circle cx="38" cy="56" r="3.5"/><circle cx="54" cy="56" r="3.5"/><circle cx="70" cy="56" r="3.5"/><circle cx="86" cy="56" r="3.5"/><circle cx="102" cy="56" r="3.5"/>
      <circle cx="14" cy="70" r="3.5"/><circle cx="30" cy="70" r="3.5"/><circle cx="46" cy="70" r="3.5"/><circle cx="62" cy="70" r="3.5"/><circle cx="78" cy="70" r="3.5"/><circle cx="94" cy="70" r="3.5"/><circle cx="110" cy="70" r="3.5"/>
      <circle cx="22" cy="84" r="3.5"/><circle cx="38" cy="84" r="3.5"/><circle cx="54" cy="84" r="3.5"/><circle cx="70" cy="84" r="3.5"/><circle cx="86" cy="84" r="3.5"/><circle cx="102" cy="84" r="3.5"/>
    </g>
  </svg>`;

  const textSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #c8102e; letter-spacing: 8px; }
      .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -2px; }
      .accent { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #c8102e; letter-spacing: -2px; }
      .subtitle { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #ffffff; opacity: 0.88; letter-spacing: 4px; }
    </style>
    <text x="${WIDTH / 2}" y="200" text-anchor="middle" class="eyebrow" font-size="26">2026 NASCAR MEMORIAL DAY WEEKEND</text>
    <text x="${WIDTH / 2}" y="450" text-anchor="middle" class="title" font-size="118">COCA-COLA 600</text>
    <text x="${WIDTH / 2}" y="560" text-anchor="middle" class="accent" font-size="64">Memorial Day Tributes</text>
    <text x="${WIDTH / 2}" y="640" text-anchor="middle" class="subtitle" font-size="22">600 MILES OF REMEMBRANCE</text>
  </svg>`;

  const flagPng = await sharp(Buffer.from(flagSvg)).resize(320, 180).png().toBuffer();

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([
      {
        input: flagPng,
        left: Math.round((WIDTH - 320) / 2),
        top: 690,
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
