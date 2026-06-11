#!/usr/bin/env node

import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STEELERS = resolve(__dirname, "../public/images/posts/unified-city-colors/steelers.png");
const PIRATES = resolve(__dirname, "../public/images/posts/unified-city-colors/pirates.svg");
const PENGUINS = resolve(__dirname, "../public/images/posts/unified-city-colors/penguins.png");
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const OUTPUT = resolve(
  __dirname,
  "../public/images/posts/unified-city-colors/pittsburgh-cover.jpg"
);

const WIDTH = 1600;
const HEIGHT = 900;
const LOGO_BOX = 340;

async function build() {
  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="warmth" cx="50%" cy="50%" r="65%">
        <stop offset="0%" stop-color="#3d2a00" stop-opacity="1"/>
        <stop offset="55%" stop-color="#1a1100" stop-opacity="1"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="1"/>
      </radialGradient>
      <radialGradient id="topGlow" cx="50%" cy="0%" r="50%">
        <stop offset="0%" stop-color="#FFB612" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#FFB612" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="bottomGlow" cx="50%" cy="100%" r="50%">
        <stop offset="0%" stop-color="#FFB612" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#FFB612" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#000000"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#warmth)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#topGlow)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bottomGlow)"/>
    <rect x="0" y="0" width="${WIDTH}" height="6" fill="#FFB612"/>
    <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="#FFB612"/>
  </svg>`;

  const renderLogo = async (path, density = 600) => {
    const buf = await readFile(path);
    const opts = path.endsWith(".svg") ? { density } : {};
    return sharp(buf, opts)
      .resize(LOGO_BOX, LOGO_BOX, {
        fit: "inside",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
  };

  const [steelers, pirates, penguins] = await Promise.all([
    renderLogo(STEELERS),
    renderLogo(PIRATES),
    renderLogo(PENGUINS),
  ]);

  const [stMeta, piMeta, peMeta] = await Promise.all([
    sharp(steelers).metadata(),
    sharp(pirates).metadata(),
    sharp(penguins).metadata(),
  ]);

  const slot = WIDTH / 3;
  const centerY = HEIGHT / 2;

  const placeAt = (meta, slotIndex) => {
    const cx = Math.round(slot * slotIndex + slot / 2);
    return {
      left: Math.round(cx - meta.width / 2),
      top: Math.round(centerY - meta.height / 2),
    };
  };

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([
      { input: steelers, ...placeAt(stMeta, 0) },
      { input: pirates, ...placeAt(piMeta, 1) },
      { input: penguins, ...placeAt(peMeta, 2) },
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
