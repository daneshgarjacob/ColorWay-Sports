// Cover for the Todd Radom interview: his Topps Allen & Ginter card (from
// toddradom.com) on a navy field, name + headline projects, and three of his
// marks along the bottom. 3:2 at 1500x1000 per the cover spec.
// Source images live in the session scratchpad; pass the folder as argv[2].
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const SRC = process.argv[2];
const W = 1500, H = 1000;
const NAVY = '#14225A', DEEP = '#0B1533', RED = '#E03A3E';
const OUT = 'public/images/posts/todd-radom-interview';
const F = 'Arial, Helvetica, sans-serif';

const ribs = Array.from({ length: 22 }, (_, i) => {
  const x = -400 + i * 110;
  return `<rect x="${x}" y="-200" width="26" height="1500" fill="#ffffff" opacity="0.022" transform="rotate(18 ${x} 500)"/>`;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${NAVY}"/><stop offset="65%" stop-color="#101c48"/><stop offset="100%" stop-color="${DEEP}"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${ribs}
  <text x="730" y="190" font-family="${F}" font-size="28" font-weight="800" fill="${RED}" letter-spacing="6">THE COLORWAY INTERVIEW</text>
  <text x="726" y="300" font-family="${F}" font-size="100" font-weight="900" fill="#ffffff" letter-spacing="-3">TODD RADOM</text>
  <rect x="730" y="335" width="160" height="9" fill="${RED}"/>
  <text x="730" y="415" font-family="${F}" font-size="36" font-weight="700" fill="#ffffff">The designer behind the Nationals,</text>
  <text x="730" y="463" font-family="${F}" font-size="36" font-weight="700" fill="#ffffff">the Angels and Super Bowl XXXVIII</text>
  <text x="730" y="530" font-family="${F}" font-size="26" font-weight="800" fill="#AEB8D6" letter-spacing="4">"WE ARE AT PEAK UNIFORM"</text>
  <text x="730" y="945" font-family="${F}" font-size="20" font-weight="800" fill="#ffffff" opacity="0.5" letter-spacing="5">COLORWAY SPORTS</text>
</svg>`;

// Portrait card, slight drop shadow.
const cardH = 800, cardW = Math.round(820 * cardH / 1151);
const card = await sharp(`${SRC}/RADOM_TOPPS_CARD.jpg`).resize(cardW, cardH).toBuffer();
const shadow = await sharp({ create: { width: cardW + 40, height: cardH + 40, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg width="${cardW + 40}" height="${cardH + 40}"><rect x="20" y="24" width="${cardW}" height="${cardH}" rx="10" fill="#000" opacity="0.45"/></svg>`) }])
  .blur(12).png().toBuffer();

// Three marks (Angels, 2018 ASG, Lakers 60th) on white chips along the bottom right.
const chip = async (file, bg = '#ffffff') => {
  const inner = await sharp(`${SRC}/${file}`).flatten({ background: bg }).resize(200, 200, { fit: 'contain', background: bg }).toBuffer();
  return sharp({ create: { width: 220, height: 220, channels: 3, background: bg } }).composite([{ input: inner, left: 10, top: 10 }]).png().toBuffer();
};
const marks = [
  await chip('ANGELS.jpg'),
  await chip('2018-MLB-ALL-STAR-GAME-LOGO-WASHINGTON-NATIONALS.jpg'),
  await chip('LAKERS60.png'),
];

await mkdir(OUT, { recursive: true });
await sharp(Buffer.from(svg))
  .composite([
    { input: shadow, left: 70, top: 80 },
    { input: card, left: 90, top: 100 },
    ...marks.map((m, i) => ({ input: m, left: 730 + i * 245, top: 610 })),
  ])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(`${OUT}/cover.jpg`);
console.log(`wrote ${OUT}/cover.jpg`);
