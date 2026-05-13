#!/usr/bin/env node

import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMG_DIR = resolve(__dirname, "../public/images/posts/suns-leaked-city-edition-2026-27");
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const OUTPUT = resolve(IMG_DIR, "cover.jpg");

const WIDTH = 1600;
const HEIGHT = 900;

const CURRENT_JERSEY = "suns-current-city-black.jpg";
const LEAKED_JERSEY = "suns-leaked-city-teal.jpg";

const TILE_W = 460;
const TILE_H = 540;

async function build() {
  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1D1160"/>
        <stop offset="55%" stop-color="#3D1B6E"/>
        <stop offset="100%" stop-color="#00B2A9"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="38%" r="55%">
        <stop offset="0%" stop-color="#E56020" stop-opacity="0.35"/>
        <stop offset="70%" stop-color="#E56020" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <rect x="0" y="0" width="${WIDTH}" height="6" fill="#E56020"/>
    <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="#E56020"/>
  </svg>`;

  const textSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #E56020; letter-spacing: 10px; }
      .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -1px; }
      .vs { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: 4px; opacity: 0.9; }
      .label { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #ffffff; letter-spacing: 6px; opacity: 0.85; }
    </style>
    <text x="${WIDTH / 2}" y="100" text-anchor="middle" class="eyebrow" font-size="26">LEAKED · PHOENIX SUNS</text>
    <text x="${WIDTH / 2}" y="170" text-anchor="middle" class="title" font-size="60">2026-27 City Edition Jersey</text>
    <text x="${WIDTH / 2}" y="490" text-anchor="middle" class="vs" font-size="48">VS</text>
    <text x="${Math.round(WIDTH * 0.275)}" y="780" text-anchor="middle" class="label" font-size="22">CURRENT (BLACK)</text>
    <text x="${Math.round(WIDTH * 0.725)}" y="780" text-anchor="middle" class="label" font-size="22">LEAKED (TEAL)</text>
  </svg>`;

  async function prepTile(filename) {
    const buf = await readFile(resolve(IMG_DIR, filename));
    const resized = await sharp(buf)
      .resize(TILE_W, TILE_H, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = resized;
    const threshold = 235;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r >= threshold && g >= threshold && b >= threshold) {
        data[i + 3] = 0;
      } else if (r >= 215 && g >= 215 && b >= 215) {
        const lum = (r + g + b) / 3;
        data[i + 3] = Math.max(0, Math.round(((255 - lum) / 40) * 255));
      }
    }
    return sharp(data, { raw: info }).png().toBuffer();
  }

  const currentTile = await prepTile(CURRENT_JERSEY);
  const leakedTile = await prepTile(LEAKED_JERSEY);

  const tileTop = 220;
  const currentLeft = Math.round(WIDTH * 0.275) - Math.round(TILE_W / 2);
  const leakedLeft = Math.round(WIDTH * 0.725) - Math.round(TILE_W / 2);

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([
      { input: currentTile, left: currentLeft, top: tileTop },
      { input: leakedTile, left: leakedLeft, top: tileTop },
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
