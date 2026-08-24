// Four design directions for the social grade card, rendered with one sample
// (Ravens White Noise, A) so the comparison is pure design.
//   node scripts/gen-grade-card-options.mjs <outdir>
import sharp from 'sharp';

const W = 1600, H = 900;
const outdir = process.argv[2] ?? '.';
const TEAM = { primary: '#241773', dark: '#1a1052', accent: '#9E7C0C', logo: 'nfl-baltimore-ravens' };
const EYEBROW = 'BALTIMORE RAVENS &#183; WHITE NOISE';
const TITLE = 'White Noise';
const SUB = 'Debuts Week 2 vs the Saints &#183; September 20';
const GRADE = 'A';
const BLUE = '#2f6bed';

const flag = (fill, s = 1, x = 0, y = 0) => `
  <g transform="translate(${x} ${y}) scale(${s})">
    <circle cx="-7" cy="-15" r="4.5" fill="${fill}"/>
    <rect x="-9" y="-13" width="4.5" height="32" rx="2.2" fill="${fill}"/>
    <path d="M-3 -9 L19 -1.5 L8 3.5 L19 8.5 L-3 16 Z" fill="${fill}"/>
  </g>`;

async function logoBuf(height, maxW = 480) {
  const b = await sharp(`public/logos/teams/${TEAM.logo}.png`).resize({ height, width: maxW, fit: 'inside' }).toBuffer();
  return { b, m: await sharp(b).metadata() };
}

async function render(name, svg, composites = []) {
  const info = await sharp(Buffer.from(svg)).composite(composites).jpeg({ quality: 92 }).toFile(`${outdir}/${name}.jpg`);
  console.log(`${name}: ${info.width}x${info.height} ${Math.round(info.size / 1024)}KB`);
}

// ---------- Option A: Colorway Flood — the team's color IS the card ----------
{
  const stripes = Array.from({ length: 10 }, (_, i) =>
    `<rect x="${i * 210 - 300}" y="-200" width="70" height="1400" fill="#000000" opacity="0.05" transform="rotate(16 ${i * 210} 450)"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${TEAM.primary}"/><stop offset="100%" stop-color="${TEAM.dark}"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  ${stripes}
  <text x="90" y="150" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="34" font-weight="800" fill="#ffffff" opacity="0.85" letter-spacing="6">${EYEBROW}</text>
  <text x="1510" y="700" text-anchor="end" font-family="Arial Black, Arial, sans-serif" font-size="560" font-weight="900" fill="#ffffff">${GRADE}</text>
  <text x="1500" y="770" text-anchor="end" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="30" font-weight="800" fill="${TEAM.accent}" letter-spacing="8">OUR GRADE</text>
  <text x="90" y="700" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="40" font-weight="800" fill="#ffffff" opacity="0.9">${SUB}</text>
  <rect x="0" y="836" width="${W}" height="64" fill="${BLUE}"/>
  ${flag('#ffffff', 1.35, 96, 868)}
  <text x="132" y="879" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="26" font-weight="800" fill="#ffffff" letter-spacing="5">COLORWAY SPORTS</text>
  <text x="1510" y="879" text-anchor="end" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="24" font-weight="700" fill="#ffffff" opacity="0.85" letter-spacing="3">COLORWAYSPORTS.COM</text>
</svg>`;
  const { b, m } = await logoBuf(400);
  await render('option-a-colorway-flood', svg, [{ input: b, left: Math.round(330 - m.width / 2), top: Math.round(430 - m.height / 2) }]);
}

// ---------- Option B: Site White — the website as a card ----------
{
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect x="1080" y="0" width="520" height="${H}" fill="#f4f6fa"/>
  <rect x="0" y="0" width="${W}" height="14" fill="${BLUE}"/>
  <text x="100" y="200" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="30" font-weight="800" fill="${BLUE}" letter-spacing="6">2026 NIKE RIVALRIES &#183; CONFIRMED</text>
  <text x="94" y="330" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="118" font-weight="800" fill="#0e1b33" letter-spacing="-3">Ravens ${TITLE}</text>
  <text x="100" y="410" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="38" font-weight="600" fill="#6b7488">${SUB}</text>
  <rect x="100" y="520" width="260" height="260" rx="32" fill="${BLUE}"/>
  <text x="230" y="722" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="190" font-weight="900" fill="#ffffff">${GRADE}</text>
  <text x="400" y="620" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="30" font-weight="800" fill="#0e1b33" letter-spacing="5">OUR GRADE</text>
  <rect x="400" y="648" width="120" height="8" rx="4" fill="${TEAM.accent}"/>
  <line x1="100" y1="828" x2="1000" y2="828" stroke="#e3e7ee" stroke-width="2"/>
  ${flag('${BLUE}', 1.1, 112, 862)}
  <text x="142" y="872" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="24" font-weight="800" fill="#8a93a5" letter-spacing="4">COLORWAYSPORTS.COM</text>
</svg>`;
  const { b, m } = await logoBuf(380, 440);
  await render('option-b-site-white', svg, [{ input: b, left: Math.round(1340 - m.width / 2), top: Math.round(450 - m.height / 2) }]);
}

// ---------- Option C: Split Panel — broadcast graphic ----------
{
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <polygon points="0,0 760,0 620,900 0,900" fill="${TEAM.primary}"/>
  <polygon points="760,0 800,0 660,900 620,900" fill="${TEAM.accent}"/>
  <text x="860" y="230" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="30" font-weight="800" fill="${BLUE}" letter-spacing="6">2026 NIKE RIVALRIES</text>
  <text x="854" y="350" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="104" font-weight="800" fill="#0e1b33" letter-spacing="-2">${TITLE}</text>
  <text x="860" y="420" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="34" font-weight="600" fill="#6b7488">${SUB}</text>
  <text x="850" y="768" font-family="Arial Black, Arial, sans-serif" font-size="380" font-weight="900" fill="${TEAM.primary}">${GRADE}</text>
  <text x="1180" y="700" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="30" font-weight="800" fill="#0e1b33" letter-spacing="5">OUR GRADE</text>
  <rect x="1180" y="728" width="130" height="9" rx="4.5" fill="${TEAM.accent}"/>
  ${flag('#0e1b33', 1.1, 1196, 800)}
  <text x="1226" y="810" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="23" font-weight="800" fill="#8a93a5" letter-spacing="3">COLORWAYSPORTS.COM</text>
</svg>`;
  const { b, m } = await logoBuf(420);
  await render('option-c-split-panel', svg, [{ input: b, left: Math.round(340 - m.width / 2), top: Math.round(430 - m.height / 2) }]);
}

// ---------- Option D: Ghost Letter — dark, type-led ----------
{
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#0b0d12"/>
  <text x="1560" y="880" text-anchor="end" font-family="Arial Black, Arial, sans-serif" font-size="880" font-weight="900" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.16">${GRADE}</text>
  <text x="100" y="170" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="30" font-weight="800" fill="${TEAM.accent}" letter-spacing="7">${EYEBROW}</text>
  <text x="94" y="560" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="150" font-weight="800" fill="#ffffff" letter-spacing="-3">${TITLE}</text>
  <text x="100" y="640" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="36" font-weight="600" fill="#9aa3b5">${SUB}</text>
  <rect x="100" y="700" width="320" height="110" rx="16" fill="${BLUE}"/>
  <text x="130" y="775" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="40" font-weight="800" fill="#cddafb">Grade</text>
  <text x="330" y="788" font-family="Arial Black, Arial, sans-serif" font-size="82" font-weight="900" fill="#ffffff">${GRADE}</text>
  ${flag('#ffffff', 1.1, 1310, 848)}
  <text x="1340" y="858" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="23" font-weight="800" fill="#ffffff" opacity="0.5" letter-spacing="3">COLORWAYSPORTS.COM</text>
</svg>`;
  const { b, m } = await logoBuf(230);
  await render('option-d-ghost-letter', svg, [{ input: b, left: 1280, top: 110 }]);
}
