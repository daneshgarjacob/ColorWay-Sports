// Generates the cover for the "How World Cup Kits Are Chosen" explainer.
// Design-forward, photo-free, no FIFA marks (compliance-safe): two contrasting
// jersey silhouettes (light vs colour) on the dark ColorWay palette.
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, "..", "public", "images", "posts", "world-cup-kit-rules", "cover.jpg");

// One reusable jersey silhouette path (~300 wide x ~330 tall in its own space).
const JERSEY = "M10,70 L95,35 Q150,75 205,35 L290,70 L270,132 L215,110 L215,320 Q150,336 85,320 L85,110 L30,132 Z";

const svg = `<svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B1A2F"/>
      <stop offset="0.55" stop-color="#0d1626"/>
      <stop offset="1" stop-color="#11161D"/>
    </linearGradient>
    <linearGradient id="seam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FF5910" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#FF5910" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#FF5910" stop-opacity="0"/>
    </linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="22" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>

  <rect width="1600" height="900" fill="url(#bg)"/>

  <!-- faint baseline grid -->
  <g opacity="0.05" stroke="#E8EBF0" stroke-width="1">
    <line x1="0" y1="225" x2="1600" y2="225"/>
    <line x1="0" y1="450" x2="1600" y2="450"/>
    <line x1="0" y1="675" x2="1600" y2="675"/>
  </g>

  <!-- two contrasting kits, slightly overlapped, centre-right -->
  <g filter="url(#sh)">
    <g transform="translate(820,205) scale(1.32) rotate(-7)">
      <path d="${JERSEY}" fill="#EEF1F6" stroke="#cfd6e0" stroke-width="3"/>
    </g>
    <g transform="translate(1090,255) scale(1.42) rotate(8)">
      <path d="${JERSEY}" fill="#C8102E" stroke="#8B0000" stroke-width="3"/>
    </g>
  </g>

  <!-- contrast seam between them -->
  <rect x="1058" y="150" width="4" height="560" fill="url(#seam)"/>

  <!-- kit labels -->
  <text x="965" y="730" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" letter-spacing="4" fill="#9aa6b6" text-anchor="middle">LIGHT KIT</text>
  <text x="1320" y="772" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" letter-spacing="4" fill="#d98a86" text-anchor="middle">COLOUR KIT</text>

  <!-- headline block, lower-left -->
  <text x="90" y="430" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="800" letter-spacing="6" fill="#FF5910">THE KIT-CLASH RULES</text>
  <text x="86" y="525" font-family="Arial, Helvetica, sans-serif" font-size="104" font-weight="800" fill="#ffffff">Who Wears What</text>
  <text x="90" y="630" font-family="Arial, Helvetica, sans-serif" font-size="104" font-weight="800" fill="#ffffff">at the World Cup</text>
  <text x="92" y="700" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="500" fill="#9aa6b6">How every 2026 match kit is decided — and who decides it</text>

  <!-- wordmark -->
  <text x="90" y="120" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="800" letter-spacing="3" fill="#E8EBF0">COLORWAY SPORTS</text>
</svg>`;

await sharp(Buffer.from(svg)).jpeg({ quality: 84, mozjpeg: true }).toFile(out);
console.log("wrote", out);
