// Cover for the Bills 2026 uniform schedule post: all five jerseys in the
// closet as transparent cutouts, fanned across a Bills-blue field. Jake asked
// for this on 9/4 because the old cover (the Nickel City reveal photo) read as
// if the post were only about the gray set.
//
// Cutouts are Nike product shots from the Bills' team store (Fanatics), trimmed
// to their alpha bounds and archived outside the repo:
//   ~/Desktop/colorway-archive/nfl-2026-jersey-cutouts/bills/
// 3:2 at 1500x1000 per the cover spec.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

const W = 1500, H = 1000;
const OUT = 'public/images/posts/bills-uniform-schedule-2026';
const SRC = resolve(homedir(), 'Desktop/colorway-archive/nfl-2026-jersey-cutouts/bills');

const BLUE = '#00338D', DEEP = '#07173a', RED = '#C60C30', ICE = '#c8d8ff';

// Left to right, in the order they appear in the post's closet.
const JERSEYS = [
  'bills-blue-primary.png',
  'bills-white-road.png',
  'bills-nickel-city.png',
  'bills-cold-front.png',
  'bills-red-alternate.png',
];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BLUE}"/>
      <stop offset="58%" stop-color="#0a2a6e"/>
      <stop offset="100%" stop-color="${DEEP}"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.45"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="0" y="560" width="${W}" height="440" fill="url(#floor)"/>
  <!-- red stripe, the Bills' shoulder stripe as a rule -->
  <rect x="0" y="0" width="${W}" height="14" fill="${RED}"/>

  <text x="90" y="150" font-family="Arial, Helvetica, sans-serif" font-size="30"
        font-weight="800" fill="${ICE}" letter-spacing="7">BUFFALO BILLS</text>
  <text x="88" y="262" font-family="Arial, Helvetica, sans-serif" font-size="78"
        font-weight="900" fill="#ffffff" letter-spacing="-2">2026 UNIFORM SCHEDULE</text>
  <rect x="92" y="300" width="150" height="7" rx="3.5" fill="${RED}"/>
  <text x="90" y="362" font-family="Arial, Helvetica, sans-serif" font-size="27"
        font-weight="700" fill="#ffffff" opacity="0.9" letter-spacing="1.5">BLUE &#183; WHITE &#183; NICKEL CITY &#183; COLD FRONT &#183; RED ALTERNATE</text>
</svg>`;

const composites = [];
const JH = 560;                 // jersey height
const STEP = 232;               // horizontal spacing; composites overlap on purpose
const X0 = 30, TOP = 400;
const buffers = [];
for (const f of JERSEYS) {
  const b = await sharp(resolve(SRC, f)).resize({ height: JH }).toBuffer();
  const m = await sharp(b).metadata();
  buffers.push({ b, w: m.width });
}
// Right-most first so each jersey's front (the right half of the product shot)
// sits on top of its neighbour's back.
buffers.forEach(({ b, w }, i) => {
  composites.unshift({ input: b, left: X0 + i * STEP, top: TOP + (i % 2 ? 0 : 14) });
});

const bills = await sharp('public/logos/teams/nfl-buffalo-bills.png').resize({ height: 140, fit: 'inside' }).toBuffer();
const billsMeta = await sharp(bills).metadata();
composites.push({ input: bills, left: W - billsMeta.width - 90, top: 74 });

// Brand mark sits under the Bills mark, top-right, because the jerseys own the
// whole bottom edge and a watermark on top of the red alternate read cluttered.
const logo = await sharp('public/brand/colorway-sports-logo-white.png').resize({ width: 270 }).toBuffer();
const logoMeta = await sharp(logo).metadata();
composites.push({ input: logo, left: W - logoMeta.width - 90, top: 262 });

await mkdir(OUT, { recursive: true });
const info = await sharp(Buffer.from(svg)).composite(composites).jpeg({ quality: 88 }).toFile(`${OUT}/cover.jpg`);
console.log(`wrote ${OUT}/cover.jpg — ${info.width}x${info.height}, ${Math.round(info.size / 1024)}KB`);
