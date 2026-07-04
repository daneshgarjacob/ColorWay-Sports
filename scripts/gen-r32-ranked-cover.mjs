// One-off branded 3:2 cover for the Round of 32 kit-matchups-ranked post.
// Same treatment as the roof covers: gradient, motif, eyebrow/title/sub, ColorWay mark.
// Usage: node scripts/gen-r32-ranked-cover.mjs
import sharp from "sharp";
import { mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");
const outDir = resolve(root, "public/images/posts");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const W = 1500, H = 1000;
// Portugal green vs Croatia blue (the #1 matchup) drives the palette.
const c1 = "#00694b", c2 = "#0a1030", accent = "#9bc824";

// Sixteen thin "bracket" bars fanning down the top, VS badge in the middle.
const bars = Array.from({ length: 8 }, (_, i) => {
  const x = 90 + i * 175;
  return `<rect x="${x}" y="0" width="10" height="${150 + (i % 4) * 45}" fill="#ffffff" opacity="0.12"/>`;
}).join("\n  ");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.45" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${bars}
  <!-- VS badge -->
  <circle cx="750" cy="215" r="92" fill="none" stroke="${accent}" stroke-width="7" opacity="0.9"/>
  <text x="750" y="245" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="82" font-weight="900" fill="#ffffff">VS</text>
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <text x="100" y="558" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" letter-spacing="7" fill="${accent}">2026 KNOCKOUTS · ALL 16 MATCHES GRADED</text>
  <rect x="100" y="582" width="120" height="8" fill="${accent}"/>
  <text x="96" y="700" font-family="Arial, Helvetica, sans-serif" font-size="94" font-weight="900" letter-spacing="-2" fill="#ffffff">ROUND OF 32 KIT</text>
  <text x="96" y="800" font-family="Arial, Helvetica, sans-serif" font-size="94" font-weight="900" letter-spacing="-2" fill="#ffffff">MATCHUPS, RANKED</text>
  <text x="100" y="878" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700" fill="#ffffff" opacity="0.92">From Portugal-Croatia at 9.5 to the Round's Only 6.5</text>
</svg>`;

const logoPath = resolve(root, "public/brand/colorway-sports-logo-white.png");
const base = sharp(Buffer.from(svg)).resize(W, H);
let img = base;
if (existsSync(logoPath)) {
  const logo = await sharp(logoPath).resize({ height: 60 }).png().toBuffer();
  const meta = await sharp(logo).metadata();
  img = base.composite([{ input: logo, top: H - 60 - 48, left: W - (meta.width || 200) - 60 }]);
}
const out = resolve(outDir, "wc-r32-kit-matchups-ranked-cover.jpg");
await img.jpeg({ quality: 86 }).toFile(out);
console.log("wrote", out);
