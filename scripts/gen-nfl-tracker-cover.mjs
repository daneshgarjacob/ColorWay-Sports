// Branded cover for the NFL uniform tracker, same system as gen-mlb-tracker-cover.mjs.
// usage: node scripts/gen-nfl-tracker-cover.mjs public/images/posts/nfl-uniform-tracker-2026/cover.jpg
import sharp from 'sharp';
import { readdirSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
const W = 1500, H = 1000;
const logos = readdirSync('public/logos/teams').filter(f => f.startsWith('nfl-')).sort();
if (logos.length !== 32) throw new Error(`expected 32 NFL logos, found ${logos.length}`);
const M = 92;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#123f86"/><stop offset="55%" stop-color="#0b2451"/><stop offset="100%" stop-color="#07132b"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.22" r="0.75">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.045 0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <polygon points="1325,1000 1825,0 1865,0 1865,140 1410,1000" fill="#000000" opacity="0.22"/>
  <polygon points="1280,1000 1780,0 1812,0 1315,1000" fill="#D50A0A" opacity="0.85"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" filter="url(#noise)"/>

  <rect x="56" y="150" width="1318" height="510" rx="20" fill="#eceef3"/>
  <rect x="56" y="150" width="1318" height="510" rx="20" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="2"/>

  <g transform="translate(${M} 66) skewX(-8)">
    <rect x="0" y="0" width="436" height="52" fill="#D50A0A"/>
    <text x="24" y="36" font-family="Hanken Grotesk" font-weight="800" font-size="25" fill="#ffffff" letter-spacing="4">NFL UNIFORM TRACKER</text>
  </g>
  <g transform="translate(${M + 452} 66) skewX(-8)">
    <rect x="0" y="0" width="362" height="52" fill="none" stroke="#8fb2e8" stroke-width="2"/>
    <text x="24" y="36" font-family="Hanken Grotesk" font-weight="800" font-size="25" fill="#8fb2e8" letter-spacing="4">EVERY GAME, GRADED</text>
  </g>

  <g transform="translate(${M} 770) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="112" fill="#ffffff">WHAT EVERY TEAM</text>
  </g>
  <g transform="translate(${M} 892) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="112" fill="#ffffff">IS WEARING <tspan fill="#ff4b63">THIS WEEK</tspan></text>
  </g>

  <line x1="${M}" y1="928" x2="1265" y2="928" stroke="#ffffff" stroke-opacity="0.22" stroke-width="2"/>
</svg>`;

const comps = [];
// 4 rows x 8, left edge of every column aligned, first column flush at M
for (let i = 0; i < 32; i++) {
  const buf = await sharp(`public/logos/teams/${logos[i]}`).resize({ height: 104, width: 140, fit: 'inside' }).toBuffer();
  const m = await sharp(buf).metadata();
  const row = Math.floor(i / 8), col = i % 8;
  const cellX = M + col * 158;
  const cy = 213 + row * 128;
  comps.push({ input: buf, left: cellX + Math.round((140 - m.width) / 2), top: Math.round(cy - m.height / 2) });
}
const shield = await sharp('public/logos/leagues/nfl.png').resize({ height: 96, width: 140, fit: 'inside' }).toBuffer();
const sm = await sharp(shield).metadata();
comps.push({ input: shield, left: Math.round(M + 6 * 158 + 70 + 79 - sm.width / 2), top: 44 }); // centred between the Bengals and Browns columns
const wm = await sharp('public/brand/colorway-sports-logo-white.png').resize({ height: 30 }).toBuffer();
comps.push({ input: wm, left: 92, top: 951 });

const out = process.argv[2] || 'public/images/posts/nfl-uniform-tracker-2026/cover.jpg';
mkdirSync(dirname(out), { recursive: true });
const info = await sharp(Buffer.from(svg)).composite(comps).jpeg({ quality: 86 }).toFile(out);
console.log(`${out} ${info.width}x${info.height} ${Math.round(info.size/1024)}KB`);
