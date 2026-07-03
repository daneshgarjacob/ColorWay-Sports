#!/usr/bin/env node
// ColorWay Sports composite cover: the US Soccer crest on a flag-themed gradient.
// 3:2 (1500x1000) per post cover spec: gradient + scrim + centered crest + watermark.
// Usage: node scripts/usmnt-crest-cover.mjs

import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const CREST_PATH = resolve(homedir(), "Desktop/colorway-archive/brand-assets/United_States_Soccer_Federation_logo.svg.webp");
const OUT_DIR = resolve(__dirname, "../public/images/posts/usmnt-crest-explained");
const OUT = resolve(OUT_DIR, "usmnt-crest-cover.jpg");
const W = 1500, H = 1000;

function star(cx, cy, r, opacity) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${(cx + rad * Math.cos(ang)).toFixed(1)},${(cy + rad * Math.sin(ang)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="#ffffff" opacity="${opacity}"/>`;
}

// faint scattered stars, kept away from the center where the crest sits
const stars = [
  [150, 160, 26, 0.10], [320, 90, 16, 0.08], [1240, 130, 22, 0.10], [1390, 300, 15, 0.08],
  [110, 760, 18, 0.08], [1360, 800, 24, 0.10], [240, 900, 14, 0.07], [1180, 920, 16, 0.07],
].map(([x, y, r, o]) => star(x, y, r, o)).join("");

const bgSvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0A3161"/>
      <stop offset="55%" stop-color="#101a33"/>
      <stop offset="100%" stop-color="#B31942"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="46%" r="46%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="70%" stop-color="#000000" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.45"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#halo)"/>
  ${stars}
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect x="0" y="0" width="${W}" height="8" fill="#B31942"/>
  <rect x="0" y="${H - 8}" width="${W}" height="8" fill="#ffffff"/>
</svg>`;

await mkdir(OUT_DIR, { recursive: true });

// crest centered, large; slight upward bias so the bottom scrim stays clear
const crest = await sharp(CREST_PATH).resize(null, 680, { fit: "inside" }).png().toBuffer();
const cm = await sharp(crest).metadata();

let img = await sharp(Buffer.from(bgSvg))
  .composite([{ input: crest, left: Math.round((W - cm.width) / 2), top: Math.round((H - cm.height) / 2) - 30 }])
  .png().toBuffer();

const wmk = await sharp(WATERMARK_PATH).resize(300, null, { fit: "inside" }).png().toBuffer();
const m = await sharp(wmk).metadata();
const final = await sharp(img)
  .composite([{ input: wmk, left: W - m.width - 60, top: H - m.height - 40 }])
  .jpeg({ quality: 88, mozjpeg: true }).toBuffer();
await writeFile(OUT, final);
console.log(`Wrote ${OUT}`);
