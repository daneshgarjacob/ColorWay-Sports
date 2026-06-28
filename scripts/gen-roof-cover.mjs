// Generates branded 3:2 roof-status cover images for the retractable-roof vertical.
// Typographic + geometric retractable-roof motif in team colors, ColorWay mark bottom-right.
// Usage: node scripts/gen-roof-cover.mjs   (renders every entry in STADIUMS below)
import sharp from "sharp";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");
const outDir = resolve(root, "public/images/posts/roof-covers");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const W = 1500, H = 1000;

const STADIUMS = [
  { slug: "daikin-park-roof-2026", stadium: "DAIKIN PARK", team: "HOUSTON ASTROS", c1: "#002D62", c2: "#0A1A30", accent: "#EB6E1F" },
  { slug: "tmobile-park-roof-2026", stadium: "T-MOBILE PARK", team: "SEATTLE MARINERS", c1: "#0C2C56", c2: "#0A1A2A", accent: "#15A0A0" },
  { slug: "american-family-field-roof-2026", stadium: "AMERICAN FAMILY FIELD", team: "MILWAUKEE BREWERS", c1: "#0A2351", c2: "#0A1426", accent: "#FFC52F", titleSize: 86 },
  { slug: "rogers-centre-roof-2026", stadium: "ROGERS CENTRE", team: "TORONTO BLUE JAYS", c1: "#134A8E", c2: "#0C1F3F", accent: "#1D9BD7" },
  { slug: "loandepot-park-roof-2026", stadium: "LOANDEPOT PARK", team: "MIAMI MARLINS", c1: "#0077C8", c2: "#111111", accent: "#EF3340" },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function svg({ stadium, team, c1, c2, accent, titleSize = 150 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.45" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <!-- retractable roof motif: two panels sliding apart, sky gap between -->
  <g opacity="0.16" fill="#ffffff">
    <polygon points="0,0 660,0 560,300 0,300"/>
    <polygon points="${W},0 840,0 940,300 ${W},300"/>
  </g>
  <g stroke="${accent}" stroke-width="6" opacity="0.9">
    <line x1="560" y1="300" x2="660" y2="0"/>
    <line x1="940" y1="300" x2="840" y2="0"/>
  </g>
  <!-- thin roof seam lines -->
  <g stroke="#ffffff" stroke-width="2" opacity="0.10">
    <line x1="120" y1="0" x2="60" y2="180"/>
    <line x1="300" y1="0" x2="230" y2="210"/>
    <line x1="${W-120}" y1="0" x2="${W-60}" y2="180"/>
    <line x1="${W-300}" y1="0" x2="${W-230}" y2="210"/>
  </g>
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <!-- eyebrow -->
  <text x="100" y="558" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" letter-spacing="7" fill="${accent}">${esc(team)} · RETRACTABLE ROOF</text>
  <!-- accent underline -->
  <rect x="100" y="582" width="120" height="8" fill="${accent}"/>
  <!-- title -->
  <text x="96" y="712" font-family="Arial, Helvetica, sans-serif" font-size="${titleSize}" font-weight="900" letter-spacing="-2" fill="#ffffff">${esc(stadium)}</text>
  <!-- subtitle -->
  <text x="100" y="800" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" fill="#ffffff" opacity="0.92">Roof Open or Closed Today? · 2026 Schedule</text>
</svg>`;
}

const logoPath = resolve(root, "public/brand/colorway-sports-logo-white.png");

for (const s of STADIUMS) {
  const base = sharp(Buffer.from(svg(s))).resize(W, H);
  let img = base;
  if (existsSync(logoPath)) {
    const logo = await sharp(logoPath).resize({ height: 60 }).png().toBuffer();
    const meta = await sharp(logo).metadata();
    img = base.composite([{ input: logo, top: H - 60 - 48, left: W - (meta.width || 200) - 60 }]);
  }
  const out = resolve(outDir, `${s.slug}.jpg`);
  await img.jpeg({ quality: 86 }).toFile(out);
  console.log("wrote", out);
}
