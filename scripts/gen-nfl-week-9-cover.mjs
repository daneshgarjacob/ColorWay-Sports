// Cover for the NFL Week 9 uniform guide: five alternates in one week, led by Purple Rising (Jaguars at Ravens)
// and the 1980s rivalry game (Giants Vintage White at Eagles Kelly Green).
// Same light-ground system as gen-nfl-tracker-cover.mjs; the right side carries the teams' own reveal images.
// usage: node scripts/gen-nfl-week-9-cover.mjs public/images/posts/nfl-week-9-uniforms-2026/cover.jpg
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const W = 1500, H = 1000, M = 80;
const INK = '#14223f';
const RED = '#D50A0A';
const BRAND = '#2f6bed';
const PAD = 22;

async function textWidth(str, size, ls) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="200"><rect width="2400" height="200" fill="#ffffff"/>` +
    `<text x="20" y="130" font-family="Hanken Grotesk" font-weight="800" font-size="${size}" letter-spacing="${ls}" fill="#000000">${str}</text></svg>`;
  const { info } = await sharp(Buffer.from(svg)).png().trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
  return info.width;
}

const K1 = 'NFL WEEK 9 UNIFORMS', K2 = 'NOV 5 - NOV 9';
const w1 = Math.round(await textWidth(K1, 24, 4) + PAD * 2);
const w2 = Math.round(await textWidth(K2, 24, 4) + PAD * 2);

// two photo panels on the right, each a parallelogram
const PX = 760, PW = 380, GAP = 14, SK = 70;
const panel = (x) => `${x + SK},0 ${x + PW + SK},0 ${x + PW},${H} ${x},${H}`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#e9ecf2"/>
    </linearGradient>
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.045 0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" filter="url(#noise)"/>

  <g transform="translate(${M} 66) skewX(-8)">
    <rect x="0" y="0" width="${w1}" height="50" fill="${RED}"/>
    <text x="${PAD}" y="35" font-family="Hanken Grotesk" font-weight="800" font-size="24" fill="#ffffff" letter-spacing="4">${K1}</text>
  </g>
  <g transform="translate(${M} 128) skewX(-8)">
    <rect x="0" y="0" width="${w2}" height="50" fill="none" stroke="${INK}" stroke-width="2"/>
    <text x="${PAD}" y="35" font-family="Hanken Grotesk" font-weight="800" font-size="24" fill="${INK}" letter-spacing="4">${K2}</text>
  </g>

  <text x="${M + 150}" y="335" font-family="Anton" font-size="44" fill="${INK}" opacity="0.55">VS</text>
  <text x="${M + 150}" y="505" font-family="Anton" font-size="44" fill="${INK}" opacity="0.55">VS</text>

  <g transform="translate(${M} 700) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="96" fill="${INK}">FIVE ALTERNATE</text>
  </g>
  <g transform="translate(${M} 808) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="96" fill="${RED}">UNIFORMS</text>
  </g>
  <text x="${M}" y="872" font-family="Hanken Grotesk" font-weight="800" font-size="26" fill="${INK}" letter-spacing="1">Every Week 9 jersey, helmet and pants call</text>
  <line x1="${M}" y1="905" x2="690" y2="905" stroke="${INK}" stroke-opacity="0.18" stroke-width="2"/>

  <polygon points="${panel(PX - 26)}" fill="${RED}" opacity="0.9"/>
</svg>`;

const comps = [];

// matchup logos: Jaguars vs Ravens, Giants vs Eagles
async function logo(file, cx, cy, h = 120) {
  const buf = await sharp(`assets/logos-hires/teams/${file}`).resize({ height: h, width: 150, fit: 'inside' }).toBuffer();
  const m = await sharp(buf).metadata();
  comps.push({ input: buf, left: Math.round(cx - m.width / 2), top: Math.round(cy - m.height / 2) });
}
await logo('nfl-jacksonville-jaguars.png', M + 70, 320);
await logo('nfl-baltimore-ravens.png', M + 300, 320);
await logo('nfl-new-york-giants.png', M + 70, 490);
await logo('nfl-philadelphia-eagles.png', M + 300, 490);

const shield = await sharp('assets/logos-hires/leagues/nfl.png').resize({ height: 100, width: 140, fit: 'inside' }).toBuffer();
const sm = await sharp(shield).metadata();
comps.push({ input: shield, left: 600 - Math.round(sm.width / 2), top: 70 });

// photo panels: crop to the player, then mask to the parallelogram
async function photo(src, x, crop) {
  const box = { width: PW + SK, height: H };
  const img = await sharp(src).extract(crop).resize(box.width, box.height, { fit: 'cover', position: 'top' }).toBuffer();
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${box.width}" height="${box.height}"><polygon points="${SK},0 ${PW + SK},0 ${PW},${H} 0,${H}" fill="#fff"/></svg>`);
  const out = await sharp(img).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  comps.push({ input: out, left: x, top: 0 });
}
// Ravens: Purple Rising reveal photo, crouching player full length
await photo('public/images/posts/ravens-uniforms-2026-reveal/purple-alternate.jpg', PX, { left: 440, top: 40, width: 560, height: 1028 });
// Giants: Vintage White schedule graphic, player only (right side, no graphic text)
await photo('public/images/posts/new-york-giants-uniform-schedule-2026/vintage-white-games.jpg', PX + PW + GAP, { left: 420, top: 0, width: 540, height: 1200 });

// labels on the panels
const label = (t, x) => `<g transform="translate(${x} 940) skewX(-8)"><rect x="0" y="0" width="${t.length * 17 + 36}" height="40" fill="${INK}"/><text x="18" y="28" font-family="Hanken Grotesk" font-weight="800" font-size="20" fill="#fff" letter-spacing="3">${t}</text></g>`;
comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${label('RAVENS', PX + 20)}${label('GIANTS', PX + PW + GAP + 20)}</svg>`), left: 0, top: 0 });

const wmWhite = await sharp('public/brand/colorway-sports-logo-white.png').resize({ height: 30 }).toBuffer();
const wmMeta = await sharp(wmWhite).metadata();
const wm = await sharp({ create: { width: wmMeta.width, height: wmMeta.height, channels: 4, background: BRAND } })
  .composite([{ input: wmWhite, blend: 'dest-in' }]).png().toBuffer();
comps.push({ input: wm, left: M, top: 935 });

const out = process.argv[2] || 'public/images/posts/nfl-week-9-uniforms-2026/cover.jpg';
mkdirSync(dirname(out), { recursive: true });
const info = await sharp(Buffer.from(svg)).composite(comps).jpeg({ quality: 84 }).toFile(out);
console.log(`${out} ${info.width}x${info.height} ${Math.round(info.size / 1024)}KB`);
