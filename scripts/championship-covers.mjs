#!/usr/bin/env node
// ColorWay Sports composite covers for the 2026 championship posts.
// Team logo (top-center, soft halo) + gradient + center glow + watermark. 1600x900.
// Configs without a `logo` are SKIPPED (logo files not yet in repo).

import sharp from "sharp";
import { writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const PUB = resolve(__dirname, "../public");
const POSTS = resolve(PUB, "images/posts");
const W = 1600, H = 900;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const KNICKS = "images/posts/unified-city-colors/knicks.png";

const COVERS = [
  { out: `${POSTS}/hurricanes-won-without-red-cover.png`, stops: ["#000000", "#333F42", "#CC0000"], mid: 48, accent: "#CC0000", eyebrow: "2026 STANLEY CUP CHAMPIONS", t1: "CHAMPIONS IN", t1s: 100, t2: "BLACK & WHITE", t2s: 104, sub: "CAROLINA WON WITHOUT THE RED SWEATER", logo: null },
  { out: `${POSTS}/hurricanes-champions-gear/champions-gear-cover.png`, stops: ["#CC0000", "#1d1d1d", "#A2AAAD"], mid: 55, accent: "#CC0000", eyebrow: "2026 STANLEY CUP CHAMPIONS", t1: "HURRICANES", t1s: 110, t2: "CHAMPIONS GEAR", t2s: 78, sub: "LOCKER ROOM HAT + SHIRT · GRADED", logo: null },
  { out: `${POSTS}/knicks-finals-gear/champions-gear-cover.png`, stops: ["#006BB6", "#F58426", "#1d1d1d"], mid: 50, accent: "#F58426", eyebrow: "2026 NBA CHAMPIONS", t1: "KNICKS", t1s: 124, t2: "CHAMPIONS GEAR", t2s: 78, sub: "LOCKER ROOM HAT + SHIRT · GRADED", logo: KNICKS },
  { out: `${POSTS}/knicks-1973-vs-2026-cover.png`, stops: ["#F58426", "#1d1d1d", "#006BB6"], mid: 50, accent: "#F58426", eyebrow: "NEW YORK KNICKS", t1: "1973 vs 2026", t1s: 112, t2: "TITLE UNIFORMS", t2s: 86, sub: "53 YEARS APART · NEARLY IDENTICAL", logo: KNICKS },
];

function bgSvg(c) {
  const halo = c.logo ? `
      <radialGradient id="logohalo" cx="800" cy="225" r="195" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.42"/>
        <stop offset="64%" stop-color="#000000" stop-opacity="0.14"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>` : "";
  const haloRect = c.logo ? `<rect width="${W}" height="${H}" fill="url(#logohalo)"/>` : "";
  return `
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c.stops[0]}"/>
        <stop offset="${c.mid}%" stop-color="${c.stops[1]}"/>
        <stop offset="100%" stop-color="${c.stops[2]}"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="56%" r="62%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.55"/>
        <stop offset="72%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="70%" stop-color="#000000" stop-opacity="0.05"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.45"/>
      </linearGradient>${halo}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    <rect width="${W}" height="${H}" fill="url(#scrim)"/>
    ${haloRect}
    <rect x="0" y="0" width="${W}" height="8" fill="${c.accent}"/>
    <rect x="0" y="${H - 8}" width="${W}" height="8" fill="${c.accent}"/>
  </svg>`;
}

function textSvg(c) {
  return `
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #FF5910; letter-spacing: 9px; }
      .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -2px; }
      .sub { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #ffffff; opacity: 0.9; letter-spacing: 5px; }
    </style>
    <text x="${W / 2}" y="430" text-anchor="middle" class="eyebrow" font-size="30">${esc(c.eyebrow)}</text>
    <text x="${W / 2}" y="535" text-anchor="middle" class="title" font-size="${c.t1s}">${esc(c.t1)}</text>
    <text x="${W / 2}" y="642" text-anchor="middle" class="title" font-size="${c.t2s}">${esc(c.t2)}</text>
    <text x="${W / 2}" y="716" text-anchor="middle" class="sub" font-size="25">${esc(c.sub)}</text>
  </svg>`;
}

async function buildOne(c) {
  if (!c.logo) { console.log(`Skip (no logo yet): ${c.out}`); return; }
  let img = await sharp(Buffer.from(bgSvg(c)))
    .composite([{ input: Buffer.from(textSvg(c)), top: 0, left: 0 }]).png().toBuffer();
  const logo = await sharp(resolve(PUB, c.logo))
    .resize(360, 190, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const lm = await sharp(logo).metadata();
  img = await sharp(img).composite([{ input: logo, left: Math.round((W - lm.width) / 2), top: Math.round(225 - lm.height / 2) }]).png().toBuffer();
  const wmk = await sharp(WATERMARK_PATH).resize(320, null, { fit: "inside" }).png().toBuffer();
  const m = await sharp(wmk).metadata();
  const final = await sharp(img).composite([{ input: wmk, left: W - m.width - 60, top: H - m.height - 44 }]).png().toBuffer();
  await writeFile(c.out, final);
  console.log(`Wrote ${c.out}`);
}
for (const c of COVERS) await buildOne(c);
console.log("Done.");
