// Cover for content/drafts/vikings-all-purple-white-pants-colts-2026.md
// One Vikings panel: logo badge, the tracker purple home jersey cutout, and a
// "scheduled / worn" pants swatch pair (PURPLE struck -> WHITE).
// Bottom band: Anton headline + ColorWay wordmark lockup (BRAND - START HERE).
// Run: node scripts/gen-vikings-all-purple-white-pants-cover.mjs
import sharp from 'sharp';
import os from 'node:os';
import fs from 'node:fs';

const OUT_DIR = 'public/images/posts/vikings-all-purple-white-pants-colts-2026';
const LOCKUP = `${os.homedir()}/Desktop/ColorWay Sports/BRAND - START HERE/Logos (all uses)/wordmark-lockup-white.png`;
const F = 'Hanken Grotesk';
const W = 1500, H = 1000, BAND = 190;
const panelH = H - BAND;

// Layout: jersey on the left half, logo + pants swatches on the right half.
const JX = 430;           // jersey center x
const RX = 1060;          // right column center x
const SY = 380;           // swatch label baseline

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.07"/></feComponentTransfer></filter>
<radialGradient id="bg" cx="30%" cy="45%" r="85%"><stop offset="0%" stop-color="#6a36ad"/><stop offset="100%" stop-color="#22093f"/></radialGradient>
</defs>`;
svg += `<rect x="0" y="0" width="${W}" height="${panelH}" fill="url(#bg)"/>`;
svg += `<ellipse cx="${JX}" cy="420" rx="300" ry="330" fill="#ffffff" opacity="0.12"/>`;
// gold accent bar
svg += `<rect x="${RX - 260}" y="${SY - 150}" width="520" height="6" fill="#FFC62F"/>`;
svg += `<circle cx="${RX}" cy="130" r="82" fill="#ffffff"/>`;
const sw = (cx, label, name, color, struck) => {
  let s = `<text x="${cx}" y="${SY}" text-anchor="middle" font-family="${F}" font-size="26" font-weight="800" fill="#ffffff" opacity="0.88" letter-spacing="3">${label}</text>`;
  s += `<rect x="${cx - 95}" y="${SY + 18}" width="190" height="200" rx="14" fill="${color}" stroke="#ffffff" stroke-width="4"/>`;
  s += `<text x="${cx}" y="${SY + 270}" text-anchor="middle" font-family="${F}" font-size="38" font-weight="800" fill="#ffffff" letter-spacing="1">${name}</text>`;
  if (struck) s += `<line x1="${cx - 112}" y1="${SY + 230}" x2="${cx + 112}" y2="${SY + 6}" stroke="#ffffff" stroke-width="9" stroke-linecap="round"/><line x1="${cx - 112}" y1="${SY + 230}" x2="${cx + 112}" y2="${SY + 6}" stroke="#e8213a" stroke-width="5" stroke-linecap="round"/>`;
  return s;
};
svg += sw(RX - 150, 'SCHEDULED', 'PURPLE', '#4F2683', true);
svg += `<text x="${RX}" y="${SY + 135}" text-anchor="middle" font-family="${F}" font-size="56" font-weight="800" fill="#ffffff">&#8594;</text>`;
svg += sw(RX + 150, 'WORN', 'WHITE', '#ffffff', false);
svg += `<text x="${RX}" y="${SY - 100}" text-anchor="middle" font-family="${F}" font-size="30" font-weight="800" fill="#FFC62F" letter-spacing="4">PANTS · WEEK 7 VS. COLTS</text>`;
svg += `<rect x="0" y="0" width="${W}" height="${panelH}" filter="url(#grain)"/>`;
// bottom band
svg += `<rect x="0" y="${panelH}" width="${W}" height="${BAND}" fill="#0b1630"/>`;
svg += `<rect x="0" y="${panelH}" width="${W}" height="6" fill="#e8213a"/>`;
svg += `<text x="64" y="${panelH + 96}" font-family="Anton" font-size="78" fill="#ffffff" letter-spacing="1" transform="translate(${Math.round(Math.tan(6*Math.PI/180)*(panelH + 96))} 0) skewX(-6)">ALL PURPLE? <tspan fill="#ff6b7a">NOT QUITE</tspan></text>`;
svg += `<text x="66" y="${panelH + 150}" font-family="${F}" font-size="30" font-weight="700" fill="#c9d3e6" letter-spacing="2">THE VIKINGS WORE WHITE PANTS.</text>`;
svg += `</svg>`;

const layers = [];
const logo = await sharp('assets/logos-hires/teams/nfl-minnesota-vikings.png').trim().resize({ height: 110, width: 130, fit: 'inside' }).png().toBuffer();
const lm = await sharp(logo).metadata();
layers.push({ input: logo, left: Math.round(RX - lm.width / 2), top: Math.round(130 - lm.height / 2) });
const jersey = await sharp('public/images/posts/nfl-tracker-jerseys/vikings-purple-home-cut.webp').trim().resize({ height: 640 }).png().toBuffer();
const jm = await sharp(jersey).metadata();
layers.push({ input: jersey, left: Math.round(JX - jm.width / 2), top: Math.round(panelH / 2 - jm.height / 2) + 10 });
const lockup = await sharp(LOCKUP).resize({ width: 330 }).png().toBuffer();
const lkm = await sharp(lockup).metadata();
layers.push({ input: lockup, left: W - 64 - lkm.width, top: Math.round(panelH + BAND / 2 - lkm.height / 2) });

fs.mkdirSync(OUT_DIR, { recursive: true });
await sharp(Buffer.from(svg)).composite(layers).jpeg({ quality: 86, mozjpeg: true }).toFile(`${OUT_DIR}/cover.jpg`);
console.log('wrote', `${OUT_DIR}/cover.jpg`);
