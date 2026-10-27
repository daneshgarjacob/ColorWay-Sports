// Cover for the Muggsy Bogues No. 1 jersey retirement story. NBA = word-only
// cover (no photos). Layout: the rafters. A steel truss across the top with
// three hanging banners, the existing Hornets retired numbers (13 Phills,
// 30 Curry) smaller and set back, and a big new No. 1 BOGUES banner in front
// filling the right half. Stacked Hanken headline on the left, white ColorWay
// lockup bottom-left. Banners are our own drawings, not the team's artwork.
// 3:2 at 1500x1000.
import sharp from 'sharp';
import os from 'node:os';
import fs from 'node:fs';

const W = 1500, H = 1000;
const TEAL = '#00788C', PURPLE = '#1D1160', DEEP = '#120a3d', MINT = '#7fd3dd';
const OUT = 'public/images/posts/hornets-retire-muggsy-bogues-number-2026';
const LOCKUP = `${os.homedir()}/Desktop/ColorWay Sports/BRAND - START HERE/Logos (all uses)/wordmark-lockup-white.png`;
const F = 'Hanken Grotesk, Helvetica Neue, Arial, sans-serif';
fs.mkdirSync(OUT, { recursive: true });

// One hanging banner: wire from the truss, white field, teal side stripes,
// purple number, name, years, swallow-tail bottom.
function banner(cx, top, w, h, num, name, years, scale = 1, numSize = 250 * scale) {
  const x = cx - w / 2, notch = 46 * scale, stripe = 14 * scale;
  const body = `M${x},${top} H${x + w} V${top + h} L${cx},${top + h - notch} L${x},${top + h} Z`;
  return `
  <line x1="${x + w * 0.2}" y1="96" x2="${x + w * 0.2}" y2="${top}" stroke="#c9ced8" stroke-width="3"/>
  <line x1="${x + w * 0.8}" y1="96" x2="${x + w * 0.8}" y2="${top}" stroke="#c9ced8" stroke-width="3"/>
  <path d="${body}" fill="#000" opacity="0.28" transform="translate(${10 * scale},${14 * scale})"/>
  <path d="${body}" fill="#ffffff"/>
  <rect x="${x + 18 * scale}" y="${top}" width="${stripe}" height="${h - notch - 6}" fill="${TEAL}"/>
  <rect x="${x + w - 18 * scale - stripe}" y="${top}" width="${stripe}" height="${h - notch - 6}" fill="${TEAL}"/>
  <rect x="${x}" y="${top}" width="${w}" height="${12 * scale}" fill="${PURPLE}"/>
  <text x="${cx}" y="${top + 74 * scale}" text-anchor="middle" font-family="${F}" font-size="${30 * scale}" font-weight="800" fill="${TEAL}" letter-spacing="${5 * scale}">CHARLOTTE</text>
  <text x="${cx}" y="${top + 300 * scale}" text-anchor="middle" font-family="${F}" font-size="${numSize}" font-weight="900" fill="${PURPLE}" letter-spacing="${-8 * scale}">${num}</text>
  <text x="${cx}" y="${top + 380 * scale}" text-anchor="middle" font-family="${F}" font-size="${50 * scale}" font-weight="900" fill="${PURPLE}" letter-spacing="${3 * scale}">${name}</text>
  <text x="${cx}" y="${top + 430 * scale}" text-anchor="middle" font-family="${F}" font-size="${28 * scale}" font-weight="700" fill="${TEAL}" letter-spacing="${3 * scale}">${years}</text>`;
}

// Truss: two chords with diagonal bracing.
let truss = `<rect x="560" y="70" width="${W - 560}" height="8" fill="#5d5a86"/><rect x="560" y="104" width="${W - 560}" height="8" fill="#5d5a86"/>`;
for (let x = 560; x < W; x += 44) truss += `<line x1="${x}" y1="74" x2="${x + 44}" y2="108" stroke="#5d5a86" stroke-width="4"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="g" cx="0.72" cy="0.35" r="0.85">
      <stop offset="0" stop-color="#2a1a7a"/><stop offset="0.55" stop-color="${PURPLE}"/><stop offset="1" stop-color="${DEEP}"/>
    </radialGradient>
    <radialGradient id="spot" cx="0.5" cy="0" r="0.9">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="0" y="${H - 16}" width="${W}" height="16" fill="${TEAL}"/>
  <ellipse cx="1110" cy="120" rx="420" ry="820" fill="url(#spot)"/>
  ${truss}
  <g opacity="0.82">
    ${banner(785, 150, 220, 330, "13", "PHILLS", "1997-2000", 0.62, 120)}
    ${banner(1370, 150, 220, 330, "30", "CURRY", "1988-1998", 0.62, 120)}
  </g>
  ${banner(1078, 150, 340, 600, "1", "BOGUES", "1988-1998", 1.12, 330)}
  <text x="70" y="250" font-family="${F}" font-size="32" font-weight="800" fill="${MINT}" letter-spacing="6">HORNETS RETIRED NUMBERS</text>
  <text x="64" y="380" font-family="${F}" font-size="120" font-weight="900" fill="#ffffff" letter-spacing="-5">NO. 1</text>
  <text x="64" y="500" font-family="${F}" font-size="120" font-weight="900" fill="#ffffff" letter-spacing="-5">GOES</text>
  <text x="64" y="620" font-family="${F}" font-size="120" font-weight="900" fill="${MINT}" letter-spacing="-5">UP.</text>
  <rect x="70" y="655" width="120" height="8" fill="#ffffff"/>
  <text x="70" y="720" font-family="${F}" font-size="36" font-weight="600" fill="#ffffff">Muggsy Bogues, Feb. 11, 2027</text>
</svg>`;

const lockup = await sharp(LOCKUP).resize({ width: 320 }).png().toBuffer();
await sharp(Buffer.from(svg))
  .composite([{ input: lockup, left: 70, top: 820 }])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(`${OUT}/cover.jpg`);
console.log(`wrote ${OUT}/cover.jpg`);
