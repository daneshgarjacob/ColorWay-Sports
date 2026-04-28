#!/usr/bin/env node

import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LOGOS_DIR = resolve(__dirname, "../public/images/posts/stanley-cup-finals-logo-history-2000-2026");
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");

const ALL_YEARS = [
  1989, 1990, 1991, 1992, 1993, 1994,
  1995, 1996, 1997, 1998, 1999,
  2000, 2001, 2002, 2003, 2004,
  2006, 2007, 2008,
  2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021,
  2022, 2023, 2024, 2025, 2026,
];

async function fixSvgAsPng(year) {
  const path = `${LOGOS_DIR}/${year}.png`;
  const raw = await readFile(path);
  const head = raw.slice(0, 5).toString();
  if (head.startsWith("<?xml") || head.startsWith("<svg")) {
    console.log(`Converting ${year}.png from SVG to real PNG...`);
    const png = await sharp(raw, { density: 300 })
      .resize(800, 800, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    await writeFile(path, png);
    console.log(`  -> ${year}.png now real PNG`);
  }
}

async function squarePad(year, targetSize = 600) {
  const path = `${LOGOS_DIR}/${year}.png`;
  const buf = await readFile(path);
  const meta = await sharp(buf).metadata();
  console.log(`Square-padding ${year}.png (was ${meta.width}x${meta.height})...`);
  const padded = await sharp(buf)
    .resize(targetSize, targetSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  await writeFile(path, padded);
  console.log(`  -> ${year}.png padded to ${targetSize}x${targetSize}`);
}

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
  const padSvg = `<svg width="${padW}" height="${padH}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${padW}" height="${padH}" rx="${padR}" fill="rgba(255,255,255,0.9)"/>
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
  const labelSvg = `<svg width="${cellSize}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
    <text x="50%" y="${yearFontSize}" font-family="-apple-system, 'SF Pro Display', system-ui, sans-serif" font-size="${yearFontSize}" font-weight="800" fill="#0a0a0a" text-anchor="middle" letter-spacing="-0.5">${year}</text>
  </svg>`;
  const labelBuf = await sharp(Buffer.from(labelSvg)).png().toBuffer();
  return { logoBuf, labelBuf, labelHeight };
}

async function buildCoverComposite({ output }) {
  const topRow = [1989, 1995, 2000, 2006];
  const bottomRow = [2008, 2009, 2022];
  const cellSize = 240;
  const yearFontSize = 32;
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
        <stop offset="0%" stop-color="#E8F4F8"/>
        <stop offset="100%" stop-color="#D6E0EE"/>
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
        <stop offset="0%" stop-color="#E8F4F8"/>
        <stop offset="100%" stop-color="#D6E0EE"/>
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
  console.log("=== Stanley Cup Final Logo History composite builder ===\n");

  console.log("Step 1: Fix SVG-as-PNG files");
  for (const y of [2000, 2002]) await fixSvgAsPng(y);

  console.log("\nStep 2: Square-pad 1993");
  await squarePad(1993, 600);

  console.log("\nStep 3: Build cover composite (4+3 layout, 7 era picks, watermark bottom-middle)");
  await buildCoverComposite({
    output: `${LOGOS_DIR}/stanley-cup-final-logo-history-cover.png`,
  });

  console.log("\nStep 4: Build full chronological grid (6 cols, watermark bottom-middle hugging bottom)");
  await buildGridComposite({
    years: ALL_YEARS,
    columns: 6,
    cellSize: 220,
    gap: 18,
    padding: 50,
    yearFontSize: 26,
    output: `${LOGOS_DIR}/stanley-cup-final-logo-history-grid.png`,
    watermarkBand: 130,
  });

  console.log("\nDone.");
})().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
