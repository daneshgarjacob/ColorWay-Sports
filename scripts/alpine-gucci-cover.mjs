#!/usr/bin/env node

import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOGO_DIR = resolve(__dirname, "../public/logos");
const IMG_DIR = resolve(__dirname, "../public/images/posts/alpine-f1-gucci-title-sponsor-2027-livery");
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const OUTPUT = resolve(IMG_DIR, "cover.jpg");

const WIDTH = 1600;
const HEIGHT = 900;

async function makeWhite(buffer, size) {
  const resized = await sharp(buffer)
    .resize(size, size, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .png()
    .toBuffer();

  const { data, info } = await sharp(resized).raw().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

async function build() {
  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0054A6"/>
        <stop offset="55%" stop-color="#001845"/>
        <stop offset="100%" stop-color="#111111"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.06"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <rect x="0" y="0" width="${WIDTH}" height="5" fill="#FF5910"/>
    <rect x="0" y="${HEIGHT - 5}" width="${WIDTH}" height="5" fill="#FF5910"/>
    <line x1="${WIDTH / 2}" y1="320" x2="${WIDTH / 2}" y2="600" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.3"/>
  </svg>`;

  const textSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #FF5910; letter-spacing: 8px; }
      .kicker { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 600; fill: rgba(255,255,255,0.55); letter-spacing: 4px; }
    </style>
    <text x="${WIDTH / 2}" y="118" text-anchor="middle" class="eyebrow" font-size="20">F1 · 2027 TITLE SPONSORSHIP</text>
    <text x="${Math.round(WIDTH * 0.27)}" y="680" text-anchor="middle" class="kicker" font-size="18">ALPINE F1 TEAM</text>
    <text x="${Math.round(WIDTH * 0.73)}" y="680" text-anchor="middle" class="kicker" font-size="18">GUCCI</text>
  </svg>`;

  const alpineBuf = await readFile(resolve(LOGO_DIR, "alpine-f1.png"));
  const gucciBuf = await readFile(resolve(LOGO_DIR, "gucci.png"));

  const alpineLogo = await makeWhite(alpineBuf, 340);
  const alpineMeta = await sharp(alpineLogo).metadata();

  const gucciLogo = await makeWhite(gucciBuf, 340);
  const gucciMeta = await sharp(gucciLogo).metadata();

  const centerY = 460;
  const alpineX = Math.round(WIDTH * 0.27) - Math.round(alpineMeta.width / 2);
  const alpineY = Math.round(centerY - alpineMeta.height / 2);
  const gucciX = Math.round(WIDTH * 0.73) - Math.round(gucciMeta.width / 2);
  const gucciY = Math.round(centerY - gucciMeta.height / 2);

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([
      { input: alpineLogo, left: alpineX, top: alpineY },
      { input: gucciLogo, left: gucciX, top: gucciY },
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
  const pillTop = HEIGHT - pillH - 30;

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
