#!/usr/bin/env node

import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOGO_DIR = resolve(__dirname, "../public/logos");
const IMG_DIR = resolve(
  __dirname,
  "../public/images/posts/where-to-watch-2026-nba-conference-finals"
);
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const OUTPUT = resolve(IMG_DIR, "cover.jpg");

const WIDTH = 1600;
const HEIGHT = 900;

async function build() {
  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#1A4FA3"/>
        <stop offset="50%" stop-color="#0A0A0A"/>
        <stop offset="100%" stop-color="#C8102E"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
        <stop offset="80%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <rect x="0" y="0" width="${WIDTH}" height="6" fill="#FF5910"/>
    <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="#FF5910"/>
    <line x1="${WIDTH / 2}" y1="380" x2="${WIDTH / 2}" y2="640" stroke="#ffffff" stroke-width="2" stroke-opacity="0.4"/>
  </svg>`;

  const textSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #FF5910; letter-spacing: 8px; }
      .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -1px; }
      .label { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #ffffff; letter-spacing: 5px; opacity: 0.92; }
      .conf { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #ffffff; letter-spacing: 3px; opacity: 0.85; }
    </style>
    <text x="${WIDTH / 2}" y="120" text-anchor="middle" class="eyebrow" font-size="22">WHERE TO WATCH</text>
    <text x="${WIDTH / 2}" y="200" text-anchor="middle" class="title" font-size="58">2026 NBA Conference Finals</text>
    <text x="${Math.round(WIDTH * 0.275)}" y="720" text-anchor="middle" class="label" font-size="24">WESTERN</text>
    <text x="${Math.round(WIDTH * 0.275)}" y="755" text-anchor="middle" class="conf" font-size="16">CONFERENCE FINALS</text>
    <text x="${Math.round(WIDTH * 0.725)}" y="720" text-anchor="middle" class="label" font-size="24">EASTERN</text>
    <text x="${Math.round(WIDTH * 0.725)}" y="755" text-anchor="middle" class="conf" font-size="16">CONFERENCE FINALS</text>
  </svg>`;

  // NBA logo small at top center, above title? Actually skip — NBA logo would be in the middle. Let me drop a small NBA logo at center between the network logos.
  const nbcBuf = await readFile(resolve(LOGO_DIR, "nbc.png"));
  const espnBuf = await readFile(resolve(LOGO_DIR, "espn.png"));
  const nbaBuf = await readFile(resolve(LOGO_DIR, "nba.png"));

  const networkLogoSize = 360;
  const nbcLogo = await sharp(nbcBuf)
    .resize(networkLogoSize, networkLogoSize, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const nbcMeta = await sharp(nbcLogo).metadata();

  const espnLogo = await sharp(espnBuf)
    .resize(networkLogoSize, networkLogoSize, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const espnMeta = await sharp(espnLogo).metadata();

  const nbaLogo = await sharp(nbaBuf)
    .resize(70, 70, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const nbaMeta = await sharp(nbaLogo).metadata();

  const tileCenterY = 500;
  const nbcX = Math.round(WIDTH * 0.275) - Math.round(nbcMeta.width / 2);
  const nbcY = Math.round(tileCenterY - nbcMeta.height / 2);
  const espnX = Math.round(WIDTH * 0.725) - Math.round(espnMeta.width / 2);
  const espnY = Math.round(tileCenterY - espnMeta.height / 2);
  const nbaX = Math.round(WIDTH / 2 - nbaMeta.width / 2);
  const nbaY = Math.round(tileCenterY - nbaMeta.height / 2);

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([
      { input: nbcLogo, left: nbcX, top: nbcY },
      { input: espnLogo, left: espnX, top: espnY },
      { input: nbaLogo, left: nbaX, top: nbaY },
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
