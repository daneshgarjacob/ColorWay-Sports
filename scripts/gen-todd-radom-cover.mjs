// Cover for the Todd Radom interview. Warm drafting-paper field, his Topps
// Allen & Ginter card (from toddradom.com) tilted on the left, stacked name on
// the right, three of his marks (Nationals, Angels, Super Bowl XXXVIII) and the
// ColorWay wordmark lockup (recolored navy) along the bottom. 3:2 at 1500x1000 per the cover spec.
// Source images live in the session scratchpad; pass the folder as argv[2].
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const SRC = process.argv[2];
const W = 1500, H = 1000;
const PAPER = '#F3EEE3', NAVY = '#14225A', RED = '#C8102E';
const OUT = 'public/images/posts/todd-radom-interview';
// Hanken Grotesk is the wordmark's typeface (installed in ~/Library/Fonts).
const F = 'Hanken Grotesk, Helvetica Neue, Arial, sans-serif';

// Faint drafting grid.
const grid = [];
for (let x = 0; x <= W; x += 50) grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${NAVY}" stroke-width="1" opacity="${x % 250 ? 0.035 : 0.07}"/>`);
for (let y = 0; y <= H; y += 50) grid.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${NAVY}" stroke-width="1" opacity="${y % 250 ? 0.035 : 0.07}"/>`);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  ${grid.join('')}
  <rect x="0" y="0" width="${W}" height="14" fill="${NAVY}"/>
  <rect x="0" y="14" width="${W}" height="6" fill="${RED}"/>
  <text x="742" y="172" font-family="${F}" font-size="40" font-weight="800" fill="${RED}" letter-spacing="-0.5">A ColorWay Interview</text>
  <text x="734" y="318" font-family="${F}" font-size="168" font-weight="800" fill="${NAVY}" letter-spacing="-6">TODD</text>
  <text x="734" y="470" font-family="${F}" font-size="168" font-weight="800" fill="${NAVY}" letter-spacing="-6">RADOM</text>
  <rect x="742" y="505" width="120" height="8" fill="${RED}"/>
  <text x="742" y="572" font-family="${F}" font-size="34" font-weight="600" fill="${NAVY}">The designer behind the Nationals,</text>
  <text x="742" y="616" font-family="${F}" font-size="34" font-weight="600" fill="${NAVY}">the Angels and Super Bowl XXXVIII</text>
  <line x1="742" y1="690" x2="1420" y2="690" stroke="${NAVY}" stroke-width="2" opacity="0.18"/>
</svg>`;

// Card with white border, tilted, with a soft shadow.
const cardH = 760, cardW = Math.round(820 * cardH / 1151);
const bordered = await sharp(`${SRC}/RADOM_TOPPS_CARD.jpg`).resize(cardW, cardH)
  .extend({ top: 14, bottom: 14, left: 14, right: 14, background: '#ffffff' }).png().toBuffer();
const tilted = await sharp(bordered).rotate(-4, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
const tm = await sharp(tilted).metadata();
// sharp runs composite last, so flatten the shadow shape first, then blur it.
const shadowShape = await sharp({ create: { width: tm.width + 120, height: tm.height + 120, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg width="${tm.width}" height="${tm.height}"><rect x="${(tm.width - cardW - 28) / 2}" y="${(tm.height - cardH - 28) / 2}" width="${cardW + 28}" height="${cardH + 28}" fill="#0B1533" opacity="0.38" transform="rotate(-4 ${tm.width / 2} ${tm.height / 2})"/></svg>`), left: 75, top: 85 }])
  .png().toBuffer();
const shadow = await sharp(shadowShape).blur(22).png().toBuffer();

// Marks: trimmed to the same height, spaced evenly across the right column;
// white backgrounds multiply away on the paper.
const MARK_H = 170, COL_L = 742, COL_R = 1420;
const trimmed = await Promise.all([
  ['NATS.png', 'multiply'], ['ANGELS_A_cut.png', 'over'], ['SB38.png', 'multiply'],
].map(async ([f, blend]) => {
  let img = sharp(`${SRC}/${f}`);
  if (blend === 'multiply') img = img.flatten({ background: '#ffffff' }).trim({ threshold: 12 });
  const buf = await img.resize({ height: MARK_H }).png().toBuffer();
  return { buf, blend, w: (await sharp(buf).metadata()).width };
}));
const gap = (COL_R - COL_L - trimmed.reduce((a, t) => a + t.w, 0)) / (trimmed.length - 1);
let x = COL_L;
const marks = trimmed.map((t) => { const m = { input: t.buf, left: Math.round(x), top: 715, blend: t.blend }; x += t.w + gap; return m; });

// Brand lockup (flag badge + wordmark + tagline). The source is white, so keep
// its alpha and fill it with brand navy.
const LOCK_W = 430;
const lockAlpha = await sharp(`${SRC}/wordmark-lockup.png`).resize({ width: LOCK_W }).extractChannel('alpha').toBuffer();
const lockMeta = await sharp(lockAlpha).metadata();
const lockup = await sharp({ create: { width: lockMeta.width, height: lockMeta.height, channels: 3, background: '#003087' } })
  .joinChannel(lockAlpha).png().toBuffer();

await mkdir(OUT, { recursive: true });
await sharp(Buffer.from(svg))
  .composite([
    { input: shadow, left: 30, top: 40 },
    { input: tilted, left: 90, top: 100 },
    ...marks,
    { input: lockup, left: COL_L, top: 925 },
  ])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(`${OUT}/cover.jpg`);
console.log(`wrote ${OUT}/cover.jpg`);
