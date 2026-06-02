import sharp from "sharp";
import { readFileSync } from "fs";
import { join } from "path";

const WIDTH = 1600;
const HEIGHT = 900;

const USA_BLUE = "#012169";
const RED = "#C8102E";
const MEX_GREEN = "#006847";
const GOLD = "#D4A017";
const ORANGE = "#FF5910";

const LOGO_HEIGHT = 540;
const logoPath = join(process.cwd(), "public/logos/world-cup-2026.png");
const logoBuf = readFileSync(logoPath);
const logoResized = await sharp(logoBuf).resize(null, LOGO_HEIGHT, { fit: "contain" }).png().toBuffer();
const logoMeta = await sharp(logoResized).metadata();

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${USA_BLUE}"/>
      <stop offset="50%" stop-color="${RED}"/>
      <stop offset="100%" stop-color="${MEX_GREEN}"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${WIDTH}" height="6" fill="${ORANGE}"/>
  <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="${ORANGE}"/>

  <text x="1080" y="270" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="700" font-size="38" letter-spacing="14" fill="#ffffff" fill-opacity="0.95">2026 FIFA WORLD CUP</text>

  <text x="1080" y="450" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="900" font-size="130" letter-spacing="-4" fill="#ffffff">Jersey Tracker</text>

  <text x="1080" y="540" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="600" font-size="30" letter-spacing="6" fill="${GOLD}">EVERY MATCH KIT GRADED</text>

  <text x="${WIDTH - 30}" y="${HEIGHT - 30}" text-anchor="end" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="700" font-size="20" letter-spacing="3" fill="#ffffff" fill-opacity="0.7">COLORWAY SPORTS</text>
</svg>`;

const composite = await sharp(Buffer.from(svg))
  .composite([{ input: logoResized, top: Math.round((HEIGHT - LOGO_HEIGHT) / 2), left: 180 }])
  .png({ compressionLevel: 9 })
  .toFile(join(process.cwd(), "public/images/posts/world-cup-2026-jersey-tracker/cover.png"));

console.log(`Wrote cover: public/images/posts/world-cup-2026-jersey-tracker/cover.png`);
