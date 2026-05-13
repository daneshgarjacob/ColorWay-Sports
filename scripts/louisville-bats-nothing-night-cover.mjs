#!/usr/bin/env node

import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMG_DIR = resolve(
  __dirname,
  "../public/images/posts/louisville-bats-nothing-night-mlb-should-copy-2026"
);
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const OUTPUT = resolve(IMG_DIR, "cover.jpg");

const WIDTH = 1600;
const HEIGHT = 900;

const LOGO = "louisville-bats-logo.png";

async function build() {
  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#001D52"/>
        <stop offset="55%" stop-color="#0A1F3D"/>
        <stop offset="100%" stop-color="#DA291C"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.07"/>
        <stop offset="80%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <rect x="0" y="0" width="${WIDTH}" height="6" fill="#DA291C"/>
    <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="#DA291C"/>
  </svg>`;

  const textSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #DA291C; letter-spacing: 12px; }
      .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -2px; }
      .subtitle { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #ffffff; opacity: 0.92; letter-spacing: 4px; }
    </style>
    <text x="${WIDTH / 2}" y="135" text-anchor="middle" class="eyebrow" font-size="28">LOUISVILLE BATS</text>
    <text x="${WIDTH / 2}" y="225" text-anchor="middle" class="title" font-size="92">"Nothing Night"</text>
    <text x="${WIDTH / 2}" y="800" text-anchor="middle" class="subtitle" font-size="26">NO MUSIC · NO ADS · NO VIDEOS · JUST THE GAME</text>
  </svg>`;

  const logoBuf = await readFile(resolve(IMG_DIR, LOGO));
  const logoSize = 420;
  const resized = await sharp(logoBuf)
    .resize(logoSize, logoSize, { fit: "inside", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = resized;
  const pixels = new Uint8ClampedArray(data);
  const whiteThreshold = 235;
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    if (r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold) {
      pixels[i + 3] = 0;
    }
  }

  const logoPng = await sharp(Buffer.from(pixels), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
  const logoMeta = await sharp(logoPng).metadata();

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([
      {
        input: logoPng,
        left: Math.round((WIDTH - logoMeta.width) / 2),
        top: Math.round(HEIGHT / 2 - logoMeta.height / 2 + 30),
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
