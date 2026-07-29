// Branded homepage cover for the MLB Uniform Schedule pillar.
// Matches the Calendars cover style Jake likes (30 club marks in a strip up top,
// brand navy, ColorWay mark), but differentiated with a day-of-week jersey strip
// so the two homepage tracker cards don't read identically.
// Usage: node scripts/gen-mlb-schedule-cover.mjs
import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1500, H = 1000;

const TILE_COLORS = [
  "#005A9C", "#BD3039", "#0C2340", "#EB6E1F", "#00A3E0", "#12284B",
  "#CE1141", "#FDB827",
];

// Day-of-week jersey strip, lower-right — the "schedule" motif: a jersey per day.
const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const CELL = 100, GAP = 14, weekY = 500;
const weekW = DAYS.length * CELL + (DAYS.length - 1) * GAP;
const weekX = W - weekW - 96;

let week = "";
for (let i = 0; i < DAYS.length; i++) {
  const x = weekX + i * (CELL + GAP);
  const col = TILE_COLORS[i % TILE_COLORS.length];
  week += `<text x="${x + CELL / 2}" y="${weekY - 18}" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="800" letter-spacing="2" fill="rgba(255,255,255,0.5)" text-anchor="middle">${DAYS[i]}</text>`;
  week += `<rect x="${x}" y="${weekY}" width="${CELL}" height="${CELL}" rx="16" fill="${col}"/>`;
  const cx = x + CELL / 2, ty = weekY + 26;
  week += `<path d="M${cx - 13} ${ty} l-15 7 -6 17 9 4 4 -8 v30 q0 6 6 6 h30 q6 0 6 -6 v-30 l4 8 9 -4 -6 -17 -15 -7 -7 6 -6 4 -6 -4 z" fill="#ffffff" opacity="0.92"/>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#37578f"/>
      <stop offset="0.55" stop-color="#284376"/>
      <stop offset="1" stop-color="#1d3157"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <text x="96" y="396" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="800" letter-spacing="7" fill="#2f6bed">ALL 30 TEAMS · 2026</text>
  <text x="96" y="506" font-family="Arial, Helvetica, sans-serif" font-size="82" font-weight="900" fill="#ffffff" letter-spacing="-1">Uniform</text>
  <text x="96" y="596" font-family="Arial, Helvetica, sans-serif" font-size="82" font-weight="900" fill="#ffffff" letter-spacing="-1">Schedule</text>
  <rect x="96" y="642" width="150" height="5" fill="#2f6bed"/>
  <text x="96" y="718" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="600" fill="rgba(255,255,255,0.68)">What each team wears and when.</text>
  <text x="96" y="796" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="700" letter-spacing="3" fill="rgba(255,255,255,0.42)">HOME · ROAD · CITY CONNECT · THROWBACKS</text>

  ${week}
</svg>`;

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

const out = resolve(root, "public/images/posts/mlb-uniform-schedule-2026-cover.jpg");
await sharp(Buffer.from(svg))
  .composite([...logoLayers, ...mlbLayer, ...cwLayer])
  .jpeg({ quality: 88 })
  .toFile(out);
console.log("wrote", out);
