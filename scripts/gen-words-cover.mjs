// Reusable words-and-logos cover for posts with no licensable photography.
// Generalised from scripts/gen-jets-schedule-cover.mjs so we stop copying that
// file per team. Usage: node scripts/gen-words-cover.mjs <config-key>
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const W = 1500, H = 1000;

const CONFIGS = {
  'white-sox-southside': {
    out: 'public/images/posts/white-sox-southside-city-connect-tim-anderson',
    base: '#27251F', mid: '#1a1917', deep: '#0a0a0a', accent: '#C4CED4',
    teamLogo: 'public/logos/teams/mlb-chicago-white-sox.png',
    leagueLogo: 'public/logos/leagues/mlb.png',
    // The White Sox mark is black, so it needs the light disc.
    disc: true,
    eyebrow: 'CHICAGO WHITE SOX',
    line1: 'SOUTHSIDE',
    line2: 'RETURNS',
    sub: ['SEPT 17', 'FOR TIM ANDERSON'],
  },
};

const key = process.argv[2];
const c = CONFIGS[key];
if (!c) {
  console.error(`unknown config "${key}". known: ${Object.keys(CONFIGS).join(', ')}`);
  process.exit(1);
}

const ribs = Array.from({ length: 22 }, (_, i) => {
  const x = -400 + i * 110;
  return `<rect x="${x}" y="-200" width="26" height="1500" fill="#ffffff" opacity="0.022" transform="rotate(18 ${x} 500)"/>`;
}).join('');

// Subline is laid out as one run so spacing stays even whatever the words are.
const subText = c.sub.join('  ·  ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c.base}"/>
      <stop offset="62%" stop-color="${c.mid}"/>
      <stop offset="100%" stop-color="${c.deep}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${ribs}
  ${c.disc ? `<circle cx="300" cy="500" r="212" fill="#ffffff" opacity="0.055"/>
  <circle cx="300" cy="500" r="196" fill="#ffffff"/>` : ''}

  <text x="620" y="330" font-family="Arial, Helvetica, sans-serif" font-size="30"
        font-weight="800" fill="${c.accent}" letter-spacing="7">${c.eyebrow}</text>
  <text x="618" y="440" font-family="Arial, Helvetica, sans-serif" font-size="104"
        font-weight="900" fill="#ffffff" letter-spacing="-2">${c.line1}</text>
  <text x="618" y="546" font-family="Arial, Helvetica, sans-serif" font-size="104"
        font-weight="900" fill="#ffffff" letter-spacing="-2">${c.line2}</text>
  <rect x="622" y="600" width="150" height="7" rx="3.5" fill="${c.accent}"/>
  <text x="620" y="672" font-family="Arial, Helvetica, sans-serif" font-size="27"
        font-weight="700" fill="#ffffff" opacity="0.92" letter-spacing="1.5">${subText}</text>
  <text x="620" y="762" font-family="Arial, Helvetica, sans-serif" font-size="21"
        font-weight="700" fill="#ffffff" opacity="0.42" letter-spacing="4">COLORWAY SPORTS</text>
</svg>`;

const team = await sharp(c.teamLogo).resize({ height: 250, fit: 'inside' }).toBuffer();
const teamMeta = await sharp(team).metadata();
const league = await sharp(c.leagueLogo).resize({ height: 86, fit: 'inside' }).toBuffer();
const leagueMeta = await sharp(league).metadata();

await mkdir(c.out, { recursive: true });
const info = await sharp(Buffer.from(svg))
  .composite([
    { input: team, left: Math.round(300 - teamMeta.width / 2), top: Math.round(H / 2 - teamMeta.height / 2) },
    { input: league, left: W - leagueMeta.width - 74, top: 764 },
  ])
  .jpeg({ quality: 90 })
  .toFile(`${c.out}/cover.jpg`);

console.log(`wrote ${c.out}/cover.jpg — ${info.width}x${info.height}, ${Math.round(info.size / 1024)}KB`);
