// Cover for the NBA City Edition 2026-27 tracker.
//
// v2 (2026-08-27): the first version was abstract jersey silhouettes in colour
// pairs. Jake did not like it, and he was right — the page is about actual
// jerseys, so the cover should show actual jerseys. This uses three real City
// Edition product shots already in our jersey library, placed WHOLE on light
// cards (never cropped — see feedback_never_crop_jersey_product_shots), over
// the brand-dark field.
//
// Usage: node scripts/gen-nba-city-edition-cover.mjs
import sharp from "sharp";
import { resolve, dirname, join } from "node:path";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1500, H = 1000;
const JERSEYS = join(root, "public", "images", "jerseys", "nba");

// Three City Editions from the program's own back catalogue, chosen for palette
// separation so the row does not read as one dark smear.
const PICKS = ["lakers-city-black", "thunder-city-blue", "spurs-city-black"];

// Card geometry: three across the right two-thirds, jerseys sit whole inside.
const CARD_W = 340, CARD_H = 560, GAP = 26;
const rowW = PICKS.length * CARD_W + (PICKS.length - 1) * GAP;
const rowX = Math.round((W - rowW) / 2);
const rowY = 350;

const layers = [];
for (let i = 0; i < PICKS.length; i++) {
  const x = rowX + i * (CARD_W + GAP);
  // Whole jersey, contained inside the card with padding. `contain` never crops.
  const shirt = await sharp(join(JERSEYS, `${PICKS[i]}.png`))
    .resize({
      width: CARD_W - 56,
      height: CARD_H - 56,
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .toBuffer();
  const meta = await sharp(shirt).metadata();
  layers.push({
    input: shirt,
    top: rowY + Math.round((CARD_H - (meta.height ?? 0)) / 2),
    left: x + Math.round((CARD_W - (meta.width ?? 0)) / 2),
  });
}

const cards = PICKS.map((_, i) => {
  const x = rowX + i * (CARD_W + GAP);
  return `<rect x="${x}" y="${rowY}" width="${CARD_W}" height="${CARD_H}" rx="20" fill="#ffffff" opacity="0.97"/>`;
}).join("");

const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2d2540"/>
      <stop offset="0.5" stop-color="#1d2340"/>
      <stop offset="1" stop-color="#12172b"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <text x="${W / 2}" y="118" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="800" letter-spacing="7" fill="#7fb0ff">ALL 30 TEAMS &#183; YEAR TEN</text>
  <text x="${W / 2}" y="228" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="900" fill="#ffffff" letter-spacing="-2">City Edition 2026-27</text>
  <text x="${W / 2}" y="292" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="600" fill="rgba(255,255,255,0.72)">Every jersey, tracked and graded. Revealed 09.15.26</text>
  ${cards}
</svg>`;

const outDir = join(root, "public", "images", "posts", "nba-city-edition-jerseys-2026-27");
mkdirSync(outDir, { recursive: true });
const out = join(outDir, "cover.jpg");
await sharp(Buffer.from(bg)).composite(layers).jpeg({ quality: 88 }).toFile(out);
console.log(`wrote ${out}`);
