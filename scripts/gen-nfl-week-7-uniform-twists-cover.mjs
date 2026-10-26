// Cover for content/drafts/nfl-week-7-uniform-twists-vikings-bengals-rams-2026.md
// Three team-color panels (Vikings, Bengals, Rams), each with the team logo, the
// tracker jersey cutout worn on Sunday, and a "listed / worn" pants swatch pair.
// Bottom band: Anton headline + ColorWay wordmark lockup (BRAND - START HERE).
// Run: node scripts/gen-nfl-week-7-uniform-twists-cover.mjs
import sharp from 'sharp';
import os from 'node:os';
import fs from 'node:fs';

const OUT_DIR = 'public/images/posts/nfl-week-7-uniform-twists-vikings-bengals-rams-2026';
const LOCKUP = `${os.homedir()}/Desktop/ColorWay Sports/BRAND - START HERE/Logos (all uses)/wordmark-lockup-white.png`;
const F = 'Hanken Grotesk';
const W = 1500, H = 1000, COL = 500, BAND = 190;

const teams = [
  { key: 'minnesota-vikings', jersey: 'vikings-purple-home-cut.webp', bg1: '#5b2d94', bg2: '#2c1150',
    was: { label: 'LISTED', name: 'PURPLE', color: '#4F2683' }, now: { name: 'WHITE', color: '#ffffff' } },
  { key: 'cincinnati-bengals', jersey: 'bengals-white-road-cut.webp', bg1: '#ff6a2b', bg2: '#b83300',
    was: { label: 'EXPECTED', name: 'BLACK', color: '#111111' }, now: { name: 'WHITE', color: '#ffffff' } },
  { key: 'los-angeles-rams', jersey: 'rams-white-road-cut.webp', bg1: '#1a54c4', bg2: '#001d5c',
    was: { label: 'EXPECTED', name: 'WHITE', color: '#ffffff' }, now: { name: 'ROYAL', color: '#003594' } },
];

const panelH = H - BAND;
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.07"/></feComponentTransfer></filter>`;
teams.forEach((t, i) => {
  svg += `<radialGradient id="g${i}" cx="50%" cy="42%" r="70%"><stop offset="0%" stop-color="${t.bg1}"/><stop offset="100%" stop-color="${t.bg2}"/></radialGradient>`;
});
svg += `</defs>`;
teams.forEach((t, i) => {
  const x = i * COL;
  svg += `<rect x="${x}" y="0" width="${COL}" height="${panelH}" fill="url(#g${i})"/>`;
  // white badge behind the logo so the royal Rams horn reads on royal
  svg += `<circle cx="${x + COL / 2}" cy="96" r="74" fill="#ffffff"/>`;
  // soft glow behind the jersey so a purple jersey still reads on purple
  svg += `<ellipse cx="${x + COL / 2}" cy="390" rx="200" ry="220" fill="#ffffff" opacity="0.13"/>`;
  // pants swatches row
  const sy = 650;
  const sw = (cx, label, name, color, struck) => {
    let s = `<text x="${cx}" y="${sy}" text-anchor="middle" font-family="${F}" font-size="22" font-weight="800" fill="#ffffff" opacity="0.85" letter-spacing="3">${label}</text>`;
    s += `<rect x="${cx - 70}" y="${sy + 14}" width="140" height="62" rx="10" fill="${color}" stroke="#ffffff" stroke-width="3"/>`;
    s += `<text x="${cx}" y="${sy + 112}" text-anchor="middle" font-family="${F}" font-size="30" font-weight="800" fill="#ffffff" letter-spacing="1">${name}</text>`;
    if (struck) s += `<line x1="${cx - 84}" y1="${sy + 88}" x2="${cx + 84}" y2="${sy + 2}" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/><line x1="${cx - 84}" y1="${sy + 88}" x2="${cx + 84}" y2="${sy + 2}" stroke="#e8213a" stroke-width="4" stroke-linecap="round"/>`;
    return s;
  };
  svg += sw(x + 140, t.was.label, t.was.name, t.was.color, true);
  svg += `<text x="${x + COL / 2}" y="${sy + 58}" text-anchor="middle" font-family="${F}" font-size="44" font-weight="800" fill="#ffffff">&#8594;</text>`;
  svg += sw(x + 360, 'WORN', t.now.name, t.now.color, false);
  if (i > 0) svg += `<rect x="${x - 2}" y="0" width="4" height="${panelH}" fill="#0b1630" opacity="0.55"/>`;
});
svg += `<rect x="0" y="0" width="${W}" height="${panelH}" filter="url(#grain)"/>`;
// bottom band
svg += `<rect x="0" y="${panelH}" width="${W}" height="${BAND}" fill="#0b1630"/>`;
svg += `<rect x="0" y="${panelH}" width="${W}" height="6" fill="#e8213a"/>`;
svg += `<text x="64" y="${panelH + 96}" font-family="Anton" font-size="78" fill="#ffffff" letter-spacing="1" transform="translate(${Math.round(Math.tan(6*Math.PI/180)*(panelH + 96))} 0) skewX(-6)">WEEK 7 PANTS <tspan fill="#ff6b7a">SURPRISES</tspan></text>`;
svg += `<text x="66" y="${panelH + 150}" font-family="${F}" font-size="30" font-weight="700" fill="#c9d3e6" letter-spacing="2">NOT WHAT WAS EXPECTED. ALL THREE WON.</text>`;
svg += `</svg>`;

const layers = [];
for (const [i, t] of teams.entries()) {
  const x = i * COL;
  const logo = await sharp(`assets/logos-hires/teams/nfl-${t.key}.png`).trim().resize({ height: 96, width: 112, fit: 'inside' }).png().toBuffer();
  const lm = await sharp(logo).metadata();
  layers.push({ input: logo, left: Math.round(x + COL / 2 - lm.width / 2), top: Math.round(96 - lm.height / 2) });
  const jersey = await sharp(`public/images/posts/nfl-tracker-jerseys/${t.jersey}`).trim().resize({ height: 430 }).png().toBuffer();
  const jm = await sharp(jersey).metadata();
  layers.push({ input: jersey, left: Math.round(x + COL / 2 - jm.width / 2), top: 170 });
}
const lockup = await sharp(LOCKUP).resize({ width: 330 }).png().toBuffer();
const lkm = await sharp(lockup).metadata();
layers.push({ input: lockup, left: W - 64 - lkm.width, top: Math.round(panelH + BAND / 2 - lkm.height / 2) });

fs.mkdirSync(OUT_DIR, { recursive: true });
await sharp(Buffer.from(svg)).composite(layers).jpeg({ quality: 86, mozjpeg: true }).toFile(`${OUT_DIR}/cover.jpg`);
console.log('wrote', `${OUT_DIR}/cover.jpg`);
