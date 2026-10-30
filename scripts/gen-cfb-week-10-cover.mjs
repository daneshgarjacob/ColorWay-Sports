// Cover for the college football Week 10 uniform guide (Nov 3 - 7, 2026).
// Same frame as the Week 9 cover (scripts/gen-cfb-week-9-cover.mjs): dark ground, orange accent, headline and
// team + conference logos on the left (college cover rule), the week's real uniform imagery on the right.
// Right side: Tennessee's Dark Mode jersey (the one special look announced so far, from Tennessee Athletics'
// adidas reveal photos, already cropped into public/images/posts/tennessee-dark-mode-uniforms-kentucky-2026/cover.jpg),
// then three marquee matchups as logo tiles. No uniform is pictured that has not been announced.
// usage: node scripts/gen-cfb-week-10-cover.mjs [out]
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [OUT = 'public/images/posts/college-football-week-10-uniforms-2026/cover.jpg'] = process.argv.slice(2);
const TENN = 'public/images/posts/tennessee-dark-mode-uniforms-kentucky-2026/cover.jpg';

const W = 1500, H = 1000, M = 70;
const BG = '#0d0f14';
const ORANGE = '#FF8200';
const PAPER = '#f3efe7';
const PAD = 20;

async function textWidth(str, size, ls) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="200"><rect width="2400" height="200" fill="#ffffff"/>` +
    `<text x="20" y="130" font-family="Hanken Grotesk" font-weight="800" font-size="${size}" letter-spacing="${ls}" fill="#000000">${str}</text></svg>`;
  const { info } = await sharp(Buffer.from(svg)).png().trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
  return info.width;
}

const K1 = 'CFB WEEK 10 UNIFORMS', K2 = 'NOV 3 - 7';
const w1 = Math.round(await textWidth(K1, 22, 4) + PAD * 2);
const w2 = Math.round(await textWidth(K2, 22, 4) + PAD * 2);

// right side: Tennessee panel on top, three matchup tiles below
const RX = 640, TOP_H = 600, GAP = 10;
const BW = Math.floor((W - RX - GAP * 2) / 3);
const TILE_Y = TOP_H + GAP, TILE_H = H - TOP_H - GAP;
const tileX = (i) => RX + (BW + GAP) * i;
const tileW = (i) => (i === 2 ? W - tileX(2) : BW);

const matchups = [
  { away: 'ncaa-miami-hurricanes', home: 'ncaa-notre-dame-fighting-irish', label: 'MIAMI AT NOTRE DAME' },
  { away: 'ncaa-alabama-crimson-tide', home: 'ncaa-lsu-tigers', label: 'ALABAMA AT LSU' },
  { away: 'ncaa-oregon-ducks', home: 'ncaa-ohio-state-buckeyes', label: 'OREGON AT OHIO STATE' },
];

const tilesSvg = matchups.map((m, i) => {
  const x = tileX(i), w = tileW(i);
  return `<rect x="${x}" y="${TILE_Y}" width="${w}" height="${TILE_H}" fill="${PAPER}"/>` +
    `<text x="${x + w / 2}" y="${TILE_Y + 190}" text-anchor="middle" font-family="Hanken Grotesk" font-weight="800" font-size="30" fill="${BG}" fill-opacity="0.45">at</text>` +
    `<text x="${x + w / 2}" y="${TILE_Y + 350}" text-anchor="middle" font-family="Hanken Grotesk" font-weight="800" font-size="17" letter-spacing="2" fill="${BG}" fill-opacity="0.8">${m.label}</text>`;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="glow" cx="0.25" cy="0.35" r="0.7">
      <stop offset="0%" stop-color="#2a1a0c"/><stop offset="100%" stop-color="${BG}"/>
    </radialGradient>
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" filter="url(#noise)"/>

  <g transform="translate(${M} 62) skewX(-8)">
    <rect x="0" y="0" width="${w1}" height="46" fill="${ORANGE}"/>
    <text x="${PAD}" y="32" font-family="Hanken Grotesk" font-weight="800" font-size="22" fill="${BG}" letter-spacing="4">${K1}</text>
  </g>
  <g transform="translate(${M} 120) skewX(-8)">
    <rect x="0" y="0" width="${w2}" height="46" fill="none" stroke="#ffffff" stroke-opacity="0.8" stroke-width="2"/>
    <text x="${PAD}" y="32" font-family="Hanken Grotesk" font-weight="800" font-size="22" fill="#ffffff" letter-spacing="4">${K2}</text>
  </g>

  <g transform="translate(${M} 330) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="118" fill="${ORANGE}">WEEK 10</text>
  </g>
  <g transform="translate(${M} 455) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="118" fill="#ffffff">UNIFORMS</text>
  </g>
  <text x="${M}" y="520" font-family="Hanken Grotesk" font-weight="800" font-size="25" fill="#ffffff" fill-opacity="0.85">Tennessee's Dark Mode, Florida all blue,</text>
  <text x="${M}" y="556" font-family="Hanken Grotesk" font-weight="800" font-size="25" fill="#ffffff" fill-opacity="0.85">Miami at Notre Dame and Alabama at LSU</text>

  <rect x="${M}" y="610" width="${RX - M - 40}" height="150" rx="14" fill="${PAPER}"/>
  <rect x="${M}" y="776" width="${RX - M - 40}" height="96" rx="14" fill="${PAPER}" fill-opacity="0.92"/>
  ${tilesSvg}
</svg>`;

const comps = [];

async function logo(file, cx, cy, h, w) {
  const buf = await sharp(file).resize({ height: h, width: w, fit: 'inside' }).toBuffer();
  const m = await sharp(buf).metadata();
  comps.push({ input: buf, left: Math.round(cx - m.width / 2), top: Math.round(cy - m.height / 2) });
}
const stripW = RX - M - 40;
const teams = ['ncaa-tennessee-volunteers', 'ncaa-florida-gators', 'ncaa-miami-hurricanes', 'ncaa-notre-dame-fighting-irish'];
for (let i = 0; i < teams.length; i++) {
  await logo(`assets/logos-hires/teams/${teams[i]}.png`, M + stripW * (i + 0.5) / teams.length, 685, 104, 112);
}
const confs = ['ncaa-conf-sec', 'ncaa-conf-acc', 'ncaa-conf-big-ten', 'ncaa-conf-big-12'];
for (let i = 0; i < confs.length; i++) {
  await logo(`assets/logos-hires/leagues/${confs[i]}.png`, M + stripW * (i + 0.5) / confs.length, 824, 70, 120);
}

// Tennessee Dark Mode: the black jersey with orange numbers and the collar Power T (right half of the Dark Mode cover)
const tn = await sharp(TENN).extract({ left: 760, top: 0, width: 740, height: 640 }).resize(W - RX, TOP_H, { fit: 'cover', position: 'centre' }).toBuffer();
comps.push({ input: tn, left: RX, top: 0 });

// matchup tiles: away logo on top, home logo below the "at"
for (let i = 0; i < matchups.length; i++) {
  const cx = tileX(i) + tileW(i) / 2;
  await logo(`assets/logos-hires/teams/${matchups[i].away}.png`, cx, TILE_Y + 95, 110, 150);
  await logo(`assets/logos-hires/teams/${matchups[i].home}.png`, cx, TILE_Y + 265, 110, 150);
}

const label = (t, x, y) => `<g transform="translate(${x} ${y}) skewX(-8)"><rect x="0" y="0" width="${t.length * 15 + 30}" height="36" fill="${ORANGE}"/><text x="15" y="25" font-family="Hanken Grotesk" font-weight="800" font-size="18" fill="${BG}" letter-spacing="3">${t}</text></g>`;
comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
  label('TENNESSEE DARK MODE', RX + 20, TOP_H - 54) + `</svg>`), left: 0, top: 0 });

const wm = await sharp('public/brand/colorway-sports-logo-white.png').resize({ height: 30 }).toBuffer();
comps.push({ input: wm, left: M, top: 920 });

mkdirSync(dirname(OUT), { recursive: true });
const info = await sharp(Buffer.from(svg)).composite(comps).jpeg({ quality: 84 }).toFile(OUT);
console.log(`${OUT} ${info.width}x${info.height} ${Math.round(info.size / 1024)}KB`);
