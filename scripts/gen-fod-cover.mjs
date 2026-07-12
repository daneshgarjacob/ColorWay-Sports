// One-off editorial cover for the leaked Field of Dreams 2026 jerseys post.
// Deliberately NOT the tracker template: warm aged-cream palette, serif display
// type, real team logos (fetched from ESPN CDN), zero photography — so nothing on
// the cover needs crediting. Usage: node scripts/gen-fod-cover.mjs
import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1500, H = 1000;

const cornRows = Array.from({ length: 26 }, (_, i) => {
  const x = 30 + i * 58;
  return `<rect x="${x}" y="650" width="2.5" height="350" fill="#8a6f3a" opacity="0.10"/>`;
}).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="#f7efda"/>
      <stop offset="0.6" stop-color="#efe1c1"/>
      <stop offset="1" stop-color="#e4d2a8"/>
    </linearGradient>
    <radialGradient id="vig" cx="0.5" cy="0.42" r="0.75">
      <stop offset="0.6" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#5b4620" stop-opacity="0.18"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${cornRows}
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
  <text x="750" y="150" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="26" font-weight="700" letter-spacing="9" fill="#9c2b1f" font-style="italic">COLORWAY · FIRST LOOK</text>
  <text x="750" y="702" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="90" font-weight="900" fill="#16233f" letter-spacing="1">Field of Dreams 2026</text>
  <text x="750" y="772" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="33" font-weight="700" fill="#5a4a2e">The Leaked Twins &amp; Phillies Throwbacks, Graded</text>
  <rect x="620" y="818" width="260" height="3" fill="#9c2b1f" opacity="0.7"/>
  <text x="750" y="882" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="800" letter-spacing="5" fill="#16233f">AUGUST 13 · DYERSVILLE, IOWA</text>
</svg>`;

const dl = async (u) => Buffer.from(await (await fetch(u)).arrayBuffer());
const min = await sharp(await dl("https://a.espncdn.com/i/teamlogos/mlb/500/min.png")).resize({ height: 300 }).png().toBuffer();
const phi = await sharp(await dl("https://a.espncdn.com/i/teamlogos/mlb/500/phi.png")).resize({ height: 300 }).png().toBuffer();
const vs = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><text x="60" y="88" text-anchor="middle" font-family="Georgia, serif" font-size="60" font-style="italic" font-weight="700" fill="#9c2b1f">vs</text></svg>`)).png().toBuffer();

const out = resolve(root, "public/images/posts/field-of-dreams-2026/cover.jpg");
await sharp(Buffer.from(svg)).resize(W, H).composite([
  { input: min, top: 235, left: 380 },
  { input: vs, top: 325, left: 690 },
  { input: phi, top: 235, left: 840 },
]).jpeg({ quality: 88 }).toFile(out);
console.log("wrote", out);
