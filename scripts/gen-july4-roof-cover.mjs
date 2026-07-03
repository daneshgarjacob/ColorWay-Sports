// One-off branded 3:2 cover for the MLB July 4th roof-report post.
// Same treatment as gen-roof-cover.mjs, patriotic navy/red palette + star field.
// Usage: node scripts/gen-july4-roof-cover.mjs
import sharp from "sharp";
import { mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");
const outDir = resolve(root, "public/images/posts/roof-covers");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const W = 1500, H = 1000;
const c1 = "#0A2351", c2 = "#10060a", accent = "#C8102E";

const star = (cx, cy, r, fill, opacity) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.42;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="${fill}" opacity="${opacity}"/>`;
};

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
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
  <!-- stars in the open-sky gap between the roof panels -->
  ${star(750, 90, 34, "#ffffff", 0.9)}
  ${star(672, 200, 22, "#ffffff", 0.55)}
  ${star(830, 190, 26, accent, 0.8)}
  ${star(760, 268, 16, "#ffffff", 0.4)}
  <!-- thin roof seam lines -->
  <g stroke="#ffffff" stroke-width="2" opacity="0.10">
    <line x1="120" y1="0" x2="60" y2="180"/>
    <line x1="300" y1="0" x2="230" y2="210"/>
    <line x1="${W - 120}" y1="0" x2="${W - 60}" y2="180"/>
    <line x1="${W - 300}" y1="0" x2="${W - 230}" y2="210"/>
  </g>
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <text x="100" y="558" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" letter-spacing="7" fill="${accent}">MLB · JULY 4TH WEEKEND 2026</text>
  <rect x="100" y="582" width="120" height="8" fill="${accent}"/>
  <text x="96" y="712" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="900" letter-spacing="-2" fill="#ffffff">JULY 4TH ROOF REPORT</text>
  <text x="100" y="800" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" fill="#ffffff" opacity="0.92">Open or Closed for the Holiday Slate? · All 7 Roof Parks Ruled</text>
</svg>`;

const logoPath = resolve(root, "public/brand/colorway-sports-logo-white.png");
const base = sharp(Buffer.from(svg)).resize(W, H);
let img = base;
if (existsSync(logoPath)) {
  const logo = await sharp(logoPath).resize({ height: 60 }).png().toBuffer();
  const meta = await sharp(logo).metadata();
  img = base.composite([{ input: logo, top: H - 60 - 48, left: W - (meta.width || 200) - 60 }]);
}
const out = resolve(outDir, "mlb-july-4th-roofs-2026.jpg");
await img.jpeg({ quality: 86 }).toFile(out);
console.log("wrote", out);
