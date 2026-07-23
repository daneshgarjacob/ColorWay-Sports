#!/usr/bin/env node
// Generate 1500x1000 (3:2) logo covers for all MLB uniform-schedule posts.
// For each team in uniform-cover-config.json: pull the primary logo from ESPN's
// CDN, drop it on a white roundel over a team-color gradient, add the title,
// subtitle, tagline, a row of uniform color swatches, and the ColorWay mark.
// Idempotent — re-run any time. Run from the repo root: node scripts/uniform-covers-all.mjs

import sharp from "sharp";
import { readFile, writeFile, mkdir, access } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG = resolve(__dirname, "uniform-cover-config.json");
const CWLOGO = resolve(__dirname, "../public/brand/colorway-sports-logo-white.png");
const POSTS = resolve(__dirname, "../public/images/posts");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const W = 1500, H = 1000;

const hexToRgb = (h) => { const n = parseInt(h.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lum = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
const toHex = (c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0");
const lighten = (hex, amt) => { const [r, g, b] = hexToRgb(hex); return `#${toHex(r + (255 - r) * amt)}${toHex(g + (255 - g) * amt)}${toHex(b + (255 - b) * amt)}`; };
const esc = (s) => s.replace(/&/g, "&amp;");
const exists = async (p) => { try { await access(p); return true; } catch { return false; } };

async function fetchLogo(abbr, dest) {
  const url = `https://a.espncdn.com/i/teamlogos/mlb/500/${abbr}.png`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf.length;
}

function buildSvg(team) {
  const [c0, c1] = team.gradient;
  let accent = lum(hexToRgb(c0)) >= lum(hexToRgb(c1)) ? c0 : c1;
  if (lum(hexToRgb(accent)) < 70) accent = lighten(accent, 0.55);
  const SW = 196, SG = 30, SH = 150, SY = 662;
  const n = team.swatches.length;
  const totalW = n * SW + (n - 1) * SG;
  const startX = Math.round((W - totalW) / 2);
  const swatches = team.swatches.map((s, i) => {
    const x = startX + i * (SW + SG);
    const cx = x + SW / 2;
    const stroke = lum(hexToRgb(s.hex)) > 180 ? `stroke="rgba(255,255,255,0.35)" stroke-width="2"` : "";
    return `<rect x="${x}" y="${SY}" width="${SW}" height="${SH}" rx="12" fill="${s.hex}" ${stroke}/>
      <text x="${cx}" y="${SY + SH + 34}" text-anchor="middle" class="lbl">${esc(s.label)}</text>`;
  }).join("\n");

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c0}"/>
        <stop offset="52%" stop-color="#11141a"/>
        <stop offset="100%" stop-color="${c1}"/>
      </linearGradient>
    </defs>
    <style>
      .title{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;fill:#ffffff;letter-spacing:3px;}
      .sub{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:800;fill:${accent};letter-spacing:2px;}
      .tag{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:600;fill:#aeb4bd;letter-spacing:3px;}
      .lbl{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;fill:#e9ebef;font-size:18px;letter-spacing:1.5px;}
    </style>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect x="0" y="0" width="${W}" height="8" fill="${accent}"/>
    <rect x="0" y="${H - 8}" width="${W}" height="8" fill="${accent}"/>
    <circle cx="${W / 2}" cy="196" r="160" fill="#ffffff"/>
    <text x="${W / 2}" y="466" text-anchor="middle" class="title" font-size="104">${esc(team.coverTitle)}</text>
    <text x="${W / 2}" y="528" text-anchor="middle" class="sub" font-size="48">UNIFORM SCHEDULE 2026</text>
    <text x="${W / 2}" y="572" text-anchor="middle" class="tag" font-size="22">EVERY JERSEY &amp; WHEN THEY WEAR IT</text>
    ${swatches}
  </svg>`;
}

async function build() {
  const config = JSON.parse(await readFile(CONFIG, "utf8"));
  const hasCw = await exists(CWLOGO);
  if (!hasCw) console.warn("WARN: ColorWay logo missing at", CWLOGO, "(covers will build without it)");

  let ok = 0, fail = 0;
  for (const team of config) {
    const dir = resolve(POSTS, team.slug);
    await mkdir(dir, { recursive: true });
    const logoPath = resolve(dir, "team-logo.png");

    try {
      const kb = (await fetchLogo(team.abbr, logoPath)) / 1024;
      console.log(`${team.slug}: logo ${kb.toFixed(0)}KB (${team.abbr})`);
    } catch (e) {
      if (await exists(logoPath)) console.log(`${team.slug}: fetch failed (${e.message}) — using existing logo`);
      else { console.log(`${team.slug}: NO LOGO (${e.message}) — SKIPPED`); fail++; continue; }
    }

    try {
      const svg = buildSvg(team);
      const logo = await sharp(logoPath).resize({ width: 250, height: 250, fit: "inside" }).png().toBuffer();
      const lM = await sharp(logo).metadata();
      const layers = [{ input: logo, left: Math.round(W / 2 - lM.width / 2), top: Math.round(196 - lM.height / 2) }];
      if (hasCw) {
        // House standard for the ColorWay mark on a 1500x1000 cover: 60px tall,
        // 60px from the right edge, 44px from the bottom. Matches the MLB
        // tracker and calendar covers -- these were rendering at 200x25, less
        // than half the size, which read as sloppy across the set.
        const cw = await sharp(CWLOGO).resize({ height: 60 }).png().toBuffer();
        const cwM = await sharp(cw).metadata();
        layers.push({ input: cw, left: W - (cwM.width || 485) - 60, top: H - 60 - 44 });
      }
      const composed = await sharp(Buffer.from(svg)).composite(layers).jpeg({ quality: 88 }).toBuffer();
      await writeFile(resolve(dir, "cover.jpg"), composed);
      console.log(`${team.slug}: ✓ cover.jpg`);
      ok++;
    } catch (e) {
      console.log(`${team.slug}: COVER FAILED ${e.message}`); fail++;
    }
  }
  console.log(`\nDone. ${ok} covers built, ${fail} failed.`);
}

build().catch((e) => { console.error(e); process.exit(1); });
