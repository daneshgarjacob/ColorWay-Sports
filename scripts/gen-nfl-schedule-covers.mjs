// Words-only covers for the per-team NFL uniform schedule posts.
// Same shape as gen-jets-schedule-cover.mjs, generalised so the remaining teams
// are a config entry instead of a new file. 3:2 at 1500x1000 per the cover spec.
//
//   node scripts/gen-nfl-schedule-covers.mjs            # all configured teams
//   node scripts/gen-nfl-schedule-covers.mjs bengals    # just one
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const W = 1500, H = 1000;

const TEAMS = {
  bengals: {
    slug: 'bengals-uniform-schedule-2026',
    logo: 'nfl-cincinnati-bengals',
    eyebrow: 'CINCINNATI BENGALS',
    looks: ['OPEN IN ORANGE', 'WHITE BENGAL'],
    base: '#FB4F14', mid: '#8a2c0a', deep: '#0d0d0d', accent: '#ffd2b8',
    // The Bengals mark is orange on a warm background, so it needs the disc.
    disc: true,
  },
  chargers: {
    slug: 'chargers-uniform-schedule-2026',
    logo: 'nfl-los-angeles-chargers',
    eyebrow: 'LOS ANGELES CHARGERS',
    looks: ['SUPER CHARGERS', 'POWDER BLUE'],
    base: '#0080C6', mid: '#00477e', deep: '#001a37', accent: '#FFC20E',
    disc: false,
  },
  dolphins: {
    slug: 'dolphins-uniform-schedule-2026',
    logo: 'nfl-miami-dolphins',
    eyebrow: 'MIAMI DOLPHINS',
    looks: ['THROWBACK', 'RIVALRIES'],
    base: '#008E97', mid: '#005e64', deep: '#00272b', accent: '#FC4C02',
    disc: false,
  },
  titans: {
    slug: 'titans-uniform-schedule-2026',
    logo: 'nfl-tennessee-titans',
    eyebrow: 'TENNESSEE TITANS',
    looks: ['BRAND-NEW SET', 'TITANS BLUE'],
    // The 2026 rebrand leads with the light blue, so the field does too.
    base: '#4B92DB', mid: '#2b6ea8', deep: '#0C2340', accent: '#e8f3fc',
    // The new primary mark is light blue on light blue, so it needs the disc.
    disc: true,
  },
  texans: {
    slug: 'texans-uniform-schedule-2026',
    logo: 'nfl-houston-texans',
    eyebrow: 'HOUSTON TEXANS',
    looks: ['LIBERTY WHITE', 'BATTLE RED', 'RIVALRIES'],
    base: '#12405c', mid: '#0a2a3d', deep: '#03202F', accent: '#dce8ef',
    disc: true,
  },
  jaguars: {
    slug: 'jaguars-uniform-schedule-2026',
    logo: 'nfl-jacksonville-jaguars',
    eyebrow: 'JACKSONVILLE JAGUARS',
    looks: ['TEAL', 'RIVALRIES'],
    base: '#006778', mid: '#00404d', deep: '#101820', accent: '#D7A22A',
    disc: true,
  },
  cardinals: {
    slug: 'arizona-cardinals-uniform-schedule-2026',
    logo: 'nfl-arizona-cardinals',
    eyebrow: 'ARIZONA CARDINALS',
    looks: ['CARDINAL RED', 'RIVALRY JERSEYS'],
    base: '#97233F', mid: '#5e1628', deep: '#141414', accent: '#FFB612',
    disc: true,
  },
  seahawks: {
    slug: 'seahawks-uniform-schedule-2026',
    logo: 'nfl-seattle-seahawks',
    eyebrow: 'SEATTLE SEAHAWKS',
    looks: ['ROYAL BLUE THROWBACK', 'RIVALRIES'],
    base: '#0b3a6b', mid: '#002244', deep: '#000d1c', accent: '#69BE28',
    disc: false,
  },
};

async function build(key) {
  const t = TEAMS[key];
  if (!t) throw new Error(`no config for "${key}" (have: ${Object.keys(TEAMS).join(', ')})`);
  const OUT = `public/images/posts/${t.slug}`;

  // Faint diagonal ribs so the flat field has structure without reading busy.
  const ribs = Array.from({ length: 22 }, (_, i) => {
    const x = -400 + i * 110;
    return `<rect x="${x}" y="-200" width="26" height="1500" fill="#ffffff" opacity="0.022" transform="rotate(18 ${x} 500)"/>`;
  }).join('');

  const disc = t.disc
    ? `<circle cx="300" cy="500" r="212" fill="#ffffff" opacity="0.055"/>
       <circle cx="300" cy="500" r="196" fill="#ffffff"/>`
    : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${t.base}"/>
      <stop offset="62%" stop-color="${t.mid}"/>
      <stop offset="100%" stop-color="${t.deep}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${ribs}
  ${disc}

  <text x="620" y="330" font-family="Arial, Helvetica, sans-serif" font-size="30"
        font-weight="800" fill="${t.accent}" letter-spacing="7">${t.eyebrow}</text>

  <text x="618" y="440" font-family="Arial, Helvetica, sans-serif" font-size="104"
        font-weight="900" fill="#ffffff" letter-spacing="-2">2026 UNIFORM</text>
  <text x="618" y="546" font-family="Arial, Helvetica, sans-serif" font-size="104"
        font-weight="900" fill="#ffffff" letter-spacing="-2">SCHEDULE</text>

  <rect x="622" y="600" width="150" height="7" rx="3.5" fill="${t.accent}"/>

  <text x="620" y="672" font-family="Arial, Helvetica, sans-serif" font-size="27"
        font-weight="700" fill="#ffffff" opacity="0.92" letter-spacing="1.5">${t.looks.join('  ·  ')}</text>

  <text x="620" y="762" font-family="Arial, Helvetica, sans-serif" font-size="21"
        font-weight="700" fill="#ffffff" opacity="0.42" letter-spacing="4">COLORWAY SPORTS</text>
</svg>`;

  const team = await sharp(`public/logos/teams/${t.logo}.png`)
    .resize({ height: 250, fit: 'inside' }).toBuffer();
  const teamMeta = await sharp(team).metadata();

  const nfl = await sharp('public/logos/leagues/nfl.png')
    .resize({ height: 86, fit: 'inside' }).toBuffer();
  const nflMeta = await sharp(nfl).metadata();

  await mkdir(OUT, { recursive: true });
  const info = await sharp(Buffer.from(svg))
    .composite([
      { input: team, left: Math.round(300 - teamMeta.width / 2), top: Math.round(H / 2 - teamMeta.height / 2) },
      { input: nfl, left: W - nflMeta.width - 74, top: 764 },
    ])
    .jpeg({ quality: 90 })
    .toFile(`${OUT}/cover.jpg`);

  console.log(`wrote ${OUT}/cover.jpg — ${info.width}x${info.height}, ${Math.round(info.size / 1024)}KB`);
}

const only = process.argv[2];
for (const key of only ? [only] : Object.keys(TEAMS)) await build(key);
