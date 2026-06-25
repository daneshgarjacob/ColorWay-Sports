#!/usr/bin/env node
// ColorWay Sports cover for "The Best Rugby Club Kits, Ranked".
// Design-forward: forest-green -> black gradient + the 12 clubs as a signature colour palette band.
// 1500x1000 (3:2) so the StoryCard doesn't crop it. sharp resolves up-tree from the worktree to the main repo.
import sharp from "sharp";
import { mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = resolve(ROOT, "public/images/posts/rugby-club-kits");
const OUT = resolve(OUT_DIR, "cover.jpg");
const WATERMARK = resolve(ROOT, "public/brand/colorway-sports-logo.png");
const W = 1500, H = 1000;

// 12 clubs in ranking order (#1 -> #12), each shown in its signature kit colour.
const CLUBS = [
  { n: "Stade Francais", c: "#EC0F8C" },
  { n: "Harlequins",     c: "#A8327A" },
  { n: "Leinster",       c: "#123A8C" },
  { n: "St George",      c: "#D81E34" },
  { n: "Hurricanes",     c: "#F4C20D" },
  { n: "Fijian Drua",    c: "#0E96AD" },
  { n: "Crusaders",      c: "#A11414" },
  { n: "Toulouse",       c: "#6E0F1E" },
  { n: "South Sydney",   c: "#0A7A45" },
  { n: "Bath",           c: "#2E5AA8" },
  { n: "Bristol",        c: "#16284F" },
  { n: "Leicester",      c: "#1C4A33" },
];

const bandX = 130, bandW = W - 2 * bandX;
const gap = 14, n = CLUBS.length;
const sw = (bandW - gap * (n - 1)) / n;
const bandY = 650, bandH = 150;

const swatches = CLUBS.map((club, i) => {
  const x = bandX + i * (sw + gap);
  return `<rect x="${x.toFixed(1)}" y="${bandY}" width="${sw.toFixed(1)}" height="${bandH}" rx="10" fill="${club.c}"/>`;
}).join("\n  ");

const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1B3A2B"/>
      <stop offset="55%" stop-color="#0c1c14"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#2f6b4e" stop-opacity="0.30"/>
      <stop offset="70%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.45"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect x="0" y="0" width="${W}" height="9" fill="#EC0F8C"/>
  <rect x="0" y="${H - 9}" width="${W}" height="9" fill="#EC0F8C"/>

  <text x="${W / 2}" y="152" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="29" font-weight="800" letter-spacing="9" fill="#86E0B4">RANKED &#183; WORST TO BEST</text>

  <text x="${W / 2}" y="322" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="118" font-weight="900" letter-spacing="-3" fill="#ffffff">THE BEST RUGBY</text>
  <text x="${W / 2}" y="448" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="118" font-weight="900" letter-spacing="-3" fill="#ffffff">CLUB KITS</text>

  <text x="${W / 2}" y="542" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="35" font-weight="600" fill="#ffffff" fill-opacity="0.82">12 of the most iconic jerseys in world rugby</text>

  ${swatches}

  <text x="${W / 2}" y="${bandY + bandH + 60}" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="25" font-weight="700" letter-spacing="5" fill="#ffffff" fill-opacity="0.6">TOP 14 &#183; PREMIERSHIP &#183; URC &#183; SUPER RUGBY &#183; NRL</text>
</svg>`;

await mkdir(OUT_DIR, { recursive: true });
const base = await sharp(Buffer.from(svg)).png().toBuffer();

const wmW = 180;
const wm = await sharp(WATERMARK).resize({ width: wmW }).png().toBuffer();
const wmH = (await sharp(wm).metadata()).height || 56;

await sharp(base)
  .composite([{ input: wm, left: Math.round((W - wmW) / 2), top: H - wmH - 34 }])
  .jpeg({ quality: 88 })
  .toFile(OUT);

console.log(`Wrote ${OUT}  (${W}x${H})`);
