#!/usr/bin/env node
// ColorWay Sports composite cover: the USA 250 patch across MLB, NBA, NFL.
// Patriotic gradient + three league logos in a row + watermark. 1600x900.

import sharp from "sharp";
import { writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const LOGOS = ["mlb", "nba", "nfl"].map((l) => resolve(__dirname, `../public/logos/${l}.png`));
const OUT = resolve(__dirname, "../public/images/posts/usa-250-patch-cover.jpg");
const W = 1600, H = 900;

function star(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${(cx + rad * Math.cos(ang)).toFixed(1)},${(cy + rad * Math.sin(ang)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="#ffffff" opacity="0.9"/>`;
}
const stars = [700, 750, 800, 850, 900].map((x) => star(x, 205, 20)).join("");

const bgSvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0A3161"/>
      <stop offset="50%" stop-color="#141422"/>
      <stop offset="100%" stop-color="#B31942"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="62%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.5"/>
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
    .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #FF5910; letter-spacing: 6px; }
    .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -1px; }
    .t2 { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #ffffff; letter-spacing: 2px; }
  </style>
  <text x="${W / 2}" y="320" text-anchor="middle" class="eyebrow" font-size="26">AMERICA'S 250TH BIRTHDAY</text>
  <text x="${W / 2}" y="430" text-anchor="middle" class="title" font-size="104">THE USA 250 PATCH</text>
  <text x="${W / 2}" y="508" text-anchor="middle" class="t2" font-size="42">ONE PATCH ACROSS THREE LEAGUES</text>
</svg>`;

let img = await sharp(Buffer.from(bgSvg))
  .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }]).png().toBuffer();

// three league logos centered in a row near the bottom third
const LOGO_H = 92, GAP = 80, ROW_Y = 600;
const bufs = [];
for (const p of LOGOS) {
  const b = await sharp(p).resize(null, LOGO_H, { fit: "inside" }).png().toBuffer();
  bufs.push({ b, w: (await sharp(b).metadata()).width });
}
const totalW = bufs.reduce((s, x) => s + x.w, 0) + GAP * (bufs.length - 1);
let x = Math.round((W - totalW) / 2);
const comps = [];
for (const { b, w } of bufs) { comps.push({ input: b, left: x, top: ROW_Y }); x += w + GAP; }
img = await sharp(img).composite(comps).png().toBuffer();

const wmk = await sharp(WATERMARK_PATH).resize(320, null, { fit: "inside" }).png().toBuffer();
const m = await sharp(wmk).metadata();
const final = await sharp(img)
  .composite([{ input: wmk, left: W - m.width - 160, top: H - m.height - 44 }]).png().toBuffer();
await writeFile(OUT, final);
console.log(`Wrote ${OUT}`);
