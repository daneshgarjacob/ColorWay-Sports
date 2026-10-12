// Cover for nba-classic-edition-jerseys-courts-2026-27 (the four ABA Classic Edition sets, ranked).
//
// House style (gen-nba-city-edition-cover.mjs / gen-mlb-tracker-cover.mjs): navy ground, grain,
// skewed Hanken kicker chips, skewed Anton headline, red corner slash, NBA mark top-right, real
// ColorWay wordmark bottom-left. Ranking covers never reveal the order
// (feedback_ranking_covers_dont_reveal_order), so the four team photos sit ALPHABETICALLY
// (Nets, Nuggets, Pacers, Spurs) with no numbers or grades, and the hook asks which is No. 1.
//
// Sources are the team-released photos Jake downloaded 2026-10-12, archived after use in
// ~/Desktop/colorway-archive/nba-classic-edition-2026-10-12/.
// Usage: node scripts/gen-nba-classic-edition-cover.mjs [srcDir] [out.jpg]
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const SRC = process.argv[2] || join(homedir(), "Desktop", "colorway-archive", "nba-classic-edition-2026-10-12");
const OUT = process.argv[3] || "public/images/posts/nba-classic-edition-jerseys-courts-2026-27/cover.jpg";

const W = 1500, H = 1000, M = 92, PAD = 24;
const RED = "#C8102E";
const TILES = [
  { file: "HUcbfGCWgAAJXn7.jpg", logo: "nba-brooklyn-nets.png", pos: "north" },
  { file: "HUcZ9viasAAKtUG.jpg", logo: "nba-denver-nuggets.png", pos: "north" },
  { file: "HUcYfIgXoAA3uSg.jpg", logo: "nba-indiana-pacers.png", pos: "centre" },
  { file: "HUcaSnkWkAAGbb1.png", logo: "nba-san-antonio-spurs.png", pos: "centre" },
];

async function textWidth(str, size, ls) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="200"><rect width="2400" height="200" fill="#ffffff"/>` +
    `<text x="20" y="130" font-family="Hanken Grotesk" font-weight="800" font-size="${size}" letter-spacing="${ls}" fill="#000000">${str}</text></svg>`;
  const { info } = await sharp(Buffer.from(svg)).png().trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
  return info.width;
}
const K1 = "ABA-NBA 50TH ANNIVERSARY", K2 = "WHICH ONE IS NO. 1?";
const w1 = Math.round((await textWidth(K1, 25, 4)) + PAD * 2);
const w2 = Math.round((await textWidth(K2, 25, 4)) + PAD * 2);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1d3f7a"/><stop offset="55%" stop-color="#112750"/><stop offset="100%" stop-color="#08152a"/></linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.3" r="0.75"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.13"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.045 0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <polygon points="1325,1000 1825,0 1865,0 1865,140 1410,1000" fill="#000000" opacity="0.22"/>
  <polygon points="1280,1000 1780,0 1812,0 1315,1000" fill="${RED}" opacity="0.85"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" filter="url(#noise)"/>
  <g transform="translate(${M} 52) skewX(-8)">
    <rect x="0" y="0" width="${w1}" height="52" fill="${RED}"/>
    <text x="${PAD}" y="36" font-family="Hanken Grotesk" font-weight="800" font-size="25" fill="#ffffff" letter-spacing="4">${K1}</text>
  </g>
  <g transform="translate(${M + w1 + 16} 52) skewX(-8)">
    <rect x="0" y="0" width="${w2}" height="52" fill="none" stroke="#8fb2e8" stroke-width="2"/>
    <text x="${PAD}" y="36" font-family="Hanken Grotesk" font-weight="800" font-size="25" fill="#8fb2e8" letter-spacing="4">${K2}</text>
  </g>
  <g transform="translate(${M} 790) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="104" fill="#ffffff">NBA CLASSIC EDITION 2026-27</text>
  </g>
  <g transform="translate(${M} 900) skewX(-6)">
    <text x="0" y="0" font-family="Anton" font-size="104" fill="#ffffff">JERSEYS + COURTS <tspan fill="#ff4b63">RANKED</tspan></text>
  </g>
  <line x1="${M}" y1="928" x2="1265" y2="928" stroke="#ffffff" stroke-opacity="0.22" stroke-width="2"/>
</svg>`;

// Four photo tiles, alphabetical, each with the real team logo in a white disc at the foot.
const GAP = 20, TW = Math.floor((W - M * 2 - GAP * 3) / 4), TH = 480, TOP = 132, R = 16;
const comps = [];
for (let i = 0; i < TILES.length; i++) {
  const t = TILES[i];
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}"><rect width="${TW}" height="${TH}" rx="${R}" fill="#fff"/></svg>`);
  const photo = await sharp(join(SRC, t.file)).resize({ width: TW, height: TH, fit: "cover", position: t.pos })
    .composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  const left = M + i * (TW + GAP);
  const shadow = await sharp({ create: { width: TW, height: TH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.5 } } })
    .composite([{ input: mask, blend: "dest-in" }]).blur(10).png().toBuffer();
  comps.push({ input: shadow, left, top: TOP + 8 });
  comps.push({ input: photo, left, top: TOP });
  const D = 104;
  const disc = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${D}" height="${D}"><circle cx="${D / 2}" cy="${D / 2}" r="${D / 2 - 2}" fill="#ffffff" stroke="#14284b" stroke-opacity="0.15" stroke-width="2"/></svg>`);
  const logo = await sharp(join("assets/logos-hires/teams", t.logo)).trim({ threshold: 1 }).resize({ width: 72, height: 72, fit: "inside" }).toBuffer();
  const lm = await sharp(logo).metadata();
  const dl = Math.round(left + TW / 2 - D / 2), dt = TOP + TH - D / 2;
  comps.push({ input: disc, left: dl, top: dt });
  comps.push({ input: logo, left: Math.round(dl + (D - lm.width) / 2), top: Math.round(dt + (D - lm.height) / 2) });
}

const nba = await sharp("assets/logos-hires/leagues/nba.png").trim({ threshold: 1 }).resize({ height: 84, width: 140, fit: "inside" }).toBuffer();
const nm = await sharp(nba).metadata();
comps.push({ input: nba, left: W - M - nm.width, top: 36 });

const wm = await sharp("public/brand/colorway-sports-logo-white.png").resize({ height: 30 }).toBuffer();
comps.push({ input: wm, left: M, top: 951 });

mkdirSync(dirname(OUT), { recursive: true });
const info = await sharp(Buffer.from(svg)).composite(comps).jpeg({ quality: 84, mozjpeg: true }).toFile(OUT);
console.log(`${OUT} ${info.width}x${info.height} ${Math.round(info.size / 1024)}KB`);
