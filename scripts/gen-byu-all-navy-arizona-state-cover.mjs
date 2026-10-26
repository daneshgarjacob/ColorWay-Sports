// Cover for content/drafts/byu-all-navy-uniforms-arizona-state-2026.md
// College rule: conference logo (Big 12) + team logo (BYU oval Y).
// Layout: full-bleed navy, giant oval Y left, the navy pants' white side
// stripes run top to bottom on the right edge, "ALL NAVY" stacked headline with
// a helmet / jersey / pants swatch row. Wordmark lockup from BRAND - START HERE.
// Logos: ESPN 500px marks (same marks as public/logos/teams + leagues, hi-res).
// Run: node scripts/gen-byu-all-navy-arizona-state-cover.mjs
import sharp from 'sharp';
import os from 'node:os';
import fs from 'node:fs';


const OUT_DIR = 'public/images/posts/byu-all-navy-uniforms-arizona-state-2026';
const LOCKUP = `${os.homedir()}/Desktop/ColorWay Sports/BRAND - START HERE/Logos (all uses)/wordmark-lockup-white.png`;
const F = 'Hanken Grotesk';
const W = 1500, H = 1000;
const NAVY = '#0b1f45', NAVY2 = '#14306a';

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.08"/></feComponentTransfer></filter>
<radialGradient id="bg" cx="28%" cy="48%" r="80%"><stop offset="0%" stop-color="${NAVY2}"/><stop offset="100%" stop-color="#050f26"/></radialGradient>
</defs>`;
svg += `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
// pants side stripes: navy-white-navy-white running full height on the right edge
const sx = 1380;
svg += `<rect x="${sx}" y="0" width="40" height="${H}" fill="#ffffff"/>`;
svg += `<rect x="${sx + 62}" y="0" width="40" height="${H}" fill="#ffffff"/>`;
svg += `<rect x="${sx - 18}" y="0" width="6" height="${H}" fill="#ffffff" opacity="0.35"/>`;
// halo behind the logo
svg += `<ellipse cx="380" cy="470" rx="330" ry="300" fill="#ffffff" opacity="0.06"/>`;
// headline block
const HX = 740;
svg += `<text x="${HX}" y="190" font-family="${F}" font-size="25" font-weight="800" fill="#9fb6e0" letter-spacing="4">GAME 08 · OCT 31 · VS ARIZONA STATE</text>`;
svg += `<text x="${HX - 8}" y="400" font-family="${F}" font-size="205" font-weight="900" fill="#ffffff" letter-spacing="-6">ALL</text>`;
svg += `<text x="${HX - 8}" y="600" font-family="${F}" font-size="205" font-weight="900" fill="#ffffff" letter-spacing="-6">NAVY</text>`;
// swatch row
const chips = ['HELMET', 'JERSEY', 'PANTS'];
chips.forEach((c, i) => {
  const x = HX + i * 175;
  svg += `<rect x="${x}" y="650" width="150" height="110" rx="14" fill="#0e2a5c" stroke="#ffffff" stroke-width="4"/>`;
  if (c === 'PANTS') svg += `<rect x="${x + 112}" y="654" width="9" height="102" fill="#ffffff"/><rect x="${x + 128}" y="654" width="9" height="102" fill="#ffffff"/>`;
  if (c === 'HELMET') svg += `<rect x="${x + 62}" y="654" width="8" height="102" fill="#ffffff"/><rect x="${x + 80}" y="654" width="8" height="102" fill="#ffffff"/>`;
  if (c === 'JERSEY') svg += `<text x="${x + 75}" y="738" text-anchor="middle" font-family="${F}" font-size="76" font-weight="900" fill="#ffffff">1</text>`;
  svg += `<text x="${x + 75}" y="800" text-anchor="middle" font-family="${F}" font-size="24" font-weight="800" fill="#ffffff" letter-spacing="3">${c}</text>`;
});
// big 12 chip bottom-left
svg += `<rect x="64" y="852" width="150" height="96" rx="14" fill="#ffffff"/>`;
svg += `<text x="234" y="912" font-family="${F}" font-size="28" font-weight="800" fill="#c9d6ef" letter-spacing="2">BYU UNIFORMS · BIG 12</text>`;
svg += `<rect width="${W}" height="${H}" filter="url(#grain)"/>`;
svg += `</svg>`;

const layers = [];
const y = await sharp("assets/logos-hires/teams/ncaa-byu-cougars-500.png").trim().resize({ width: 560 }).png().toBuffer();
const ym = await sharp(y).metadata();
layers.push({ input: y, left: Math.round(380 - ym.width / 2), top: Math.round(470 - ym.height / 2) });
const b12 = await sharp("assets/logos-hires/leagues/ncaa-conf-big-12-500.png").trim().resize({ width: 120, height: 76, fit: 'inside' }).png().toBuffer();
const bm = await sharp(b12).metadata();
layers.push({ input: b12, left: Math.round(139 - bm.width / 2), top: Math.round(900 - bm.height / 2) });
const lockup = await sharp(LOCKUP).resize({ width: 300 }).png().toBuffer();
const lkm = await sharp(lockup).metadata();
layers.push({ input: lockup, left: 1290 - lkm.width - 20, top: Math.round(900 - lkm.height / 2) });

fs.mkdirSync(OUT_DIR, { recursive: true });
await sharp(Buffer.from(svg)).composite(layers).jpeg({ quality: 86, mozjpeg: true }).toFile(`${OUT_DIR}/cover.jpg`);
console.log('wrote', `${OUT_DIR}/cover.jpg`);
