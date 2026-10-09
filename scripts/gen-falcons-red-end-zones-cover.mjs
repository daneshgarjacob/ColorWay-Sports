// Cover for the Falcons red end zones post (SNF vs Ravens, 2026-10-11). Black to
// Falcons red field, big Falcons mark on the left, stacked Hanken headline, white
// ColorWay wordmark lockup, and a top-down football field along the bottom with
// red end zones. 3:2 at 1500x1000, same layout family as gen-dieter-lakers-cover.mjs.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import os from 'node:os';

const W = 1500, H = 1000;
const RED = '#A71930', BLACK = '#0b0b0d', TURF = '#2f7d32';
const OUT = 'public/images/posts/falcons-red-end-zones-2026';
const LOCKUP = `${os.homedir()}/Desktop/ColorWay Sports/BRAND - START HERE/Logos (all uses)/wordmark-lockup-white.png`;
// Hanken Grotesk is the wordmark's typeface (installed in ~/Library/Fonts).
const F = 'Hanken Grotesk, Helvetica Neue, Arial, sans-serif';

// Field strip: end zones 130px each, 10-yard lines across the 1240px of field between.
const FT = 800, FH = 200, EZ = 130;
const lines = [];
for (let i = 0; i <= 10; i++) {
  const x = EZ + i * (W - 2 * EZ) / 10;
  lines.push(`<rect x="${x - 2}" y="${FT}" width="4" height="${FH}" fill="#ffffff" opacity="0.85"/>`);
  if (i > 0 && i < 10) {
    const yd = i <= 5 ? i * 10 : (10 - i) * 10;
    lines.push(`<text x="${x}" y="${FT + 128}" text-anchor="middle" font-family="${F}" font-size="52" font-weight="800" fill="#ffffff" stroke="${TURF}" stroke-width="14" paint-order="stroke">${yd}</text>`);
  }
}
const ez = (x, rot) => `<rect x="${x}" y="${FT}" width="${EZ}" height="${FH}" fill="${RED}"/>
  <text transform="translate(${x + EZ / 2} ${FT + FH / 2}) rotate(${rot})" text-anchor="middle" dominant-baseline="central" font-family="${F}" font-size="76" font-weight="800" fill="#ffffff" letter-spacing="4">ATL</text>`;

const TX = 760;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><radialGradient id="g" cx="0.25" cy="0.4" r="0.85">
    <stop offset="0" stop-color="#5a0d1a"/><stop offset="0.55" stop-color="#1c0a0e"/><stop offset="1" stop-color="${BLACK}"/>
  </radialGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="0" y="${FT}" width="${W}" height="${FH}" fill="${TURF}"/>
  ${lines.join('')}
  ${ez(0, -90)}
  ${ez(W - EZ, 90)}
  <rect x="0" y="${FT - 8}" width="${W}" height="8" fill="#ffffff"/>
  <text x="${TX}" y="200" font-family="${F}" font-size="38" font-weight="800" fill="#ff4d5e" letter-spacing="6">ATLANTA FALCONS</text>
  <text x="${TX - 8}" y="356" font-family="${F}" font-size="168" font-weight="800" fill="#ffffff" letter-spacing="-6">RED END</text>
  <text x="${TX - 8}" y="512" font-family="${F}" font-size="168" font-weight="800" fill="#ffffff" letter-spacing="-6">ZONES</text>
  <rect x="${TX}" y="548" width="130" height="9" fill="${RED}"/>
  <text x="${TX}" y="612" font-family="${F}" font-size="36" font-weight="600" fill="#ffffff">Sunday Night Football vs. Ravens</text>
</svg>`;

const logo = await sharp('public/logos/teams/nfl-atlanta-falcons.png').trim().resize({ height: 520 }).png().toBuffer();
const lm = await sharp(logo).metadata();
const lockup = await sharp(LOCKUP).resize({ width: 340 }).png().toBuffer();

await mkdir(OUT, { recursive: true });
await sharp(Buffer.from(svg))
  .composite([
    { input: logo, left: Math.round(370 - lm.width / 2), top: Math.round(400 - lm.height / 2) },
    { input: lockup, left: TX, top: 680 },
  ])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(`${OUT}/cover.jpg`);
console.log(`wrote ${OUT}/cover.jpg`);
