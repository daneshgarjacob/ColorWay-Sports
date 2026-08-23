#!/usr/bin/env node
// Shirt-led 3:2 covers for the twenty Premier League club kit pages plus the hub.
// House cover language from gen-words-cover.mjs: 1500x1000, diagonal club-colour
// gradient, faint angled ribs, text block on the right, ColorWay mark bottom-left.
// The difference here is the left-hand slot holds the club's actual shirt rather
// than a crest, because we have no licensable club crests.
//
// Usage: node scripts/gen-epl-covers.mjs [slug]   (omit slug to build all)
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';

const W = 1500, H = 1000;
const LIB = `${homedir()}/Desktop/colorway-archive/epl-2026-27-kits`;
const PL = 'public/logos/leagues/soccer-premier-league.png';

// shirt: file in LIB · label: what that shirt is, printed under the name
const CLUBS = {
  'arsenal':           { name: 'ARSENAL',        shirt: 'arsenal-home',        label: 'HOME',  grade: 'B+', base: '#EF0107', mid: '#8d0104', deep: '#041f3f', accent: '#ffd166' },
  'aston-villa':       { name: 'ASTON VILLA',    shirt: 'aston-villa-home',    label: 'HOME',  grade: 'B+', base: '#670E36', mid: '#3d0820', deep: '#0d1b33', accent: '#95BFE5' },
  'bournemouth':       { name: 'BOURNEMOUTH',    shirt: 'bournemouth-home',    label: 'HOME',  grade: 'B+', base: '#DA291C', mid: '#7a1710', deep: '#0a0a0a', accent: '#d8b45a' },
  'brentford':         { name: 'BRENTFORD',      shirt: 'brentford-home',      label: 'HOME',  grade: 'B+', base: '#e30613', mid: '#8f0009', deep: '#0f1a3c', accent: '#f5c451' },
  'brighton':          { name: 'BRIGHTON',       shirt: 'brighton-home',       label: 'HOME',  grade: 'B+', base: '#0057B8', mid: '#013a7a', deep: '#04263f', accent: '#00d6c8' },
  'chelsea':           { name: 'CHELSEA',        shirt: 'chelsea-home',        label: 'HOME',  grade: 'B',  base: '#034694', mid: '#022c5e', deep: '#050d1a', accent: '#e6c565' },
  'coventry-city':     { name: 'COVENTRY CITY',  shirt: 'coventry-home',       label: 'HOME',  grade: 'B+', base: '#4a9bd4', mid: '#1d5b8a', deep: '#08243a', accent: '#f2d27a' },
  'crystal-palace':    { name: 'CRYSTAL PALACE', shirt: 'crystal-palace-away', label: 'AWAY',  grade: 'A-', base: '#1B458F', mid: '#121f3d', deep: '#0a0a0a', accent: '#C4122E' },
  'everton':           { name: 'EVERTON',        shirt: 'everton-home',        label: 'HOME',  grade: 'B+', base: '#003399', mid: '#00205e', deep: '#040c1f', accent: '#f2c94c' },
  'fulham':            { name: 'FULHAM',         shirt: 'fulham-home',         label: 'HOME',  grade: 'B+', base: '#1f1f1f', mid: '#121212', deep: '#000000', accent: '#CC0000' },
  'hull-city':         { name: 'HULL CITY',      shirt: 'hull-home',           label: 'HOME',  grade: 'B+', base: '#F5A12D', mid: '#a2650f', deep: '#0a0a0a', accent: '#ffffff' },
  'ipswich-town':      { name: 'IPSWICH TOWN',   shirt: 'ipswich-home',        label: 'HOME',  grade: 'B+', base: '#0044a9', mid: '#002d6e', deep: '#0b0f1c', accent: '#e8a0b4' },
  'leeds-united':      { name: 'LEEDS UNITED',   shirt: 'leeds-home',          label: 'HOME',  grade: 'A-', base: '#1D428A', mid: '#12285a', deep: '#070d1c', accent: '#FFCD00' },
  'liverpool':         { name: 'LIVERPOOL',      shirt: 'liverpool-home',      label: 'HOME',  grade: 'B+', base: '#C8102E', mid: '#7a0a1c', deep: '#0d0507', accent: '#00B2A9' },
  'manchester-city':   { name: 'MAN CITY',       shirt: 'man-city-home',       label: 'HOME',  grade: 'B-', base: '#6CABDD', mid: '#2b6a9c', deep: '#0a2233', accent: '#f2e28a' },
  'manchester-united': { name: 'MAN UNITED',     shirt: 'man-united-away',     label: 'AWAY',  grade: 'B+', base: '#DA291C', mid: '#7a1710', deep: '#0a0a0a', accent: '#FBE122' },
  'newcastle':         { name: 'NEWCASTLE',      shirt: 'newcastle-home',      label: 'HOME',  grade: 'B+', base: '#241F20', mid: '#141112', deep: '#000000', accent: '#41B6E6' },
  'nottingham-forest': { name: 'NOTT’M FOREST',  shirt: 'forest-home',         label: 'HOME',  grade: 'B+', base: '#DD0000', mid: '#8a0000', deep: '#0a0a0a', accent: '#8fd6a8' },
  'sunderland':        { name: 'SUNDERLAND',     shirt: 'sunderland-home',     label: 'HOME',  grade: 'A-', base: '#EB172B', mid: '#8a0d19', deep: '#141112', accent: '#f4a8b8' },
  'tottenham':         { name: 'TOTTENHAM',      shirt: 'tottenham-away',      label: 'AWAY',  grade: 'B',  base: '#101c3a', mid: '#0a1226', deep: '#000000', accent: '#c9a0ff' },
};

const HUB = {
  name: 'PREMIER LEAGUE', line2: 'KIT SCHEDULE',
  base: '#3D195B', mid: '#25103a', deep: '#0b0417', accent: '#00FF87',
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const ribs = Array.from({ length: 22 }, (_, i) => {
  const x = -400 + i * 110;
  return `<rect x="${x}" y="-200" width="26" height="1500" fill="#ffffff" opacity="0.022" transform="rotate(18 ${x} 500)"/>`;
}).join('');

function svgFor(c, isHub) {
  const grade = isHub ? '' : `
  <rect x="1246" y="86" width="164" height="150" rx="22" fill="#000000" opacity="0.28"/>
  <rect x="1246" y="86" width="164" height="150" rx="22" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="2"/>
  <text x="1328" y="108" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="15" font-weight="800" fill="${c.accent}" opacity="0.95" letter-spacing="3">WARDROBE</text>
  <text x="1328" y="176" text-anchor="middle" dominant-baseline="central"
        font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="76"
        font-weight="900" fill="#ffffff" letter-spacing="-3">${c.grade}</text>`;

  const nameSize = c.name.length > 13 ? 78 : c.name.length > 10 ? 92 : 104;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c.base}"/>
      <stop offset="62%" stop-color="${c.mid}"/>
      <stop offset="100%" stop-color="${c.deep}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${ribs}
  ${isHub
    ? `<rect x="128" y="252" width="444" height="496" rx="42" fill="#ffffff" opacity="0.10"/>
  <rect x="152" y="276" width="396" height="448" rx="34" fill="#f2f3f5" opacity="0.96"/>`
    : `<rect x="128" y="252" width="444" height="496" rx="42" fill="#ffffff" opacity="0.10"/>
  <rect x="152" y="276" width="396" height="448" rx="34" fill="#f2f3f5" opacity="0.96"/>`}
  <text x="700" y="322" font-family="Arial, Helvetica, sans-serif" font-size="27"
        font-weight="800" fill="${c.accent}" letter-spacing="6">PREMIER LEAGUE 2026/27</text>
  <text x="698" y="${isHub ? 424 : 440}" font-family="Arial, Helvetica, sans-serif" font-size="${nameSize}"
        font-weight="900" fill="#ffffff" letter-spacing="-2">${esc(c.name)}</text>
  ${isHub
    ? `<text x="698" y="524" font-family="Arial, Helvetica, sans-serif" font-size="78"
        font-weight="900" fill="#ffffff" letter-spacing="-2">${c.line2}</text>`
    : `<text x="698" y="540" font-family="Arial, Helvetica, sans-serif" font-size="60"
        font-weight="900" fill="#ffffff" opacity="0.95" letter-spacing="-1">KITS GRADED</text>`}
  <rect x="702" y="${isHub ? 578 : 594}" width="140" height="7" rx="3.5" fill="${c.accent}"/>
  <text x="700" y="${isHub ? 656 : 672}" font-family="Arial, Helvetica, sans-serif" font-size="25"
        font-weight="700" fill="#ffffff" opacity="0.9" letter-spacing="1.4">${
          isHub ? 'EVERY CLUB  ·  EVERY MATCHWEEK' : `KITS  ·  JERSEYS  ·  UNIFORMS, GRADED`}</text>
  ${grade}
  <text x="700" y="800" font-family="Arial, Helvetica, sans-serif" font-size="20"
        font-weight="700" fill="#ffffff" opacity="0.42" letter-spacing="4">COLORWAY SPORTS</text>
</svg>`;
}

async function build(key) {
  const isHub = key === 'hub';
  const c = isHub ? HUB : CLUBS[key];
  if (!c) throw new Error(`unknown club key ${key}`);
  const slug = isHub ? 'premier-league-kit-schedule-2026-27' : `${key}-kits-2026-27`;

  const layers = [];
  if (isHub) {
    const mark = await sharp(PL).resize({ height: 320, width: 320, fit: 'inside' }).toBuffer();
    const m = await sharp(mark).metadata();
    layers.push({ input: mark, left: Math.round(350 - m.width / 2), top: Math.round(500 - m.height / 2) });
  } else {
    const src = `public/logos/teams/epl-${key}.png`;
    if (!existsSync(src)) throw new Error(`missing crest ${src}`);
    const crest = await sharp(src).resize({ height: 400, width: 400, fit: 'inside' }).toBuffer();
    const m = await sharp(crest).metadata();
    layers.push({ input: crest, left: Math.round(350 - m.width / 2), top: Math.round(500 - m.height / 2) });
  }

  const out = `public/images/posts/${slug}`;
  await mkdir(out, { recursive: true });
  const info = await sharp(Buffer.from(svgFor(c, isHub)))
    .composite(layers).jpeg({ quality: 88 }).toFile(`${out}/cover.jpg`);
  console.log(`  ${slug.padEnd(36)} ${info.width}x${info.height}  ${Math.round(info.size / 1024)}KB`);
}

const only = process.argv[2];
const targets = only ? [only] : [...Object.keys(CLUBS), 'hub'];
for (const t of targets) await build(t);
