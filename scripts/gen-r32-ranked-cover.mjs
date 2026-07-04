// Branded 3:2 cover for the Round of 32 kit-matchups-ranked post.
// Gradient + bracket bars, FIFA World Cup 26 logo in a white badge (the mark is
// black-heavy and needs a light chip to read on the dark background), and two
// real R32 kits with transparent backgrounds (Norway white alt, Congo DR sky blue).
// Norway PNG lives in the archive stash, not the repo — regenerate on Jake's Mac only.
// Usage: node scripts/gen-r32-ranked-cover.mjs
import sharp from "sharp";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { homedir } from "node:os";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");

const W = 1500, H = 1000;
const c1 = "#00694b", c2 = "#0a1030", accent = "#9bc824";

const bars = Array.from({ length: 8 }, (_, i) => {
  const x = 90 + i * 175;
  return `<rect x="${x}" y="0" width="10" height="${150 + (i % 4) * 45}" fill="#ffffff" opacity="0.10"/>`;
}).join("\n  ");

// White badge chip for the tournament mark, top-left.
const BADGE = { x: 100, y: 72, w: 200, h: 284, r: 24 };

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
  <rect x="${BADGE.x}" y="${BADGE.y}" width="${BADGE.w}" height="${BADGE.h}" rx="${BADGE.r}" fill="#ffffff"/>
  <text x="100" y="568" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" letter-spacing="7" fill="${accent}">2026 KNOCKOUTS · ALL 16 GRADED</text>
  <rect x="100" y="592" width="120" height="8" fill="${accent}"/>
  <text x="96" y="700" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="900" letter-spacing="-2" fill="#ffffff">ROUND OF 32 KIT</text>
  <text x="96" y="790" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="900" letter-spacing="-2" fill="#ffffff">MATCHUPS, RANKED</text>
  <text x="100" y="850" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#ffffff" opacity="0.92">From Portugal-Croatia at 9.5 to the Round's Only 6.5</text>
</svg>`;

const wcLogoPath = resolve(root, "public/logos/world-cup-2026.png");
const cwLogoPath = resolve(root, "public/brand/colorway-sports-logo-white.png");
const norwayPath = resolve(homedir(), "Desktop/colorway-archive/wc-2026-jerseys/norway-white.png");
const congoPath = resolve(root, "public/images/posts/wc-congo-dr-home.png");

const composites = [];

// FIFA World Cup 26 mark centered in the white badge
if (existsSync(wcLogoPath)) {
  const wc = await sharp(wcLogoPath).resize({ height: BADGE.h - 48 }).png().toBuffer();
  const m = await sharp(wc).metadata();
  composites.push({ input: wc, top: BADGE.y + 24, left: BADGE.x + Math.round((BADGE.w - m.width) / 2) });
}

// Two transparent R32 kits fanned on the right: Congo DR behind, Norway in front
if (existsSync(congoPath)) {
  const congo = await sharp(congoPath).resize({ height: 380 }).png().toBuffer();
  composites.push({ input: congo, top: 175, left: 1120 });
}
if (existsSync(norwayPath)) {
  const norway = await sharp(norwayPath).resize({ height: 420 }).png().toBuffer();
  composites.push({ input: norway, top: 70, left: 930 });
}

// ColorWay mark bottom-right
if (existsSync(cwLogoPath)) {
  const logo = await sharp(cwLogoPath).resize({ height: 60 }).png().toBuffer();
  const m = await sharp(logo).metadata();
  composites.push({ input: logo, top: H - 60 - 44, left: W - (m.width || 200) - 60 });
}

const out = resolve(root, "public/images/posts/wc-r32-kit-matchups-ranked-cover.jpg");
await sharp(Buffer.from(svg)).resize(W, H).composite(composites).jpeg({ quality: 86 }).toFile(out);
console.log("wrote", out);
