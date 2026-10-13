// Cover for nfl-prime-time-games-by-team-2026. NFL navy night field, big NFL
// shield on the left, stacked Hanken headline on the right, all 32 team marks
// in two rows along the bottom (nobody's count is revealed), and the white
// ColorWay wordmark lockup. 3:2 at 1500x1000. Modeled on gen-dieter-lakers-cover.mjs.
import sharp from 'sharp';
import { mkdir, readdir } from 'node:fs/promises';
import os from 'node:os';

const W = 1500, H = 1000;
const NAVY = '#013369', DEEP = '#020b1c', RED = '#D50A0A';
const OUT = 'public/images/posts/nfl-prime-time-games-by-team-2026';
const LOCKUP = `${os.homedir()}/Desktop/ColorWay Sports/BRAND - START HERE/Logos (all uses)/wordmark-lockup-white.png`;
const FALLBACK_LOGO = 'public/brand/colorway-sports-logo-white.png';
const F = 'Hanken Grotesk, Helvetica Neue, Arial, sans-serif';

// Stadium light glow, top corners.
const BAND_TOP = 790;
const TX = 640;
// White discs behind the 32 marks so dark logos (Giants, Jets, Patriots) read.
const CELL = W / 16, SIZE = 58;
const discs = Array.from({ length: 32 }, (_, i) => {
  const cx = (i % 16) * CELL + CELL / 2, cy = BAND_TOP + 58 + Math.floor(i / 16) * 92;
  return `<circle cx="${cx}" cy="${cy}" r="40" fill="#ffffff"/>`;
}).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="g" cx="0.25" cy="0.35" r="0.85">
      <stop offset="0" stop-color="${NAVY}"/><stop offset="1" stop-color="${DEEP}"/>
    </radialGradient>
    <radialGradient id="light" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <circle cx="1420" cy="40" r="300" fill="url(#light)"/>
  <circle cx="80" cy="40" r="220" fill="url(#light)"/>
  <rect x="0" y="${BAND_TOP}" width="${W}" height="${H - BAND_TOP}" fill="#000000" opacity="0.35"/>
  ${discs}
  <rect x="0" y="${BAND_TOP - 8}" width="${W}" height="8" fill="${RED}"/>
  <text x="${TX}" y="170" font-family="${F}" font-size="34" font-weight="800" fill="#ffffff" opacity="0.75" letter-spacing="6">2026 NFL · ALL 32 TEAMS</text>
  <text x="${TX - 6}" y="320" font-family="${F}" font-size="136" font-weight="800" fill="#ffffff" letter-spacing="-5">WHO GOT</text>
  <text x="${TX - 6}" y="465" font-family="${F}" font-size="136" font-weight="800" fill="#ffffff" letter-spacing="-5">PRIME TIME?</text>
  <rect x="${TX}" y="500" width="130" height="9" fill="${RED}"/>
  <text x="${TX}" y="568" font-family="${F}" font-size="38" font-weight="600" fill="#ffffff">TNF, SNF and MNF games, team by team</text>
</svg>`;

const shield = await sharp('assets/logos-hires/leagues/nfl.png').trim().resize({ height: 430, fit: 'inside' }).png().toBuffer();
const sm = await sharp(shield).metadata();

let lockup;
try {
  lockup = await sharp(LOCKUP).resize({ width: 340 }).png().toBuffer();
} catch {
  lockup = await sharp(FALLBACK_LOGO).resize({ width: 340 }).png().toBuffer();
}

// 32 team marks, two rows of 16, alphabetical so the order says nothing.
const files = (await readdir('assets/logos-hires/teams')).filter((f) => f.startsWith('nfl-')).sort();
const marks = [];
for (let i = 0; i < files.length; i++) {
  const buf = await sharp(`assets/logos-hires/teams/${files[i]}`).trim().resize({ width: SIZE, height: SIZE, fit: 'inside' }).png().toBuffer();
  const m = await sharp(buf).metadata();
  const col = i % 16, row = Math.floor(i / 16);
  marks.push({
    input: buf,
    left: Math.round(col * CELL + CELL / 2 - m.width / 2),
    top: Math.round(BAND_TOP + 58 + row * 92 - m.height / 2),
  });
}

await mkdir(OUT, { recursive: true });
await sharp(Buffer.from(svg))
  .composite([
    { input: shield, left: Math.round(300 - sm.width / 2), top: Math.round(390 - sm.height / 2) },
    { input: lockup, left: TX, top: 640 },
    ...marks,
  ])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(`${OUT}/cover.jpg`);
console.log(`wrote ${OUT}/cover.jpg (${files.length} team marks)`);
