#!/usr/bin/env node
// 3:2 (1500x1000) cover for the Broncos Midnight Navy post.
// Navy field on the left carrying the headline, the Broncos' own announcement
// graphic bled in on the right. Same construction as the other gen-*-cover.mjs
// files: an SVG string composited with sharp.

import sharp from "sharp";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../public/images/posts/broncos-midnight-navy-2026/cover.jpg");
const ART = resolve(__dirname, "../public/images/posts/broncos-midnight-navy-2026/midnight-navy-announcement.jpg");
const TEAM = resolve(__dirname, "../public/logos/teams/nfl-denver-broncos.png");
const LEAGUE = resolve(__dirname, "../public/logos/leagues/nfl.png");

const W = 1500;
const H = 1000;
const ART_W = 620; // right-hand panel

const NAVY = "#0C2340";
const ORANGE = "#FB4F14";

// faint rotated ribs so the flat navy has some structure
const ribs = Array.from({ length: 26 }, (_, i) =>
  `<rect x="${i * 90 - 300}" y="-200" width="26" height="1500" fill="#ffffff" opacity="0.022" transform="rotate(18 750 500)"/>`
).join("");

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#132e52"/>
      <stop offset="55%" stop-color="${NAVY}"/>
      <stop offset="100%" stop-color="#071627"/>
    </linearGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${NAVY}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${NAVY}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${ribs}

  <!-- soften the seam where the team graphic starts -->
  <rect x="${W - ART_W}" y="0" width="150" height="${H}" fill="url(#fade)"/>

  <text x="90" y="300" font-family="Arial, Helvetica, sans-serif" font-size="30"
        font-weight="700" fill="${ORANGE}" letter-spacing="6">DENVER BRONCOS &#183; 2026</text>

  <text x="90" y="410" font-family="Arial, Helvetica, sans-serif" font-size="104"
        font-weight="800" fill="#ffffff" letter-spacing="-2">MIDNIGHT</text>
  <text x="90" y="512" font-family="Arial, Helvetica, sans-serif" font-size="104"
        font-weight="800" fill="#ffffff" letter-spacing="-2">NAVY</text>

  <rect x="92" y="560" width="132" height="7" fill="${ORANGE}"/>

  <text x="90" y="638" font-family="Arial, Helvetica, sans-serif" font-size="30"
        font-weight="700" fill="#c8d4e6" letter-spacing="2">WEEK 3 vs. RAMS &#183; SUNDAY NIGHT FOOTBALL</text>
  <text x="90" y="686" font-family="Arial, Helvetica, sans-serif" font-size="30"
        font-weight="700" fill="#c8d4e6" letter-spacing="2">WEEK 16 vs. BILLS &#183; CHRISTMAS DAY</text>

  <text x="90" y="905" font-family="Arial, Helvetica, sans-serif" font-size="21"
        font-weight="700" fill="#7f8fa6" letter-spacing="4">COLORWAY SPORTS</text>
</svg>`;

const art = await sharp(ART)
  .resize(ART_W, H, { fit: "cover", position: "top" })
  .toBuffer();

const team = await sharp(TEAM).resize(112, 112, { fit: "inside" }).toBuffer();
const league = await sharp(LEAGUE).resize(56, 56, { fit: "inside" }).toBuffer();

await sharp(Buffer.from(svg))
  .composite([
    { input: art, left: W - ART_W, top: 0 },
    { input: team, left: 90, top: 120 },
    { input: league, left: 792, top: 862 },
  ])
  .jpeg({ quality: 90 })
  .toFile(OUT);

console.log("wrote", OUT);
