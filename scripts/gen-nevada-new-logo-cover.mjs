// Cover for the Nevada rebrand post. Nevada navy field, the new Nevada Wolf
// (wordmark + head) large on the left with the new Interlocked UN under it,
// stacked Hanken headline on the right, silver rule, white ColorWay lockup.
// Logos are the university's own files (unr.edu brand release), tinted white.
// 3:2 at 1500x1000.
import sharp from 'sharp';
import os from 'node:os';

const W = 1500, H = 1000;
const NAVY = '#0f2a55', DEEP = '#071735', SILVER = '#b9c2cf';
const OUT = 'public/images/posts/nevada-new-wolf-pack-logo-2026';
const LOCKUP = `${os.homedir()}/Desktop/ColorWay Sports/BRAND - START HERE/Logos (all uses)/wordmark-lockup-white.png`;
const F = 'Hanken Grotesk, Helvetica Neue, Arial, sans-serif';

// The release PNGs are navy art on an opaque white field. Build an alpha
// mask from darkness (navy = solid, white = clear; the faint light-gray
// preview watermark falls below the cutoff) and fill it with white.
async function white(file, width) {
  const trimmed = await sharp(file).flatten({ background: '#ffffff' }).trim().resize({ width }).png().toBuffer();
  const { width: w, height: h } = await sharp(trimmed).metadata();
  const alpha = await sharp(trimmed).greyscale().negate().linear(1.6, -60).toColourspace('b-w').raw().toBuffer();
  return sharp({ create: { width: w, height: h, channels: 3, background: '#ffffff' } })
    .joinChannel(alpha, { raw: { width: w, height: h, channels: 1 } }).png().toBuffer();
}

const wolf = await white(`${OUT}/nevada-wolf-new.png`, 660);
const wm = await sharp(wolf).metadata();
const un = await white(`${OUT}/interlocked-un-logo.png`, 250);
const unm = await sharp(un).metadata();
const lockup = await sharp(LOCKUP).resize({ width: 330 }).png().toBuffer();

const TX = 830;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><radialGradient id="g" cx="0.27" cy="0.45" r="0.8">
    <stop offset="0" stop-color="${NAVY}"/><stop offset="1" stop-color="${DEEP}"/>
  </radialGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="${TX - 50}" y="140" width="3" height="720" fill="${SILVER}" opacity="0.45"/>
  <text x="${TX}" y="215" font-family="${F}" font-size="34" font-weight="800" fill="${SILVER}" letter-spacing="6">NEVADA REBRAND</text>
  <text x="${TX - 6}" y="355" font-family="${F}" font-size="116" font-weight="800" fill="#ffffff" letter-spacing="-5">NEW WOLF.</text>
  <text x="${TX - 6}" y="485" font-family="${F}" font-size="116" font-weight="800" fill="#ffffff" letter-spacing="-5">NEW UN.</text>
  <text x="${TX - 6}" y="615" font-family="${F}" font-size="116" font-weight="800" fill="${SILVER}" letter-spacing="-5">GRADED.</text>
  <rect x="${TX}" y="652" width="120" height="8" fill="#ffffff"/>
  <text x="${TX}" y="718" font-family="${F}" font-size="36" font-weight="600" fill="#ffffff">Goodbye, Sport Wolf (2002-2026)</text>
</svg>`;

await sharp(Buffer.from(svg))
  .composite([
    { input: wolf, left: Math.round(410 - wm.width / 2), top: 170 },
    { input: un, left: Math.round(410 - unm.width / 2), top: 170 + wm.height + 70 },
    { input: lockup, left: TX, top: 790 },
  ])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(`${OUT}/cover.jpg`);
console.log(`wrote ${OUT}/cover.jpg`);
