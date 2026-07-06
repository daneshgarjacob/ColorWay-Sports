#!/usr/bin/env node
// ColorWay Sports cover for the MLB uniform-schedule PILLAR page (all 30 teams).
// MLB logo (top-center, soft halo) + navy→brand-blue gradient + glow + watermark. 1600x900.

import sharp from "sharp";
import { writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const PUB = resolve(__dirname, "../public");
const OUT = resolve(PUB, "images/posts/mlb-uniform-schedule-2026-cover.png");
const LOGO = resolve(PUB, "logos/mlb.png");
const W = 1600, H = 900;

const bgSvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0A2A66"/>
      <stop offset="52%" stop-color="#0B1A2F"/>
      <stop offset="100%" stop-color="#2f6bed"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="56%" r="62%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.55"/>
      <stop offset="72%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="70%" stop-color="#000000" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.45"/>
    </linearGradient>
    <radialGradient id="logohalo" cx="800" cy="235" r="200" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.46"/>
      <stop offset="62%" stop-color="#ffffff" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect width="${W}" height="${H}" fill="url(#logohalo)"/>
  <rect x="0" y="0" width="${W}" height="8" fill="#FF5910"/>
  <rect x="0" y="${H - 8}" width="${W}" height="8" fill="#FF5910"/>
</svg>`;

const textSvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #FF5910; letter-spacing: 9px; }
    .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -2px; }
    .t2 { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #ffffff; letter-spacing: 3px; }
    .sub { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #ffffff; opacity: 0.9; letter-spacing: 4px; }
  </style>
  <text x="${W / 2}" y="452" text-anchor="middle" class="eyebrow" font-size="30">2026 MLB SEASON</text>
  <text x="${W / 2}" y="558" text-anchor="middle" class="title" font-size="116">UNIFORM SCHEDULE</text>
  <text x="${W / 2}" y="638" text-anchor="middle" class="t2" font-size="52">ALL 30 TEAMS</text>
  <text x="${W / 2}" y="706" text-anchor="middle" class="sub" font-size="24">WHAT EACH TEAM WEARS AND WHEN</text>
</svg>`;

let img = await sharp(Buffer.from(bgSvg))
  .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }]).png().toBuffer();
const logo = await sharp(LOGO)
  .resize(300, 200, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
const lm = await sharp(logo).metadata();
img = await sharp(img).composite([{ input: logo, left: Math.round((W - lm.width) / 2), top: Math.round(235 - lm.height / 2) }]).png().toBuffer();
const wmk = await sharp(WATERMARK_PATH).resize(320, null, { fit: "inside" }).png().toBuffer();
const m = await sharp(wmk).metadata();
const final = await sharp(img).composite([{ input: wmk, left: W - m.width - 160, top: H - m.height - 44 }]).png().toBuffer();
await writeFile(OUT, final);
console.log(`Wrote ${OUT}`);
