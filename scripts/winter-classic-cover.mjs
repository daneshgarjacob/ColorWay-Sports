#!/usr/bin/env node

import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMG_DIR = resolve(
  __dirname,
  "../public/images/posts/nhl-winter-classic-2027-logo-history-ranked"
);
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const OUTPUT = resolve(IMG_DIR, "cover.jpg");

const WIDTH = 1600;
const HEIGHT = 900;

async function build() {
  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0B1F3A"/>
        <stop offset="50%" stop-color="#1A3A5F"/>
        <stop offset="100%" stop-color="#3D6E9C"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="55%" r="55%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/>
        <stop offset="80%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <rect x="0" y="0" width="${WIDTH}" height="6" fill="#CE1126"/>
    <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="#CE1126"/>
  </svg>`;

  const textSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #CE1126; letter-spacing: 10px; }
      .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -2px; }
      .subtitle { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #ffffff; opacity: 0.92; letter-spacing: 4px; }
    </style>
    <text x="${WIDTH / 2}" y="95" text-anchor="middle" class="eyebrow" font-size="26">NHL WINTER CLASSIC LOGO HISTORY</text>
    <text x="${WIDTH / 2}" y="180" text-anchor="middle" class="title" font-size="86">2008 to 2027</text>
    <text x="${WIDTH / 2}" y="230" text-anchor="middle" class="subtitle" font-size="26">EVERY OUTDOOR GAME LOGO RANKED</text>
  </svg>`;

  // 2027 logo as the hero
  const heroBuf = await readFile(resolve(IMG_DIR, "2027.png"));
  const heroSize = 420;
  const heroPng = await sharp(heroBuf)
    .resize(heroSize, heroSize, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const heroMeta = await sharp(heroPng).metadata();

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([
      {
        input: heroPng,
        left: Math.round((WIDTH - heroMeta.width) / 2),
        top: Math.round(HEIGHT / 2 - heroMeta.height / 2 + 80),
      },
      { input: Buffer.from(textSvg), top: 0, left: 0 },
    ])
    .png()
    .toBuffer();

  const watermarkWidth = Math.max(160, Math.min(220, Math.round(WIDTH * 0.11)));
  const watermark = await sharp(WATERMARK_PATH)
    .resize(watermarkWidth, null, { fit: "inside" })
    .png()
    .toBuffer();
  const wmMeta = await sharp(watermark).metadata();

  const pillPaddingX = 18;
  const pillPaddingY = 12;
  const pillW = wmMeta.width + pillPaddingX * 2;
  const pillH = wmMeta.height + pillPaddingY * 2;
  const pillSvg = `
  <svg width="${pillW}" height="${pillH}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${pillW}" height="${pillH}" rx="${Math.round(pillH / 2)}" ry="${Math.round(pillH / 2)}" fill="#ffffff" fill-opacity="0.92"/>
  </svg>`;
  const pill = await sharp(Buffer.from(pillSvg)).png().toBuffer();

  const pillLeft = Math.round((WIDTH - pillW) / 2);
  const pillTop = HEIGHT - pillH - 24;

  const final = await sharp(composed)
    .composite([
      { input: pill, left: pillLeft, top: pillTop },
      { input: watermark, left: pillLeft + pillPaddingX, top: pillTop + pillPaddingY },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  await writeFile(OUTPUT, final);
  console.log(`Wrote ${OUTPUT} (${WIDTH}x${HEIGHT})`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
