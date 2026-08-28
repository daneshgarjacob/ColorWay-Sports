// Cover for the Premier League kit schedule hub, built to match the MLB
// tracker cover Jake likes (scripts/gen-mlb-tracker-cover.mjs): same skewed
// kicker chips, same badge grid, same Anton headline with one accent word,
// same diagonal slash and wordmark. What changes is the palette - Premier
// League purple ground, the league's pink for the slash and chip, its green
// for the accent word (the same #00FF87 the post's own gradient already uses).
//
// Usage: node scripts/gen-epl-schedule-cover.mjs <out.jpg>
import sharp from 'sharp';
import { readdirSync } from 'node:fs';
const W = 1500, H = 1000;
const logos = readdirSync('public/logos/teams').filter(f => f.startsWith('epl-')).sort();
if (logos.length !== 20) throw new Error(`expected 20 epl-*.png logos, found ${logos.length}`);
const M = 92; // shared left margin for kicker, badges, headline

const PINK = '#E90052', GREEN = '#00FF87';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3b1054"/><stop offset="55%" stop-color="#23073a"/><stop offset="100%" stop-color="#10021d"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.22" r="0.75">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.045 0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <polygon points="1325,1000 1825,0 1865,0 1865,140 1410,1000" fill="#000000" opacity="0.22"/>
  <polygon points="1280,1000 1780,0 1812,0 1315,1000" fill="${PINK}" opacity="0.85"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" filter="url(#noise)"/>

  <g transform="translate(${M} 66) skewX(-8)">
    <rect x="0" y="0" width="640" height="52" fill="${PINK}"/>
    <text x="24" y="36" font-family="Hanken Grotesk" font-weight="800" font-size="25" fill="#ffffff" letter-spacing="4">PREMIER LEAGUE KIT SCHEDULE</text>
  </g>
  <g transform="translate(${M + 656} 66) skewX(-8)">
    <rect x="0" y="0" width="514" height="52" fill="none" stroke="#c9a7e8" stroke-width="2"/>
    <text x="24" y="36" font-family="Hanken Grotesk" font-weight="800" font-size="25" fill="#c9a7e8" letter-spacing="4">UPDATED EVERY MATCHWEEK</text>
  </g>

  <g transform="translate(${M} 740) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="122" fill="#ffffff">WHAT EVERY CLUB</text>
  </g>
  <g transform="translate(${M} 880) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="122" fill="#ffffff">WEARS THIS <tspan fill="${GREEN}">MATCHWEEK</tspan></text>
  </g>

  <line x1="${M}" y1="928" x2="1265" y2="928" stroke="#ffffff" stroke-opacity="0.22" stroke-width="2"/>
</svg>`;

const comps = [];
// 2 rows x 10, left edge of every column aligned, first column flush at M.
// Two rows instead of the MLB three, so the badges run larger.
for (let i = 0; i < 20; i++) {
  const buf = await sharp(`public/logos/teams/${logos[i]}`).resize({ height: 138, width: 118, fit: 'inside' }).toBuffer();
  const m = await sharp(buf).metadata();
  const row = Math.floor(i / 10), col = i % 10;
  const cellX = M + col * 138 + Math.round((118 - m.width) / 2);
  const cy = 190 + row * 190 + 69;
  comps.push({ input: buf, left: cellX, top: Math.round(cy - m.height / 2) });
}
const wm = await sharp('public/brand/colorway-sports-logo-white.png').resize({ height: 30 }).toBuffer();
comps.push({ input: wm, left: 92, top: 951 });

const out = process.argv[2];
const info = await sharp(Buffer.from(svg)).composite(comps).jpeg({ quality: 86 }).toFile(out);
console.log(`${out} ${info.width}x${info.height} ${Math.round(info.size/1024)}KB`);
