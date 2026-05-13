#!/usr/bin/env node

import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMG_DIR = resolve(
  __dirname,
  "../public/images/posts/nhl-winter-classic-2027-logo-history-ranked"
);
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const OUTPUT = resolve(IMG_DIR, "history-grid.jpg");

const WIDTH = 1600;
const HEIGHT = 1400;

const YEARS = [
  2008, 2009, 2010, 2011, 2012,
  2014, 2015, 2016, 2017, 2018,
  2019, 2020, 2022, 2023, 2024,
  2025, 2026, 2027,
];

const COLS = 5;
const ROWS = Math.ceil(YEARS.length / COLS); // 4 rows

const MARGIN_X = 80;
const MARGIN_TOP = 130;
const MARGIN_BOTTOM = 160;

const CELL_W = Math.floor((WIDTH - MARGIN_X * 2) / COLS);
const CELL_H = Math.floor((HEIGHT - MARGIN_TOP - MARGIN_BOTTOM) / ROWS);
const LOGO_BOX = Math.min(CELL_W - 30, CELL_H - 60);

async function build() {
  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0B1F3A"/>
        <stop offset="100%" stop-color="#1A3A5F"/>
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect x="0" y="0" width="${WIDTH}" height="6" fill="#CE1126"/>
    <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="#CE1126"/>
  </svg>`;

  const titleSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #CE1126; letter-spacing: 10px; }
      .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -1px; }
    </style>
    <text x="${WIDTH / 2}" y="60" text-anchor="middle" class="eyebrow" font-size="22">EVERY NHL WINTER CLASSIC LOGO</text>
    <text x="${WIDTH / 2}" y="110" text-anchor="middle" class="title" font-size="42">2008 – 2027</text>
  </svg>`;

  const yearLabels = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .ylabel { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #ffffff; letter-spacing: 2px; opacity: 0.95; }
    </style>
    ${YEARS.map((year, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cellX = MARGIN_X + col * CELL_W + CELL_W / 2;
      const cellY = MARGIN_TOP + row * CELL_H + CELL_H - 18;
      return `<text x="${cellX}" y="${cellY}" text-anchor="middle" class="ylabel" font-size="22">${year}</text>`;
    }).join("\n    ")}
  </svg>`;

  async function prepLogo(filename) {
    const buf = await readFile(resolve(IMG_DIR, filename));
    return sharp(buf)
      .resize(LOGO_BOX, LOGO_BOX, { fit: "inside", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();
  }

  const composites = [];
  composites.push({ input: Buffer.from(titleSvg), top: 0, left: 0 });

  for (let i = 0; i < YEARS.length; i++) {
    const year = YEARS[i];
    const filename = `${year}.png`;
    const logoBuf = await prepLogo(filename);
    const logoMeta = await sharp(logoBuf).metadata();
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const cellX = MARGIN_X + col * CELL_W;
    const cellY = MARGIN_TOP + row * CELL_H;
    const logoX = cellX + Math.round((CELL_W - logoMeta.width) / 2);
    const logoY = cellY + Math.round((CELL_H - 50 - logoMeta.height) / 2);
    composites.push({ input: logoBuf, left: logoX, top: logoY });
  }

  composites.push({ input: Buffer.from(yearLabels), top: 0, left: 0 });

  const composed = await sharp(Buffer.from(bgSvg)).composite(composites).png().toBuffer();

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
