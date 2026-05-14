#!/usr/bin/env node

import sharp from "sharp";
import { readFile, writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const JERSEY_DIR = resolve(__dirname, "../public/images/jerseys/nba");
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const OUTPUT_DIR = resolve(__dirname, "../public/images/posts/nba-playoffs-2026-round-1-home-jersey-breakdown");
const OUTPUT = resolve(OUTPUT_DIR, "cover.jpg");

const W = 1600;
const H = 900;

async function build() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Background — left half navy, right half near-black, split at center
  const bgSvg = `
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="left" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#002060"/>
        <stop offset="100%" stop-color="#001240"/>
      </linearGradient>
      <linearGradient id="right" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#0a0a14"/>
        <stop offset="100%" stop-color="#050508"/>
      </linearGradient>
      <linearGradient id="centerGlow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FF5910" stop-opacity="0.18"/>
        <stop offset="50%" stop-color="#FF5910" stop-opacity="0.06"/>
        <stop offset="100%" stop-color="#FF5910" stop-opacity="0.18"/>
      </linearGradient>
    </defs>
    <!-- Backgrounds -->
    <rect x="0" y="0" width="${W / 2}" height="${H}" fill="url(#left)"/>
    <rect x="${W / 2}" y="0" width="${W / 2}" height="${H}" fill="url(#right)"/>
    <!-- Center divider glow -->
    <rect x="${W / 2 - 30}" y="0" width="60" height="${H}" fill="url(#centerGlow)"/>
    <!-- Orange accent bars -->
    <rect x="0" y="0" width="${W}" height="5" fill="#FF5910"/>
    <rect x="0" y="${H - 5}" width="${W}" height="5" fill="#FF5910"/>
    <!-- Center divider line -->
    <line x1="${W / 2}" y1="60" x2="${W / 2}" y2="${H - 60}" stroke="#FF5910" stroke-width="2" stroke-opacity="0.7"/>
  </svg>`;

  // Text layer
  const textSvg = `
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #FF5910; letter-spacing: 8px; }
      .label { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #ffffff; letter-spacing: 5px; }
      .stat-big { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; }
      .stat-sub { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 600; fill: rgba(255,255,255,0.65); letter-spacing: 2px; }
      .side-label { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: rgba(255,255,255,0.45); letter-spacing: 6px; }
    </style>
    <!-- Eyebrow -->
    <text x="${W / 2}" y="52" text-anchor="middle" class="eyebrow" font-size="14">NBA PLAYOFFS 2026 · ROUND 1 · HOME JERSEY INDEX</text>
    <!-- Center stat -->
    <text x="${W / 2}" y="460" text-anchor="middle" class="stat-big" font-size="120" letter-spacing="-4">19/40</text>
    <text x="${W / 2}" y="510" text-anchor="middle" class="stat-sub" font-size="16">HOME GAMES IN TRADITIONAL WHITE</text>
    <!-- Pct badge -->
    <text x="${W / 2}" y="562" text-anchor="middle" class="eyebrow" font-size="22">47.5%</text>
    <!-- Left side label -->
    <text x="${Math.round(W * 0.23)}" y="${H - 38}" text-anchor="middle" class="side-label" font-size="11">TRADITIONAL · WHITE AT HOME</text>
    <!-- Right side label -->
    <text x="${Math.round(W * 0.77)}" y="${H - 38}" text-anchor="middle" class="side-label" font-size="11">NON-TRADITIONAL · COLOR AT HOME</text>
  </svg>`;

  // Load jerseys
  const whiteBuf = await readFile(resolve(JERSEY_DIR, "knicks-association-white.png"));
  const colorBuf = await readFile(resolve(JERSEY_DIR, "knicks-icon-blue.png"));

  const whiteJersey = await sharp(whiteBuf)
    .resize(320, 480, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const whiteMeta = await sharp(whiteJersey).metadata();

  const colorJersey = await sharp(colorBuf)
    .resize(320, 480, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const colorMeta = await sharp(colorJersey).metadata();

  const jerseyY = Math.round((H - 480) / 2) - 20;
  const whiteX = Math.round(W * 0.23 - whiteMeta.width / 2);
  const colorX = Math.round(W * 0.77 - colorMeta.width / 2);

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([
      { input: whiteJersey, left: whiteX, top: jerseyY },
      { input: colorJersey, left: colorX, top: jerseyY },
      { input: Buffer.from(textSvg), top: 0, left: 0 },
    ])
    .png()
    .toBuffer();

  // Watermark
  const watermarkWidth = Math.max(160, Math.min(200, Math.round(W * 0.1)));
  const watermark = await sharp(WATERMARK_PATH)
    .resize(watermarkWidth, null, { fit: "inside" })
    .png()
    .toBuffer();
  const wmMeta = await sharp(watermark).metadata();

  const pillPad = 14;
  const pillW = wmMeta.width + pillPad * 2;
  const pillH = wmMeta.height + pillPad * 2;
  const pillSvg = `<svg width="${pillW}" height="${pillH}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${pillW}" height="${pillH}" rx="${Math.round(pillH / 2)}" fill="#ffffff" fill-opacity="0.9"/>
  </svg>`;
  const pill = await sharp(Buffer.from(pillSvg)).png().toBuffer();

  const pillLeft = Math.round((W - pillW) / 2);
  const pillTop = H - pillH - 28;

  const final = await sharp(composed)
    .composite([
      { input: pill, left: pillLeft, top: pillTop },
      { input: watermark, left: pillLeft + pillPad, top: pillTop + pillPad },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  await writeFile(OUTPUT, final);
  console.log(`Wrote ${OUTPUT}`);
}

build().catch((e) => { console.error(e); process.exit(1); });
