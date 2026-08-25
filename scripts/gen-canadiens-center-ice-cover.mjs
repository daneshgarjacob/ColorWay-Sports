// Words-only cover for the Canadiens 2026-27 center-ice post.
// No photography: the new ice is a team photo and the old ice only exists as
// broadcast stills, so neither can be re-hosted. Red-to-navy field, the
// Canadiens and NHL marks, and the two designs named in the subline.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const W = 1500, H = 1000;
const RED = '#AF1E2D', NAVY = '#192168', ICE = '#dbe4f5';
const OUT = 'public/images/posts/canadiens-new-center-ice-2026-27';

// Faint rotated ribs so the flat field has structure without reading busy.
const ribs = Array.from({ length: 22 }, (_, i) => {
  const x = -400 + i * 110;
  return `<rect x="${x}" y="-200" width="26" height="1500" fill="#ffffff" opacity="0.022" transform="rotate(18 ${x} 500)"/>`;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${RED}"/>
      <stop offset="58%" stop-color="#6d1730"/>
      <stop offset="100%" stop-color="${NAVY}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${ribs}

  <!-- faceoff-circle motif behind the crest, echoing the new open ice -->
  <circle cx="300" cy="500" r="232" fill="none" stroke="#ffffff" stroke-width="7" opacity="0.16"/>
  <circle cx="300" cy="500" r="206" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.10"/>
  <circle cx="300" cy="500" r="190" fill="#ffffff" opacity="0.94"/>

  <text x="620" y="322" font-family="Arial, Helvetica, sans-serif" font-size="30"
        font-weight="800" fill="${ICE}" letter-spacing="7">MONTREAL CANADIENS</text>

  <text x="618" y="432" font-family="Arial, Helvetica, sans-serif" font-size="104"
        font-weight="900" fill="#ffffff" letter-spacing="-2">THE NEW</text>
  <text x="618" y="538" font-family="Arial, Helvetica, sans-serif" font-size="104"
        font-weight="900" fill="#ffffff" letter-spacing="-2">CENTER ICE</text>

  <rect x="622" y="592" width="150" height="7" rx="3.5" fill="${ICE}"/>

  <text x="620" y="664" font-family="Arial, Helvetica, sans-serif" font-size="27"
        font-weight="700" fill="#ffffff" opacity="0.92" letter-spacing="1.5">2026-27</text>
  <text x="742" y="664" font-family="Arial, Helvetica, sans-serif" font-size="27"
        font-weight="700" fill="${ICE}" opacity="0.9">&#183;</text>
  <text x="768" y="664" font-family="Arial, Helvetica, sans-serif" font-size="27"
        font-weight="700" fill="#ffffff" opacity="0.92" letter-spacing="1.5">GRADED</text>
  <text x="906" y="664" font-family="Arial, Helvetica, sans-serif" font-size="27"
        font-weight="700" fill="${ICE}" opacity="0.9">&#183;</text>
  <text x="932" y="664" font-family="Arial, Helvetica, sans-serif" font-size="27"
        font-weight="700" fill="#ffffff" opacity="0.92" letter-spacing="1.5">CENTRE BELL</text>

  <text x="620" y="754" font-family="Arial, Helvetica, sans-serif" font-size="21"
        font-weight="700" fill="#ffffff" opacity="0.42" letter-spacing="4">COLORWAY SPORTS</text>
</svg>`;

const habs = await sharp('public/logos/teams/nhl-montreal-canadiens.png')
  .resize({ height: 236, fit: 'inside' }).toBuffer();
const habsMeta = await sharp(habs).metadata();

const nhl = await sharp('public/logos/nhl.png')
  .resize({ height: 86, fit: 'inside' }).toBuffer();
const nhlMeta = await sharp(nhl).metadata();

await mkdir(OUT, { recursive: true });
const info = await sharp(Buffer.from(svg))
  .composite([
    { input: habs, left: Math.round(300 - habsMeta.width / 2), top: Math.round(H / 2 - habsMeta.height / 2) },
    { input: nhl, left: 1500 - nhlMeta.width - 74, top: 756 },
  ])
  .jpeg({ quality: 90 })
  .toFile(`${OUT}/cover.jpg`);

console.log(`wrote ${OUT}/cover.jpg — ${info.width}x${info.height}, ${Math.round(info.size / 1024)}KB`);
