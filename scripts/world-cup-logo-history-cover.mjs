// Cover for "Every World Cup Logo, Ranked" — 3:2, vibrant brand gradient with a
// bottom scrim for legibility, real ColorWay logo badge, last 5 emblems in order.
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, "..", "public", "images", "posts", "world-cup-logo-history");
const brand = join(__dirname, "..", "public", "brand", "colorway-sports-logo.png");
const out = join(dir, "cover.jpg");

const W = 1500, H = 1000;
const picks = [{ year: 2010 }, { year: 2014 }, { year: 2018 }, { year: 2022 }, { year: 2026 }];

const badge = { x: 56, y: 52, w: 430, h: 108, pad: 18 };
const logo = await sharp(brand).resize(badge.w - badge.pad * 2, badge.h - badge.pad * 2, { fit: "inside" }).toBuffer({ resolveWithObject: true });
const logoPos = { left: Math.round(badge.x + (badge.w - logo.info.width) / 2), top: Math.round(badge.y + (badge.h - logo.info.height) / 2) };

const tile = 232, gap = 33, pad = 20;
const totalW = picks.length * tile + (picks.length - 1) * gap;
const startX = Math.round((W - totalW) / 2), tileY = 312;
const imgs = [{ input: logo.data, ...logoPos }];
for (let i = 0; i < picks.length; i++) {
  const buf = await sharp(join(dir, `emblem-${picks[i].year}.png`)).resize(tile - pad * 2, tile - pad * 2, { fit: "inside" }).toBuffer({ resolveWithObject: true });
  const tx = startX + i * (tile + gap);
  imgs.push({ input: buf.data, left: Math.round(tx + (tile - buf.info.width) / 2), top: Math.round(tileY + (tile - buf.info.height) / 2) });
}
const tilesSvg = picks.map((p, i) => { const tx = startX + i * (tile + gap); return `<rect x="${tx}" y="${tileY}" width="${tile}" height="${tile}" rx="22" fill="#ffffff"/>`; }).join("");

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a2550"/><stop offset="0.45" stop-color="#1769c0"/><stop offset="1" stop-color="#FF7a1f"/></linearGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#081428" stop-opacity="0"/><stop offset="1" stop-color="#081428" stop-opacity="0.94"/></linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#000" flood-opacity="0.45"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="0" y="566" width="${W}" height="434" fill="url(#scrim)"/>
  <rect x="${badge.x}" y="${badge.y}" width="${badge.w}" height="${badge.h}" rx="16" fill="#ffffff"/>
  <g filter="url(#sh)">${tilesSvg}</g>
  <text x="${W / 2}" y="668" font-family="Arial, Helvetica, sans-serif" font-size="33" font-weight="800" letter-spacing="6" fill="#FF7a1f" text-anchor="middle">RANKED · 1930 → 2026</text>
  <text x="${W / 2}" y="778" font-family="Arial, Helvetica, sans-serif" font-size="92" font-weight="800" fill="#ffffff" text-anchor="middle">Every World Cup Logo</text>
  <text x="${W / 2}" y="840" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="600" fill="#e6ebf2" text-anchor="middle">All 23 official tournament emblems, ranked</text>
</svg>`;

await sharp(Buffer.from(svg)).composite(imgs).jpeg({ quality: 86, mozjpeg: true }).toFile(out);
console.log("wrote", out, `${W}x${H}`);
