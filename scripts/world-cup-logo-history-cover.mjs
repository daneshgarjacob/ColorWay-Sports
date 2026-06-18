// Cover for "Every World Cup Logo, Ranked" — 3:2 (matches StoryCard crop),
// real ColorWay logo badge, a row of larger real emblems (editorial use).
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, "..", "public", "images", "posts", "world-cup-logo-history");
const brand = join(__dirname, "..", "public", "brand", "colorway-sports-logo.png");
const out = join(dir, "cover.jpg");

const W = 1500, H = 1000;
const picks = [{ year: 1970, top: true }, { year: 2010 }, { year: 2018 }, { year: 2022 }, { year: 2026 }];

// logo badge
const badge = { x: 56, y: 52, w: 430, h: 108, pad: 18 };
const logo = await sharp(brand).resize(badge.w - badge.pad * 2, badge.h - badge.pad * 2, { fit: "inside" }).toBuffer({ resolveWithObject: true });
const logoPos = { left: Math.round(badge.x + (badge.w - logo.info.width) / 2), top: Math.round(badge.y + (badge.h - logo.info.height) / 2) };

// emblem row (bigger tiles)
const tile = 232, gap = 33, pad = 20;
const totalW = picks.length * tile + (picks.length - 1) * gap;
const startX = Math.round((W - totalW) / 2), tileY = 250;
const imgs = [{ input: logo.data, ...logoPos }];
for (let i = 0; i < picks.length; i++) {
  const buf = await sharp(join(dir, `emblem-${picks[i].year}.png`)).resize(tile - pad * 2, tile - pad * 2, { fit: "inside" }).toBuffer({ resolveWithObject: true });
  const tx = startX + i * (tile + gap);
  imgs.push({ input: buf.data, left: Math.round(tx + (tile - buf.info.width) / 2), top: Math.round(tileY + (tile - buf.info.height) / 2) });
}
const tilesSvg = picks.map((p, i) => {
  const tx = startX + i * (tile + gap), gold = p.top;
  return `<rect x="${tx}" y="${tileY}" width="${tile}" height="${tile}" rx="22" fill="#ffffff" stroke="${gold ? "#FFD23F" : "none"}" stroke-width="${gold ? 7 : 0}"/>` +
    (gold ? `<circle cx="${tx + tile - 8}" cy="${tileY + 8}" r="22" fill="#FFD23F"/><text x="${tx + tile - 8}" y="${tileY + 16}" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="800" fill="#11161D" text-anchor="middle">1</text>` : "");
}).join("");

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0B1A2F"/><stop offset="0.55" stop-color="#0d1626"/><stop offset="1" stop-color="#11161D"/></linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#000" flood-opacity="0.4"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <g opacity="0.05" stroke="#E8EBF0" stroke-width="1"><line x1="0" y1="250" x2="${W}" y2="250"/><line x1="0" y1="720" x2="${W}" y2="720"/></g>
  <rect x="${badge.x}" y="${badge.y}" width="${badge.w}" height="${badge.h}" rx="16" fill="#ffffff"/>
  <g filter="url(#sh)">${tilesSvg}</g>
  <text x="${W / 2}" y="660" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="800" letter-spacing="6" fill="#FF5910" text-anchor="middle">RANKED · 1930 → 2026</text>
  <text x="${W / 2}" y="770" font-family="Arial, Helvetica, sans-serif" font-size="92" font-weight="800" fill="#ffffff" text-anchor="middle">Every World Cup Logo</text>
  <text x="${W / 2}" y="832" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="500" fill="#9aa6b6" text-anchor="middle">All 23 official tournament emblems, ranked</text>
</svg>`;

await sharp(Buffer.from(svg)).composite(imgs).jpeg({ quality: 86, mozjpeg: true }).toFile(out);
console.log("wrote", out, `${W}x${H}`);
