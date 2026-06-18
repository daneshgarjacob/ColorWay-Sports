// Cover for "How World Cup Kits Are Chosen" — 3:2, vibrant brand gradient with a
// bottom scrim for legibility, real ColorWay logo badge, two real 2026 kits.
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = join(__dirname, "..", "public", "images", "posts");
const brand = join(__dirname, "..", "public", "brand", "colorway-sports-logo.png");
const out = join(pub, "world-cup-kit-rules", "cover.jpg");

const W = 1500, H = 1000;
const badge = { x: 56, y: 52, w: 430, h: 108, pad: 18 };
const logo = await sharp(brand).resize(badge.w - badge.pad * 2, badge.h - badge.pad * 2, { fit: "inside" }).toBuffer({ resolveWithObject: true });
const logoPos = { left: Math.round(badge.x + (badge.w - logo.info.width) / 2), top: Math.round(badge.y + (badge.h - logo.info.height) / 2) };

const tileW = 340, tileH = 430, gap = 46, pad = 26;
const totalW = tileW * 2 + gap;
const leftX = Math.round((W - totalW) / 2), rightX = leftX + tileW + gap, tileY = 222;
const white = await sharp(join(pub, "wc-england-home.jpg")).resize(tileW - pad * 2, tileH - pad * 2, { fit: "inside" }).toBuffer({ resolveWithObject: true });
const color = await sharp(join(pub, "wc-norway-home.jpg")).resize(tileW - pad * 2, tileH - pad * 2, { fit: "inside" }).toBuffer({ resolveWithObject: true });
const place = (x, info) => ({ left: Math.round(x + (tileW - info.info.width) / 2), top: Math.round(tileY + (tileH - info.info.height) / 2) });
const seamX = leftX + tileW + gap / 2;

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a2550"/><stop offset="0.45" stop-color="#1769c0"/><stop offset="1" stop-color="#FF7a1f"/></linearGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#081428" stop-opacity="0"/><stop offset="1" stop-color="#081428" stop-opacity="0.94"/></linearGradient>
    <linearGradient id="seam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0.85"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="22" flood-color="#000" flood-opacity="0.5"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="0" y="640" width="${W}" height="360" fill="url(#scrim)"/>

  <rect x="${badge.x}" y="${badge.y}" width="${badge.w}" height="${badge.h}" rx="16" fill="#ffffff"/>

  <g filter="url(#sh)">
    <rect x="${leftX}" y="${tileY}" width="${tileW}" height="${tileH}" rx="18" fill="#edf0f4"/>
    <rect x="${rightX}" y="${tileY}" width="${tileW}" height="${tileH}" rx="18" fill="#edf0f4"/>
  </g>
  <rect x="${seamX - 2}" y="${tileY + 20}" width="4" height="${tileH - 40}" fill="url(#seam)"/>
  <text x="${leftX + tileW / 2}" y="${tileY + tileH + 50}" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="700" letter-spacing="4" fill="#dfe5ee" text-anchor="middle">LIGHT KIT</text>
  <text x="${rightX + tileW / 2}" y="${tileY + tileH + 50}" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="700" letter-spacing="4" fill="#ffc9b0" text-anchor="middle">COLOUR KIT</text>

  <text x="${W / 2}" y="792" font-family="Arial, Helvetica, sans-serif" font-size="33" font-weight="800" letter-spacing="6" fill="#FF7a1f" text-anchor="middle">THE KIT-CLASH RULES</text>
  <text x="${W / 2}" y="876" font-family="Arial, Helvetica, sans-serif" font-size="76" font-weight="800" fill="#ffffff" text-anchor="middle">Who Wears What at the World Cup</text>
  <text x="${W / 2}" y="938" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="600" fill="#e6ebf2" text-anchor="middle">How every 2026 match kit is decided — and who decides it</text>
</svg>`;

await sharp(Buffer.from(svg))
  .composite([{ input: logo.data, ...logoPos }, { input: white.data, ...place(leftX, white) }, { input: color.data, ...place(rightX, color) }])
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile(out);
console.log("wrote", out, `${W}x${H}`);
