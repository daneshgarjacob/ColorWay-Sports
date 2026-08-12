#!/usr/bin/env node
// 3:2 (1500x1000) cover for the Cardinals uniform-schedule post, built from the
// team's own "Navy Caps On The Road" announcement graphic. That art is 4:5
// portrait, so it is contained on a navy field rather than cropped, which would
// cut off either the players or the headline.

import sharp from "sharp";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(__dirname, "../public/images/posts/cardinals-uniform-schedule-2026");
const ART = `${DIR}/navy-caps-road.jpg`;
const OUT = `${DIR}/cover.jpg`;
const TEAM = resolve(__dirname, "../public/logos/teams/mlb-st-louis-cardinals.png");
const LEAGUE = resolve(__dirname, "../public/logos/leagues/mlb.png");

const W = 1500;
const H = 1000;
const ART_H = 1000;
const ART_W = Math.round(ART_H * (1080 / 1350)); // 800

const NAVY = "#0C2340";
const RED = "#C41E3A";

const ribs = Array.from({ length: 24 }, (_, i) =>
  `<rect x="${i * 90 - 300}" y="-200" width="24" height="1500" fill="#ffffff" opacity="0.02" transform="rotate(18 750 500)"/>`
).join("");

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#14325c"/>
      <stop offset="55%" stop-color="${NAVY}"/>
      <stop offset="100%" stop-color="#07162b"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${ribs}

  <text x="72" y="330" font-family="Arial, Helvetica, sans-serif" font-size="25"
        font-weight="700" fill="${RED}" letter-spacing="5">ST. LOUIS CARDINALS &#183; 2026</text>

  <text x="72" y="428" font-family="Arial, Helvetica, sans-serif" font-size="66"
        font-weight="800" fill="#ffffff" letter-spacing="-1">UNIFORM</text>
  <text x="72" y="500" font-family="Arial, Helvetica, sans-serif" font-size="66"
        font-weight="800" fill="#ffffff" letter-spacing="-1">SCHEDULE</text>

  <rect x="74" y="546" width="120" height="7" fill="${RED}"/>

  <text x="72" y="618" font-family="Arial, Helvetica, sans-serif" font-size="26"
        font-weight="700" fill="#c3d0e4" letter-spacing="1">EVERY JERSEY, EVERY DAY</text>
  <text x="72" y="662" font-family="Arial, Helvetica, sans-serif" font-size="26"
        font-weight="700" fill="#c3d0e4" letter-spacing="1">AND THE NAVY CAP IS BACK</text>

  <text x="72" y="922" font-family="Arial, Helvetica, sans-serif" font-size="19"
        font-weight="700" fill="#7f8fa6" letter-spacing="4">COLORWAY SPORTS</text>
</svg>`;

const art = await sharp(ART).resize(ART_W, ART_H, { fit: "cover" }).toBuffer();
const team = await sharp(TEAM).resize(96, 96, { fit: "inside" }).toBuffer();
const league = await sharp(LEAGUE).resize(44, 44, { fit: "inside" }).toBuffer();

await sharp(Buffer.from(svg))
  .composite([
    { input: art, left: W - ART_W, top: 0 },
    { input: team, left: 72, top: 180 },
    { input: league, left: 330, top: 888 },
  ])
  .jpeg({ quality: 90 })
  .toFile(OUT);

console.log("wrote", OUT);
