// Cover for the Dieter Ruehle Lakers return. Lakers purple field, big Lakers
// mark on the left, stacked Hanken headline on the right, an organ keyboard
// along the bottom and the white ColorWay wordmark lockup. 3:2 at 1500x1000.
// Lockup source: ~/Desktop/ColorWay Sports/BRAND - START HERE/Logos (all uses)/.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import os from 'node:os';

const W = 1500, H = 1000;
const PURPLE = '#552583', DEEP = '#2B0F47', GOLD = '#FDB927';
const OUT = 'public/images/posts/dieter-ruehle-lakers-organist-return-2026';
const LOCKUP = `${os.homedir()}/Desktop/ColorWay Sports/BRAND - START HERE/Logos (all uses)/wordmark-lockup-white.png`;
// Hanken Grotesk is the wordmark's typeface (installed in ~/Library/Fonts).
const F = 'Hanken Grotesk, Helvetica Neue, Arial, sans-serif';

// Organ keyboard: white keys with black keys in the 2-3 pattern.
const KEY_W = 50, KEY_TOP = 840, KEY_H = 160;
const keys = [];
for (let i = 0; i * KEY_W < W; i++) {
  keys.push(`<rect x="${i * KEY_W}" y="${KEY_TOP}" width="${KEY_W - 3}" height="${KEY_H}" fill="#ffffff" opacity="0.92"/>`);
}
for (let i = 0; i * KEY_W < W; i++) {
  if ([0, 1, 3, 4, 5].includes(i % 7)) keys.push(`<rect x="${i * KEY_W + KEY_W * 0.68}" y="${KEY_TOP}" width="${KEY_W * 0.62}" height="${KEY_H * 0.6}" fill="#160626"/>`);
}

const TX = 760;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><radialGradient id="g" cx="0.28" cy="0.42" r="0.75">
    <stop offset="0" stop-color="${PURPLE}"/><stop offset="1" stop-color="${DEEP}"/>
  </radialGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="0" y="${KEY_TOP - 10}" width="${W}" height="10" fill="${GOLD}"/>
  ${keys.join('')}
  <text x="${TX}" y="210" font-family="${F}" font-size="38" font-weight="800" fill="${GOLD}" letter-spacing="6">LAKERS ORGANIST</text>
  <text x="${TX - 8}" y="370" font-family="${F}" font-size="172" font-weight="800" fill="#ffffff" letter-spacing="-6">DIETER</text>
  <text x="${TX - 8}" y="530" font-family="${F}" font-size="172" font-weight="800" fill="#ffffff" letter-spacing="-6">IS BACK</text>
  <rect x="${TX}" y="568" width="130" height="9" fill="${GOLD}"/>
  <text x="${TX}" y="636" font-family="${F}" font-size="38" font-weight="600" fill="#ffffff">First time since 2016</text>
</svg>`;

const logo = await sharp('public/logos/teams/nba-los-angeles-lakers.png').trim().resize({ width: 600 }).png().toBuffer();
const lm = await sharp(logo).metadata();
const lockup = await sharp(LOCKUP).resize({ width: 360 }).png().toBuffer();

await mkdir(OUT, { recursive: true });
await sharp(Buffer.from(svg))
  .composite([
    { input: logo, left: 90, top: Math.round(420 - lm.height / 2) },
    { input: lockup, left: TX, top: 715 },
  ])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(`${OUT}/cover.jpg`);
console.log(`wrote ${OUT}/cover.jpg`);
