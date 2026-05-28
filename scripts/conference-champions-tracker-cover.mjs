#!/usr/bin/env node

import sharp from "sharp";
import { readFile, writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const KNICKS_HAT = resolve(
  __dirname,
  "../public/images/posts/knicks-finals-gear/knicks-2026-nba-finals-locker-room-hat.png"
);
const KNIGHTS_HAT = resolve(
  __dirname,
  "../public/images/posts/knights-finals-gear/knights-finals-hat-front.png"
);
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const OUTPUT_DIR = resolve(__dirname, "../public/images/posts/conference-champions-tracker");
const OUTPUT = resolve(OUTPUT_DIR, "cover.jpg");

const WIDTH = 1600;
const HEIGHT = 900;

async function build() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="knicksBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#006BB6"/>
        <stop offset="55%" stop-color="#003a73"/>
        <stop offset="100%" stop-color="#001f3d"/>
      </linearGradient>
      <linearGradient id="knightsBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#333F42"/>
        <stop offset="55%" stop-color="#1a1f22"/>
        <stop offset="100%" stop-color="#0a0d0f"/>
      </linearGradient>
      <radialGradient id="knicksGlow" cx="50%" cy="42%" r="55%">
        <stop offset="0%" stop-color="#F58426" stop-opacity="0.18"/>
        <stop offset="60%" stop-color="#F58426" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="knightsGlow" cx="50%" cy="42%" r="55%">
        <stop offset="0%" stop-color="#B4975A" stop-opacity="0.22"/>
        <stop offset="60%" stop-color="#B4975A" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="${WIDTH / 2}" height="${HEIGHT}" fill="url(#knicksBg)"/>
    <rect x="${WIDTH / 2}" y="0" width="${WIDTH / 2}" height="${HEIGHT}" fill="url(#knightsBg)"/>
    <rect x="0" y="0" width="${WIDTH / 2}" height="${HEIGHT}" fill="url(#knicksGlow)"/>
    <rect x="${WIDTH / 2}" y="0" width="${WIDTH / 2}" height="${HEIGHT}" fill="url(#knightsGlow)"/>
    <line x1="${WIDTH / 2}" y1="60" x2="${WIDTH / 2}" y2="${HEIGHT - 60}" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.25"/>
    <rect x="0" y="0" width="${WIDTH}" height="6" fill="#FF5910"/>
    <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="#FF5910"/>
  </svg>`;

  const textSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #FF5910; letter-spacing: 10px; }
      .vs { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: rgba(255,255,255,0.92); letter-spacing: 4px; }
      .grade-good { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #5fe39c; letter-spacing: 2px; }
      .grade-mid { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #e6c238; letter-spacing: 2px; }
      .team { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #ffffff; letter-spacing: 3px; }
      .league { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 600; fill: rgba(255,255,255,0.6); letter-spacing: 4px; }
    </style>
    <text x="${WIDTH / 2}" y="80" text-anchor="middle" class="eyebrow" font-size="22">2026 CONFERENCE CHAMPIONS · LOCKER ROOM GEAR</text>
    <text x="${WIDTH / 2}" y="${HEIGHT / 2 + 12}" text-anchor="middle" class="vs" font-size="36">VS</text>
    <text x="${Math.round(WIDTH * 0.25)}" y="${HEIGHT - 220}" text-anchor="middle" class="team" font-size="28">NEW YORK KNICKS</text>
    <text x="${Math.round(WIDTH * 0.25)}" y="${HEIGHT - 188}" text-anchor="middle" class="league" font-size="16">NBA EASTERN CONFERENCE</text>
    <text x="${Math.round(WIDTH * 0.25)}" y="${HEIGHT - 148}" text-anchor="middle" class="grade-good" font-size="22">HAT A−</text>
    <text x="${Math.round(WIDTH * 0.75)}" y="${HEIGHT - 220}" text-anchor="middle" class="team" font-size="28">VEGAS GOLDEN KNIGHTS</text>
    <text x="${Math.round(WIDTH * 0.75)}" y="${HEIGHT - 188}" text-anchor="middle" class="league" font-size="16">NHL WESTERN CONFERENCE</text>
    <text x="${Math.round(WIDTH * 0.75)}" y="${HEIGHT - 148}" text-anchor="middle" class="grade-mid" font-size="22">HAT C+</text>
  </svg>`;

  const knicksHatBuf = await readFile(KNICKS_HAT);
  const knightsHatBuf = await readFile(KNIGHTS_HAT);

  const HAT_SIZE = 460;

  const knicksHat = await sharp(knicksHatBuf)
    .resize(HAT_SIZE, HAT_SIZE, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .png()
    .toBuffer();
  const knicksMeta = await sharp(knicksHat).metadata();

  const knightsHat = await sharp(knightsHatBuf)
    .resize(HAT_SIZE, HAT_SIZE, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .png()
    .toBuffer();
  const knightsMeta = await sharp(knightsHat).metadata();

  const centerY = Math.round(HEIGHT * 0.42);
  const knicksX = Math.round(WIDTH * 0.25) - Math.round(knicksMeta.width / 2);
  const knicksY = Math.round(centerY - knicksMeta.height / 2);
  const knightsX = Math.round(WIDTH * 0.75) - Math.round(knightsMeta.width / 2);
  const knightsY = Math.round(centerY - knightsMeta.height / 2);

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([
      { input: knicksHat, left: knicksX, top: knicksY },
      { input: knightsHat, left: knightsX, top: knightsY },
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
  const pillTop = HEIGHT - pillH - 22;

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
