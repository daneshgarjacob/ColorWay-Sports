import sharp from 'sharp';
import { readdirSync } from 'node:fs';
const W = 1500, H = 1000;
const logos = readdirSync('public/logos/teams').filter(f => f.startsWith('mlb-')).sort();
const M = 92; // shared left margin for kicker, logos, headline

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0d2a52"/><stop offset="55%" stop-color="#0a1c38"/><stop offset="100%" stop-color="#050d1c"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.22" r="0.75">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.045 0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <polygon points="1120,1000 1620,0 1660,0 1660,140 1205,1000" fill="#000000" opacity="0.22"/>
  <polygon points="1075,1000 1575,0 1607,0 1110,1000" fill="#D50032" opacity="0.85"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" filter="url(#noise)"/>

  <text x="${M}" y="104" font-family="Hanken Grotesk" font-weight="700" font-size="27" fill="#8fb2e8" letter-spacing="5">MLB UNIFORM TRACKER &#183; UPDATED DAILY</text>

  <g transform="translate(${M} 724) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="150" fill="#ffffff">WHAT EVERY TEAM</text>
  </g>
  <g transform="translate(${M} 884) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="150" fill="#ffffff">IS WEARING <tspan fill="#ff4b63">TONIGHT</tspan></text>
  </g>

  <line x1="${M}" y1="928" x2="1408" y2="928" stroke="#ffffff" stroke-opacity="0.22" stroke-width="2"/>
</svg>`;

const comps = [];
// 3 rows x 10, left edge of every column aligned, first column flush at M
for (let i = 0; i < 30; i++) {
  const buf = await sharp(`public/logos/teams/${logos[i]}`).resize({ height: 94, width: 116, fit: 'inside' }).toBuffer();
  const m = await sharp(buf).metadata();
  const row = Math.floor(i / 10), col = i % 10;
  const cellX = M + col * 138;
  const cy = 176 + row * 128 + 47;
  comps.push({ input: buf, left: cellX, top: Math.round(cy - m.height / 2) });
}
// real wordmark bottom-right next to the drawn flag roundel
const wm = await sharp('public/brand/colorway-sports-logo-white.png').resize({ height: 30 }).toBuffer();
const wmm = await sharp(wm).metadata();
comps.push({ input: wm, left: 1408 - wmm.width, top: 951 });

const out = process.argv[2];
const info = await sharp(Buffer.from(svg)).composite(comps).jpeg({ quality: 90 }).toFile(out);
console.log(`${out} ${info.width}x${info.height} ${Math.round(info.size/1024)}KB`);
