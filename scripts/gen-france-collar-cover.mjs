// Branded 3:2 cover for the France polo-collar explainer post.
// Same family as the other branded covers (dark gradient, eyebrow + big type,
// ColorWay mark bottom-right) but distinct from the tracker cover: French blue
// gradient with tricolore accent, and the actual France home shirt (white polo
// collar visible) in a white photo tile on the right.
// Usage: node scripts/gen-france-collar-cover.mjs
import sharp from "sharp";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");
const W = 1500, H = 1000;
const c1 = "#002395", c2 = "#0a1030", red = "#ED2939";

// diagonal bars echoing the kit's diagonal graphic
const bars = Array.from({ length: 7 }, (_, i) => {
  const x = 60 + i * 200;
  return `<rect x="${x}" y="-200" width="12" height="600" fill="#ffffff" opacity="0.08" transform="rotate(18 ${x} 0)"/>`;
}).join("\n  ");

const TILE = { x: 1050, y: 80, w: 370, h: 560, r: 24 };

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.45" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${bars}
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect x="100" y="90" width="14" height="46" fill="${c1}" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
  <rect x="114" y="90" width="14" height="46" fill="#ffffff"/>
  <rect x="128" y="90" width="14" height="46" fill="${red}"/>
  <text x="100" y="478" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" letter-spacing="7" fill="#ffffff" opacity="0.85">2026 KIT DETAILS · EXPLAINED</text>
  <rect x="100" y="502" width="120" height="8" fill="${red}"/>
  <text x="96" y="606" font-family="Arial, Helvetica, sans-serif" font-size="74" font-weight="900" letter-spacing="-2" fill="#ffffff">WHY FRANCE'S JERSEY</text>
  <text x="96" y="686" font-family="Arial, Helvetica, sans-serif" font-size="74" font-weight="900" letter-spacing="-2" fill="#ffffff">HAS A POLO COLLAR</text>
  <text x="100" y="760" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#ffffff" opacity="0.92">Only Two Kits at the 2026 World Cup Have One. Here's Why.</text>
  <rect x="${TILE.x}" y="${TILE.y}" width="${TILE.w}" height="${TILE.h}" rx="${TILE.r}" fill="#ffffff"/>
</svg>`;

const kitPath = resolve(root, "public/images/posts/wc-france-home.jpg");
const cwLogoPath = resolve(root, "public/brand/colorway-sports-logo-white.png");
const composites = [];

// France home shirt inside the white tile, cropped to keep the collar prominent
if (existsSync(kitPath)) {
  const inner = { w: TILE.w - 40, h: TILE.h - 40 };
  const kit = await sharp(kitPath)
    .resize({ width: inner.w, height: inner.h, fit: "cover", position: "top" })
    .png()
    .toBuffer();
  composites.push({ input: kit, top: TILE.y + 20, left: TILE.x + 20 });
}

// ColorWay mark bottom-right
if (existsSync(cwLogoPath)) {
  const logo = await sharp(cwLogoPath).resize({ height: 60 }).png().toBuffer();
  const m = await sharp(logo).metadata();
  composites.push({ input: logo, top: H - 60 - 44, left: W - (m.width || 200) - 60 });
}

const out = resolve(root, "public/images/posts/france-polo-collar-cover.jpg");
await sharp(Buffer.from(svg)).resize(W, H).composite(composites).jpeg({ quality: 86 }).toFile(out);
console.log("wrote", out);
