// Cover for "How World Cup Kits Are Chosen" — design-forward, NO FIFA marks.
// Two real 2026 World Cup kits (one light, one colour) set in tracker-style
// tiles on the dark ColorWay palette, illustrating the light-vs-colour clash.
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = join(__dirname, "..", "public", "images", "posts");
const out = join(pub, "world-cup-kit-rules", "cover.jpg");

const WHITE_KIT = join(pub, "wc-england-home.jpg"); // light kit
const COLOR_KIT = join(pub, "wc-norway-home.jpg");  // colour kit

// tile geometry
const tileY = 230, tileW = 320, tileH = 400, pad = 26;
const leftTileX = 855, rightTileX = 1185;
const innerW = tileW - pad * 2, innerH = tileH - pad * 2;

const white = await sharp(WHITE_KIT).resize(innerW, innerH, { fit: "inside" }).toBuffer({ resolveWithObject: true });
const color = await sharp(COLOR_KIT).resize(innerW, innerH, { fit: "inside" }).toBuffer({ resolveWithObject: true });

const place = (tileX, info) => ({
  left: Math.round(tileX + (tileW - info.info.width) / 2),
  top: Math.round(tileY + (tileH - info.info.height) / 2),
});

const svg = `<svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B1A2F"/><stop offset="0.55" stop-color="#0d1626"/><stop offset="1" stop-color="#11161D"/>
    </linearGradient>
    <linearGradient id="seam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FF5910" stop-opacity="0"/><stop offset="0.5" stop-color="#FF5910" stop-opacity="0.9"/><stop offset="1" stop-color="#FF5910" stop-opacity="0"/>
    </linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="20" flood-color="#000" flood-opacity="0.45"/></filter>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)"/>
  <g opacity="0.05" stroke="#E8EBF0" stroke-width="1"><line x1="0" y1="225" x2="1600" y2="225"/><line x1="0" y1="450" x2="1600" y2="450"/><line x1="0" y1="675" x2="1600" y2="675"/></g>

  <g filter="url(#sh)">
    <rect x="${leftTileX}" y="${tileY}" width="${tileW}" height="${tileH}" rx="16" fill="#edf0f4"/>
    <rect x="${rightTileX}" y="${tileY}" width="${tileW}" height="${tileH}" rx="16" fill="#edf0f4"/>
  </g>
  <rect x="${(leftTileX + tileW + rightTileX) / 2 - 2}" y="250" width="4" height="360" fill="url(#seam)"/>

  <text x="${leftTileX + tileW / 2}" y="${tileY + tileH + 42}" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" letter-spacing="4" fill="#9aa6b6" text-anchor="middle">LIGHT KIT</text>
  <text x="${rightTileX + tileW / 2}" y="${tileY + tileH + 42}" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" letter-spacing="4" fill="#d98a86" text-anchor="middle">COLOUR KIT</text>

  <text x="90" y="120" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="800" letter-spacing="3" fill="#E8EBF0">COLORWAY SPORTS</text>

  <text x="90" y="392" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="800" letter-spacing="6" fill="#FF5910">THE KIT-CLASH RULES</text>
  <text x="86" y="478" font-family="Arial, Helvetica, sans-serif" font-size="78" font-weight="800" fill="#ffffff">Who Wears What</text>
  <text x="89" y="560" font-family="Arial, Helvetica, sans-serif" font-size="78" font-weight="800" fill="#ffffff">at the World Cup</text>
  <text x="91" y="612" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="500" fill="#9aa6b6">How every 2026 match kit is decided — and who decides it</text>
</svg>`;

await sharp(Buffer.from(svg))
  .composite([
    { input: white.data, ...place(leftTileX, white) },
    { input: color.data, ...place(rightTileX, color) },
  ])
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(out);
console.log("wrote", out);
