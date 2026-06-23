#!/usr/bin/env node
// Generalized 3:2 (1500x1000) cover generator for MLB uniform-schedule posts.
// Reads scripts/uniform-cover-config.json (array of teams) and writes one
// color-swatch cover per team to public/images/posts/<slug>/cover.jpg.
//
// Config entry shape:
// { "slug": "mets-uniform-schedule-2026", "coverTitle": "METS",
//   "gradient": ["#002D72", "#FF5910"],
//   "swatches": [{ "label": "HOME WHITE", "hex": "#FFFFFF" }, ...] }

import sharp from "sharp";
import { readFile, writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG = resolve(__dirname, "uniform-cover-config.json");
const LOGO = resolve(__dirname, "../public/brand/colorway-sports-logo-white.png");
const POSTS = resolve(__dirname, "../public/images/posts");

const W = 1500;
const H = 1000;
const SW = 196;
const SG = 30;
const SH = 150;
const SY = 600;

// luminance check so light swatches get a hairline border and don't vanish
function isLight(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7;
}

async function buildOne(team, logo, lM) {
  const sw = team.swatches.slice(0, 5);
  const totalW = sw.length * SW + (sw.length - 1) * SG;
  const startX = Math.round((W - totalW) / 2);
  const centerX = (i) => startX + i * (SW + SG) + SW / 2;

  const swatchRects = sw.map((s, i) => {
    const x = startX + i * (SW + SG);
    const stroke = isLight(s.hex) ? `stroke="rgba(255,255,255,0.4)" stroke-width="2"` : "";
    return `<rect x="${x}" y="${SY}" width="${SW}" height="${SH}" rx="12" fill="${s.hex}" ${stroke}/>
      <text x="${centerX(i)}" y="${SY + SH + 36}" text-anchor="middle" class="lbl">${s.label}</text>`;
  }).join("\n");

  const [g1, g2] = team.gradient;
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${g1}"/>
        <stop offset="55%" stop-color="#10141c"/>
        <stop offset="100%" stop-color="${g2}"/>
      </linearGradient>
    </defs>
    <style>
      .kick{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;fill:#c9ccd1;letter-spacing:7px;}
      .title{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;fill:#ffffff;letter-spacing:3px;}
      .sub{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:800;fill:#e8e9ec;letter-spacing:2px;}
      .tag{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:600;fill:#aab0b8;letter-spacing:3px;}
      .lbl{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;fill:#e9ebef;font-size:18px;letter-spacing:1.5px;}
    </style>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect x="0" y="0" width="${W}" height="8" fill="${g1}"/>
    <rect x="0" y="${H - 8}" width="${W}" height="8" fill="${g2}"/>
    <text x="${W / 2}" y="150" text-anchor="middle" class="kick" font-size="24">COLORWAY · MLB UNIFORM GUIDE</text>
    <text x="${W / 2}" y="345" text-anchor="middle" class="title" font-size="${team.coverTitle.length > 7 ? 120 : 150}">${team.coverTitle}</text>
    <text x="${W / 2}" y="425" text-anchor="middle" class="sub" font-size="56">UNIFORM SCHEDULE 2026</text>
    <text x="${W / 2}" y="488" text-anchor="middle" class="tag" font-size="26">EVERY JERSEY &amp; WHEN THEY WEAR IT</text>
    ${swatchRects}
  </svg>`;

  const outDir = resolve(POSTS, team.slug);
  await mkdir(outDir, { recursive: true });
  const out = resolve(outDir, "cover.jpg");
  const composed = await sharp(Buffer.from(svg))
    .composite([{ input: logo, left: W - lM.width - 56, top: H - lM.height - 30 }])
    .jpeg({ quality: 88 })
    .toBuffer();
  await writeFile(out, composed);
  console.log(`Wrote ${out}`);
}

async function build() {
  const teams = JSON.parse(await readFile(CONFIG, "utf8"));
  const logo = await sharp(LOGO).resize(210, null, { fit: "inside" }).png().toBuffer();
  const lM = await sharp(logo).metadata();
  for (const team of teams) await buildOne(team, logo, lM);
  console.log(`Done: ${teams.length} covers.`);
}

build().catch((e) => { console.error(e); process.exit(1); });
