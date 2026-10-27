// Cover for the college football Week 9 (Halloween) uniform guide.
// Dark night ground, Halloween orange accent; right side carries the teams' own reveal images
// (Nebraska black alternate, Syracuse Otto helmet, BYU all navy, UCF Space Game), left side the
// headline plus team and conference logos (college cover rule: conference + team logo).
// Sources: Nebraska frame from @HuskerFootball "Darkness Returns" (x.com/HuskerFootball/status/2088611993561559341),
// UCF from @UCF_Football (x.com/UCF_Football/status/2105015803577860604), Syracuse and BYU from their own posts'
// covers already in public/images/posts. Originals live in the scratchpad, not the repo.
// usage: node scripts/gen-cfb-week-9-cover.mjs <nebraska.jpg> <ucf.jpg> [out]
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [NEB, UCF, OUT = 'public/images/posts/college-football-week-9-uniforms-2026/cover.jpg'] = process.argv.slice(2);
if (!NEB || !UCF) { console.error('usage: node scripts/gen-cfb-week-9-cover.mjs <nebraska.jpg> <ucf.jpg> [out]'); process.exit(1); }

const W = 1500, H = 1000, M = 70;
const BG = '#0d0f14';
const ORANGE = '#F28C28';
const PAPER = '#f3efe7';
const PAD = 20;

async function textWidth(str, size, ls) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="200"><rect width="2400" height="200" fill="#ffffff"/>` +
    `<text x="20" y="130" font-family="Hanken Grotesk" font-weight="800" font-size="${size}" letter-spacing="${ls}" fill="#000000">${str}</text></svg>`;
  const { info } = await sharp(Buffer.from(svg)).png().trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
  return info.width;
}

const K1 = 'CFB WEEK 9 UNIFORMS', K2 = 'OCT 29 - 31';
const w1 = Math.round(await textWidth(K1, 22, 4) + PAD * 2);
const w2 = Math.round(await textWidth(K2, 22, 4) + PAD * 2);

// right side: one wide Nebraska panel on top, three panels below
const RX = 640, TOP_H = 520, GAP = 10;
const BW = Math.floor((W - RX - GAP * 2) / 3);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="glow" cx="0.25" cy="0.35" r="0.7">
      <stop offset="0%" stop-color="#2a1a0c"/><stop offset="100%" stop-color="${BG}"/>
    </radialGradient>
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" filter="url(#noise)"/>

  <g transform="translate(${M} 62) skewX(-8)">
    <rect x="0" y="0" width="${w1}" height="46" fill="${ORANGE}"/>
    <text x="${PAD}" y="32" font-family="Hanken Grotesk" font-weight="800" font-size="22" fill="${BG}" letter-spacing="4">${K1}</text>
  </g>
  <g transform="translate(${M} 120) skewX(-8)">
    <rect x="0" y="0" width="${w2}" height="46" fill="none" stroke="#ffffff" stroke-opacity="0.8" stroke-width="2"/>
    <text x="${PAD}" y="32" font-family="Hanken Grotesk" font-weight="800" font-size="22" fill="#ffffff" letter-spacing="4">${K2}</text>
  </g>

  <g transform="translate(${M} 330) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="118" fill="${ORANGE}">HALLOWEEN</text>
  </g>
  <g transform="translate(${M} 455) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="118" fill="#ffffff">UNIFORMS</text>
  </g>
  <text x="${M}" y="520" font-family="Hanken Grotesk" font-weight="800" font-size="25" fill="#ffffff" fill-opacity="0.85">Nebraska's black debut, Otto on the helmet,</text>
  <text x="${M}" y="556" font-family="Hanken Grotesk" font-weight="800" font-size="25" fill="#ffffff" fill-opacity="0.85">BYU all navy and the Space Game</text>

  <rect x="${M}" y="610" width="${RX - M - 40}" height="150" rx="14" fill="${PAPER}"/>
  <rect x="${M}" y="776" width="${RX - M - 40}" height="96" rx="14" fill="${PAPER}" fill-opacity="0.92"/>
</svg>`;

const comps = [];

async function logo(file, cx, cy, h, w) {
  const buf = await sharp(file).resize({ height: h, width: w, fit: 'inside' }).toBuffer();
  const m = await sharp(buf).metadata();
  comps.push({ input: buf, left: Math.round(cx - m.width / 2), top: Math.round(cy - m.height / 2) });
}
const stripW = RX - M - 40;
const teams = ['ncaa-nebraska-cornhuskers', 'ncaa-syracuse-orange', 'ncaa-byu-cougars', 'ncaa-ucf-knights'];
for (let i = 0; i < teams.length; i++) {
  await logo(`assets/logos-hires/teams/${teams[i]}.png`, M + stripW * (i + 0.5) / teams.length, 685, 104, 112);
}
const confs = ['ncaa-conf-big-ten', 'ncaa-conf-acc', 'ncaa-conf-big-12'];
for (let i = 0; i < confs.length; i++) {
  await logo(`assets/logos-hires/leagues/${confs[i]}.png`, M + stripW * (i + 0.5) / confs.length, 824, 74, 180);
}

async function panel(src, x, y, w, h, position = 'centre', crop) {
  let img = sharp(src);
  if (crop) img = img.extract(crop);
  const buf = await img.resize(w, h, { fit: 'cover', position }).toBuffer();
  comps.push({ input: buf, left: x, top: y });
}
// Nebraska: helmet + NEBRASKA wordmark
await panel(NEB, RX, 0, W - RX, TOP_H, 'centre', { left: 300, top: 20, width: 1320, height: 800 });
// Syracuse Otto helmet
await panel('public/images/posts/syracuse-otto-helmet-halloween-smu-2026/cover.jpg', RX, TOP_H + GAP, BW, H - TOP_H - GAP, 'centre', { left: 560, top: 0, width: 760, height: 1000 });
// BYU all navy: the full-length player
await panel('public/images/posts/byu-all-navy-uniforms-arizona-state-2026/cover.jpg', RX + BW + GAP, TOP_H + GAP, BW, H - TOP_H - GAP, 'north', { left: 70, top: 100, width: 600, height: 900 });
// UCF Space Game: helmet to waist
await panel(UCF, RX + (BW + GAP) * 2, TOP_H + GAP, W - RX - (BW + GAP) * 2, H - TOP_H - GAP, 'north', { left: 180, top: 120, width: 1000, height: 1100 });

const label = (t, x, y) => `<g transform="translate(${x} ${y}) skewX(-8)"><rect x="0" y="0" width="${t.length * 15 + 30}" height="36" fill="${ORANGE}"/><text x="15" y="25" font-family="Hanken Grotesk" font-weight="800" font-size="18" fill="${BG}" letter-spacing="3">${t}</text></g>`;
comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
  label('NEBRASKA', RX + 20, TOP_H - 54) + label('SYRACUSE', RX + 16, H - 52) + label('BYU', RX + BW + GAP + 16, H - 52) + label('UCF', RX + (BW + GAP) * 2 + 16, H - 52) +
  `</svg>`), left: 0, top: 0 });

const wm = await sharp('public/brand/colorway-sports-logo-white.png').resize({ height: 30 }).toBuffer();
comps.push({ input: wm, left: M, top: 920 });

mkdirSync(dirname(OUT), { recursive: true });
const info = await sharp(Buffer.from(svg)).composite(comps).jpeg({ quality: 84 }).toFile(OUT);
console.log(`${OUT} ${info.width}x${info.height} ${Math.round(info.size / 1024)}KB`);
