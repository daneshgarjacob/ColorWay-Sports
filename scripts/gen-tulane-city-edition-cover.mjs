#!/usr/bin/env node
// 3:2 (1500x1000) cover for the Tulane City Edition post.
// Tulane's photos are all 2:3 portrait, and cropping a uniform shot is against
// house rules, so the helmet photo is contained on a Mardi Gras field instead.

import sharp from "sharp";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(__dirname, "../public/images/posts/tulane-city-edition-uniforms-2026");
const ART = `${DIR}/helmet-front.jpg`;
const OUT = `${DIR}/cover.jpg`;

const W = 1500;
const H = 1000;
const ART_H = 1000;
const ART_W = Math.round(ART_H * (2726 / 4096)); // 666

const PURPLE = "#5B2B8A";
const GREEN = "#00A94F";
const GOLD = "#F3B72B";

// argyle diamonds, the motif from the pants and helmet stripe
const diamonds = [];
for (let row = 0; row < 7; row++) {
  for (let col = 0; col < 5; col++) {
    const x = 60 + col * 190 + (row % 2 ? 95 : 0);
    const y = 40 + row * 150;
    const fill = (row + col) % 2 ? GOLD : PURPLE;
    diamonds.push(
      `<polygon points="${x},${y - 46} ${x + 30},${y} ${x},${y + 46} ${x - 30},${y}" fill="${fill}" opacity="0.13"/>`
    );
  }
}

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#12331f"/>
      <stop offset="48%" stop-color="#0b2318"/>
      <stop offset="100%" stop-color="#1d1030"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${diamonds.join("")}

  <text x="80" y="330" font-family="Arial, Helvetica, sans-serif" font-size="26"
        font-weight="700" fill="${GOLD}" letter-spacing="6">THE KING OF MARDI GRAS</text>

  <text x="80" y="440" font-family="Arial, Helvetica, sans-serif" font-size="98"
        font-weight="800" fill="#ffffff" letter-spacing="-2">TULANE</text>
  <text x="80" y="546" font-family="Arial, Helvetica, sans-serif" font-size="98"
        font-weight="800" fill="${GREEN}" letter-spacing="-2">CITY EDITION</text>

  <rect x="82" y="592" width="140" height="7" fill="${PURPLE}"/>

  <text x="80" y="668" font-family="Arial, Helvetica, sans-serif" font-size="27"
        font-weight="700" fill="#cfd8d2" letter-spacing="1">PURPLE, GREEN AND GOLD &#183; GRADED</text>

  <text x="80" y="915" font-family="Arial, Helvetica, sans-serif" font-size="20"
        font-weight="700" fill="#7f8f86" letter-spacing="4">COLORWAY SPORTS</text>
</svg>`;

const art = await sharp(ART).resize(ART_W, ART_H, { fit: "cover" }).toBuffer();

await sharp(Buffer.from(svg))
  .composite([{ input: art, left: W - ART_W, top: 0 }])
  .jpeg({ quality: 90 })
  .toFile(OUT);

console.log("wrote", OUT);
