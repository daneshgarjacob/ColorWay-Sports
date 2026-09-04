// Covers for the 30 MLB uniform-schedule posts: the team's actual jerseys on
// white cards instead of the flat color swatches the first version used.
// Jersey shots are the daily tracker's product-shot library in
// public/images/posts/mlb-daily-tracker/<team>-<uniform>.(png|jpg); most are
// front+back composites on white, which is why they sit on white cards rather
// than being cut out (white home jerseys do not survive a background knockout).
// 3:2 at 1500x1000 per the cover spec.
//
//   node scripts/gen-mlb-schedule-covers.mjs            # all 30
//   node scripts/gen-mlb-schedule-covers.mjs mets rays   # some
//   OUT_DIR=/tmp/x node scripts/gen-mlb-schedule-covers.mjs   # preview elsewhere
import sharp from 'sharp';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const W = 1500, H = 1000;
const LIB = 'public/images/posts/mlb-daily-tracker';
const OUT_ROOT = process.env.OUT_DIR || 'public/images/posts';

const TEAMS = {
  angels: 'ANGELS', astros: 'ASTROS', athletics: 'ATHLETICS', 'blue-jays': 'BLUE JAYS',
  braves: 'BRAVES', brewers: 'BREWERS', cardinals: 'CARDINALS', cubs: 'CUBS',
  diamondbacks: 'D-BACKS', dodgers: 'DODGERS', giants: 'GIANTS', guardians: 'GUARDIANS',
  mariners: 'MARINERS', marlins: 'MARLINS', mets: 'METS', nationals: 'NATIONALS',
  orioles: 'ORIOLES', padres: 'PADRES', phillies: 'PHILLIES', pirates: 'PIRATES',
  rangers: 'RANGERS', rays: 'RAYS', 'red-sox': 'RED SOX', reds: 'REDS', rockies: 'ROCKIES',
  royals: 'ROYALS', tigers: 'TIGERS', twins: 'TWINS', 'white-sox': 'WHITE SOX', yankees: 'YANKEES',
};

// Label from the filename remainder. Short on purpose: the cards are narrow.
function label(rest) {
  const words = rest.split('-').map((w) => {
    if (w === 'cc') return 'CITY CONNECT';
    if (w === 'alternate') return 'ALT';
    if (w === 'fod') return 'FIELD OF DREAMS';
    return w.toUpperCase();
  });
  let s = words.join(' ')
    .replace('CITY CONNECT CITY CONNECT', 'CITY CONNECT')
    .replace('FIELD OF DREAMS FIELD OF DREAMS', 'FIELD OF DREAMS');
  return s;
}

// Home first, road second, alternates, then City Connect and throwbacks last.
function rank(rest) {
  if (/^home/.test(rest)) return 0;
  if (/road/.test(rest)) return 1;
  if (/cc|city-connect/.test(rest)) return 3;
  if (/throwback|fod|field-of-dreams|cooperstown/.test(rest)) return 4;
  return 2;
}

function wrap(text, max) {
  if (text.length <= max) return [text];
  const words = text.split(' ');
  const lines = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if ((cur + ' ' + w).trim().length > max && cur) lines.push(w);
    else lines[lines.length - 1] = (cur + ' ' + w).trim();
  }
  return lines.slice(0, 2);
}

function hexes(gradient) {
  return gradient.match(/#[0-9a-fA-F]{6}/g) || ['#14284b', '#0a1a3a'];
}

// Library files that are duplicates for cover purposes (a second gray, a
// leftover cutout) and should not take a card.
const SKIP = { dodgers: ['alt-road-gray'] };

const files = await readdir(LIB);
const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(TEAMS);

for (const team of want) {
  const slug = `${team}-uniform-schedule-2026`;
  const post = await readFile(`content/posts/${slug}.md`, 'utf8');
  const fm = post.split('---')[1];
  const gradient = (fm.match(/^gradient:\s*"?([^"\n]+)"?/m) || [])[1] || '';
  const logo = (fm.match(/^logoSrc2:\s*"?([^"\n]+)"?/m) || [])[1];
  const [c0, c1] = hexes(gradient);
  const cN = hexes(gradient).slice(-1)[0];

  // Pick the jersey files for this team, preferring png over jpg per uniform.
  const byUniform = new Map();
  for (const f of files) {
    if (!f.startsWith(team + '-')) continue;
    const rest = f.slice(team.length + 1).replace(/\.(png|jpe?g|webp)$/, '');
    if (/cutout|cover/.test(rest)) continue;
    if ((SKIP[team] || []).includes(rest)) continue;
    const prev = byUniform.get(rest);
    if (!prev || f.endsWith('.png')) byUniform.set(rest, f);
  }
  const uniforms = [...byUniform.keys()].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)).slice(0, 6);
  const n = uniforms.length;

  // Card row geometry.
  const margin = 70, gap = n >= 6 ? 18 : 24;
  const cardW = Math.min(340, Math.floor((W - margin * 2 - gap * (n - 1)) / n));
  const cardH = Math.min(cardW, 300);
  const rowTop = 590;
  const rowLeft = Math.round((W - (cardW * n + gap * (n - 1))) / 2);

  const cards = uniforms.map((u, i) => {
    const x = rowLeft + i * (cardW + gap);
    const lines = wrap(label(u), n >= 6 ? 15 : n === 5 ? 18 : 22);
    const fs = n >= 6 ? 17 : 20;
    const text = lines.map((l, j) => `<text x="${x + cardW / 2}" y="${rowTop + cardH + 34 + j * (fs + 6)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fs}" font-weight="800" fill="#ffffff" letter-spacing="1.5">${l}</text>`).join('');
    return `<rect x="${x}" y="${rowTop}" width="${cardW}" height="${cardH}" rx="16" fill="#ffffff"/>${text}`;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c0}"/>
      <stop offset="55%" stop-color="#0b1220"/>
      <stop offset="100%" stop-color="${cN}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${W}" height="12" fill="${c1 || c0}"/>
  <rect x="0" y="${H - 12}" width="${W}" height="12" fill="${c1 || c0}"/>
  <circle cx="${W / 2}" cy="180" r="118" fill="#ffffff"/>
  <text x="${W / 2}" y="418" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="108" font-weight="900" fill="#ffffff" letter-spacing="-1">${TEAMS[team]}</text>
  <text x="${W / 2}" y="482" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="800" fill="#ffffff" opacity="0.92" letter-spacing="2">UNIFORM SCHEDULE 2026</text>
  <text x="${W / 2}" y="530" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#ffffff" opacity="0.6" letter-spacing="4">EVERY JERSEY &amp; WHEN THEY WEAR IT</text>
  ${cards}
</svg>`;

  const composites = [];
  if (logo) {
    const lg = await sharp(`public${logo}`).resize({ width: 170, height: 170, fit: 'inside' }).toBuffer();
    const m = await sharp(lg).metadata();
    composites.push({ input: lg, left: Math.round(W / 2 - m.width / 2), top: Math.round(180 - m.height / 2) });
  }
  const pad = 14;
  for (let i = 0; i < n; i++) {
    const f = byUniform.get(uniforms[i]);
    const img = await sharp(resolve(LIB, f)).flatten({ background: '#ffffff' })
      .resize({ width: cardW - pad * 2, height: cardH - pad * 2, fit: 'inside' }).toBuffer();
    const m = await sharp(img).metadata();
    const x = rowLeft + i * (cardW + gap);
    composites.push({ input: img, left: Math.round(x + cardW / 2 - m.width / 2), top: Math.round(rowTop + cardH / 2 - m.height / 2) });
  }
  const brand = await sharp('public/brand/colorway-sports-logo-white.png').resize({ width: 240 }).toBuffer();
  const bm = await sharp(brand).metadata();
  composites.push({ input: brand, left: W - bm.width - 56, top: H - bm.height - 34 });

  const outDir = `${OUT_ROOT}/${slug}`;
  await mkdir(outDir, { recursive: true });
  const info = await sharp(Buffer.from(svg)).composite(composites).jpeg({ quality: 86 }).toFile(`${outDir}/cover.jpg`);
  console.log(`${team}: ${n} jerseys [${uniforms.join(', ')}] -> ${outDir}/cover.jpg ${Math.round(info.size / 1024)}KB`);
}
