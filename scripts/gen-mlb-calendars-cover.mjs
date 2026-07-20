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
const gridY = 352;

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
      // Simplified jersey silhouette so the tiles read as uniforms, not swatches.
      cells += `<path d="M${x + 26} ${y + 30} l14 -8 h20 l14 8 v12 l-10 4 v30 h-42 v-30 l-10 -4 z" fill="#ffffff" opacity="0.9"/>`;
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

  <text x="96" y="352" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="800" letter-spacing="7" fill="#2f6bed">MLB · ALL 30 TEAMS</text>
  <text x="96" y="462" font-family="Arial, Helvetica, sans-serif" font-size="82" font-weight="900" fill="#ffffff" letter-spacing="-1">Uniform</text>
  <text x="96" y="552" font-family="Arial, Helvetica, sans-serif" font-size="82" font-weight="900" fill="#ffffff" letter-spacing="-1">Calendars</text>
  <rect x="96" y="598" width="150" height="5" fill="#2f6bed"/>
  <text x="96" y="674" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="600" fill="rgba(255,255,255,0.68)">Every jersey. Every team. Every day.</text>
  <text x="96" y="752" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="700" letter-spacing="3" fill="rgba(255,255,255,0.42)">HOME &amp; ROAD USAGE COUNTS</text>

  ${cells}
</svg>`;

const out = resolve(root, "public/images/posts/mlb-daily-tracker/calendars-cover.jpg");
await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(out);
console.log("wrote", out);
