// Branded 3:2 hero/cover for the World Cup 2026 jersey tracker.
// Same family as gen-r32-ranked-cover.mjs: gradient + bars, FIFA WC26 mark in a
// white badge chip, three transparent kit cutouts fanned top-right, ColorWay mark
// bottom-right, bottom-left kept clear for the homepage card status pill.
// Norway + Uruguay PNGs live in the archive stash, not the repo — regenerate on Jake's Mac only.
// Usage: node scripts/gen-wc-tracker-cover.mjs
import sharp from "sharp";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { homedir } from "node:os";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");

const W = 1500, H = 1000;
const c1 = "#012169", c2 = "#10060a", accent = "#9bc824";

const bars = Array.from({ length: 8 }, (_, i) => {
  const x = 90 + i * 175;
  return `<rect x="${x}" y="0" width="10" height="${150 + (i % 4) * 45}" fill="#ffffff" opacity="0.10"/>`;
}).join("\n  ");

const BADGE = { x: 100, y: 72, w: 200, h: 284, r: 24 };

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.45" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${bars}
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect x="${BADGE.x}" y="${BADGE.y}" width="${BADGE.w}" height="${BADGE.h}" rx="${BADGE.r}" fill="#ffffff"/>
  <text x="100" y="478" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="800" letter-spacing="7" fill="${accent}">48 TEAMS · 104 MATCHES · LIVE</text>
  <rect x="100" y="502" width="120" height="8" fill="${accent}"/>
  <text x="96" y="610" font-family="Arial, Helvetica, sans-serif" font-size="92" font-weight="900" letter-spacing="-2" fill="#ffffff">WORLD CUP 2026</text>
  <text x="96" y="700" font-family="Arial, Helvetica, sans-serif" font-size="92" font-weight="900" letter-spacing="-2" fill="#ffffff">JERSEY TRACKER</text>
  <text x="100" y="760" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#ffffff" opacity="0.92">Every Match Kit Graded, Group Stage Through the Final</text>
</svg>`;

const wcLogoPath = resolve(root, "public/logos/world-cup-2026.png");
const cwLogoPath = resolve(root, "public/brand/colorway-sports-logo-white.png");
const stash = resolve(homedir(), "Desktop/colorway-archive/wc-2026-jerseys");
const congoRedPath = resolve(root, "public/images/posts/wc-congo-dr-red.png");
const uruguayPath = resolve(stash, "uruguay-blue.png");
const norwayPath = resolve(stash, "norway-white.png");

const composites = [];

if (existsSync(wcLogoPath)) {
  const wc = await sharp(wcLogoPath).resize({ height: BADGE.h - 48 }).png().toBuffer();
  const m = await sharp(wc).metadata();
  composites.push({ input: wc, top: BADGE.y + 24, left: BADGE.x + Math.round((BADGE.w - m.width) / 2) });
}

// Three kits fanned top-right, back to front: Congo DR red, Uruguay celeste, Norway white
if (existsSync(congoRedPath)) {
  const congo = await sharp(congoRedPath).resize({ height: 330 }).png().toBuffer();
  composites.push({ input: congo, top: 160, left: 1170 });
}
if (existsSync(uruguayPath)) {
  const uru = await sharp(uruguayPath).resize({ height: 355 }).png().toBuffer();
  composites.push({ input: uru, top: 105, left: 1010 });
}
if (existsSync(norwayPath)) {
  const norway = await sharp(norwayPath).resize({ height: 395 }).png().toBuffer();
  composites.push({ input: norway, top: 45, left: 880 });
}

if (existsSync(cwLogoPath)) {
  const logo = await sharp(cwLogoPath).resize({ height: 60 }).png().toBuffer();
  const m = await sharp(logo).metadata();
  composites.push({ input: logo, top: H - 60 - 44, left: W - (m.width || 200) - 60 });
}

const out = resolve(root, "public/images/posts/world-cup-2026-jersey-tracker/cover-branded.jpg");
await sharp(Buffer.from(svg)).resize(W, H).composite(composites).jpeg({ quality: 86 }).toFile(out);
console.log("wrote", out);
