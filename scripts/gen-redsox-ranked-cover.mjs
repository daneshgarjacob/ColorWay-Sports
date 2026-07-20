// Editorial cover for the Red Sox 2026 jersey rankings. Illustrated only —
// club mark from the ESPN CDN plus grade pills, no photography to license.
// Usage: node scripts/gen-redsox-ranked-cover.mjs
import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1500, H = 1000;

const GRADES = [
  ["RED ALT", "A+", "#BD3039"],
  ["HOME WHITE", "A", "#8a8f98"],
  ["ROAD GRAY", "A", "#8a8f98"],
  ["YELLOW CC", "C", "#C9A227"],
  ["FENWAY GREEN", "C-", "#0d5c3a"],
];

const PILL_H = 62, PILL_GAP = 14;
const pillsY = 596;
let pills = "";
GRADES.forEach(([label, grade, color], i) => {
  const y = pillsY + i * (PILL_H + PILL_GAP);
  // width tracks the label so long names never collide with the grade
  const PILL_W = Math.max(250, label.length * 13 + grade.length * 18 + 70);
  pills += `<rect x="96" y="${y}" width="${PILL_W}" height="${PILL_H}" rx="31" fill="${color}"/>
    <text x="${96 + 22}" y="${y + 40}" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="800" letter-spacing="1.5" fill="#ffffff">${label}</text>
    <text x="${96 + PILL_W - 22}" y="${y + 41}" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="900" fill="#ffffff">${grade}</text>`;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0C2340"/>
      <stop offset="0.6" stop-color="#111c33"/>
      <stop offset="1" stop-color="#BD3039"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <text x="96" y="300" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="800" letter-spacing="7" fill="rgba(255,255,255,0.6)">BOSTON RED SOX · 2026</text>
  <text x="96" y="410" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="900" fill="#ffffff" letter-spacing="-1">Every Jersey,</text>
  <text x="96" y="502" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="900" fill="#ffffff" letter-spacing="-1">Ranked</text>
  <rect x="96" y="546" width="150" height="5" fill="#BD3039"/>
  ${pills}
</svg>`;

const dl = async (u) => Buffer.from(await (await fetch(u)).arrayBuffer());
const bos = await sharp(await dl("https://a.espncdn.com/i/teamlogos/mlb/500/bos.png"))
  .resize({ height: 460 }).png().toBuffer();

const out = resolve(root, "public/images/posts/red-sox-jerseys-2026/cover.jpg");
await sharp(Buffer.from(svg))
  .composite([{ input: bos, top: 300, left: 940 }])
  .jpeg({ quality: 88 }).toFile(out);
console.log("wrote", out);
