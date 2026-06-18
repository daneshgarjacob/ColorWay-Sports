// Cover for "Every World Cup Logo, Ranked" — a row of six real World Cup
// emblems in white tiles on the dark ColorWay palette (editorial use).
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, "..", "public", "images", "posts", "world-cup-logo-history");
const out = join(dir, "cover.jpg");

const picks = [
  { year: 1970, top: true },
  { year: 1994 },
  { year: 2010 },
  { year: 2018 },
  { year: 2022 },
  { year: 2026 },
];

const tile = 150, gap = 26, pad = 16;
const totalW = picks.length * tile + (picks.length - 1) * gap;
const startX = Math.round((1600 - totalW) / 2);
const tileY = 250;

// resize each emblem to fit inside the tile
const imgs = [];
for (let i = 0; i < picks.length; i++) {
  const buf = await sharp(join(dir, `emblem-${picks[i].year}.png`))
    .resize(tile - pad * 2, tile - pad * 2, { fit: "inside" })
    .toBuffer({ resolveWithObject: true });
  const tileX = startX + i * (tile + gap);
  imgs.push({
    input: buf.data,
    left: Math.round(tileX + (tile - buf.info.width) / 2),
    top: Math.round(tileY + (tile - buf.info.height) / 2),
  });
}

const tilesSvg = picks.map((p, i) => {
  const tileX = startX + i * (tile + gap);
  const gold = p.top;
  return `
    <rect x="${tileX}" y="${tileY}" width="${tile}" height="${tile}" rx="18" fill="#ffffff" stroke="${gold ? "#FFD23F" : "rgba(255,255,255,0.0)"}" stroke-width="${gold ? 6 : 0}"/>
    ${gold ? `<circle cx="${tileX + tile - 6}" cy="${tileY + 6}" r="19" fill="#FFD23F"/><text x="${tileX + tile - 6}" y="${tileY + 13}" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800" fill="#11161D" text-anchor="middle">1</text>` : ""}`;
}).join("");

const svg = `<svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B1A2F"/><stop offset="0.55" stop-color="#0d1626"/><stop offset="1" stop-color="#11161D"/>
    </linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#000" flood-opacity="0.4"/></filter>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)"/>
  <g opacity="0.05" stroke="#E8EBF0" stroke-width="1"><line x1="0" y1="225" x2="1600" y2="225"/><line x1="0" y1="640" x2="1600" y2="640"/></g>
  <text x="90" y="120" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="800" letter-spacing="3" fill="#E8EBF0">COLORWAY SPORTS</text>
  <g filter="url(#sh)">${tilesSvg}</g>
  <text x="90" y="700" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="800" letter-spacing="6" fill="#FF5910">RANKED · 1930 → 2026</text>
  <text x="86" y="800" font-family="Arial, Helvetica, sans-serif" font-size="100" font-weight="800" fill="#ffffff">Every World Cup Logo</text>
</svg>`;

await sharp(Buffer.from(svg)).composite(imgs).jpeg({ quality: 86, mozjpeg: true }).toFile(out);
console.log("wrote", out);
