#!/usr/bin/env node

import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const MLB_LOGO = resolve(__dirname, "../public/logos/mlb-city-connect.png");
const NFL_LOGO = resolve(__dirname, "../public/logos/nfl.png");
const NHL_LOGO = resolve(__dirname, "../public/logos/NHL.png");
const NBA_LOGO_SVG = resolve(__dirname, "../public/logos/nba.svg");

const OUTPUT = resolve(
  __dirname,
  "../public/images/posts/nba-only-major-league-killed-home-jersey-tradition/cover.jpg"
);

const WIDTH = 1600;
const HEIGHT = 900;

async function build() {
  // Light editorial background so the brand watermark is readable
  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f8f8fb"/>
        <stop offset="50%" stop-color="#eef0f5"/>
        <stop offset="100%" stop-color="#e3e6ee"/>
      </linearGradient>
      <radialGradient id="glow" cx="78%" cy="50%" r="35%">
        <stop offset="0%" stop-color="#FF5910" stop-opacity="0.10"/>
        <stop offset="100%" stop-color="#FF5910" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#1D428A"/>
        <stop offset="100%" stop-color="#C8102E"/>
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <rect x="0" y="0" width="${WIDTH}" height="6" fill="url(#accent)"/>
    <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="url(#accent)"/>

    <!-- Editorial top eyebrow -->
    <text x="${WIDTH / 2}" y="120" text-anchor="middle"
          font-family="'Helvetica Neue', Arial, sans-serif"
          font-weight="700" font-size="24" letter-spacing="10"
          fill="#FF5910">EVERY UNIFORM. EVERY LOGO. EVERY DETAIL.</text>

    <!-- NBA highlight ring (subtle) -->
    <circle cx="1300" cy="420" r="180" fill="none" stroke="#FF5910" stroke-width="3" stroke-opacity="0.85"/>
    <text x="1300" y="640" text-anchor="middle"
          font-family="'Helvetica Neue', Arial, sans-serif"
          font-weight="800" font-size="16" letter-spacing="3"
          fill="#FF5910">NO HOME RULE</text>

    <!-- Subtle labels under the other 3 leagues -->
    <g font-family="'Helvetica Neue', Arial, sans-serif" font-weight="700" font-size="14" letter-spacing="3" text-anchor="middle" fill="#444">
      <text x="300" y="640">HOME WHITE</text>
      <text x="630" y="640">HOME LOCKED</text>
      <text x="960" y="640">HOME DARK</text>
    </g>

    <!-- Bottom title -->
    <text x="${WIDTH / 2}" y="755" text-anchor="middle"
          font-family="'Helvetica Neue', Arial, sans-serif"
          font-weight="900" font-size="58" fill="#0d1024" letter-spacing="-1">The Only Major League</text>
    <text x="${WIDTH / 2}" y="820" text-anchor="middle"
          font-family="'Helvetica Neue', Arial, sans-serif"
          font-weight="900" font-size="58" fill="#0d1024" letter-spacing="-1">Without a Home Jersey</text>
  </svg>`;

  // Logo sizes — small enough to fit four in a row on a 1600 wide canvas
  const SMALL = 220;
  const NBA_SIZE = 280; // slightly larger to draw the eye

  async function loadLogo(src, height) {
    const isSvg = src.endsWith(".svg");
    const input = isSvg
      ? await sharp(await readFile(src), { density: 600 }).png().toBuffer()
      : await readFile(src);
    return sharp(input)
      .resize({ height, fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  }

  const [mlb, nfl, nhl, nba] = await Promise.all([
    loadLogo(MLB_LOGO, SMALL),
    loadLogo(NFL_LOGO, SMALL),
    loadLogo(NHL_LOGO, SMALL),
    loadLogo(NBA_LOGO_SVG, NBA_SIZE),
  ]);

  const [mlbMeta, nflMeta, nhlMeta, nbaMeta] = await Promise.all([
    sharp(mlb).metadata(),
    sharp(nfl).metadata(),
    sharp(nhl).metadata(),
    sharp(nba).metadata(),
  ]);

  // Layout: MLB at 300, NFL at 630, NHL at 960, NBA at 1300 (vertical center 420)
  function centerLeft(centerX, w) {
    return Math.round(centerX - w / 2);
  }
  function centerTop(centerY, h) {
    return Math.round(centerY - h / 2);
  }

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([
      { input: mlb, left: centerLeft(300, mlbMeta.width), top: centerTop(420, mlbMeta.height) },
      { input: nfl, left: centerLeft(630, nflMeta.width), top: centerTop(420, nflMeta.height) },
      { input: nhl, left: centerLeft(960, nhlMeta.width), top: centerTop(420, nhlMeta.height) },
      { input: nba, left: centerLeft(1300, nbaMeta.width), top: centerTop(420, nbaMeta.height) },
    ])
    .png()
    .toBuffer();

  const watermarkWidth = Math.max(220, Math.min(380, Math.round(WIDTH * 0.16)));
  const watermark = await sharp(WATERMARK_PATH)
    .resize(watermarkWidth, null, { fit: "inside" })
    .png()
    .toBuffer();
  const wmMeta = await sharp(watermark).metadata();

  const final = await sharp(composed)
    .composite([
      {
        input: watermark,
        left: WIDTH - wmMeta.width - 60,
        top: HEIGHT - wmMeta.height - 30,
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
