#!/usr/bin/env node
// Generates ColorWay Sports composite covers for the 2026 championship posts,
// replacing third-party celebration/game photos. Text-forward gradient design
// in the house style, watermarked bottom-right. 1600x900.

import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const POSTS = resolve(__dirname, "../public/images/posts");
const WIDTH = 1600;
const HEIGHT = 900;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const COVERS = [
  {
    out: `${POSTS}/hurricanes-won-without-red-cover.png`,
    stops: ["#000000", "#333F42", "#CC0000"], mid: 48, accent: "#CC0000",
    eyebrow: "2026 STANLEY CUP CHAMPIONS",
    t1: "CHAMPIONS IN", t1s: 100, t2: "BLACK & WHITE", t2s: 104,
    sub: "CAROLINA WON WITHOUT THE RED SWEATER",
  },
  {
    out: `${POSTS}/hurricanes-champions-gear/champions-gear-cover.png`,
    stops: ["#CC0000", "#1d1d1d", "#A2AAAD"], mid: 55, accent: "#CC0000",
    eyebrow: "2026 STANLEY CUP CHAMPIONS",
    t1: "HURRICANES", t1s: 110, t2: "CHAMPIONS GEAR", t2s: 78,
    sub: "LOCKER ROOM HAT + SHIRT · GRADED",
  },
  {
    out: `${POSTS}/knicks-finals-gear/champions-gear-cover.png`,
    stops: ["#006BB6", "#F58426", "#1d1d1d"], mid: 50, accent: "#F58426",
    eyebrow: "2026 NBA CHAMPIONS",
    t1: "KNICKS", t1s: 124, t2: "CHAMPIONS GEAR", t2s: 78,
    sub: "LOCKER ROOM HAT + SHIRT · GRADED",
  },
  {
    out: `${POSTS}/knicks-1973-vs-2026-cover.png`,
    stops: ["#F58426", "#1d1d1d", "#006BB6"], mid: 50, accent: "#F58426",
    eyebrow: "NEW YORK KNICKS",
    t1: "1973 vs 2026", t1s: 112, t2: "TITLE UNIFORMS", t2s: 86,
    sub: "53 YEARS APART · NEARLY IDENTICAL",
  },
];

async function buildOne(c) {
  const bgSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
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
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#scrim)"/>
    <rect x="0" y="0" width="${WIDTH}" height="8" fill="${c.accent}"/>
    <rect x="0" y="${HEIGHT - 8}" width="${WIDTH}" height="8" fill="${c.accent}"/>
  </svg>`;

  const textSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #FF5910; letter-spacing: 9px; }
      .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -2px; }
      .sub { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #ffffff; opacity: 0.9; letter-spacing: 5px; }
    </style>
    <text x="${WIDTH / 2}" y="420" text-anchor="middle" class="eyebrow" font-size="30">${esc(c.eyebrow)}</text>
    <text x="${WIDTH / 2}" y="525" text-anchor="middle" class="title" font-size="${c.t1s}">${esc(c.t1)}</text>
    <text x="${WIDTH / 2}" y="632" text-anchor="middle" class="title" font-size="${c.t2s}">${esc(c.t2)}</text>
    <text x="${WIDTH / 2}" y="708" text-anchor="middle" class="sub" font-size="25">${esc(c.sub)}</text>
  </svg>`;

  const base = await sharp(Buffer.from(bgSvg))
    .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  const wmW = 320;
  const watermark = await sharp(WATERMARK_PATH).resize(wmW, null, { fit: "inside" }).png().toBuffer();
  const wmMeta = await sharp(watermark).metadata();

  const final = await sharp(base)
    .composite([{ input: watermark, left: WIDTH - wmMeta.width - 60, top: HEIGHT - wmMeta.height - 44 }])
    .png()
    .toBuffer();

  await writeFile(c.out, final);
  console.log(`Wrote ${c.out}`);
}

for (const c of COVERS) await buildOne(c);
console.log("Done: 4 championship covers.");
