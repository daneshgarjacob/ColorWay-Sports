#!/usr/bin/env node
// Process Jake's 11 rugby jersey cutouts -> white-bg JPGs for the post,
// and build a cover montage (11 jersey cutouts in a row) for the ranking post.
// sharp resolves up-tree from the worktree to the main repo's node_modules.
import sharp from "sharp";
import { mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(homedir(), "Desktop/rugby-kits");
const OUT = resolve(__dirname, "../public/images/posts/rugby-club-kits");
const WATERMARK = resolve(__dirname, "../public/brand/colorway-sports-logo-white.png");

// Jake's ranking order (#1 best -> #11 worst): source file -> slug
const CLUBS = [
  ["4174-461-removebg-preview.png", "bristol-bears"],
  ["new-bath-home-kit-25-26-v0-r4g2nmhtledf1-removebg-preview.png", "bath"],
  ["TL7031-010_Nike_Stade_Toulousain_Replica_Home_Jersey_red_black_01-removebg-preview.png", "toulouse"],
  ["Rabbitohs-Jersey-1-1024x1024-removebg-preview.png", "south-sydney"],
  ["IMG_9963-removebg-preview.png", "st-george-dragons"],
  ["IMG_6151-removebg-preview.png", "hurricanes"],
  ["tm11905-030-surf-the-web-01-removebg-preview.png", "leinster"],
  ["510084-removebg-preview.png", "fijian-drua"],
  ["maillot-stade-francais-paris-domicile-junior-kappa2025090216495368b70411d5424-removebg-preview.png", "stade-francais"],
  ["TM1273_MULTI_1-scaled-1-removebg-preview.png", "harlequins"],
  ["csi-crr26mj1-removebg-preview.png", "crusaders"],
];

await mkdir(OUT, { recursive: true });

// 1) Per-club white-bg JPGs for the post cards
for (const [src, slug] of CLUBS) {
  await sharp(resolve(SRC, src))
    .resize({ height: 640, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(resolve(OUT, `${slug}.webp`));
  console.log("jersey ->", `${slug}.webp`);
}

// 2) Cover montage: 11 transparent cutouts in a row on the brand gradient
const W = 1500, H = 1000;
const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1B3A2B"/>
      <stop offset="55%" stop-color="#0c1c14"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="38%" r="62%">
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
  <text x="${W / 2}" y="150" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="29" font-weight="800" letter-spacing="9" fill="#86E0B4">RANKED &#183; WORST TO BEST</text>
  <text x="${W / 2}" y="316" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="116" font-weight="900" letter-spacing="-3" fill="#ffffff">THE BEST RUGBY</text>
  <text x="${W / 2}" y="440" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="116" font-weight="900" letter-spacing="-3" fill="#ffffff">CLUB KITS</text>
  <text x="${W / 2}" y="532" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="34" font-weight="600" fill="#ffffff" fill-opacity="0.82">11 of the boldest jerseys in world club rugby</text>
</svg>`;

const base = await sharp(Buffer.from(svg)).png().toBuffer();

const margin = 36;
const slotW = (W - margin * 2) / CLUBS.length;
const rowCenterY = 740;
const composites = [];
for (let i = 0; i < CLUBS.length; i++) {
  const [src] = CLUBS[i];
  const jersey = await sharp(resolve(SRC, src))
    .resize({ height: 135 })
    .png()
    .toBuffer();
  const m = await sharp(jersey).metadata();
  const slotCenterX = margin + slotW * (i + 0.5);
  composites.push({
    input: jersey,
    left: Math.round(slotCenterX - m.width / 2),
    top: Math.round(rowCenterY - m.height / 2),
  });
}

const wmW = 260;
const wm = await sharp(WATERMARK).resize({ width: wmW }).png().toBuffer();
const wmH = (await sharp(wm).metadata()).height || 56;
composites.push({ input: wm, left: Math.round((W - wmW) / 2), top: H - wmH - 30 });

await sharp(base).composite(composites).jpeg({ quality: 88 }).toFile(resolve(OUT, "cover.jpg"));
console.log("cover -> cover.jpg");
