// Grade card v3 — two refined directions, rendered with the Ravens sample.
//   node scripts/gen-grade-card-v3.mjs <outdir>
import sharp from 'sharp';

const W = 1600, H = 900;
const outdir = process.argv[2] ?? '.';
const T = { primary: '#241773', deep: '#100a38', accent: '#C9A227', logo: 'nfl-baltimore-ravens' };
const COND = 'Avenir Next Condensed, Arial Narrow, Arial, sans-serif';

async function logoBuf(height) {
  const b = await sharp(`public/logos/teams/${T.logo}.png`).resize({ height, fit: 'inside' }).toBuffer();
  return { b, m: await sharp(b).metadata() };
}
const flag = (fill, s, x, y) => `
  <g transform="translate(${x} ${y}) scale(${s})">
    <circle r="15" fill="none" stroke="${fill}" stroke-width="2"/>
    <circle cx="-3.1" cy="-6.6" r="2" fill="${fill}"/>
    <rect x="-4.1" y="-5.7" width="2" height="14" rx="1" fill="${fill}"/>
    <path d="M-1.3 -4 L8.4 -0.6 L3.6 1.5 L8.4 3.7 L-1.3 7 Z" fill="${fill}"/>
  </g>`;

// ---------- V3-A: Broadcast ----------
{
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${T.primary}"/><stop offset="100%" stop-color="${T.deep}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.78" cy="0.42" r="0.55">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.14"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <polygon points="0,900 520,0 640,0 120,900" fill="#ffffff" opacity="0.03"/>
  <polygon points="1050,900 1570,0 1600,0 1600,60 1130,900" fill="#000000" opacity="0.18"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" filter="url(#noise)"/>

  ${flag('#ffffff', 1.4, 92, 92)}
  <text x="128" y="101" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800" fill="#ffffff" letter-spacing="5" opacity="0.9">COLORWAY SPORTS</text>

  <g transform="skewX(-6)">
    <text x="160" y="360" font-family="${COND}" font-size="34" font-weight="700" fill="${T.accent}" letter-spacing="7">NEW UNIFORM &#183; CONFIRMED</text>
    <text x="152" y="490" font-family="${COND}" font-size="132" font-weight="800" fill="#ffffff" letter-spacing="2">RAVENS</text>
    <text x="152" y="620" font-family="${COND}" font-size="132" font-weight="800" fill="#ffffff" letter-spacing="2">WHITE NOISE</text>
  </g>
  <rect x="100" y="668" width="170" height="7" rx="3.5" fill="${T.accent}" transform="skewX(-6)"/>
  <text x="96" y="740" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#ffffff" opacity="0.82">Debuts Week 2 vs the Saints &#183; September 20</text>

  <text x="1372" y="330" text-anchor="middle" font-family="${COND}" font-size="36" font-weight="700" fill="#ffffff" opacity="0.85" letter-spacing="8">OUR GRADE</text>
  <g transform="skewX(-6)">
    <text x="1445" y="762" text-anchor="middle" font-family="${COND}" font-size="560" font-weight="800" fill="#000000" opacity="0.35">A</text>
    <text x="1432" y="750" text-anchor="middle" font-family="${COND}" font-size="560" font-weight="800" fill="#ffffff">A</text>
  </g>
  <rect x="1290" y="790" width="170" height="8" rx="4" fill="${T.accent}"/>

  <line x1="92" y1="828" x2="1508" y2="828" stroke="#ffffff" stroke-opacity="0.22" stroke-width="2"/>
  <text x="92" y="868" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="#ffffff" opacity="0.55" letter-spacing="4">EVERY JERSEY. EVERY LOGO. EVERY DETAIL.</text>
  <text x="1508" y="868" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="800" fill="#ffffff" opacity="0.75" letter-spacing="3">COLORWAYSPORTS.COM</text>
</svg>`;
  const { b, m } = await logoBuf(130);
  const info = await sharp(Buffer.from(svg))
    .composite([{ input: b, left: Math.round(1508 - m.width), top: 60 }])
    .jpeg({ quality: 92 }).toFile(`${outdir}/v3a-broadcast.jpg`);
  console.log('v3a-broadcast', Math.round(info.size / 1024) + 'KB');
}

// ---------- V3-B: Print poster ----------
{
  const dots = [];
  for (let r = 0; r < 26; r++) for (let c = 0; c < 46; c++) {
    const x = 40 + c * 34, y = 560 + r * 14 - c * 1.2;
    if (y > 540 && y < 900) dots.push(`<circle cx="${x}" cy="${y}" r="${1.6 + (r % 5) * 0.28}" fill="${T.primary}" opacity="0.10"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#f4f1ea"/>
  ${dots.join('')}
  <rect x="0" y="0" width="${W}" height="16" fill="${T.primary}"/>

  ${flag(T.primary, 1.4, 92, 104)}
  <text x="128" y="113" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800" fill="#1b1b1b" letter-spacing="5">COLORWAY SPORTS</text>

  <text x="94" y="336" font-family="${COND}" font-size="32" font-weight="700" fill="${T.primary}" letter-spacing="7">NEW UNIFORM &#183; CONFIRMED</text>
  <text x="88" y="470" font-family="${COND}" font-size="140" font-weight="800" fill="#141414" letter-spacing="1">RAVENS</text>
  <text x="88" y="606" font-family="${COND}" font-size="140" font-weight="800" fill="#141414" letter-spacing="1">WHITE NOISE</text>
  <text x="94" y="676" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="700" fill="#5a5a52">Debuts Week 2 vs the Saints &#183; September 20</text>

  <text x="1600" y="836" text-anchor="end" font-family="${COND}" font-size="820" font-weight="800" fill="${T.primary}">A</text>
  <text x="1080" y="300" font-family="${COND}" font-size="34" font-weight="700" fill="#141414" letter-spacing="8">OUR GRADE</text>
  <rect x="1082" y="318" width="150" height="8" rx="4" fill="${T.accent}"/>

  <line x1="92" y1="806" x2="980" y2="806" stroke="#141414" stroke-opacity="0.25" stroke-width="2"/>
  <text x="92" y="852" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="800" fill="#1b1b1b" letter-spacing="3">COLORWAYSPORTS.COM</text>
</svg>`;
  const { b, m } = await logoBuf(150);
  const info = await sharp(Buffer.from(svg))
    .composite([{ input: b, left: Math.round(1470 - m.width), top: 66 }])
    .jpeg({ quality: 92 }).toFile(`${outdir}/v3b-poster.jpg`);
  console.log('v3b-poster', Math.round(info.size / 1024) + 'KB');
}
