#!/usr/bin/env node

import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMG_DIR = resolve(__dirname, "../public/images/posts/espn-college-basketball-new-logo-2026");
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const OUTPUT = resolve(IMG_DIR, "social-old-vs-new.jpg");

const WIDTH = 1600;
const HEIGHT = 900;

const OLD_LOGO = "espn-cbb-old-logo.png";
const NEW_LOGO = "espn-cbb-new-logo.png";

const TILE_W = 560;
const TILE_H = 380;

async function build() {
  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1a0508"/>
        <stop offset="55%" stop-color="#3a0a0f"/>
        <stop offset="100%" stop-color="#C8102E"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="48%" r="55%">
        <stop offset="0%" stop-color="#E25822" stop-opacity="0.25"/>
        <stop offset="70%" stop-color="#E25822" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <rect x="0" y="0" width="${WIDTH}" height="6" fill="#C8102E"/>
    <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="#C8102E"/>
  </svg>`;

  const textSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #ffffff; letter-spacing: 10px; opacity: 0.95; }
      .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -1px; }
      .vs { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: 4px; opacity: 0.85; }
      .label { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #ffffff; letter-spacing: 6px; opacity: 0.9; }
      .grade { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: 2px; }
    </style>
    <text x="${WIDTH / 2}" y="90" text-anchor="middle" class="eyebrow" font-size="22">ESPN COLLEGE BASKETBALL</text>
    <text x="${WIDTH / 2}" y="160" text-anchor="middle" class="title" font-size="58">New 2026 Logo</text>
    <text x="${WIDTH / 2}" y="500" text-anchor="middle" class="vs" font-size="44">VS</text>
    <text x="${Math.round(WIDTH * 0.275)}" y="780" text-anchor="middle" class="label" font-size="22">OLD</text>
    <text x="${Math.round(WIDTH * 0.725)}" y="780" text-anchor="middle" class="label" font-size="22">NEW · GRADE B+</text>
  </svg>`;

  async function prepTile(filename) {
    const buf = await readFile(resolve(IMG_DIR, filename));
    return sharp(buf)
      .resize(TILE_W, TILE_H, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  }

  const oldTile = await prepTile(OLD_LOGO);
  const newTile = await prepTile(NEW_LOGO);

  const tileTop = 280;
  const oldLeft = Math.round(WIDTH * 0.275) - Math.round(TILE_W / 2);
  const newLeft = Math.round(WIDTH * 0.725) - Math.round(TILE_W / 2);

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([
      { input: oldTile, left: oldLeft, top: tileTop },
      { input: newTile, left: newLeft, top: tileTop },
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
