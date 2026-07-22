// Branded homepage cover for the MLB uniform-calendar hub (/mlb-tracker).
// Illustrated only — a stylised month grid in brand navy with team-colour tiles,
// no photography and no team marks, so nothing on it needs licensing.
// Usage: node scripts/gen-mlb-calendars-cover.mjs
import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1500, H = 1000;

// A few real club colours, used purely as abstract tiles in the grid.
const TILE_COLORS = [
  "#005A9C", "#BD3039", "#0C2340", "#EB6E1F", "#00A3E0", "#12284B",
  "#CE1141", "#FDB827", "#2F241D", "#C41E3A", "#134A8E", "#00385D",
];

// 7 x 4 calendar grid, right-hand side of the cover.
const COLS = 7, ROWS = 4, CELL = 96, GAP = 11;
const gridW = COLS * CELL + (COLS - 1) * GAP;
const gridX = W - gridW - 96;
const gridY = 396;

let cells = "";
let filled = 0;
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const x = gridX + c * (CELL + GAP);
    const y = gridY + r * (CELL + GAP);
    const i = r * COLS + c;
    // Deterministic scatter: roughly half the cells are "game days".
    const isGame = (i * 7 + r * 3) % 5 < 3 && i > 2;
    if (isGame) {
      const col = TILE_COLORS[filled % TILE_COLORS.length];
      filled++;
      cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="14" fill="${col}"/>`;
      // Jersey silhouette: centred in the cell, with real sleeves, a collar
      // notch and a rounded hem so it reads as a shirt rather than a clipped box.
      const cx = x + CELL / 2, ty = y + 24;
      cells += `<path d="M${cx - 13} ${ty} l-15 7 -6 17 9 4 4 -8 v30 q0 6 6 6 h30 q6 0 6 -6 v-30 l4 8 9 -4 -6 -17 -15 -7 -7 6 -6 4 -6 -4 z" fill="#ffffff" opacity="0.92"/>`;
    } else {
      cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="14" fill="#ffffff" opacity="0.07"/>`;
    }
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#14223f"/>
      <stop offset="0.55" stop-color="#0d1730"/>
      <stop offset="1" stop-color="#080f20"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <text x="96" y="396" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="800" letter-spacing="7" fill="#2f6bed">ALL 30 TEAMS · 2026</text>
  <text x="96" y="506" font-family="Arial, Helvetica, sans-serif" font-size="82" font-weight="900" fill="#ffffff" letter-spacing="-1">Uniform</text>
  <text x="96" y="596" font-family="Arial, Helvetica, sans-serif" font-size="82" font-weight="900" fill="#ffffff" letter-spacing="-1">Calendars</text>
  <rect x="96" y="642" width="150" height="5" fill="#2f6bed"/>
  <text x="96" y="718" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="600" fill="rgba(255,255,255,0.68)">Every jersey. Every team. Every day.</text>
  <text x="96" y="796" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="700" letter-spacing="3" fill="rgba(255,255,255,0.42)">HOME &amp; ROAD USAGE COUNTS</text>

  ${cells}
</svg>`;

// All 30 club marks in a strip across the top, so the cover says "every team"
// before you read a word. Fetched from the ESPN CDN, same source the site
// already uses for team logos elsewhere.
const ABBRS = [
  "ari", "atl", "bal", "bos", "chc", "chw", "cin", "cle", "col", "det",
  "hou", "kc", "laa", "lad", "mia", "mil", "min", "nym", "nyy", "ath",
  "phi", "pit", "sd", "sf", "sea", "stl", "tb", "tex", "tor", "wsh",
];

const dl = async (u) => {
  const r = await fetch(u);
  if (!r.ok) throw new Error(`${r.status} ${u}`);
  return Buffer.from(await r.arrayBuffer());
};

const LOGO = 40, LOGO_GAP = 8, STRIP_Y = 96;
const stripW = ABBRS.length * LOGO + (ABBRS.length - 1) * LOGO_GAP;
const stripX = Math.round((W - stripW) / 2);

const logoLayers = [];
for (let i = 0; i < ABBRS.length; i++) {
  try {
    const buf = await sharp(await dl(`https://a.espncdn.com/i/teamlogos/mlb/500/${ABBRS[i]}.png`))
      .resize({ height: LOGO, width: LOGO, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    logoLayers.push({ input: buf, top: STRIP_Y, left: stripX + i * (LOGO + LOGO_GAP) });
  } catch (e) {
    console.warn("  skipped logo", ABBRS[i], e.message);
  }
}
console.log(`composited ${logoLayers.length}/${ABBRS.length} team logos`);

// MLB mark anchoring the headline block.
let mlbLayer = [];
try {
  const mlb = await sharp(resolve(root, "public/logos/mlb.png"))
    .resize({ height: 62, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  mlbLayer = [{ input: mlb, top: 262, left: 96 }];
} catch (e) {
  console.warn("  skipped MLB mark:", e.message);
}

// ColorWay mark, bottom-right — every other branded cover carries it and this
// one was missing it.
let cwLayer = [];
try {
  const cw = await sharp(resolve(root, "public/brand/colorway-sports-logo-white.png"))
    .resize({ height: 60, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const m = await sharp(cw).metadata();
  cwLayer = [{ input: cw, top: H - 60 - 44, left: W - (m.width || 200) - 60 }];
} catch (e) {
  console.warn("  skipped ColorWay mark:", e.message);
}

const out = resolve(root, "public/images/posts/mlb-daily-tracker/calendars-cover.jpg");
await sharp(Buffer.from(svg))
  .composite([...logoLayers, ...mlbLayer, ...cwLayer])
  .jpeg({ quality: 88 })
  .toFile(out);
console.log("wrote", out);
