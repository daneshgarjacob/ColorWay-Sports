#!/usr/bin/env node
// Side-by-side 3:2 cover for the Nebraska 2026 uniform rebrand post.
// Places the official "Primary Red" + "Primary White" reveal graphics on a dark
// scarlet-tinted canvas with a bottom kicker, a grade badge, and the ColorWay logo.

import sharp from "sharp";
import { writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(__dirname, "../public/images/posts/nebraska-football-rebrand");
const RED = resolve(DIR, "nebraska-2026-primary-red.jpg");
const WHITE = resolve(DIR, "nebraska-2026-primary-white.jpg");
const LOGO = resolve(__dirname, "../public/brand/colorway-sports-logo-white.png");
const OUT = resolve(DIR, "nebraska-2026-cover.jpg");

const W = 1500;
const H = 1000;
const GH = 792; // graphic height

async function build() {
  const bg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#23101300"/>
        <stop offset="0%" stop-color="#241015"/>
        <stop offset="55%" stop-color="#0c0c0c"/>
        <stop offset="100%" stop-color="#280309"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <rect x="0" y="0" width="${W}" height="8" fill="#E60026"/>
    <rect x="0" y="${H - 8}" width="${W}" height="8" fill="#E60026"/>
  </svg>`;

  const redG = await sharp(RED).resize({ height: GH }).png().toBuffer();
  const whiteG = await sharp(WHITE).resize({ height: GH }).png().toBuffer();
  const rM = await sharp(redG).metadata();
  const wM = await sharp(whiteG).metadata();
  const gap = 32;
  const totalW = rM.width + wM.width + gap;
  const startX = Math.round((W - totalW) / 2);
  const top = 56;

  const logo = await sharp(LOGO).resize(216, null, { fit: "inside" }).png().toBuffer();
  const lM = await sharp(logo).metadata();

  const overlay = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .k{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:800;fill:#ffffff;letter-spacing:4px;}
      .s{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;fill:#9c9c9c;letter-spacing:3px;}
    </style>
    <text x="70" y="${H - 58}" class="k" font-size="26">NEBRASKA · 2026 REBRAND</text>
    <text x="70" y="${H - 30}" class="s" font-size="17">ADIDAS · FULL REVIEW &amp; GRADE</text>
    <rect x="${W / 2 - 92}" y="${H - 110}" rx="9" ry="9" width="184" height="54" fill="#E60026"/>
    <text x="${W / 2}" y="${H - 73}" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-weight="900" font-size="28" fill="#ffffff" letter-spacing="2">GRADE B−</text>
  </svg>`;

  const composed = await sharp(Buffer.from(bg))
    .composite([
      { input: redG, left: startX, top },
      { input: whiteG, left: startX + rM.width + gap, top },
      { input: Buffer.from(overlay), top: 0, left: 0 },
      { input: logo, left: W - lM.width - 56, top: H - lM.height - 34 },
    ])
    .jpeg({ quality: 88 })
    .toBuffer();

  await writeFile(OUT, composed);
  console.log(`Wrote ${OUT} (${W}x${H})`);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
