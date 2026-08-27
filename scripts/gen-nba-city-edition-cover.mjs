// Branded cover for the NBA City Edition 2026-27 tracker.
// Illustrated only — jersey silhouettes in abstract colour pairs on brand navy.
// No team marks, no photography, nothing on it needs licensing.
// Usage: node scripts/gen-nba-city-edition-cover.mjs
import sharp from "sharp";
import { resolve, dirname, join } from "node:path";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1500, H = 1000;

// Thirty abstract colour pairs, loosely the palettes City Edition has run over
// its first nine years. Used as blocks of colour only.
const PAIRS = [
  ["#552583", "#FDB927"], ["#007A33", "#BA9653"], ["#1D1160", "#00B2A9"],
  ["#E31837", "#F8A3B8"], ["#C8102E", "#06ADEF"], ["#0E2240", "#FEC524"],
  ["#5D76A9", "#12173F"], ["#00538C", "#B8C4CA"], ["#0C2340", "#FDBB30"],
  ["#CE1141", "#000000"], ["#00471B", "#EEE1C6"], ["#5A2D81", "#F9A01B"],
  ["#98002E", "#F9A01B"], ["#006BB6", "#ED174C"], ["#002B5C", "#00471B"],
  ["#1D428A", "#FFC72C"], ["#000000", "#C4CED4"], ["#63727A", "#0B0B0B"],
  ["#C4CED4", "#7399C6"], ["#00788C", "#4B90CD"], ["#E03A3E", "#26282A"],
  ["#008348", "#FDB927"], ["#BEC0C2", "#002D62"], ["#002D62", "#FDBB30"],
  ["#0077C0", "#EF3B24"], ["#B4975A", "#111111"], ["#6F263D", "#236192"],
  ["#61259E", "#FFC72C"], ["#012B5C", "#C1D32F"], ["#CE1141", "#FFC72C"],
];

// 6 x 5 grid across the lower right.
const COLS = 6, ROWS = 5, CELL = 118, GAP = 12;
const gridW = COLS * CELL + (COLS - 1) * GAP;
const gridX = W - gridW - 84;
const gridY = 330;

let cells = "";
for (let i = 0; i < PAIRS.length; i++) {
  const r = Math.floor(i / COLS), c = i % COLS;
  const x = gridX + c * (CELL + GAP);
  const y = gridY + r * (CELL + GAP);
  const [base, accent] = PAIRS[i];
  cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="16" fill="${base}"/>`;
  // Basketball tank, not a tee: rounded body, scooped neck, two armholes punched
  // back out in the tile colour so the straps read at thumbnail size.
  const cx = x + CELL / 2, ty = y + 30;
  cells += `<rect x="${cx - 27}" y="${ty}" width="54" height="62" rx="8" fill="${accent}" opacity="0.95"/>`;
  cells += `<ellipse cx="${cx}" cy="${ty - 1}" rx="12" ry="9" fill="${base}"/>`;
  cells += `<ellipse cx="${cx - 27}" cy="${ty + 6}" rx="9" ry="17" fill="${base}"/>`;
  cells += `<ellipse cx="${cx + 27}" cy="${ty + 6}" rx="9" ry="17" fill="${base}"/>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2d2540"/>
      <stop offset="0.5" stop-color="#1d2340"/>
      <stop offset="1" stop-color="#12172b"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <text x="84" y="200" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="800" letter-spacing="7" fill="#2f6bed">ALL 30 TEAMS &#183; YEAR TEN</text>
  <text x="84" y="316" font-family="Arial, Helvetica, sans-serif" font-size="94" font-weight="900" fill="#ffffff" letter-spacing="-2">City</text>
  <text x="84" y="410" font-family="Arial, Helvetica, sans-serif" font-size="94" font-weight="900" fill="#ffffff" letter-spacing="-2">Edition</text>
  <text x="84" y="504" font-family="Arial, Helvetica, sans-serif" font-size="94" font-weight="900" fill="#ffffff" letter-spacing="-2">2026-27</text>
  <rect x="84" y="552" width="160" height="6" fill="#2f6bed"/>
  <text x="84" y="632" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="600" fill="rgba(255,255,255,0.7)">Every jersey, tracked and graded.</text>
  <text x="84" y="806" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="700" letter-spacing="4" fill="rgba(255,255,255,0.45)">REVEALED</text>
  <text x="84" y="884" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="900" fill="#ffffff" letter-spacing="1">09.15.26</text>

  ${cells}
</svg>`;

const outDir = join(root, "public", "images", "posts", "nba-city-edition-jerseys-2026-27");
mkdirSync(outDir, { recursive: true });
const out = join(outDir, "cover.jpg");
await sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toFile(out);
console.log(`wrote ${out}`);
