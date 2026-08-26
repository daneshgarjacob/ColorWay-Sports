// Branded cover for the NBA 09.15.26 uniform-reveal explainer.
// Illustrated only: our own stipple field, our own type, the NBA league mark the
// site already uses in its nav, and the ColorWay mark. No team logos, no Nike
// mark, no lift from the league's teaser art, so nothing here needs licensing.
// Usage: node scripts/gen-nba-september-15-cover.mjs
import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1500, H = 1000; // 3:2, the house cover spec

// Deterministic spray-paint stipple. A seeded LCG so the cover is byte-identical
// on every run and a re-generate never shows up as a spurious image diff.
let seed = 20260915;
const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

let dots = "";
for (let i = 0; i < 2600; i++) {
  const x = rand() * W;
  const y = rand() * H;
  // Denser toward the middle-left, where the headline sits, so the type has a
  // textured bed instead of floating on flat black.
  const bias = 1 - Math.abs(x - W * 0.42) / W - Math.abs(y - H * 0.5) / H;
  if (rand() > bias + 0.35) continue;
  const r = 0.6 + rand() * 2.1;
  const o = (0.05 + rand() * 0.3).toFixed(2);
  dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#ffffff" opacity="${o}"/>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="0.38" cy="0.45" r="0.85">
      <stop offset="0" stop-color="#2b2b33"/>
      <stop offset="0.55" stop-color="#17171c"/>
      <stop offset="1" stop-color="#0b0b0e"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${dots}

  <text x="96" y="300" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="800" letter-spacing="7" fill="#2f6bed">ALL 30 TEAMS · ONE DATE</text>

  <text x="96" y="452" font-family="Georgia, 'Times New Roman', serif" font-size="176" font-weight="700" fill="#ffffff" letter-spacing="2">09.15.26</text>
  <rect x="96" y="498" width="180" height="5" fill="#2f6bed"/>

  <text x="96" y="606" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="900" fill="#ffffff" letter-spacing="-1">Something new</text>
  <text x="96" y="682" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="900" fill="#ffffff" letter-spacing="-1">is coming soon</text>

  <text x="96" y="766" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="600" fill="rgba(255,255,255,0.62)">Every NBA club is teasing the same date. We decode it.</text>
  <text x="96" y="836" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="700" letter-spacing="3" fill="rgba(255,255,255,0.38)">CITY EDITION, YEAR TEN</text>
</svg>`;

const layers = [];

// NBA league mark, top-left above the kicker.
try {
  const nba = await sharp(resolve(root, "public/logos/leagues/nba.png"))
    .resize({ height: 84, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  layers.push({ input: nba, top: 150, left: 96 });
} catch (e) {
  console.warn("  skipped NBA mark:", e.message);
}

// ColorWay mark, bottom-right, same as every other branded cover.
try {
  const cw = await sharp(resolve(root, "public/brand/colorway-sports-logo-white.png"))
    .resize({ height: 60, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const meta = await sharp(cw).metadata();
  layers.push({ input: cw, top: H - 60 - 72, left: W - (meta.width ?? 200) - 96 });
} catch (e) {
  console.warn("  skipped ColorWay mark:", e.message);
}

const outDir = resolve(root, "public/images/posts/nba-september-15-2026-uniform-reveal");
mkdirSync(outDir, { recursive: true });
const out = resolve(outDir, "cover.jpg");

await sharp(Buffer.from(svg))
  .composite(layers)
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(out);

console.log("wrote", out);
