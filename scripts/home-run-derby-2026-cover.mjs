#!/usr/bin/env node
// ColorWay Sports type-led editorial cover: 2026 Home Run Derby looks, ranked.
// Patriotic Phillies-red -> navy -> colonial-blue gradient, 13 stars (America 250),
// eyebrow + title + subtitle, watermark. 1500x1000 (3:2).

import sharp from "sharp";
import { writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const OUT = resolve(__dirname, "../public/images/posts/home-run-derby-2026/cover-derby-looks-ranked.jpg");
const W = 1500, H = 1000;

function star(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${(cx + rad * Math.cos(ang)).toFixed(1)},${(cy + rad * Math.sin(ang)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="#ffffff" opacity="0.82"/>`;
}
// 13 stars across the crown of the cover, for the original 13 colonies / America 250.
const startX = 250, stepX = (W - 2 * startX) / 12;
const stars = Array.from({ length: 13 }, (_, i) => star(startX + i * stepX, 175, 15)).join("");

const bgSvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E81828"/>
      <stop offset="52%" stop-color="#101528"/>
      <stop offset="100%" stop-color="#284898"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="46%" r="65%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.42"/>
      <stop offset="74%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="68%" stop-color="#000000" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect x="0" y="0" width="${W}" height="9" fill="#E81828"/>
  <rect x="0" y="${H - 9}" width="${W}" height="9" fill="#F4F1E8"/>
  ${stars}
</svg>`;

const textSvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #FF7A33; letter-spacing: 6px; }
    .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -2px; }
    .sub { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #E7ECF6; letter-spacing: 1px; }
  </style>
  <text x="${W / 2}" y="360" text-anchor="middle" class="eyebrow" font-size="27">2026 HOME RUN DERBY  ·  PHILADELPHIA</text>
  <text x="${W / 2}" y="500" text-anchor="middle" class="title" font-size="150">EVERY LOOK,</text>
  <text x="${W / 2}" y="640" text-anchor="middle" class="title" font-size="150">RANKED</text>
  <text x="${W / 2}" y="740" text-anchor="middle" class="sub" font-size="33">Eight Big Bats  ·  New Era's America-250 Caps  ·  Live on Netflix</text>
</svg>`;

let img = await sharp(Buffer.from(bgSvg))
  .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }]).png().toBuffer();

const wmk = await sharp(WATERMARK_PATH).resize(300, null, { fit: "inside" }).png().toBuffer();
const m = await sharp(wmk).metadata();
const final = await sharp(img)
  .composite([{ input: wmk, left: W - m.width - 60, top: H - m.height - 46 }])
  .jpeg({ quality: 90 }).toBuffer();
await writeFile(OUT, final);
console.log(`Wrote ${OUT}`);
