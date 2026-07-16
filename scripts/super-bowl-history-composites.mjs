#!/usr/bin/env node

import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LOGOS_DIR = resolve(__dirname, "../public/images/posts/super-bowl-logo-history");
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");

// Super Bowl I (1967) through Super Bowl LXI (2027) — 61 games, every year
const ALL_YEARS = Array.from({ length: 61 }, (_, i) => 1967 + i);

// Roman numeral mapping for labels (year -> numeral)
const NUMERAL = {};
const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X",
               "XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX",
               "XXI","XXII","XXIII","XXIV","XXV","XXVI","XXVII","XXVIII","XXIX","XXX",
               "XXXI","XXXII","XXXIII","XXXIV","XXXV","XXXVI","XXXVII","XXXVIII","XXXIX","XL",
               "XLI","XLII","XLIII","XLIV","XLV","XLVI","XLVII","XLVIII","XLIX","50",
               "LI","LII","LIII","LIV","LV","LVI","LVII","LVIII","LIX","LX","LXI"];
ALL_YEARS.forEach((y, i) => { NUMERAL[y] = ROMAN[i]; });

// Lombardi silver-rose gradient
const GRADIENT_FROM = "#F4E8E8";
const GRADIENT_TO = "#E0D2D2";

async function applyBottomCenterWatermark(imageBuf, width, height, bottomMargin = 16) {
  const watermarkWidth = Math.max(240, Math.min(420, Math.round(width * 0.18)));
  const watermark = await sharp(WATERMARK_PATH)
    .resize(watermarkWidth, null, { fit: "inside" })
    .png()
    .toBuffer();
  const wmMeta = await sharp(watermark).metadata();
  const padX = Math.round(watermarkWidth * 0.05);
  const padY = Math.round(wmMeta.height * 0.18);
  const padW = watermarkWidth + padX * 2;
  const padH = wmMeta.height + padY * 2;
  const padR = Math.round(padH * 0.18);
  // The 2026-06 rebrand made public/brand/colorway-sports-logo.png a WHITE mark (it is
  // now byte-identical to -logo-white.png), so the old white pill rendered this
  // watermark invisible. Pill is brand navy #003087 to match the site header.
  const padSvg = `<svg width="${padW}" height="${padH}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${padW}" height="${padH}" rx="${padR}" fill="#003087"/>
  </svg>`;
  const padBuf = await sharp(Buffer.from(padSvg)).png().toBuffer();
  const padWithLogo = await sharp(padBuf)
    .composite([{ input: watermark, left: padX, top: padY }])
    .png()
    .toBuffer();
  const wmLeft = Math.round((width - padW) / 2);
  const wmTop = height - padH - bottomMargin;
  return sharp(imageBuf)
    .composite([{ input: padWithLogo, left: wmLeft, top: wmTop }])
    .png()
    .toBuffer();
}

async function buildLogoCellWithLabel(year, cellSize, yearFontSize) {
  const logoBuf = await sharp(`${LOGOS_DIR}/${year}.png`)
    .resize(cellSize, cellSize, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();
  const labelHeight = yearFontSize + 14;
  const numeralLabel = NUMERAL[year];
  const labelSvg = `<svg width="${cellSize}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
    <text x="50%" y="${yearFontSize}" font-family="-apple-system, 'SF Pro Display', system-ui, sans-serif" font-size="${yearFontSize}" font-weight="800" fill="#0a0a0a" text-anchor="middle" letter-spacing="-0.5">${numeralLabel} · ${year}</text>
  </svg>`;
  const labelBuf = await sharp(Buffer.from(labelSvg)).png().toBuffer();
  return { logoBuf, labelBuf, labelHeight };
}

async function buildCoverComposite({ topRow, bottomRow, output }) {
  const cellSize = 240;
  const yearFontSize = 28;
  const colGap = 32;
  const rowGap = 60;
  const sidePadding = 70;
  const topPadding = 60;
  const watermarkBand = 130;
  const labelHeight = yearFontSize + 14;

  const width = sidePadding * 2 + topRow.length * cellSize + (topRow.length - 1) * colGap;
  const height = topPadding + cellSize + labelHeight + rowGap + cellSize + labelHeight + watermarkBand;

  const gradientSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${GRADIENT_FROM}"/>
        <stop offset="100%" stop-color="${GRADIENT_TO}"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
  </svg>`;
  const background = await sharp(Buffer.from(gradientSvg)).png().toBuffer();

  const composites = [];

  for (let i = 0; i < topRow.length; i++) {
    const { logoBuf, labelBuf } = await buildLogoCellWithLabel(topRow[i], cellSize, yearFontSize);
    const x = sidePadding + i * (cellSize + colGap);
    const y = topPadding;
    composites.push({ input: logoBuf, left: x, top: y });
    composites.push({ input: labelBuf, left: x, top: y + cellSize + 8 });
  }

  const bottomRowWidth = bottomRow.length * cellSize + (bottomRow.length - 1) * colGap;
  const bottomStartX = Math.round((width - bottomRowWidth) / 2);
  const bottomY = topPadding + cellSize + labelHeight + rowGap;
  for (let i = 0; i < bottomRow.length; i++) {
    const { logoBuf, labelBuf } = await buildLogoCellWithLabel(bottomRow[i], cellSize, yearFontSize);
    const x = bottomStartX + i * (cellSize + colGap);
    composites.push({ input: logoBuf, left: x, top: bottomY });
    composites.push({ input: labelBuf, left: x, top: bottomY + cellSize + 8 });
  }

  let result = await sharp(background).composite(composites).png().toBuffer();
  result = await applyBottomCenterWatermark(result, width, height, 18);

  await writeFile(output, result);
  console.log(`  -> ${output} (${width}x${height})`);
}

async function buildGridComposite({ years, columns, cellSize, gap, padding, yearFontSize, output, watermarkBand = 120 }) {
  const rows = Math.ceil(years.length / columns);
  const labelHeight = yearFontSize + 14;
  const cellWithLabel = cellSize + labelHeight;
  const width = padding * 2 + columns * cellSize + (columns - 1) * gap;
  const height = padding + rows * cellWithLabel + (rows - 1) * gap + watermarkBand;

  const gradientSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${GRADIENT_FROM}"/>
        <stop offset="100%" stop-color="${GRADIENT_TO}"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
  </svg>`;
  const background = await sharp(Buffer.from(gradientSvg)).png().toBuffer();

  const composites = [];

  for (let i = 0; i < years.length; i++) {
    const { logoBuf, labelBuf } = await buildLogoCellWithLabel(years[i], cellSize, yearFontSize);
    const row = Math.floor(i / columns);
    const col = i % columns;
    const x = padding + col * (cellSize + gap);
    const y = padding + row * (cellWithLabel + gap);
    composites.push({ input: logoBuf, left: x, top: y });
    composites.push({ input: labelBuf, left: x, top: y + cellSize + 8 });
  }

  let result = await sharp(background).composite(composites).png().toBuffer();
  result = await applyBottomCenterWatermark(result, width, height, 18);

  await writeFile(output, result);
  console.log(`  -> ${output} (${width}x${height})`);
}

(async () => {
  console.log("=== Super Bowl Logo History composite builder ===\n");

  console.log("Step 1: Build cover composite (era picks: 1 unique-era + template-era debut + 50 anomaly + recent template + LXI debut)");
  await buildCoverComposite({
    // 3 era picks: unique era (1986 = peak custom XX), template era (2014 = XLVIII), 50 anomaly (2016)
    // Plus a representative from each end (1967 = I, 2027 = LXI debut), and 2 template-era examples
    topRow: [1967, 1987, 2008, 2010],
    bottomRow: [2014, 2016, 2027],
    output: `${LOGOS_DIR}/super-bowl-logo-history-cover.png`,
  });

  console.log("\nStep 2: Build full chronological grid (6 cols, all 59 logos, watermark bottom-middle)");
  await buildGridComposite({
    years: ALL_YEARS,
    columns: 6,
    cellSize: 220,
    gap: 18,
    padding: 50,
    yearFontSize: 22,
    output: `${LOGOS_DIR}/super-bowl-logo-history-grid.png`,
    watermarkBand: 130,
  });

  console.log("\nDone.");
})().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
