// Cover for the NBA 09.15.26 uniform-reveal explainer: a full-bleed strip of the
// teaser posters the clubs published themselves, five across, each cropped to its
// centre so the 09.15.26 line survives in every panel.
//
// Source art is each club's own published teaser, credited in the post. Originals
// live on Jake's Desktop at ~/Desktop/nba-09-15-26-teasers and are NOT committed;
// only this composite ships. Same treatment as any other reveal-graphic composite
// on the site.
//
// Usage: node scripts/gen-nba-september-15-cover.mjs
import sharp from "sharp";
import { resolve, dirname, join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(homedir(), "Desktop", "nba-09-15-26-teasers");

const W = 1500, H = 1000; // 3:2, the house cover spec

// Five clubs, chosen for palette separation so the strip does not read as one
// dark smear: black/silver, navy/gold, purple/grey, blue/black, red/white/black.
// Kings and Pistons are also two of the eight Christmas Day clubs.
const PANELS = ["spurs", "pacers", "kings", "pistons", "wizards"];

const panelW = Math.floor(W / PANELS.length); // 300
const missing = PANELS.filter((p) => !existsSync(join(SRC, `${p}.jpg`)));
if (missing.length) {
  console.error(`Missing teaser sources in ${SRC}: ${missing.join(", ")}`);
  process.exit(1);
}

const layers = [];
for (let i = 0; i < PANELS.length; i++) {
  // Scale to full cover height, then centre-crop to the panel width. The date
  // sits centred at the foot of every poster, so a centre crop keeps it.
  const scaled = await sharp(join(SRC, `${PANELS[i]}.jpg`))
    .resize({ height: H, fit: "cover", position: "centre" })
    .toBuffer();
  const meta = await sharp(scaled).metadata();
  const left = Math.max(0, Math.round(((meta.width ?? panelW) - panelW) / 2));

  const panel = await sharp(scaled)
    .extract({ left, top: 0, width: Math.min(panelW, meta.width ?? panelW), height: H })
    .toBuffer();

  layers.push({ input: panel, top: 0, left: i * panelW });
}

// Hairline separators, so five dark posters still read as five separate teams.
const rules = PANELS.slice(1)
  .map((_, i) => `<rect x="${(i + 1) * panelW - 1}" y="0" width="2" height="${H}" fill="#000000" opacity="0.55"/>`)
  .join("");

// Top scrim only. The five 09.15.26 lines along the foot are the whole point of
// the cover, so nothing goes over them: the ColorWay mark sits up top instead.
const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${rules}
  <rect x="0" y="0" width="${W}" height="150" fill="url(#s)"/>
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000000" stop-opacity="0.66"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
  </defs>
</svg>`;
layers.push({ input: Buffer.from(overlay), top: 0, left: 0 });

try {
  const cw = await sharp(resolve(root, "public/brand/colorway-sports-logo-white.png"))
    .resize({ height: 52, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const m = await sharp(cw).metadata();
  layers.push({ input: cw, top: 30, left: W - (m.width ?? 180) - 34 });
} catch (e) {
  console.warn("  skipped ColorWay mark:", e.message);
}

const outDir = resolve(root, "public/images/posts/nba-september-15-2026-uniform-reveal");
mkdirSync(outDir, { recursive: true });
const out = resolve(outDir, "cover.jpg");

await sharp({ create: { width: W, height: H, channels: 3, background: "#000000" } })
  .composite(layers)
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(out);

console.log("wrote", out, `(${PANELS.join(", ")})`);
