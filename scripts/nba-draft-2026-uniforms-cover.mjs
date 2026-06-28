#!/usr/bin/env node

import sharp from "sharp";
import { mkdir, readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMG_DIR = resolve(__dirname, "../public/images/posts/nba-draft-2026-rookies-new-uniforms");
const LOGO_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo-white.png");
const NBA_LOGO_PATH = resolve(__dirname, "../public/logos/nba.svg");
const OUTPUT = resolve(IMG_DIR, "cover.jpg");

const WIDTH = 1500;
const HEIGHT = 1000;

async function build() {
  await mkdir(IMG_DIR, { recursive: true });

  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#17408B"/>
        <stop offset="50%" stop-color="#0a1f4d"/>
        <stop offset="100%" stop-color="#091634"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="38%" r="62%">
        <stop offset="0%" stop-color="#C9082A" stop-opacity="0.34"/>
        <stop offset="70%" stop-color="#C9082A" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <rect x="0" y="0" width="${WIDTH}" height="8" fill="#C9082A"/>
    <rect x="0" y="${HEIGHT - 8}" width="${WIDTH}" height="8" fill="#C9082A"/>
  </svg>`;

  const textSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #ff5a6e; letter-spacing: 11px; }
      .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -1.5px; }
      .sub { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #ffffff; opacity: 0.82; letter-spacing: 5px; }
    </style>
    <text x="${WIDTH / 2}" y="320" text-anchor="middle" class="eyebrow" font-size="30">2026 NBA DRAFT · ROOKIE UNIFORM TRACKER</text>
    <text x="${WIDTH / 2}" y="445" text-anchor="middle" class="title" font-size="96">Every Pick in</text>
    <text x="${WIDTH / 2}" y="555" text-anchor="middle" class="title" font-size="96">Their New Uniform</text>
    <text x="${WIDTH / 2}" y="680" text-anchor="middle" class="sub" font-size="30">ALL 30 FIRST-ROUND JERSEYS</text>
  </svg>`;

  // NBA logo silhouette → tint white so it reads on the navy background.
  let nbaSvg = await readFile(NBA_LOGO_PATH, "utf8");
  nbaSvg = nbaSvg.replace("<svg ", '<svg fill="#ffffff" ');
  const nbaLogo = await sharp(Buffer.from(nbaSvg)).resize(null, 150, { fit: "inside" }).png().toBuffer();
  const nbaMeta = await sharp(nbaLogo).metadata();

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([
      { input: nbaLogo, left: Math.round((WIDTH - nbaMeta.width) / 2), top: 120 },
      { input: Buffer.from(textSvg), top: 0, left: 0 },
    ])
    .png()
    .toBuffer();

  const logoWidth = 300;
  const logo = await sharp(LOGO_PATH).resize(logoWidth, null, { fit: "inside" }).png().toBuffer();
  const logoMeta = await sharp(logo).metadata();

  const final = await sharp(composed)
    .composite([
      { input: logo, left: Math.round((WIDTH - logoMeta.width) / 2), top: HEIGHT - logoMeta.height - 70 },
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
