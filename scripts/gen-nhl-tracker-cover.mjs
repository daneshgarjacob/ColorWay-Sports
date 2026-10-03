// Branded cover for the 2026-27 NHL daily uniform tracker, the hockey twin of
// gen-mlb-tracker-cover.mjs: all 32 club marks in a 4 x 8 grid over an ice-dark
// field, kicker pills top-left, the headline across the bottom.
//   node scripts/gen-nhl-tracker-cover.mjs public/images/posts/nhl-daily-tracker/cover-branded.jpg
import sharp from 'sharp';
import { readdirSync } from 'node:fs';
const W = 1500, H = 1000;
const logos = readdirSync('public/logos/teams').filter(f => f.startsWith('nhl-')).sort();
const M = 92;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1d2733"/><stop offset="55%" stop-color="#111821"/><stop offset="100%" stop-color="#080b10"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.22" r="0.75">
      <stop offset="0%" stop-color="#bfe3ff" stop-opacity="0.14"/><stop offset="100%" stop-color="#bfe3ff" stop-opacity="0"/>
    </radialGradient>
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.045 0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <polygon points="1325,1000 1825,0 1865,0 1865,140 1410,1000" fill="#000000" opacity="0.25"/>
  <polygon points="1280,1000 1780,0 1812,0 1315,1000" fill="#2f6bed" opacity="0.9"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" filter="url(#noise)"/>

  <g transform="translate(${M} 50) skewX(-8)">
    <rect x="0" y="0" width="446" height="52" fill="#2f6bed"/>
    <text x="24" y="36" font-family="Hanken Grotesk" font-weight="800" font-size="25" fill="#ffffff" letter-spacing="4">NHL UNIFORM TRACKER</text>
  </g>
  <g transform="translate(${M + 462} 50) skewX(-8)">
    <rect x="0" y="0" width="304" height="52" fill="none" stroke="#9fd3ff" stroke-width="2"/>
    <text x="24" y="36" font-family="Hanken Grotesk" font-weight="800" font-size="25" fill="#9fd3ff" letter-spacing="4">UPDATED DAILY</text>
  </g>

  <g transform="translate(${M} 744) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="132" fill="#ffffff">WHAT EVERY TEAM</text>
  </g>
  <g transform="translate(${M} 884) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="132" fill="#ffffff">WORE <tspan fill="#9fd3ff">LAST NIGHT</tspan></text>
  </g>

${Array.from({ length: 32 }, (_, i) => `<circle cx="${M + (i % 8) * 140 + 54}" cy="${170 + Math.floor(i / 8) * 112 + 41}" r="50" fill="#ffffff" fill-opacity="0.94"/>`).join('')}
  <line x1="${M}" y1="928" x2="1265" y2="928" stroke="#ffffff" stroke-opacity="0.22" stroke-width="2"/>
</svg>`;

const comps = [];
// 4 rows x 8, left edge of every column aligned, first column flush at M
for (let i = 0; i < 32; i++) {
  const buf = await sharp(`public/logos/teams/${logos[i]}`).resize({ height: 66, width: 76, fit: 'inside' }).toBuffer();
  const m = await sharp(buf).metadata();
  const row = Math.floor(i / 8), col = i % 8;
  const cellX = M + col * 140;
  const cy = 170 + row * 112 + 41;
  comps.push({ input: buf, left: Math.round(cellX + 54 - m.width / 2), top: Math.round(cy - m.height / 2) });
}
const shield = await sharp('public/logos/leagues/nhl.png').resize({ height: 120, width: 150, fit: 'inside' }).toBuffer();
const sm = await sharp(shield).metadata();
comps.push({ input: shield, left: Math.round(1250 - sm.width / 2), top: 36 });
const wm = await sharp('public/brand/colorway-sports-logo-white.png').resize({ height: 30 }).toBuffer();
comps.push({ input: wm, left: 92, top: 951 });

const out = process.argv[2];
if (!out) { console.error('usage: gen-nhl-tracker-cover.mjs <out.jpg>'); process.exit(1); }
const info = await sharp(Buffer.from(svg)).composite(comps).jpeg({ quality: 86 }).toFile(out);
console.log(`${out} ${info.width}x${info.height} ${Math.round(info.size / 1024)}KB`);
