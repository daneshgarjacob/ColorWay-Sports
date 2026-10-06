// Words-only cover for the Todd Radom interview. No team marks: navy field,
// red accent, the designer's name and his headline projects. 3:2 at 1500x1000.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const W = 1500, H = 1000;
const NAVY = '#14225A', DEEP = '#0B1533', RED = '#E03A3E';
const OUT = 'public/images/posts/todd-radom-interview';

const ribs = Array.from({ length: 22 }, (_, i) => {
  const x = -400 + i * 110;
  return `<rect x="${x}" y="-200" width="26" height="1500" fill="#ffffff" opacity="0.022" transform="rotate(18 ${x} 500)"/>`;
}).join('');

const F = 'Arial, Helvetica, sans-serif';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${NAVY}"/>
      <stop offset="65%" stop-color="#101c48"/>
      <stop offset="100%" stop-color="${DEEP}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${ribs}
  <text x="120" y="300" font-family="${F}" font-size="32" font-weight="800" fill="${RED}" letter-spacing="7">THE COLORWAY INTERVIEW</text>
  <text x="114" y="440" font-family="${F}" font-size="150" font-weight="900" fill="#ffffff" letter-spacing="-3">TODD RADOM</text>
  <rect x="120" y="485" width="180" height="10" fill="${RED}"/>
  <text x="120" y="580" font-family="${F}" font-size="50" font-weight="700" fill="#ffffff">The designer behind the Nationals,</text>
  <text x="120" y="644" font-family="${F}" font-size="50" font-weight="700" fill="#ffffff">the Angels and Super Bowl XXXVIII</text>
  <text x="120" y="770" font-family="${F}" font-size="30" font-weight="800" fill="#AEB8D6" letter-spacing="5">"WE ARE AT PEAK UNIFORM"</text>
  <text x="120" y="900" font-family="${F}" font-size="24" font-weight="800" fill="#ffffff" opacity="0.55" letter-spacing="6">COLORWAY SPORTS</text>
</svg>`;

await mkdir(OUT, { recursive: true });
await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(`${OUT}/cover.jpg`);
console.log(`wrote ${OUT}/cover.jpg`);
