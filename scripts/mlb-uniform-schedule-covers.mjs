#!/usr/bin/env node
// ColorWay Sports composite covers for the MLB uniform-schedule posts.
// Text-forward gradient design (team colors) + center glow + watermark. 1600x900.
// No third-party photos — fully owned graphics.

import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WATERMARK_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");
const POSTS = resolve(__dirname, "../public/images/posts");
const WIDTH = 1600, HEIGHT = 900;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const SUB = "EVERY JERSEY AND WHEN THEY WEAR IT";
const COVERS = [
  { out: `${POSTS}/orioles-uniform-schedule-cover.png`,  stops: ["#DF4601", "#1a1a1a", "#000000"], mid: 50, accent: "#DF4601", t1: "ORIOLES",   t1s: 120 },
  { out: `${POSTS}/padres-uniform-schedule-cover.png`,   stops: ["#5A3A1F", "#2a1d12", "#FFC425"], mid: 58, accent: "#FFC425", t1: "PADRES",    t1s: 124 },
  { out: `${POSTS}/giants-uniform-schedule-cover.png`,   stops: ["#FD5A1E", "#1a1a1a", "#000000"], mid: 50, accent: "#FD5A1E", t1: "GIANTS",    t1s: 124 },
  { out: `${POSTS}/royals-uniform-schedule-cover.png`,   stops: ["#004687", "#16314a", "#7BB2DD"], mid: 56, accent: "#BD9B60", t1: "ROYALS",    t1s: 124 },
  { out: `${POSTS}/cardinals-uniform-schedule-cover.png`,stops: ["#C41E3A", "#1a1a1a", "#0C2340"], mid: 50, accent: "#C41E3A", t1: "CARDINALS", t1s: 104 },
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
      .t2 { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: #ffffff; letter-spacing: 3px; }
      .sub { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #ffffff; opacity: 0.9; letter-spacing: 4px; }
    </style>
    <text x="${WIDTH / 2}" y="420" text-anchor="middle" class="eyebrow" font-size="30">2026 MLB SEASON</text>
    <text x="${WIDTH / 2}" y="535" text-anchor="middle" class="title" font-size="${c.t1s}">${esc(c.t1)}</text>
    <text x="${WIDTH / 2}" y="628" text-anchor="middle" class="t2" font-size="66">UNIFORM SCHEDULE</text>
    <text x="${WIDTH / 2}" y="702" text-anchor="middle" class="sub" font-size="24">${esc(SUB)}</text>
  </svg>`;

  const base = await sharp(Buffer.from(bgSvg))
    .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }]).png().toBuffer();
  const watermark = await sharp(WATERMARK_PATH).resize(320, null, { fit: "inside" }).png().toBuffer();
  const wm = await sharp(watermark).metadata();
  const final = await sharp(base)
    .composite([{ input: watermark, left: WIDTH - wm.width - 60, top: HEIGHT - wm.height - 44 }]).png().toBuffer();
  await writeFile(c.out, final);
  console.log(`Wrote ${c.out}`);
}
for (const c of COVERS) await buildOne(c);
console.log("Done: 5 MLB uniform-schedule covers.");
