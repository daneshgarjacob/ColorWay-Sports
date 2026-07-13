#!/usr/bin/env node
// ColorWay Sports cover: 2026 Home Run Derby looks, ranked.
// Patriotic gradient + 13 stars (America 250) + three real All-Star Workout caps
// (white background knocked out) floating on soft spotlights. 1500x1000 (3:2).

import sharp from "sharp";
import { writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(__dirname, "../public/images/posts/home-run-derby-2026");
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const OUT = resolve(DIR, "cover-derby-looks-ranked.jpg");
const W = 1500, H = 1000;

// Featured caps, left to right (good color spread on the gradient).
const CAPS = [
  "royals-asg-workout-cap-2026.jpg",
  "phillies-asg-workout-cap-2026.jpg",
  "white-sox-asg-workout-cap-2026.jpg",
].map((f) => resolve(DIR, f));

// Knock out the border-connected white background, keep interior whites (logos).
async function knockoutWhite(path, targetH) {
  const { data, info } = await sharp(path)
    .resize({ height: targetH })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info; // 4
  const isWhite = (i) => data[i] >= 236 && data[i + 1] >= 236 && data[i + 2] >= 236;
  const visited = new Uint8Array(width * height);
  const stack = [];
  const pushIf = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    visited[p] = 1;
    const i = p * channels;
    if (isWhite(i)) { data[i + 3] = 0; stack.push(x, y); }
  };
  for (let x = 0; x < width; x++) { pushIf(x, 0); pushIf(x, height - 1); }
  for (let y = 0; y < height; y++) { pushIf(0, y); pushIf(width - 1, y); }
  while (stack.length) {
    const y = stack.pop(), x = stack.pop();
    pushIf(x + 1, y); pushIf(x - 1, y); pushIf(x, y + 1); pushIf(x, y - 1);
  }
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * channels + 3] > 0) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const w = maxX - minX + 1, h = maxY - minY + 1;
  const buf = await sharp(data, { raw: { width, height, channels } })
    .extract({ left: minX, top: minY, width: w, height: h })
    .png().toBuffer();
  return { buf, w, h };
}

function star(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${(cx + rad * Math.cos(ang)).toFixed(1)},${(cy + rad * Math.sin(ang)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="#ffffff" opacity="0.8"/>`;
}
const startX = 250, stepX = (W - 2 * startX) / 12;
const stars = Array.from({ length: 13 }, (_, i) => star(startX + i * stepX, 120, 13)).join("");

// Spotlights behind each cap (centers set below).
const CENTERS = [320, 750, 1180];
const CAP_CY = 660;
const glows = CENTERS.map((cx) =>
  `<ellipse cx="${cx}" cy="${CAP_CY + 40}" rx="250" ry="180" fill="url(#spot)"/>`
).join("");

const bgSvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E81828"/>
      <stop offset="52%" stop-color="#101528"/>
      <stop offset="100%" stop-color="#284898"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="44%" r="66%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.4"/>
      <stop offset="74%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="spot" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.34"/>
      <stop offset="70%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="72%" stop-color="#000000" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${glows}
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect x="0" y="0" width="${W}" height="9" fill="#E81828"/>
  <rect x="0" y="${H - 9}" width="${W}" height="9" fill="#F4F1E8"/>
  ${stars}
</svg>`;

const textSvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #FF7A33; letter-spacing: 5px; }
    .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -2px; }
    .sub { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #E7ECF6; letter-spacing: 1px; }
  </style>
  <text x="${W / 2}" y="205" text-anchor="middle" class="eyebrow" font-size="25">2026 HOME RUN DERBY  ·  PHILADELPHIA</text>
  <text x="${W / 2}" y="305" text-anchor="middle" class="title" font-size="108">EVERY LOOK, RANKED</text>
  <text x="${W / 2}" y="385" text-anchor="middle" class="sub" font-size="29">Eight Big Bats  ·  New Era's America-250 Caps  ·  Live on Netflix</text>
</svg>`;

let img = sharp(Buffer.from(bgSvg));
// Composite caps (center cap drawn last so it sits on top of any overlap).
const capH = 360;
const loaded = await Promise.all(CAPS.map((p) => knockoutWhite(p, capH)));
const order = [0, 2, 1]; // left, right, then center on top
const comps = [];
for (const i of order) {
  const { buf, w, h } = loaded[i];
  comps.push({ input: buf, left: Math.round(CENTERS[i] - w / 2), top: Math.round(CAP_CY - h / 2) });
}
comps.push({ input: Buffer.from(textSvg), top: 0, left: 0 });
img = sharp(await img.composite(comps).png().toBuffer());

const wmk = await sharp(WATERMARK_PATH).resize(280, null, { fit: "inside" }).png().toBuffer();
const m = await sharp(wmk).metadata();
const final = await sharp(await img.toBuffer())
  .composite([{ input: wmk, left: W - m.width - 54, top: H - m.height - 42 }])
  .jpeg({ quality: 90 }).toBuffer();
await writeFile(OUT, final);
console.log(`Wrote ${OUT}`);
