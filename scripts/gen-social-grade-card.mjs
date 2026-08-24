// Branded grade card for X — the site aesthetic (navy field, ribs, brand-blue
// pill, watermark) packaged as a native 1600x900 timeline image.
//
//   node scripts/gen-social-grade-card.mjs \
//     --logo nfl-chicago-bears --grade "A-" \
//     --eyebrow "2026 NIKE RIVALRIES" \
//     --title "Bears Rivalries Uniform" \
//     --sub "Debuts Christmas Day vs the Packers" \
//     --out /tmp/bears-card.jpg
//
// Grades follow the site rules: letter grades, Title Case subtitle.
import sharp from 'sharp';

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
const { logo, grade, title, out } = args;
const eyebrow = args.eyebrow ?? 'COLORWAY SPORTS';
const sub = args.sub ?? '';
if (!logo || !grade || !title || !out) {
  console.error('need --logo --grade --title --out (optional --eyebrow --sub)');
  process.exit(1);
}

const W = 1600, H = 900;

const ribs = Array.from({ length: 24 }, (_, i) => {
  const x = -400 + i * 110;
  return `<rect x="${x}" y="-200" width="26" height="1400" fill="#ffffff" opacity="0.02" transform="rotate(18 ${x} 450)"/>`;
}).join('');

// Two-line titles: split on " | " in the --title value.
const titleLines = title.split(' | ');
const titleSvg = titleLines
  .map((line, i) => `<text x="720" y="${360 + i * 92}" font-family="Arial, Helvetica, sans-serif" font-size="78" font-weight="900" fill="#ffffff" letter-spacing="-1">${line}</text>`)
  .join('\n  ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0d1f3c"/>
      <stop offset="55%" stop-color="#101820"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${ribs}
  <circle cx="360" cy="430" r="285" fill="#ffffff" opacity="0.05"/>
  <circle cx="360" cy="430" r="262" fill="#ffffff" opacity="0.97"/>

  <text x="720" y="262" font-family="Arial, Helvetica, sans-serif" font-size="27"
        font-weight="800" fill="#7fa4f5" letter-spacing="6">${eyebrow}</text>
  ${titleSvg}

  <rect x="716" y="${titleLines.length > 1 ? 520 : 430}" width="300" height="150" rx="18" fill="#2f6bed"/>
  <text x="754" y="${titleLines.length > 1 ? 628 : 538}" font-family="Arial, Helvetica, sans-serif" font-size="56"
        font-weight="800" fill="#bcd0fa">Grade</text>
  <text x="${grade.length > 1 ? 908 : 928}" y="${titleLines.length > 1 ? 638 : 548}" font-family="Arial Black, Arial, sans-serif" font-size="108"
        font-weight="900" fill="#ffffff">${grade}</text>

  ${sub ? `<text x="720" y="${titleLines.length > 1 ? 736 : 646}" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#ffffff" opacity="0.85">${sub}</text>` : ''}

  <text x="720" y="828" font-family="Arial, Helvetica, sans-serif" font-size="24"
        font-weight="800" fill="#ffffff" opacity="0.4" letter-spacing="4">COLORWAYSPORTS.COM</text>
</svg>`;

const team = await sharp(`public/logos/teams/${logo}.png`)
  .resize({ height: 360, width: 420, fit: 'inside' }).toBuffer();
const teamMeta = await sharp(team).metadata();

const info = await sharp(Buffer.from(svg))
  .composite([{ input: team, left: Math.round(360 - teamMeta.width / 2), top: Math.round(430 - teamMeta.height / 2) }])
  .jpeg({ quality: 92 })
  .toFile(out);
console.log(`wrote ${out} — ${info.width}x${info.height}, ${Math.round(info.size / 1024)}KB`);
