#!/usr/bin/env node
// ColorWay Sports composite cover for the Lawrence Tanter retirement tribute.
// Lakers purple-to-gold gradient, text-forward, watermarked. 1600x900. No third-party photos.

import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const OUT = resolve(__dirname, "../public/images/posts/lawrence-tanter-retires-cover.jpg");
const W = 1600, H = 900;

const bgSvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#552583"/>
      <stop offset="52%" stop-color="#20183a"/>
      <stop offset="100%" stop-color="#FDB927"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="55%" r="62%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.6"/>
      <stop offset="72%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="70%" stop-color="#000000" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect x="0" y="0" width="${W}" height="8" fill="#FDB927"/>
  <rect x="0" y="${H - 8}" width="${W}" height="8" fill="#FDB927"/>
</svg>`;

const textSvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #FDB927; letter-spacing: 8px; }
    .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -1px; }
    .t2 { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #ffffff; letter-spacing: 2px; }
    .sub { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #ffffff; opacity: 0.9; letter-spacing: 4px; }
  </style>
  <text x="${W / 2}" y="415" text-anchor="middle" class="eyebrow" font-size="30">THE VOICE OF THE LAKERS</text>
  <text x="${W / 2}" y="525" text-anchor="middle" class="title" font-size="94">LAWRENCE TANTER</text>
  <text x="${W / 2}" y="620" text-anchor="middle" class="t2" font-size="50">RETIRES AFTER 43 SEASONS</text>
  <text x="${W / 2}" y="700" text-anchor="middle" class="sub" font-size="24">THE GREATEST VOICE IN THE BUILDING</text>
</svg>`;

const base = await sharp(Buffer.from(bgSvg))
  .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }]).png().toBuffer();
const wmk = await sharp(WATERMARK_PATH).resize(320, null, { fit: "inside" }).png().toBuffer();
const m = await sharp(wmk).metadata();
const final = await sharp(base)
  .composite([{ input: wmk, left: W - m.width - 60, top: H - m.height - 44 }]).png().toBuffer();
await writeFile(OUT, final);
console.log(`Wrote ${OUT}`);
