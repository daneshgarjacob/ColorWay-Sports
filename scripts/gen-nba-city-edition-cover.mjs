// Cover for the NBA City Edition 2026-27 countdown.
//
// v4 (2026-09-15): Jake asked for more jerseys, the NBA logo, and a cover that sits in the same
// family as the MLB and NFL tracker covers (gen-mlb-tracker-cover.mjs / gen-nfl-tracker-cover.mjs):
// skewed Hanken kicker bars, skewed Anton headline, diagonal accent stripe, grain, league mark
// top-right, ColorWay wordmark bottom-left. The team-logo grid becomes a grid of the actual
// City Edition jerseys, in ranking order (Pacers first), front-only product shots cut out with
// scripts/make-kit-cutout.mjs (tolerance 12 keeps white/cream jerseys intact). Jerseys are never
// cropped (feedback_never_crop_jersey_product_shots); trim only removes empty pixels.
// Teams without a cutout are skipped rather than left as holes.
//
// Cutouts: ~/Desktop/colorway-archive/nba-city-edition-2026-27-cutouts/front/<slug>.png
// Usage:   node scripts/gen-nba-city-edition-cover.mjs [dark|light] [out.jpg]
import sharp from "sharp";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const VARIANT = process.argv[2] || "dark";
const OUT = process.argv[3] || "public/images/posts/nba-city-edition-jerseys-2026-27/cover.jpg";
const CUTS = join(homedir(), "Desktop", "colorway-archive", "nba-city-edition-2026-27-cutouts", "front");

// Jake's City Edition ranking, best to worst.
const RANK = [
  "pacers", "pistons", "nuggets", "spurs", "raptors", "thunder", "celtics", "wizards", "jazz", "clippers",
  "bulls", "grizzlies", "rockets", "heat", "magic", "knicks", "cavaliers", "nets", "suns", "timberwolves",
  "trail-blazers", "bucks", "sixers", "lakers", "kings", "warriors", "hornets", "pelicans", "hawks", "mavericks",
];
const slugs = RANK.filter((s) => existsSync(join(CUTS, `${s}.png`)));
if (slugs.length < 12) throw new Error(`only ${slugs.length} cutouts found in ${CUTS}`);

const W = 1500, H = 1000, M = 92, PAD = 24;
const RED = "#C8102E";      // NBA red
const BRAND = "#2f6bed";    // site brand blue
const dark = VARIANT === "dark";
const INK = dark ? "#ffffff" : "#14223f";
const ACCENT = dark ? "#ff4b63" : RED;
const OUTLINE = dark ? "#8fb2e8" : "#14223f";

async function textWidth(str, size, ls) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="200"><rect width="2400" height="200" fill="#ffffff"/>` +
    `<text x="20" y="130" font-family="Hanken Grotesk" font-weight="800" font-size="${size}" letter-spacing="${ls}" fill="#000000">${str}</text></svg>`;
  const { info } = await sharp(Buffer.from(svg)).png().trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
  return info.width;
}
const K1 = "NBA CITY EDITION 2026-27", K2 = "ALL 30, GRADED";
const w1 = Math.round((await textWidth(K1, 25, 4)) + PAD * 2);
const w2 = Math.round((await textWidth(K2, 25, 4)) + PAD * 2);

const ground = dark
  ? `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1d3f7a"/><stop offset="55%" stop-color="#112750"/><stop offset="100%" stop-color="#08152a"/></linearGradient>
     <radialGradient id="glow" cx="0.5" cy="0.3" r="0.75"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.13"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient>`
  : `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#e9ecf2"/></linearGradient>
     <radialGradient id="glow" cx="0.5" cy="0.3" r="0.75"><stop offset="0%" stop-color="#ffffff" stop-opacity="0"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    ${ground}
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.045 0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <polygon points="1325,1000 1825,0 1865,0 1865,140 1410,1000" fill="${dark ? "#000000" : "#9aa5b8"}" opacity="0.22"/>
  <polygon points="1280,1000 1780,0 1812,0 1315,1000" fill="${RED}" opacity="0.85"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" filter="url(#noise)"/>

  <g transform="translate(${M} 66) skewX(-8)">
    <rect x="0" y="0" width="${w1}" height="52" fill="${RED}"/>
    <text x="${PAD}" y="36" font-family="Hanken Grotesk" font-weight="800" font-size="25" fill="#ffffff" letter-spacing="4">${K1}</text>
  </g>
  <g transform="translate(${M + w1 + 16} 66) skewX(-8)">
    <rect x="0" y="0" width="${w2}" height="52" fill="none" stroke="${OUTLINE}" stroke-width="2"/>
    <text x="${PAD}" y="36" font-family="Hanken Grotesk" font-weight="800" font-size="25" fill="${OUTLINE}" letter-spacing="4">${K2}</text>
  </g>

  <g transform="translate(${M} 758) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="128" fill="${INK}">EVERY CITY EDITION</text>
  </g>
  <g transform="translate(${M} 896) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="128" fill="${INK}">RANKED <tspan fill="${ACCENT}">30 TO 1</tspan></text>
  </g>

  <line x1="${M}" y1="928" x2="1265" y2="928" stroke="${INK}" stroke-opacity="${dark ? 0.22 : 0.18}" stroke-width="2"/>
</svg>`;

// Jersey grid: 2 full rows x 12 in ranking order (best-ranked 24 that have an official front-only
// shot), each jersey trimmed and fitted in a cell, bottom-aligned so hems line up, with a soft contact
// shadow for depth. Two full rows read cleaner than a ragged third row and make every jersey bigger.
const COLS = 12, MAX = 24, CELL_W = 111, BOX_W = 104, BOX_H = 196, ROW_STEP = 214, TOP = 148;
const comps = [];
for (let i = 0; i < slugs.length && i < MAX; i++) {
  // trim on alpha only (ignore the 1px feather and faint shadow pixels) so wide-framed shots like
  // the Clippers studio photo are sized by the jersey, not by its soft halo
  const src = await sharp(join(CUTS, `${slugs[i]}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: sw, height: sh } = src.info;
  let x0 = sw, y0 = sh, x1 = 0, y1 = 0;
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    if (src.data[(y * sw + x) * 4 + 3] > 96) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  const shirt = await sharp(join(CUTS, `${slugs[i]}.png`))
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    // height leads so every hem-to-collar reads the same size; wide-framed shots may use the full cell
    .resize({ width: CELL_W - 2, height: BOX_H, fit: "inside" })
    .png()
    .toBuffer();
  const m = await sharp(shirt).metadata();
  const col = i % COLS, row = Math.floor(i / COLS);
  const cx = M + col * CELL_W + BOX_W / 2;
  const bottom = TOP + row * ROW_STEP + BOX_H;
  const left = Math.round(cx - m.width / 2), top = Math.round(bottom - m.height);
  const shadow = await sharp(shirt).ensureAlpha().linear([0, 0, 0, dark ? 0.6 : 0.28], [0, 0, 0, 0]).blur(6).toBuffer();
  comps.push({ input: shadow, left, top: top + 5 });
  comps.push({ input: shirt, left, top });
}

// NBA logo top-right, level with the kicker bars (same placement idea as the MLB/NFL marks);
const logo = await sharp("public/logos/leagues/nba.png").trim({ threshold: 1 }).resize({ height: 96, width: 150, fit: "inside" }).toBuffer();
const lm = await sharp(logo).metadata();
// right edge of the logo lines up with the right edge of the last jersey column
comps.push({ input: logo, left: Math.round(M + (COLS - 1) * CELL_W + BOX_W - lm.width), top: 42 });

// ColorWay wordmark bottom-left: white on dark, brand blue on light.
const wmWhite = await sharp("public/brand/colorway-sports-logo-white.png").resize({ height: 30 }).toBuffer();
let wm = wmWhite;
if (!dark) {
  const wmMeta = await sharp(wmWhite).metadata();
  wm = await sharp({ create: { width: wmMeta.width, height: wmMeta.height, channels: 4, background: BRAND } })
    .composite([{ input: wmWhite, blend: "dest-in" }]).png().toBuffer();
}
comps.push({ input: wm, left: M, top: 951 });

mkdirSync(dirname(OUT), { recursive: true });
const info = await sharp(Buffer.from(svg)).composite(comps).jpeg({ quality: 86, mozjpeg: true }).toFile(OUT);
console.log(`${OUT} ${VARIANT} ${info.width}x${info.height} ${Math.round(info.size / 1024)}KB  jerseys ${Math.min(slugs.length, 30)}  missing: ${RANK.filter((s) => !slugs.includes(s)).join(", ") || "none"}`);
