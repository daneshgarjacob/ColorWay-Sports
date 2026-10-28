// Banners for "NBA retired numbers that shouldn't be in the rafters" (Jake's picks
// 10/28). NBA = word-only art, so every image is our own drawing of a hanging
// banner in the club's colours, not the team's actual banner artwork. Same truss +
// swallow-tail banner as scripts/gen-hornets-bogues-cover.mjs.
//   node scripts/gen-rafters-overrated.mjs
// Writes one 1500x1000 card per player plus cover.jpg (all six, neutral order).
import sharp from 'sharp';
import os from 'node:os';
import fs from 'node:fs';

const OUT = 'public/images/posts/nba-retired-numbers-that-should-not-be-retired';
const LOCKUP = `${os.homedir()}/Desktop/ColorWay Sports/BRAND - START HERE/Logos (all uses)/wordmark-lockup-white.png`;
const F = 'Hanken Grotesk, Helvetica Neue, Arial, sans-serif';
fs.mkdirSync(OUT, { recursive: true });

// city = banner header, main = number/name colour, accent = stripes/years, bg = card background
const PLAYERS = [
  { slug: 'ilgauskas', city: 'CLEVELAND', num: '11', name: 'ILGAUSKAS', years: '1997-2010', main: '#860038', accent: '#FDBB30', bg: '#41001b' },
  { slug: 'allen', city: 'MEMPHIS', num: '9', name: 'ALLEN', years: '2010-2017', main: '#12173F', accent: '#5D76A9', bg: '#0b0f2a' },
  { slug: 'collison', city: 'OKLAHOMA CITY', num: '4', name: 'COLLISON', years: '2004-2018', main: '#002D62', accent: '#EF3B24', bg: '#001a3a' },
  { slug: 'marion', city: 'PHOENIX', num: '31', name: 'MARION', years: '1999-2008', main: '#1D1160', accent: '#E56020', bg: '#120a3d' },
  { slug: 'iguodala', city: 'GOLDEN STATE', num: '9', name: 'IGUODALA', years: '2013-2023', main: '#1D428A', accent: '#FFC72C', bg: '#0f2552' },
  { slug: 'bogues', city: 'CHARLOTTE', num: '1', name: 'BOGUES', years: '1988-1998', main: '#1D1160', accent: '#00788C', bg: '#120a3d' },
];

function banner(p, cx, top, w, h, s = 1) {
  const x = cx - w / 2, notch = 46 * s, stripe = 14 * s;
  const body = `M${x},${top} H${x + w} V${top + h} L${cx},${top + h - notch} L${x},${top + h} Z`;
  // Fit text between the stripes: Hanken black runs ~0.62em per digit, ~0.74em per capital.
  const inner = w - 2 * (18 + 14 + 12) * s;
  const numSize = Math.min(300 * s, inner / (0.66 * p.num.length));
  const nameSize = Math.min(50 * s, inner / (0.78 * p.name.length));
  const citySize = (p.city.length > 10 ? 22 : 30) * s;
  return `
  <line x1="${x + w * 0.2}" y1="96" x2="${x + w * 0.2}" y2="${top}" stroke="#c9ced8" stroke-width="3"/>
  <line x1="${x + w * 0.8}" y1="96" x2="${x + w * 0.8}" y2="${top}" stroke="#c9ced8" stroke-width="3"/>
  <path d="${body}" fill="#000" opacity="0.28" transform="translate(${10 * s},${14 * s})"/>
  <path d="${body}" fill="#ffffff"/>
  <rect x="${x + 18 * s}" y="${top}" width="${stripe}" height="${h - notch - 6}" fill="${p.accent}"/>
  <rect x="${x + w - 18 * s - stripe}" y="${top}" width="${stripe}" height="${h - notch - 6}" fill="${p.accent}"/>
  <rect x="${x}" y="${top}" width="${w}" height="${12 * s}" fill="${p.main}"/>
  <text x="${cx}" y="${top + 74 * s}" text-anchor="middle" font-family="${F}" font-size="${citySize}" font-weight="800" fill="${p.main}" letter-spacing="${4 * s}">${p.city}</text>
  <text x="${cx}" y="${top + 300 * s}" text-anchor="middle" font-family="${F}" font-size="${numSize}" font-weight="900" fill="${p.main}" letter-spacing="${-8 * s}">${p.num}</text>
  <text x="${cx}" y="${top + 380 * s}" text-anchor="middle" font-family="${F}" font-size="${nameSize}" font-weight="900" fill="${p.main}" letter-spacing="${3 * s}">${p.name}</text>
  <text x="${cx}" y="${top + 430 * s}" text-anchor="middle" font-family="${F}" font-size="${28 * s}" font-weight="700" fill="${p.accent}" letter-spacing="${3 * s}">${p.years}</text>`;
}

function truss(x0, W) {
  let t = `<rect x="${x0}" y="70" width="${W - x0}" height="8" fill="#6b7088"/><rect x="${x0}" y="104" width="${W - x0}" height="8" fill="#6b7088"/>`;
  for (let x = x0; x < W; x += 44) t += `<line x1="${x}" y1="74" x2="${x + 44}" y2="108" stroke="#6b7088" stroke-width="4"/>`;
  return t;
}

const bgDefs = (bg) => `<defs>
    <radialGradient id="g" cx="0.6" cy="0.3" r="0.9"><stop offset="0" stop-color="${bg}" stop-opacity="0.55"/><stop offset="1" stop-color="#05070f"/></radialGradient>
    <radialGradient id="spot" cx="0.5" cy="0" r="0.9"><stop offset="0" stop-color="#ffffff" stop-opacity="0.2"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
  </defs>`;

const W = 1500, H = 1000;
const lockup = await sharp(LOCKUP).resize({ width: 280 }).png().toBuffer();

// One card per player: a single big banner, centred, under a spotlight.
for (const p of PLAYERS) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${bgDefs(p.bg)}
  <rect width="${W}" height="${H}" fill="${p.bg}"/><rect width="${W}" height="${H}" fill="url(#g)"/>
  <ellipse cx="750" cy="120" rx="460" ry="860" fill="url(#spot)"/>
  ${truss(0, W)}
  ${banner(p, 750, 150, 360, 640, 1.18)}
  <rect x="0" y="${H - 16}" width="${W}" height="16" fill="${p.accent}"/>
</svg>`;
  await sharp(Buffer.from(svg)).composite([{ input: lockup, left: W - 320, top: 900 }])
    .jpeg({ quality: 86, mozjpeg: true }).toFile(`${OUT}/${p.slug}.jpg`);
}

// Cover: all six banners in a row (neutral order), headline across the bottom.
const step = 232, startX = 170;
const covSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${bgDefs('#14284b')}
  <rect width="${W}" height="${H}" fill="#0A1733"/><rect width="${W}" height="${H}" fill="url(#g)"/>
  <ellipse cx="750" cy="80" rx="760" ry="560" fill="url(#spot)"/>
  ${truss(0, W)}
  ${PLAYERS.map((p, i) => banner(p, startX + i * step, 140, 200, 360, 0.6)).join('')}
  <text x="70" y="690" font-family="${F}" font-size="32" font-weight="800" fill="#9FB6D6" letter-spacing="6">NBA RETIRED NUMBERS</text>
  <text x="64" y="800" font-family="${F}" font-size="104" font-weight="900" fill="#ffffff" letter-spacing="-4">THESE SHOULDN'T BE</text>
  <text x="64" y="905" font-family="${F}" font-size="104" font-weight="900" fill="#2f6bed" letter-spacing="-4">IN THE RAFTERS.</text>
</svg>`;
await sharp(Buffer.from(covSvg)).composite([{ input: lockup, left: W - 320, top: 905 }])
  .jpeg({ quality: 86, mozjpeg: true }).toFile(`${OUT}/cover.jpg`);
console.log('wrote', OUT);
