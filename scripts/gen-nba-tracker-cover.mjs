// Branded cover for the 2026-27 NBA daily uniform tracker, the basketball twin of
// gen-nhl-tracker-cover.mjs: all 30 club marks in a 3 x 10 grid over a dark
// hardwood-night field, kicker pills top-left, NBA logo top-right, the headline
// across the bottom.
//   node scripts/gen-nba-tracker-cover.mjs public/images/posts/nba-uniform-tracker-2026-27/cover-branded.jpg
import sharp from 'sharp';
import { readdirSync } from 'node:fs';
const W = 1500, H = 1000;
const logos = readdirSync('assets/logos-hires/teams').filter(f => f.startsWith('nba-')).sort();
if (logos.length !== 30) { console.error(`expected 30 NBA logos, found ${logos.length}`); process.exit(1); }
const M = 92;
const COLS = 10, STEP_X = 112, STEP_Y = 124, TOP = 186, R = 47;
const cx = (col) => M + col * STEP_X + 50;
const cy = (row) => TOP + row * STEP_Y + 44;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1b2540"/><stop offset="55%" stop-color="#0f1628"/><stop offset="100%" stop-color="#070a13"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.22" r="0.75">
      <stop offset="0%" stop-color="#ffb27a" stop-opacity="0.12"/><stop offset="100%" stop-color="#ffb27a" stop-opacity="0"/>
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
    <text x="24" y="36" font-family="Hanken Grotesk" font-weight="800" font-size="25" fill="#ffffff" letter-spacing="4">NBA UNIFORM TRACKER</text>
  </g>
  <g transform="translate(${M + 462} 50) skewX(-8)">
    <rect x="0" y="0" width="304" height="52" fill="none" stroke="#ffb27a" stroke-width="2"/>
    <text x="24" y="36" font-family="Hanken Grotesk" font-weight="800" font-size="25" fill="#ffb27a" letter-spacing="4">UPDATED DAILY</text>
  </g>

  <g transform="translate(${M} 744) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="132" fill="#ffffff">WHAT EVERY TEAM</text>
  </g>
  <g transform="translate(${M} 884) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="132" fill="#ffffff">WORE <tspan fill="#ffb27a">LAST NIGHT</tspan></text>
  </g>

${Array.from({ length: 30 }, (_, i) => `<circle cx="${cx(i % COLS)}" cy="${cy(Math.floor(i / COLS))}" r="${R}" fill="#ffffff" fill-opacity="0.94"/>`).join('')}
  <line x1="${M}" y1="928" x2="1265" y2="928" stroke="#ffffff" stroke-opacity="0.22" stroke-width="2"/>
</svg>`;

const comps = [];
for (let i = 0; i < 30; i++) {
  const buf = await sharp(`assets/logos-hires/teams/${logos[i]}`).resize({ height: 62, width: 70, fit: 'inside' }).toBuffer();
  const m = await sharp(buf).metadata();
  const x = cx(i % COLS), y = cy(Math.floor(i / COLS));
  comps.push({ input: buf, left: Math.round(x - m.width / 2), top: Math.round(y - m.height / 2) });
}
const shield = await sharp('assets/logos-hires/leagues/nba.png').resize({ height: 128, width: 150, fit: 'inside' }).toBuffer();
const sm = await sharp(shield).metadata();
comps.push({ input: shield, left: Math.round(1250 - sm.width / 2), top: 32 });
const wm = await sharp('public/brand/colorway-sports-logo-white.png').resize({ height: 30 }).toBuffer();
comps.push({ input: wm, left: 92, top: 951 });

const out = process.argv[2];
if (!out) { console.error('usage: gen-nba-tracker-cover.mjs <out.jpg>'); process.exit(1); }
const info = await sharp(Buffer.from(svg)).composite(comps).jpeg({ quality: 86 }).toFile(out);
console.log(`${out} ${info.width}x${info.height} ${Math.round(info.size / 1024)}KB`);
