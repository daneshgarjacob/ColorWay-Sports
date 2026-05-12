#!/usr/bin/env node

import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMG_DIR = resolve(__dirname, "../public/images/posts/nba-wordmarks-2026-27");
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const OUTPUT = resolve(IMG_DIR, "cover.jpg");

const WIDTH = 1600;
const HEIGHT = 900;

const TILE_SIZE = 260;
const GUTTER = 18;

const WORDMARKS = [
  "hawks-wordmark.jpg",
  "nets-wordmark.jpg",
  "rockets-houston-wordmark.png",
  "rockets-wordmark.png",
  "timberwolves-wordmark.jpg",
];

async function build() {
  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#17408B"/>
        <stop offset="50%" stop-color="#0a1f4d"/>
        <stop offset="100%" stop-color="#17408B"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="#C9082A" stop-opacity="0.30"/>
        <stop offset="70%" stop-color="#C9082A" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <rect x="0" y="0" width="${WIDTH}" height="6" fill="#C9082A"/>
    <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="#C9082A"/>
  </svg>`;

  const textSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #C9082A; letter-spacing: 10px; }
      .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -1px; }
      .subtitle { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #ffffff; opacity: 0.85; letter-spacing: 6px; }
    </style>
    <text x="${WIDTH / 2}" y="115" text-anchor="middle" class="eyebrow" font-size="28">LEAKED · NBA UNIFORM TRACKER</text>
    <text x="${WIDTH / 2}" y="180" text-anchor="middle" class="title" font-size="68">New 2026-27 NBA Wordmarks</text>
    <text x="${WIDTH / 2}" y="720" text-anchor="middle" class="subtitle" font-size="26">HAWKS  ·  NETS  ·  ROCKETS  ·  TIMBERWOLVES</text>
  </svg>`;

  const tileBuffers = [];
  for (const filename of WORDMARKS) {
    const buf = await readFile(resolve(IMG_DIR, filename));
    const tile = await sharp(buf)
      .resize(TILE_SIZE, TILE_SIZE, { fit: "cover", position: "center" })
      .png()
      .toBuffer();

    const mask = Buffer.from(
      `<svg width="${TILE_SIZE}" height="${TILE_SIZE}"><rect x="0" y="0" width="${TILE_SIZE}" height="${TILE_SIZE}" rx="14" ry="14" fill="#fff"/></svg>`
    );
    const rounded = await sharp(tile)
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toBuffer();

    tileBuffers.push(rounded);
  }

  const tilesTotalWidth = TILE_SIZE * WORDMARKS.length + GUTTER * (WORDMARKS.length - 1);
  const startX = Math.round((WIDTH - tilesTotalWidth) / 2);
  const tileTop = 320;

  const tileComposites = tileBuffers.map((buf, i) => ({
    input: buf,
    left: startX + i * (TILE_SIZE + GUTTER),
    top: tileTop,
  }));

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([
      ...tileComposites,
      { input: Buffer.from(textSvg), top: 0, left: 0 },
    ])
    .png()
    .toBuffer();

  const watermarkWidth = Math.max(220, Math.min(380, Math.round(WIDTH * 0.16)));
  const watermark = await sharp(WATERMARK_PATH)
    .resize(watermarkWidth, null, { fit: "inside" })
    .png()
    .toBuffer();
  const wmMeta = await sharp(watermark).metadata();

  const pillPaddingX = 28;
  const pillPaddingY = 18;
  const pillW = wmMeta.width + pillPaddingX * 2;
  const pillH = wmMeta.height + pillPaddingY * 2;
  const pillSvg = `
  <svg width="${pillW}" height="${pillH}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${pillW}" height="${pillH}" rx="${Math.round(pillH / 2)}" ry="${Math.round(pillH / 2)}" fill="#ffffff"/>
  </svg>`;
  const pill = await sharp(Buffer.from(pillSvg)).png().toBuffer();

  const pillLeft = WIDTH - pillW - 90;
  const pillTop = HEIGHT - pillH - 32;

  const final = await sharp(composed)
    .composite([
      { input: pill, left: pillLeft, top: pillTop },
      {
        input: watermark,
        left: pillLeft + pillPaddingX,
        top: pillTop + pillPaddingY,
      },
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
