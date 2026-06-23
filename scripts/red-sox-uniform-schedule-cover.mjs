#!/usr/bin/env node
// 3:2 (1500x1000) cover for the Red Sox 2026 uniform-schedule post.
// Typographic + color-swatch design (no team photos/logos) on a navy->red
// gradient: title, subtitle, a row of the five 2026 uniform colors, ColorWay logo.

import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTDIR = resolve(__dirname, "../public/images/posts/red-sox-uniform-schedule-2026");
const LOGO = resolve(__dirname, "../public/brand/colorway-sports-logo-white.png");
const OUT = resolve(OUTDIR, "cover.jpg");

const W = 1500;
const H = 1000;

// The five 2026 uniforms, in rotation order.
const SWATCHES = [
  { color: "#FFFFFF", label: "HOME WHITE", stroke: "rgba(255,255,255,0.35)", text: "#0C2340" },
  { color: "#B6B8BA", label: "ROAD GRAY", text: "#0C2340" },
  { color: "#BD3039", label: "RED ALT", text: "#ffffff" },
  { color: "#FFD100", label: "CITY CONNECT", text: "#0C2340" },
  { color: "#00683E", label: "FENWAY GREEN", text: "#ffffff" },
];

const SW = 196;   // swatch width
const SG = 30;    // swatch gap
const SH = 150;   // swatch height
const SY = 600;   // swatch top
const totalW = SWATCHES.length * SW + (SWATCHES.length - 1) * SG;
const startX = Math.round((W - totalW) / 2);
const centerX = (i) => startX + i * (SW + SG) + SW / 2;

async function build() {
  await mkdir(OUTDIR, { recursive: true });

  const swatchRects = SWATCHES.map((s, i) => {
    const x = startX + i * (SW + SG);
    const stroke = s.stroke ? `stroke="${s.stroke}" stroke-width="2"` : "";
    return `<rect x="${x}" y="${SY}" width="${SW}" height="${SH}" rx="12" fill="${s.color}" ${stroke}/>
      <text x="${centerX(i)}" y="${SY + SH + 36}" text-anchor="middle" class="lbl">${s.label}</text>`;
  }).join("\n");

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0C2340"/>
        <stop offset="55%" stop-color="#10182e"/>
        <stop offset="100%" stop-color="#6b0a17"/>
      </linearGradient>
    </defs>
    <style>
      .kick{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;fill:#c9ccd1;letter-spacing:7px;}
      .title{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;fill:#ffffff;letter-spacing:3px;}
      .sub{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:800;fill:#ff8a8f;letter-spacing:2px;}
      .tag{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:600;fill:#9aa0a8;letter-spacing:3px;}
      .lbl{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;fill:#e9ebef;font-size:18px;letter-spacing:1.5px;}
    </style>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect x="0" y="0" width="${W}" height="8" fill="#BD3039"/>
    <rect x="0" y="${H - 8}" width="${W}" height="8" fill="#BD3039"/>
    <text x="${W / 2}" y="150" text-anchor="middle" class="kick" font-size="24">COLORWAY · MLB UNIFORM GUIDE</text>
    <text x="${W / 2}" y="345" text-anchor="middle" class="title" font-size="150">RED SOX</text>
    <text x="${W / 2}" y="425" text-anchor="middle" class="sub" font-size="58">UNIFORM SCHEDULE 2026</text>
    <text x="${W / 2}" y="488" text-anchor="middle" class="tag" font-size="26">EVERY JERSEY &amp; WHEN THEY WEAR IT</text>
    ${swatchRects}
  </svg>`;

  const logo = await sharp(LOGO).resize(210, null, { fit: "inside" }).png().toBuffer();
  const lM = await sharp(logo).metadata();

  const composed = await sharp(Buffer.from(svg))
    .composite([{ input: logo, left: W - lM.width - 56, top: H - lM.height - 30 }])
    .jpeg({ quality: 88 })
    .toBuffer();

  await writeFile(OUT, composed);
  console.log(`Wrote ${OUT} (${W}x${H})`);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
