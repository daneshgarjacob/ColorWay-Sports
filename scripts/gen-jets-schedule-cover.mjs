// Words-only cover for the Jets 2026 uniform schedule post.
// No photography: Gotham Green field, the Jets and NFL marks, and the three
// confirmed uniform names as the subline. 3:2 at 1500x1000 per the cover spec.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const W = 1500, H = 1000;
const GREEN = '#125740', DEEP = '#08281d', MINT = '#8fe3bd';
const OUT = 'public/images/posts/jets-uniform-schedule-2026';

// Faint diagonal ribs so the flat green has some structure without reading busy.
const ribs = Array.from({ length: 22 }, (_, i) => {
  const x = -400 + i * 110;
  return `<rect x="${x}" y="-200" width="26" height="1500" fill="#ffffff" opacity="0.022" transform="rotate(18 ${x} 500)"/>`;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${GREEN}"/>
      <stop offset="62%" stop-color="#0d3f2c"/>
      <stop offset="100%" stop-color="${DEEP}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${ribs}

  <!-- The Jets primary mark is green, so it needs a light disc or it vanishes
       into the background. -->
  <circle cx="300" cy="500" r="212" fill="#ffffff" opacity="0.055"/>
  <circle cx="300" cy="500" r="196" fill="#ffffff"/>

  <!-- eyebrow -->
  <text x="620" y="330" font-family="Arial, Helvetica, sans-serif" font-size="30"
        font-weight="800" fill="${MINT}" letter-spacing="7">NEW YORK JETS</text>

  <!-- headline -->
  <text x="618" y="440" font-family="Arial, Helvetica, sans-serif" font-size="104"
        font-weight="900" fill="#ffffff" letter-spacing="-2">2026 UNIFORM</text>
  <text x="618" y="546" font-family="Arial, Helvetica, sans-serif" font-size="104"
        font-weight="900" fill="#ffffff" letter-spacing="-2">SCHEDULE</text>

  <!-- rule -->
  <rect x="622" y="600" width="150" height="7" rx="3.5" fill="${MINT}"/>

  <!-- subline: the three confirmed looks -->
  <text x="620" y="672" font-family="Arial, Helvetica, sans-serif" font-size="27"
        font-weight="700" fill="#ffffff" opacity="0.92" letter-spacing="1.5">WHITE OUT</text>
  <text x="800" y="672" font-family="Arial, Helvetica, sans-serif" font-size="27"
        font-weight="700" fill="${MINT}" opacity="0.9">&#183;</text>
  <text x="826" y="672" font-family="Arial, Helvetica, sans-serif" font-size="27"
        font-weight="700" fill="#ffffff" opacity="0.92" letter-spacing="1.5">CLASSIC</text>
  <text x="968" y="672" font-family="Arial, Helvetica, sans-serif" font-size="27"
        font-weight="700" fill="${MINT}" opacity="0.9">&#183;</text>
  <text x="994" y="672" font-family="Arial, Helvetica, sans-serif" font-size="27"
        font-weight="700" fill="#ffffff" opacity="0.92" letter-spacing="1.5">RIVALRIES</text>

  <!-- footer credit -->
  <text x="620" y="762" font-family="Arial, Helvetica, sans-serif" font-size="21"
        font-weight="700" fill="#ffffff" opacity="0.42" letter-spacing="4">COLORWAY SPORTS</text>
</svg>`;

const jets = await sharp('public/logos/teams/nfl-new-york-jets.png')
  .resize({ height: 250, fit: 'inside' }).toBuffer();
const jetsMeta = await sharp(jets).metadata();

const nfl = await sharp('public/logos/leagues/nfl.png')
  .resize({ height: 86, fit: 'inside' }).toBuffer();
const nflMeta = await sharp(nfl).metadata();

await mkdir(OUT, { recursive: true });
const info = await sharp(Buffer.from(svg))
  .composite([
    { input: jets, left: Math.round(300 - jetsMeta.width / 2), top: Math.round(H / 2 - jetsMeta.height / 2) },
    { input: nfl, left: 1500 - nflMeta.width - 74, top: 764 },
  ])
  .jpeg({ quality: 90 })
  .toFile(`${OUT}/cover.jpg`);

console.log(`wrote ${OUT}/cover.jpg — ${info.width}x${info.height}, ${Math.round(info.size / 1024)}KB`);
