#!/usr/bin/env node
// 3:2 (1500x1000) cover for the Broncos uniform-schedule post.
// Jake asked for the Broncos' own uniform-schedule graphic to BE the cover, but
// that art is 4:5 portrait and cropping it to 3:2 would cut off most of the
// grid. So the full graphic is centred at height on a navy field instead —
// nothing is lost and the post still meets the 3:2 cover spec.

import sharp from "sharp";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(__dirname, "../public/images/posts/broncos-uniform-schedule-2026");
const ART = `${DIR}/uniform-schedule-graphic.jpg`;
const OUT = `${DIR}/cover.jpg`;
const TEAM = resolve(__dirname, "../public/logos/teams/nfl-denver-broncos.png");
const LEAGUE = resolve(__dirname, "../public/logos/leagues/nfl.png");

const W = 1500;
const H = 1000;
const ART_H = 940;
const ART_W = Math.round(ART_H * (1080 / 1350)); // 752

const NAVY = "#0C2340";
const ORANGE = "#FB4F14";

const ribs = Array.from({ length: 26 }, (_, i) =>
  `<rect x="${i * 90 - 300}" y="-200" width="26" height="1500" fill="#ffffff" opacity="0.025" transform="rotate(18 750 500)"/>`
).join("");

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#153montage"/>
    </linearGradient>
    <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#16345c"/>
      <stop offset="55%" stop-color="${NAVY}"/>
      <stop offset="100%" stop-color="#071627"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg2)"/>
  ${ribs}

  <text x="72" y="360" font-family="Arial, Helvetica, sans-serif" font-size="26"
        font-weight="700" fill="${ORANGE}" letter-spacing="5">DENVER BRONCOS</text>
  <text x="72" y="432" font-family="Arial, Helvetica, sans-serif" font-size="62"
        font-weight="800" fill="#ffffff" letter-spacing="-1">2026</text>
  <text x="72" y="500" font-family="Arial, Helvetica, sans-serif" font-size="62"
        font-weight="800" fill="#ffffff" letter-spacing="-1">UNIFORM</text>
  <text x="72" y="568" font-family="Arial, Helvetica, sans-serif" font-size="62"
        font-weight="800" fill="#ffffff" letter-spacing="-1">SCHEDULE</text>
  <rect x="74" y="612" width="110" height="6" fill="${ORANGE}"/>
  <text x="72" y="678" font-family="Arial, Helvetica, sans-serif" font-size="23"
        font-weight="700" fill="#c8d4e6" letter-spacing="1">ALL 17 GAMES</text>

  <text x="72" y="930" font-family="Arial, Helvetica, sans-serif" font-size="19"
        font-weight="700" fill="#7f8fa6" letter-spacing="4">COLORWAY SPORTS</text>
</svg>`;

const art = await sharp(ART)
  .resize(ART_W, ART_H, { fit: "contain" })
  .toBuffer();

const team = await sharp(TEAM).resize(96, 96, { fit: "inside" }).toBuffer();
const league = await sharp(LEAGUE).resize(46, 46, { fit: "inside" }).toBuffer();

await sharp(Buffer.from(svg))
  .composite([
    { input: art, left: W - ART_W - 46, top: Math.round((H - ART_H) / 2) },
    { input: team, left: 72, top: 190 },
    { input: league, left: 330, top: 895 },
  ])
  .jpeg({ quality: 90 })
  .toFile(OUT);

console.log("wrote", OUT);
