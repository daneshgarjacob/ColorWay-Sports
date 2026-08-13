#!/usr/bin/env node
// ORIGINAL ColorWay recreation of Netflix's 2026 MLB scorebug, drawn from scratch
// as SVG. We do NOT re-host a photograph of a live broadcast, so the diagram is
// our own artwork of the layout, which is also what lets us annotate it.
// Outputs the article diagram and the 3:2 cover.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const OUT = 'public/images/posts/netflix-mlb-scorebug-2026';

const PHI = '#E81828', MIN = '#002B5C', NFX = '#E50914';

// The bug itself, drawn at 2x for crisp downscaling.
const bug = (w, h) => `
  <rect x="0" y="0" width="${w}" height="${h}" rx="34" fill="#12151b" opacity="0.94"/>
  <rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="33" fill="none" stroke="#ffffff" stroke-opacity="0.30" stroke-width="3"/>

  <rect x="26" y="24" width="${w - 52}" height="58" rx="12" fill="${PHI}"/>
  <text x="46" y="65" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff">1.  K. SCHWARBER</text>
  <text x="${w - 46}" y="65" text-anchor="end" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff">.248</text>

  <rect x="26" y="90" width="${w - 52}" height="58" rx="12" fill="#1D4ED8"/>
  <text x="46" y="131" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff">P  T. BRADLEY</text>
  <text x="${w - 46}" y="131" text-anchor="end" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff">P:1</text>

  <rect x="26" y="166" width="300" height="86" rx="18" fill="${PHI}"/>
  <text x="60" y="228" font-family="Georgia, serif" font-size="52" font-weight="700" fill="#ffffff">P</text>
  <text x="252" y="228" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="50" font-weight="900" fill="#ffffff">0</text>

  <rect x="26" y="262" width="300" height="86" rx="18" fill="${MIN}"/>
  <text x="52" y="324" font-family="Georgia, serif" font-size="50" font-weight="700" fill="${PHI}">T</text>
  <text x="82" y="324" font-family="Georgia, serif" font-size="50" font-weight="700" fill="#ffffff">C</text>
  <text x="252" y="324" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="50" font-weight="900" fill="#ffffff">0</text>

  <text x="${w - 46}" y="200" text-anchor="end" font-family="Arial Black, Arial, sans-serif" font-size="46" font-weight="900" fill="${NFX}" letter-spacing="2">NETFLIX</text>

  <g fill="none" stroke="#ffffff" stroke-opacity="0.75" stroke-width="4">
    <rect x="472" y="224" width="40" height="40" transform="rotate(45 492 244)"/>
    <rect x="424" y="266" width="40" height="40" transform="rotate(45 444 286)"/>
    <rect x="520" y="266" width="40" height="40" transform="rotate(45 540 286)"/>
  </g>

  <path d="M 404 344 l 14 -20 l 14 20 z" fill="#ffffff"/>
  <text x="444" y="350" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff">1</text>
  <text x="492" y="350" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff">1-0</text>
  <circle cx="580" cy="338" r="13" fill="#ffffff" fill-opacity="0.22"/>
  <circle cx="614" cy="338" r="13" fill="#ffffff" fill-opacity="0.22"/>
`;

const W = 660, H = 374;

// 1) Standalone diagram on a neutral field, for the body of the article.
const diagram = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#1c2431"/><stop offset="100%" stop-color="#0a0d13"/>
  </linearGradient></defs>
  <rect width="1400" height="900" fill="url(#g)"/>
  <text x="700" y="92" text-anchor="middle" font-family="Arial, sans-serif" font-size="26"
        font-weight="800" fill="#8fa3bf" letter-spacing="6">COLORWAY SPORTS RECREATION</text>
  <g transform="translate(370, 170) scale(1.0)">${bug(W, H)}</g>
  <text x="700" y="700" text-anchor="middle" font-family="Arial, sans-serif" font-size="22"
        font-weight="600" fill="#6f8098">Our own drawing of the layout, not a broadcast still.</text>
</svg>`;

// 2) 3:2 cover.
const cover = `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1000">
  <defs><linearGradient id="c" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#241016"/><stop offset="55%" stop-color="#12151b"/><stop offset="100%" stop-color="#000000"/>
  </linearGradient></defs>
  <rect width="1500" height="1000" fill="url(#c)"/>
  <text x="750" y="250" text-anchor="middle" font-family="Arial, sans-serif" font-size="28"
        font-weight="800" fill="${NFX}" letter-spacing="7">NETFLIX MLB SCOREBUG</text>
  <g transform="translate(420, 330)">${bug(W, H)}</g>
  <text x="750" y="840" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="64"
        font-weight="900" fill="#ffffff" letter-spacing="-1">GRADED: B+</text>
  <text x="750" y="906" text-anchor="middle" font-family="Arial, sans-serif" font-size="21"
        font-weight="700" fill="#ffffff" opacity="0.45" letter-spacing="4">COLORWAY SPORTS</text>
</svg>`;

await mkdir(OUT, { recursive: true });
for (const [svg, name] of [[diagram, 'scorebug-diagram.jpg'], [cover, 'cover.jpg']]) {
  const info = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(`${OUT}/${name}`);
  console.log(`wrote ${OUT}/${name} — ${info.width}x${info.height}, ${Math.round(info.size / 1024)}KB`);
}
