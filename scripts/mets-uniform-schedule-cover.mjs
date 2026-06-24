#!/usr/bin/env node
// 3:2 (1500x1000) cover for the Mets 2026 uniform-schedule post.
// Mets "NY" primary logo on a white roundel badge over a blue->orange gradient,
// title, subtitle, and a row of the five 2026 uniform colors. ColorWay logo bottom.

import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTDIR = resolve(__dirname, "../public/images/posts/mets-uniform-schedule-2026");
const TEAMLOGO = resolve(OUTDIR, "team-logo.png");
const CWLOGO = resolve(__dirname, "../public/brand/colorway-sports-logo-white.png");
const OUT = resolve(OUTDIR, "cover.jpg");

const W = 1500;
const H = 1000;

const SWATCHES = [
  { color: "#FFFFFF", label: "HOME PINSTRIPE", stroke: "rgba(255,255,255,0.35)" },
  { color: "#9A9C9E", label: "ROAD GRAY" },
  { color: "#002D72", label: "BLUE ALT" },
  { color: "#11151C", label: "BLACK ALT", stroke: "rgba(255,255,255,0.18)" },
  { color: "#6F6F78", label: "CITY CONNECT" },
];
const SW = 196, SG = 30, SH = 150, SY = 662;
const totalW = SWATCHES.length * SW + (SWATCHES.length - 1) * SG;
const startX = Math.round((W - totalW) / 2);
const centerX = (i) => startX + i * (SW + SG) + SW / 2;

async function build() {
  await mkdir(OUTDIR, { recursive: true });

  const swatchRects = SWATCHES.map((s, i) => {
    const x = startX + i * (SW + SG);
    const stroke = s.stroke ? `stroke="${s.stroke}" stroke-width="2"` : "";
    return `<rect x="${x}" y="${SY}" width="${SW}" height="${SH}" rx="12" fill="${s.color}" ${stroke}/>
      <text x="${centerX(i)}" y="${SY + SH + 34}" text-anchor="middle" class="lbl">${s.label}</text>`;
  }).join("\n");

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#002D72"/>
        <stop offset="55%" stop-color="#10141c"/>
        <stop offset="100%" stop-color="#5a2a00"/>
      </linearGradient>
    </defs>
    <style>
      .title{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;fill:#ffffff;letter-spacing:3px;}
      .sub{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:800;fill:#ff9d5c;letter-spacing:2px;}
      .tag{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:600;fill:#aab0b8;letter-spacing:3px;}
      .lbl{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;fill:#e9ebef;font-size:18px;letter-spacing:1.5px;}
    </style>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect x="0" y="0" width="${W}" height="8" fill="#FF5910"/>
    <rect x="0" y="${H - 8}" width="${W}" height="8" fill="#FF5910"/>
    <circle cx="${W / 2}" cy="196" r="160" fill="#ffffff"/>
    <text x="${W / 2}" y="466" text-anchor="middle" class="title" font-size="118">METS</text>
    <text x="${W / 2}" y="528" text-anchor="middle" class="sub" font-size="48">UNIFORM SCHEDULE 2026</text>
    <text x="${W / 2}" y="572" text-anchor="middle" class="tag" font-size="22">EVERY JERSEY &amp; WHEN THEY WEAR IT</text>
    ${swatchRects}
  </svg>`;

  const team = await sharp(TEAMLOGO).resize({ height: 232, fit: "inside" }).png().toBuffer();
  const tM = await sharp(team).metadata();
  const cw = await sharp(CWLOGO).resize(200, null, { fit: "inside" }).png().toBuffer();
  const cwM = await sharp(cw).metadata();

  const composed = await sharp(Buffer.from(svg))
    .composite([
      { input: team, left: Math.round(W / 2 - tM.width / 2), top: Math.round(196 - tM.height / 2) },
      { input: cw, left: W - cwM.width - 54, top: H - cwM.height - 30 },
    ])
    .jpeg({ quality: 88 })
    .toBuffer();

  await writeFile(OUT, composed);
  console.log(`Wrote ${OUT} (${W}x${H})`);
}

build().catch((e) => { console.error(e); process.exit(1); });
