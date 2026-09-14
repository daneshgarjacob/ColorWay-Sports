// Branded cover for the NFL uniform tracker. Light ground so all 32 team marks read (they are drawn for white).
// usage: node scripts/gen-nfl-tracker-cover.mjs public/images/posts/nfl-uniform-tracker-2026/cover.jpg
import sharp from 'sharp';
import { readdirSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const W = 1500, H = 1000, M = 92;
const INK = '#14223f';        // headline navy
const RED = '#D50A0A';        // NFL red
const BRAND = '#2f6bed';      // site brand blue (app/globals.css --color-orange)
const PAD = 24;               // inner padding on the kicker bars

const logos = readdirSync('public/logos/teams').filter(f => f.startsWith('nfl-')).sort();
if (logos.length !== 32) throw new Error(`expected 32 NFL logos, found ${logos.length}`);

// measure painted text so both kicker bars get even padding instead of a guessed width
async function textWidth(str, size, ls) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="200"><rect width="2400" height="200" fill="#ffffff"/>` +
    `<text x="20" y="130" font-family="Hanken Grotesk" font-weight="800" font-size="${size}" letter-spacing="${ls}" fill="#000000">${str}</text></svg>`;
  const { info } = await sharp(Buffer.from(svg)).png().trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
  return info.width;
}

const K1 = 'NFL UNIFORM TRACKER', K2 = 'EVERY GAME, GRADED';
const w1 = Math.round(await textWidth(K1, 25, 4) + PAD * 2);
const w2 = Math.round(await textWidth(K2, 25, 4) + PAD * 2);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#e9ecf2"/>
    </linearGradient>
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.045 0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <polygon points="1325,1000 1825,0 1865,0 1865,140 1410,1000" fill="#9aa5b8" opacity="0.22"/>
  <polygon points="1280,1000 1780,0 1812,0 1315,1000" fill="${RED}" opacity="0.85"/>
  <rect width="${W}" height="${H}" filter="url(#noise)"/>

  <g transform="translate(${M} 66) skewX(-8)">
    <rect x="0" y="0" width="${w1}" height="52" fill="${RED}"/>
    <text x="${PAD}" y="36" font-family="Hanken Grotesk" font-weight="800" font-size="25" fill="#ffffff" letter-spacing="4">${K1}</text>
  </g>
  <g transform="translate(${M + w1 + 16} 66) skewX(-8)">
    <rect x="0" y="0" width="${w2}" height="52" fill="none" stroke="${INK}" stroke-width="2"/>
    <text x="${PAD}" y="36" font-family="Hanken Grotesk" font-weight="800" font-size="25" fill="${INK}" letter-spacing="4">${K2}</text>
  </g>

  <g transform="translate(${M} 770) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="112" fill="${INK}">WHAT EVERY TEAM</text>
  </g>
  <g transform="translate(${M} 892) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="112" fill="${INK}">IS WEARING <tspan fill="${RED}">THIS WEEK</tspan></text>
  </g>

  <line x1="${M}" y1="928" x2="1265" y2="928" stroke="${INK}" stroke-opacity="0.18" stroke-width="2"/>
</svg>`;

const comps = [];
// 4 rows x 8, centred in a 140-wide cell
for (let i = 0; i < 32; i++) {
  const buf = await sharp(`public/logos/teams/${logos[i]}`).resize({ height: 104, width: 140, fit: 'inside' }).toBuffer();
  const m = await sharp(buf).metadata();
  const cx = M + (i % 8) * 158 + 70, cy = 213 + Math.floor(i / 8) * 128;
  comps.push({ input: buf, left: Math.round(cx - m.width / 2), top: Math.round(cy - m.height / 2) });
}

// NFL shield, centred between the Bengals and Browns columns
const shield = await sharp('public/logos/leagues/nfl.png').resize({ height: 96, width: 140, fit: 'inside' }).toBuffer();
const sm = await sharp(shield).metadata();
comps.push({ input: shield, left: Math.round(M + 6 * 158 + 70 + 79 - sm.width / 2), top: 44 });

// ColorWay wordmark recoloured to the site brand blue (solid fill masked by the white logo's alpha)
const wmWhite = await sharp('public/brand/colorway-sports-logo-white.png').resize({ height: 30 }).toBuffer();
const wmMeta = await sharp(wmWhite).metadata();
const wm = await sharp({ create: { width: wmMeta.width, height: wmMeta.height, channels: 4, background: BRAND } })
  .composite([{ input: wmWhite, blend: 'dest-in' }]).png().toBuffer();
comps.push({ input: wm, left: M, top: 951 });

const out = process.argv[2] || 'public/images/posts/nfl-uniform-tracker-2026/cover.jpg';
mkdirSync(dirname(out), { recursive: true });
const info = await sharp(Buffer.from(svg)).composite(comps).jpeg({ quality: 86 }).toFile(out);
console.log(`${out} ${info.width}x${info.height} ${Math.round(info.size / 1024)}KB  bars ${w1}/${w2}`);
