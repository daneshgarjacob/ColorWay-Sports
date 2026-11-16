// Cover for the College Football Rivalry Week uniform hub (Nov 27-28, 2026).
// Logos only: no uniform is pictured that has not been announced.
// Run: node scripts/covers/college-football-rivalry-week-cover.mjs
// Output is 1500x1000 (Discover-ready width) and ~150 KB.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const OUT = 'public/images/posts/college-football-rivalry-week-uniforms-2026/cover.jpg';
const W = 1500, H = 1000, M = 70, BG = '#0b1020', ACC = '#2f5bff', PAPER = '#f3efe7', PAD = 20;

async function textWidth(str, size, ls) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="200"><rect width="2400" height="200" fill="#ffffff"/><text x="20" y="130" font-family="Hanken Grotesk" font-weight="800" font-size="${size}" letter-spacing="${ls}" fill="#000000">${str}</text></svg>`;
  const { info } = await sharp(Buffer.from(svg)).png().trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
  return info.width;
}

const K1 = 'COLLEGE FOOTBALL 2026', K2 = 'NOV 27 - 28';
const w1 = Math.round((await textWidth(K1, 22, 4)) + PAD * 2);
const w2 = Math.round((await textWidth(K2, 22, 4)) + PAD * 2);

const RX = 620, GAP = 10;
const TW = Math.floor((W - RX - GAP) / 2), TH = Math.floor((H - GAP) / 2);
const GAMES = [
  { a: 'ncaa-auburn-tigers', h: 'ncaa-alabama-crimson-tide', l: 'THE IRON BOWL', ac: '#0C2340', hc: '#9E1B32' },
  { a: 'ncaa-michigan-wolverines', h: 'ncaa-ohio-state-buckeyes', l: 'THE GAME', ac: '#00274C', hc: '#BB0000' },
  { a: 'ncaa-mississippi-state-bulldogs', h: 'ncaa-ole-miss-rebels', l: 'THE EGG BOWL', ac: '#660000', hc: '#14213D' },
  { a: 'ncaa-texas-longhorns', h: 'ncaa-texas-am-aggies', l: 'TEXAS AT TEXAS A&amp;M', ac: '#BF5700', hc: '#500000' },
];
const pos = (i) => ({
  x: RX + (i % 2) * (TW + GAP),
  y: Math.floor(i / 2) * (TH + GAP),
  w: i % 2 ? W - (RX + TW + GAP) : TW,
  h: i >= 2 ? H - (TH + GAP) : TH,
});
const tiles = GAMES.map((g, i) => {
  const p = pos(i);
  return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${PAPER}"/>` +
    `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="16" fill="${g.ac}"/>` +
    `<rect x="${p.x}" y="${p.y + p.h - 16}" width="${p.w}" height="16" fill="${g.hc}"/>` +
    `<text x="${p.x + p.w / 2}" y="${p.y + 238}" text-anchor="middle" font-family="Hanken Grotesk" font-weight="800" font-size="28" fill="${BG}" fill-opacity="0.45">at</text>` +
    `<text x="${p.x + p.w / 2}" y="${p.y + p.h - 44}" text-anchor="middle" font-family="Hanken Grotesk" font-weight="800" font-size="20" letter-spacing="2" fill="${BG}" fill-opacity="0.85">${g.l}</text>`;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="g" cx="0.2" cy="0.3" r="0.75"><stop offset="0%" stop-color="#16224a"/><stop offset="100%" stop-color="${BG}"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>
<g transform="translate(${M} 62) skewX(-8)"><rect width="${w1}" height="46" fill="${ACC}"/><text x="${PAD}" y="32" font-family="Hanken Grotesk" font-weight="800" font-size="22" fill="#fff" letter-spacing="4">${K1}</text></g>
<g transform="translate(${M} 120) skewX(-8)"><rect width="${w2}" height="46" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="2"/><text x="${PAD}" y="32" font-family="Hanken Grotesk" font-weight="800" font-size="22" fill="#fff" letter-spacing="4">${K2}</text></g>
<g transform="translate(${M} 330) skewX(-6)"><text font-family="Anton" font-size="118" fill="#7f9bff">RIVALRY</text></g>
<g transform="translate(${M} 455) skewX(-6)"><text font-family="Anton" font-size="118" fill="#fff">WEEK</text></g>
<g transform="translate(${M} 580) skewX(-6)"><text font-family="Anton" font-size="118" fill="#fff">UNIFORMS</text></g>
<text x="${M}" y="660" font-family="Hanken Grotesk" font-weight="800" font-size="27" fill="#fff" fill-opacity="0.88">What every team wears in</text>
<text x="${M}" y="698" font-family="Hanken Grotesk" font-weight="800" font-size="27" fill="#fff" fill-opacity="0.88">19 rivalry games</text>
${tiles}</svg>`;

const comps = [];
async function logo(file, cx, cy, h, w) {
  const b = await sharp(file).resize({ height: h, width: w, fit: 'inside' }).toBuffer();
  const m = await sharp(b).metadata();
  comps.push({ input: b, left: Math.round(cx - m.width / 2), top: Math.round(cy - m.height / 2) });
}
for (let i = 0; i < GAMES.length; i++) {
  const p = pos(i), cx = p.x + p.w / 2;
  await logo(`assets/logos-hires/teams/${GAMES[i].a}.png`, cx, p.y + 130, 150, 220);
  await logo(`assets/logos-hires/teams/${GAMES[i].h}.png`, cx, p.y + 345, 150, 220);
}
const wm = await sharp('public/brand/colorway-sports-logo-white.png').resize({ height: 30 }).toBuffer();
comps.push({ input: wm, left: M, top: 920 });

mkdirSync(dirname(OUT), { recursive: true });
const info = await sharp(Buffer.from(svg)).composite(comps).jpeg({ quality: 84 }).toFile(OUT);
console.log(`${OUT} ${info.width}x${info.height} ${Math.round(info.size / 1024)}KB`);
