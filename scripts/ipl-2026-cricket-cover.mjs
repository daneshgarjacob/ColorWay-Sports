#!/usr/bin/env node
// 3:2 cover for the IPL 2026 jersey ranking: title + a white panel with all 10 team logos.
import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(__dirname, "../public/images/posts/cricket-league-jerseys-ipl");
const CW = resolve(__dirname, "../public/brand/colorway-sports-logo-white.png");
const OUT = resolve(DIR, "ipl-2026-cover.jpg");

const W = 1500, H = 1000;
const logos = ["srh", "mi", "gt", "csk", "kkr", "dc", "rr", "rcb", "pbks", "lsg"];
const PANEL = { x: 70, y: 350, w: 1360, h: 560 };

async function build() {
  const bg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#122a7a"/><stop offset="55%" stop-color="#0a1230"/><stop offset="100%" stop-color="#26104f"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <rect x="0" y="0" width="${W}" height="8" fill="#FDB913"/>
    <rect x="0" y="${H - 8}" width="${W}" height="8" fill="#FDB913"/>
    <rect x="${PANEL.x}" y="${PANEL.y}" width="${PANEL.w}" height="${PANEL.h}" rx="22" ry="22" fill="#ffffff"/>
  </svg>`;

  const text = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .e{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:800;fill:#FDB913;letter-spacing:7px;}
      .t{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;fill:#ffffff;letter-spacing:-1px;}
      .s{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;fill:#cdd6ff;letter-spacing:3px;}
    </style>
    <text x="${W / 2}" y="135" text-anchor="middle" class="e" font-size="29">INDIAN PREMIER LEAGUE · 2026</text>
    <text x="${W / 2}" y="232" text-anchor="middle" class="t" font-size="94">JERSEYS, RANKED</text>
    <text x="${W / 2}" y="292" text-anchor="middle" class="s" font-size="23">ALL 11 KITS · WORST TO BEST</text>
  </svg>`;

  const cols = 5, rows = 2;
  const cellW = PANEL.w / cols, cellH = PANEL.h / rows;
  const comps = [];
  for (let i = 0; i < logos.length; i++) {
    const row = Math.floor(i / cols), col = i % cols;
    const buf = await sharp(resolve(DIR, `logo-${logos[i]}.png`))
      .resize(190, 180, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png().toBuffer();
    const m = await sharp(buf).metadata();
    const cx = PANEL.x + col * cellW + cellW / 2;
    const cy = PANEL.y + row * cellH + cellH / 2;
    comps.push({ input: buf, left: Math.round(cx - m.width / 2), top: Math.round(cy - m.height / 2) });
  }

  const cw = await sharp(CW).resize(200, null, { fit: "inside" }).png().toBuffer();
  const cwM = await sharp(cw).metadata();
  comps.push({ input: cw, left: Math.round((W - cwM.width) / 2), top: H - cwM.height - 18 });

  const out = await sharp(Buffer.from(bg))
    .composite([{ input: Buffer.from(text), top: 0, left: 0 }, ...comps])
    .jpeg({ quality: 88 }).toBuffer();
  await writeFile(OUT, out);
  console.log(`Wrote ${OUT} (${W}x${H})`);
}
build().catch((e) => { console.error(e); process.exit(1); });
