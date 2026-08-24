// Composite cover for the Rivalries explainer: all eight 2026 wave teams
// (AFC South + NFC North) on a dark field. 3:2 at 1500x1000 per the cover spec.
//
//   node scripts/gen-rivalries-2026-cover.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const W = 1500, H = 1000;
const OUT = 'public/images/posts/what-is-the-nfl-rivalries-uniform-program';

// Row 1 AFC South, row 2 NFC North.
const LOGOS = [
  'nfl-houston-texans', 'nfl-indianapolis-colts', 'nfl-jacksonville-jaguars', 'nfl-tennessee-titans',
  'nfl-chicago-bears', 'nfl-detroit-lions', 'nfl-green-bay-packers', 'nfl-minnesota-vikings',
];

const ribs = Array.from({ length: 22 }, (_, i) => {
  const x = -400 + i * 110;
  return `<rect x="${x}" y="-200" width="26" height="1500" fill="#ffffff" opacity="0.02" transform="rotate(18 ${x} 500)"/>`;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0d1f3c"/>
      <stop offset="55%" stop-color="#101820"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${ribs}

  <text x="${W / 2}" y="800" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="30" font-weight="800" fill="#D50A0A" letter-spacing="7">AFC SOUTH &#183; NFC NORTH</text>

  <text x="${W / 2}" y="893" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="88" font-weight="900" fill="#ffffff" letter-spacing="-1">2026 RIVALRIES UNIFORMS</text>

  <text x="${W / 2}" y="952" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="21" font-weight="700" fill="#ffffff" opacity="0.42" letter-spacing="4">COLORWAY SPORTS</text>
</svg>`;

const LOGO_H = 220;
const composites = [];
for (let i = 0; i < LOGOS.length; i++) {
  const buf = await sharp(`public/logos/teams/${LOGOS[i]}.png`)
    .resize({ height: LOGO_H, width: 260, fit: 'inside' }).toBuffer();
  const meta = await sharp(buf).metadata();
  const row = Math.floor(i / 4), col = i % 4;
  // 4 columns centered on 330-wide cells starting at x=90; rows centered at y=190/470.
  const cx = 90 + col * 330 + 165;
  const cy = 190 + row * 280 + LOGO_H / 2;
  composites.push({
    input: buf,
    left: Math.round(cx - meta.width / 2),
    top: Math.round(cy - meta.height / 2),
  });
}

await mkdir(OUT, { recursive: true });
const info = await sharp(Buffer.from(svg))
  .composite(composites)
  .jpeg({ quality: 90 })
  .toFile(`${OUT}/cover.jpg`);
console.log(`wrote ${OUT}/cover.jpg — ${info.width}x${info.height}, ${Math.round(info.size / 1024)}KB`);
