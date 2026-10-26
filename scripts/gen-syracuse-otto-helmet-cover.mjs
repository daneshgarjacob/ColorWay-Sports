// Cover for content/drafts/syracuse-otto-helmet-halloween-smu-2026.md
// College rule: conference logo (ACC) + team logo (Syracuse block S).
// Layout: autumn ground with falling leaves, a big white helmet drawn in SVG on
// the right with the navy-orange-navy center stripe and white facemask, the
// block S where the decal sits, a pumpkin at its base. Headline stacked left.
// We do not redraw Otto (a team mark); the team's own photos are embedded in the post.
// Run: node scripts/gen-syracuse-otto-helmet-cover.mjs
import sharp from 'sharp';
import os from 'node:os';
import fs from 'node:fs';

const OUT_DIR = 'public/images/posts/syracuse-otto-helmet-halloween-smu-2026';
const LOCKUP = `${os.homedir()}/Desktop/ColorWay Sports/BRAND - START HERE/Logos (all uses)/wordmark-lockup-white.png`;
const F = 'Hanken Grotesk';
const W = 1500, H = 1000;
const ORANGE = '#F76900', NAVY = '#000E54';

// deterministic pseudo-random for leaf placement
let seed = 7;
const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
const leaf = (x, y, s, rot, color, op) =>
  `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" opacity="${op}"><path d="M0,-40 C14,-30 30,-26 40,-8 C28,-6 24,2 30,14 C16,10 8,16 6,34 L0,26 L-6,34 C-8,16 -16,10 -30,14 C-24,2 -28,-6 -40,-8 C-30,-26 -14,-30 0,-40 Z" fill="${color}"/><path d="M0,-34 L0,46" stroke="#3a1a05" stroke-width="2" opacity="0.5"/></g>`;

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.08"/></feComponentTransfer></filter>
<radialGradient id="bg" cx="68%" cy="42%" r="85%"><stop offset="0%" stop-color="#8a3a0c"/><stop offset="60%" stop-color="#3d1a08"/><stop offset="100%" stop-color="#1a0b04"/></radialGradient>
<linearGradient id="shell" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#d9dde4"/></linearGradient>
<clipPath id="dome"><path d="M760,640 C740,420 860,240 1080,220 C1300,205 1440,360 1440,560 C1440,640 1410,700 1370,730 L1000,730 C960,700 920,690 880,690 Z"/></clipPath>
</defs>`;
svg += `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
const colors = ['#F76900', '#d4561a', '#e8a23a', '#a8320f', '#c97a1e'];
for (let i = 0; i < 26; i++) {
  let x = Math.round(rnd() * W), y = Math.round(rnd() * H);
  if (x < 700 && y > 130 && y < 700) { i--; continue; }
  svg += leaf(x, y, (0.6 + rnd() * 1.1).toFixed(2), Math.round(rnd() * 360), colors[i % colors.length], (0.25 + rnd() * 0.45).toFixed(2));
}
// helmet shell
svg += `<path d="M760,640 C740,420 860,240 1080,220 C1300,205 1440,360 1440,560 C1440,640 1410,700 1370,730 L1000,730 C960,700 920,690 880,690 Z" fill="url(#shell)" stroke="#1a0b04" stroke-opacity="0.25" stroke-width="4"/>`;
// center stripe navy-orange-navy, arcing over the crown
svg += `<g clip-path="url(#dome)" fill="none"><path d="M835,580 C840,410 950,290 1100,282 C1265,274 1385,372 1402,540" stroke="${NAVY}" stroke-width="64"/><path d="M835,580 C840,410 950,290 1100,282 C1265,274 1385,372 1402,540" stroke="${ORANGE}" stroke-width="34"/></g>`;
// ear hole + facemask
svg += ``;
svg += `<g fill="none" stroke="#f4f5f7" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"><path d="M800,600 L700,612 L690,720 L780,760 L990,735"/><path d="M700,668 L900,690"/><path d="M760,604 L748,742"/></g>`;
svg += `<g fill="none" stroke="#aeb4bf" stroke-width="4" stroke-linecap="round" opacity="0.7"><path d="M800,600 L700,612 L690,720 L780,760 L990,735"/></g>`;
// pumpkin
svg += `<g transform="translate(600 840)"><ellipse cx="-38" cy="0" rx="52" ry="62" fill="#d4561a"/><ellipse cx="38" cy="0" rx="52" ry="62" fill="#d4561a"/><ellipse cx="0" cy="0" rx="56" ry="66" fill="#F76900"/><path d="M-4,-62 C-6,-82 4,-92 16,-96" stroke="#4a5a1c" stroke-width="12" fill="none" stroke-linecap="round"/></g>`;
// headline
svg += `<text x="70" y="190" font-family="${F}" font-size="27" font-weight="800" fill="#ffc48f" letter-spacing="5">SAT OCT 31 · HALLOWEEN VS SMU</text>`;
svg += `<text x="62" y="390" font-family="${F}" font-size="225" font-weight="900" fill="#ffffff" letter-spacing="-6">OTTO</text>`;
svg += `<text x="66" y="480" font-family="${F}" font-size="84" font-weight="900" fill="${ORANGE}" letter-spacing="-1">ON THE</text>`;
svg += `<text x="66" y="565" font-family="${F}" font-size="84" font-weight="900" fill="${ORANGE}" letter-spacing="-1">HELMET</text>`;
svg += `<rect x="70" y="602" width="300" height="8" fill="#ffffff"/>`;
svg += `<text x="70" y="660" font-family="${F}" font-size="34" font-weight="800" fill="#ffffff" letter-spacing="3">FIRST TIME EVER</text>`;
// ACC chip
svg += `<rect x="70" y="852" width="160" height="96" rx="14" fill="#ffffff"/>`;
svg += `<rect width="${W}" height="${H}" filter="url(#grain)"/>`;
svg += `</svg>`;

const layers = [];
const s = await sharp('assets/logos-hires/teams/ncaa-syracuse-orange-500.png').trim().resize({ height: 180 }).png().toBuffer();
const sm = await sharp(s).metadata();
layers.push({ input: s, left: Math.round(1140 - sm.width / 2), top: Math.round(520 - sm.height / 2) });
const acc = await sharp('assets/logos-hires/leagues/ncaa-conf-acc-500.png').trim().resize({ width: 130, height: 70, fit: 'inside' }).png().toBuffer();
const am = await sharp(acc).metadata();
layers.push({ input: acc, left: Math.round(150 - am.width / 2), top: Math.round(900 - am.height / 2) });
const lockup = await sharp(LOCKUP).resize({ width: 300 }).png().toBuffer();
const lkm = await sharp(lockup).metadata();
layers.push({ input: lockup, left: W - 64 - lkm.width, top: Math.round(915 - lkm.height / 2) });

fs.mkdirSync(OUT_DIR, { recursive: true });
await sharp(Buffer.from(svg)).composite(layers).jpeg({ quality: 86, mozjpeg: true }).toFile(`${OUT_DIR}/cover.jpg`);
console.log('wrote', `${OUT_DIR}/cover.jpg`);
