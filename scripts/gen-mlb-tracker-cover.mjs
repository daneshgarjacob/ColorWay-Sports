// Branded 3:2 hero/cover for the MLB daily uniform tracker.
// Same family as gen-wc-tracker-cover.mjs: navy gradient + bars, MLB mark in a
// white badge chip, three transparent jersey cutouts fanned top-right, ColorWay
// mark bottom-right, bottom-left kept clear for the homepage card status pill.
// Jersey cutouts come from the repo's own staged tracker images.
// Usage: node scripts/gen-mlb-tracker-cover.mjs
import sharp from "sharp";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");

const W = 1500, H = 1000;
const c1 = "#002D72", c2 = "#0a0d16", accent = "#E81828";

const bars = Array.from({ length: 8 }, (_, i) => {
  const x = 90 + i * 175;
  return `<rect x="${x}" y="0" width="10" height="${150 + (i % 4) * 45}" fill="#ffffff" opacity="0.10"/>`;
}).join("\n  ");

const BADGE = { x: 100, y: 72, w: 200, h: 284, r: 24 };

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.45" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${bars}
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect x="${BADGE.x}" y="${BADGE.y}" width="${BADGE.w}" height="${BADGE.h}" rx="${BADGE.r}" fill="#ffffff"/>
  <text x="100" y="478" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="800" letter-spacing="7" fill="${accent}">30 TEAMS · EVERY GAME · EVERY DAY</text>
  <rect x="100" y="502" width="120" height="8" fill="${accent}"/>
  <text x="96" y="610" font-family="Arial, Helvetica, sans-serif" font-size="92" font-weight="900" letter-spacing="-2" fill="#ffffff">MLB DAILY</text>
  <text x="96" y="700" font-family="Arial, Helvetica, sans-serif" font-size="92" font-weight="900" letter-spacing="-2" fill="#ffffff">UNIFORM TRACKER</text>
  <text x="100" y="760" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#ffffff" opacity="0.92">What Every Team Wore Last Night, Logged Every Morning</text>
</svg>`;

const mlbLogoPath = resolve(root, "public/logos/mlb.png");
const cwLogoPath = resolve(root, "public/brand/colorway-sports-logo-white.png");
const tiles = resolve(root, "public/images/posts/mlb-daily-tracker");
// Two clean SOLO jerseys side by side (no overlap — Jake killed the messy fan 7/9).
// 7/22 (Jake): read as a real matchup, "Yankees at Dodgers" — away on the left,
// home on the right, both the SAME size. Each source PNG carries a different
// amount of transparent padding, so trim to content first and match on the
// trimmed height; sizing the raw files would leave them visually unequal.
// Both must be FRONT-ONLY shots (feedback_prefer_front_only_jersey_shots): our
// only Yankees road gray is a front+back composite, which is precisely what made
// the pair look mismatched, so the matchup runs Dodgers at Yankees instead —
// both sources are clean 800x800 front-only cutouts.
const leftJerseyPath = resolve(tiles, "dodgers-road-gray.png");   // away
const rightJerseyPath = resolve(tiles, "yankees-home-white-cutout.png"); // home

const composites = [];

if (existsSync(mlbLogoPath)) {
  const mlb = await sharp(mlbLogoPath).resize({ width: BADGE.w - 48 }).png().toBuffer();
  const m = await sharp(mlb).metadata();
  composites.push({ input: mlb, top: BADGE.y + Math.round((BADGE.h - m.height) / 2), left: BADGE.x + 24 });
}

const JERSEY_H = 330, JERSEY_GAP = 46, RIGHT_MARGIN = 74, JERSEY_TOP = 62;
if (existsSync(leftJerseyPath) && existsSync(rightJerseyPath)) {
  const [lj, rj] = await Promise.all(
    [leftJerseyPath, rightJerseyPath].map((f) =>
      sharp(f).trim().resize({ height: JERSEY_H }).png().toBuffer()
    )
  );
  const [lm, rm] = await Promise.all([sharp(lj).metadata(), sharp(rj).metadata()]);
  const totalW = (lm.width || 0) + JERSEY_GAP + (rm.width || 0);
  const startX = W - RIGHT_MARGIN - totalW;
  composites.push({ input: lj, top: JERSEY_TOP, left: startX });
  composites.push({ input: rj, top: JERSEY_TOP, left: startX + (lm.width || 0) + JERSEY_GAP });
}

if (existsSync(cwLogoPath)) {
  const logo = await sharp(cwLogoPath).resize({ height: 60 }).png().toBuffer();
  const m = await sharp(logo).metadata();
  composites.push({ input: logo, top: H - 60 - 44, left: W - (m.width || 200) - 60 });
}

mkdirSync(resolve(root, "public/images/posts/mlb-daily-tracker"), { recursive: true });
const out = resolve(root, "public/images/posts/mlb-daily-tracker/cover-branded.jpg");
await sharp(Buffer.from(svg)).resize(W, H).composite(composites).jpeg({ quality: 86 }).toFile(out);
console.log("wrote", out);
