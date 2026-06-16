#!/usr/bin/env node
// ColorWay Sports composite cover: Josh Berry San Diego stars-and-stripes paint scheme.
// Patriotic navy-to-red gradient + star motif + watermark. 1600x900. No third-party photos.

import sharp from "sharp";
import { writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const OUT = resolve(__dirname, "../public/images/posts/josh-berry-san-diego-cover.jpg");
const W = 1600, H = 900;

// a white 5-point star polygon centered at (cx,cy)
function star(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${(cx + rad * Math.cos(ang)).toFixed(1)},${(cy + rad * Math.sin(ang)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="#ffffff" opacity="0.95"/>`;
}
const stars = [700, 750, 800, 850, 900].map((x) => star(x, 215, 26)).join("");

const bgSvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0A3161"/>
      <stop offset="50%" stop-color="#141422"/>
      <stop offset="100%" stop-color="#B31942"/>
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
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect x="0" y="0" width="${W}" height="8" fill="#B31942"/>
  <rect x="0" y="${H - 8}" width="${W}" height="8" fill="#ffffff"/>
  ${stars}
</svg>`;

const textSvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #FF5910; letter-spacing: 7px; }
    .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -1px; }
    .t2 { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #ffffff; letter-spacing: 2px; }
    .sub { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #ffffff; opacity: 0.9; letter-spacing: 3px; }
  </style>
  <text x="${W / 2}" y="430" text-anchor="middle" class="eyebrow" font-size="28">2026 ANDURIL 250 · SAN DIEGO</text>
  <text x="${W / 2}" y="540" text-anchor="middle" class="title" font-size="104">JOSH BERRY</text>
  <text x="${W / 2}" y="628" text-anchor="middle" class="t2" font-size="52">STARS &amp; STRIPES PAINT SCHEME</text>
  <text x="${W / 2}" y="704" text-anchor="middle" class="sub" font-size="23">THE NO. 21 WOOD BROTHERS MILITARY TRIBUTE</text>
</svg>`;

let img = await sharp(Buffer.from(bgSvg))
  .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }]).png().toBuffer();
const wmk = await sharp(WATERMARK_PATH).resize(320, null, { fit: "inside" }).png().toBuffer();
const m = await sharp(wmk).metadata();
const final = await sharp(img)
  .composite([{ input: wmk, left: W - m.width - 160, top: H - m.height - 44 }]).png().toBuffer();
await writeFile(OUT, final);
console.log(`Wrote ${OUT}`);
