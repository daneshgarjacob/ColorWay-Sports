// Cover for the NBA City Edition 2026-27 countdown.
//
// v3 (2026-09-15): Jake asked for no white background and three City Editions
// that are actually in the 2026-27 collection. The jerseys are transparent
// cutouts (scripts/make-kit-cutout.mjs) of official NBA Store / Fanatics product
// shots, placed straight on the dark field with a soft glow, never cropped
// (feedback_never_crop_jersey_product_shots). Picks: Spurs Fiesta (#4), Thunder
// Renaissance (#6), Wizards Cherry Blossom (#8, officially confirmed).
// Cutouts live outside the repo: ~/Desktop/colorway-archive/nba-city-edition-2026-27-cutouts/
//
// Usage: node scripts/gen-nba-city-edition-cover.mjs
import sharp from "sharp";
import { resolve, dirname, join } from "node:path";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1500, H = 1000;
const CUTS = join(homedir(), "Desktop", "colorway-archive", "nba-city-edition-2026-27-cutouts");
const PICKS = ["spurs", "thunder", "wizards"];

const SLOT_W = 470, SLOT_H = 600, GAP = 10;
const rowW = PICKS.length * SLOT_W + (PICKS.length - 1) * GAP;
const rowX = Math.round((W - rowW) / 2);
const rowY = 355;

const layers = [];
const glows = [];
for (let i = 0; i < PICKS.length; i++) {
  const x = rowX + i * (SLOT_W + GAP);
  const shirt = await sharp(join(CUTS, `${PICKS[i]}.png`))
    .trim({ threshold: 1 })
    .resize({ width: SLOT_W, height: SLOT_H, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const meta = await sharp(shirt).metadata();
  const left = x + Math.round((SLOT_W - (meta.width ?? 0)) / 2);
  const top = rowY + Math.round((SLOT_H - (meta.height ?? 0)) / 2);
  // Soft drop shadow: the shirt's own silhouette, blacked out and blurred.
  const shadow = await sharp(shirt)
    .ensureAlpha()
    .linear([0, 0, 0, 0.55], [0, 0, 0, 0])
    .blur(18)
    .toBuffer();
  layers.push({ input: shadow, top: top + 18, left });
  layers.push({ input: shirt, top, left });
  glows.push(`<ellipse cx="${x + SLOT_W / 2}" cy="${rowY + SLOT_H / 2}" rx="${SLOT_W * 0.55}" ry="${SLOT_H * 0.45}" fill="url(#glow)"/>`);
}

const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2d2540"/>
      <stop offset="0.5" stop-color="#1d2340"/>
      <stop offset="1" stop-color="#12172b"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#7fb0ff" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#7fb0ff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${glows.join("")}
  <text x="${W / 2}" y="112" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="800" letter-spacing="7" fill="#7fb0ff">ALL 30 TEAMS &#183; YEAR TEN</text>
  <text x="${W / 2}" y="222" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="900" fill="#ffffff" letter-spacing="-2">City Edition 2026-27</text>
  <text x="${W / 2}" y="286" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="600" fill="rgba(255,255,255,0.72)">Every returning jersey, ranked and graded</text>
</svg>`;

const outDir = join(root, "public", "images", "posts", "nba-city-edition-jerseys-2026-27");
mkdirSync(outDir, { recursive: true });
await sharp(Buffer.from(bg))
  .composite(layers)
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(join(outDir, "cover.jpg"));
console.log("wrote", join(outDir, "cover.jpg"));
