#!/usr/bin/env node

import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const NBA_LOGO_SVG = resolve(__dirname, "../public/logos/nba.svg");
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const OUTPUT = resolve(
  __dirname,
  "../public/images/posts/NBA-Playoffs-Jersey-Matchups/conference-finals-tracker-cover.jpg"
);

const WIDTH = 1600;
const HEIGHT = 900;

async function build() {
  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1A4FA3"/>
        <stop offset="50%" stop-color="#0A0A0A"/>
        <stop offset="100%" stop-color="#C8102E"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="42%" r="55%">
        <stop offset="0%" stop-color="#5b9fff" stop-opacity="0.35"/>
        <stop offset="60%" stop-color="#5b9fff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <rect x="0" y="0" width="${WIDTH}" height="6" fill="#FF5910"/>
    <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="#FF5910"/>
  </svg>`;

  const textSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #FF5910; letter-spacing: 12px; }
      .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -2px; }
      .subtitle { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #ffffff; opacity: 0.85; letter-spacing: 4px; }
    </style>
    <text x="${WIDTH / 2}" y="195" text-anchor="middle" class="eyebrow" font-size="32">2026 NBA PLAYOFFS</text>
    <text x="${WIDTH / 2}" y="620" text-anchor="middle" class="title" font-size="96">CONFERENCE FINALS</text>
    <text x="${WIDTH / 2}" y="720" text-anchor="middle" class="title" font-size="74">Jersey Tracker</text>
    <text x="${WIDTH / 2}" y="790" text-anchor="middle" class="subtitle" font-size="22">EVERY MATCHUP GRADED</text>
  </svg>`;

  const logoBuf = await readFile(NBA_LOGO_SVG);
  const logoPng = await sharp(logoBuf, { density: 600 })
    .resize(280, 280, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const logoMeta = await sharp(logoPng).metadata();

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([
      {
        input: logoPng,
        left: Math.round((WIDTH - logoMeta.width) / 2),
        top: 240,
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
        left: WIDTH - wmMeta.width - 140,
        top: HEIGHT - wmMeta.height - 50,
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
