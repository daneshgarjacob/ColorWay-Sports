// Cover for "How World Cup Kits Are Chosen" — 3:2 (matches the StoryCard crop),
// real ColorWay logo in a white badge, two real 2026 kits (light vs colour).
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = join(__dirname, "..", "public", "images", "posts");
const brand = join(__dirname, "..", "public", "brand", "colorway-sports-logo.png");
const out = join(pub, "world-cup-kit-rules", "cover.jpg");

const W = 1500, H = 1000;

// logo badge (white) top-left
const badge = { x: 56, y: 52, w: 430, h: 108, pad: 18 };
const logo = await sharp(brand).resize(badge.w - badge.pad * 2, badge.h - badge.pad * 2, { fit: "inside" }).toBuffer({ resolveWithObject: true });
const logoPos = { left: Math.round(badge.x + (badge.w - logo.info.width) / 2), top: Math.round(badge.y + (badge.h - logo.info.height) / 2) };

// two jersey tiles, centered
const tileW = 340, tileH = 430, gap = 46, pad = 26;
const totalW = tileW * 2 + gap;
const leftX = Math.round((W - totalW) / 2), rightX = leftX + tileW + gap, tileY = 232;
const white = await sharp(join(pub, "wc-england-home.jpg")).resize(tileW - pad * 2, tileH - pad * 2, { fit: "inside" }).toBuffer({ resolveWithObject: true });
const color = await sharp(join(pub, "wc-norway-home.jpg")).resize(tileW - pad * 2, tileH - pad * 2, { fit: "inside" }).toBuffer({ resolveWithObject: true });
const place = (x, info) => ({ left: Math.round(x + (tileW - info.info.width) / 2), top: Math.round(tileY + (tileH - info.info.height) / 2) });

const seamX = leftX + tileW + gap / 2;
const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0B1A2F"/><stop offset="0.55" stop-color="#0d1626"/><stop offset="1" stop-color="#11161D"/></linearGradient>
    <linearGradient id="seam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF5910" stop-opacity="0"/><stop offset="0.5" stop-color="#FF5910" stop-opacity="0.9"/><stop offset="1" stop-color="#FF5910" stop-opacity="0"/></linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="20" flood-color="#000" flood-opacity="0.45"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <g opacity="0.05" stroke="#E8EBF0" stroke-width="1"><line x1="0" y1="250" x2="${W}" y2="250"/><line x1="0" y1="720" x2="${W}" y2="720"/></g>

  <rect x="${badge.x}" y="${badge.y}" width="${badge.w}" height="${badge.h}" rx="16" fill="#ffffff"/>

  <g filter="url(#sh)">
    <rect x="${leftX}" y="${tileY}" width="${tileW}" height="${tileH}" rx="18" fill="#edf0f4"/>
    <rect x="${rightX}" y="${tileY}" width="${tileW}" height="${tileH}" rx="18" fill="#edf0f4"/>
  </g>
  <rect x="${seamX - 2}" y="${tileY + 20}" width="4" height="${tileH - 40}" fill="url(#seam)"/>
  <text x="${leftX + tileW / 2}" y="${tileY + tileH + 46}" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="700" letter-spacing="4" fill="#9aa6b6" text-anchor="middle">LIGHT KIT</text>
  <text x="${rightX + tileW / 2}" y="${tileY + tileH + 46}" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="700" letter-spacing="4" fill="#d98a86" text-anchor="middle">COLOUR KIT</text>

  <text x="${W / 2}" y="788" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="800" letter-spacing="6" fill="#FF5910" text-anchor="middle">THE KIT-CLASH RULES</text>
  <text x="${W / 2}" y="872" font-family="Arial, Helvetica, sans-serif" font-size="74" font-weight="800" fill="#ffffff" text-anchor="middle">Who Wears What at the World Cup</text>
  <text x="${W / 2}" y="924" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="500" fill="#9aa6b6" text-anchor="middle">How every 2026 match kit is decided — and who decides it</text>
</svg>`;

await sharp(Buffer.from(svg))
  .composite([{ input: logo.data, ...logoPos }, { input: white.data, ...place(leftX, white) }, { input: color.data, ...place(rightX, color) }])
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile(out);
console.log("wrote", out, `${W}x${H}`);
