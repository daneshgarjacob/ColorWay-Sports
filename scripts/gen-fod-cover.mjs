// Editorial cover for the Field of Dreams 2026 uniforms post.
// Deliberately NOT the tracker template: warm aged-cream palette, serif display
// type, real team logos (fetched from ESPN CDN), zero photography — so nothing on
// the cover needs crediting and there is no movie/MLB imagery to license.
// Updated 2026-07-20 for the official unveiling: adds graded badges + a deeper
// cornfield treatment. Usage: node scripts/gen-fod-cover.mjs
import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1500, H = 1000;

// Layered corn: three passes at different heights/opacities so it reads as a
// field with depth rather than a barcode.
const corn = (count, baseY, height, opacity, width, tint) =>
  Array.from({ length: count }, (_, i) => {
    const x = 18 + i * ((W - 36) / count);
    const jitter = ((i * 37) % 11) - 5;
    const h = height + ((i * 23) % 34);
    return `<rect x="${x.toFixed(1)}" y="${baseY + jitter}" width="${width}" height="${h}" fill="${tint}" opacity="${opacity}" rx="${width / 2}"/>`;
  }).join("");

const cornBack = corn(64, 690, 150, 0.09, 3, "#6d5622");
const cornMid = corn(42, 742, 190, 0.13, 4, "#5c4a1d");
const cornFront = corn(28, 800, 210, 0.17, 5.5, "#4a3b17");

// Badge width scales with label length so nothing overflows the pill.
const gradeBadge = (cx, label, grade, accent) => {
  const text = `${label} ${grade}`;
  const w = Math.max(170, text.length * 17 + 44);
  const x = cx - w / 2;
  return `
  <g>
    <rect x="${x.toFixed(1)}" y="574" width="${w}" height="54" rx="27" fill="${accent}" opacity="0.94"/>
    <text x="${cx}" y="610" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="900" fill="#ffffff" letter-spacing="1.5">${text}</text>
  </g>`;
};

// Load the logos first so badges can be centred on their true rendered widths.
const dl = async (u) => Buffer.from(await (await fetch(u)).arrayBuffer());
const LOGO_H = 290, LOGO_TOP = 240;
const minBuf = await sharp(await dl("https://a.espncdn.com/i/teamlogos/mlb/500/min.png")).resize({ height: LOGO_H }).png().toBuffer();
const phiBuf = await sharp(await dl("https://a.espncdn.com/i/teamlogos/mlb/500/phi.png")).resize({ height: LOGO_H }).png().toBuffer();
const minW = (await sharp(minBuf).metadata()).width;
const phiW = (await sharp(phiBuf).metadata()).width;

const GAP = 210;                                  // clear space for the "vs"
const totalW = minW + GAP + phiW;
const minLeft = Math.round((W - totalW) / 2);
const phiLeft = minLeft + minW + GAP;
const minCx = minLeft + minW / 2;
const phiCx = phiLeft + phiW / 2;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="#faf4e4"/>
      <stop offset="0.45" stop-color="#efe1c1"/>
      <stop offset="1" stop-color="#ddc79a"/>
    </linearGradient>
    <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#16233f" stop-opacity="0.16"/>
      <stop offset="0.5" stop-color="#16233f" stop-opacity="0.02"/>
      <stop offset="1" stop-color="#16233f" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="vig" cx="0.5" cy="0.4" r="0.78">
      <stop offset="0.55" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#4a3b17" stop-opacity="0.24"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#dusk)"/>
  ${cornBack}
  ${cornMid}
  ${cornFront}
  <rect width="${W}" height="${H}" fill="url(#vig)"/>

  <text x="750" y="128" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="25" font-weight="700" letter-spacing="10" fill="#9c2b1f" font-style="italic">COLORWAY · OFFICIAL FIRST LOOK</text>
  <rect x="640" y="152" width="220" height="2" fill="#9c2b1f" opacity="0.45"/>

  ${gradeBadge(minCx, "TWINS", "B", "#002B5C")}
  ${gradeBadge(phiCx, "PHILLIES", "A-", "#9c2b1f")}

  <text x="750" y="712" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="88" font-weight="900" fill="#16233f" letter-spacing="1">Field of Dreams 2026</text>
  <text x="750" y="778" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700" fill="#5a4a2e">Both Official Throwbacks, Graded</text>
  <rect x="620" y="822" width="260" height="3" fill="#9c2b1f" opacity="0.7"/>
  <text x="750" y="886" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="800" letter-spacing="5" fill="#16233f">AUGUST 13 · DYERSVILLE, IOWA</text>
</svg>`;

const vs = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140"><text x="70" y="98" text-anchor="middle" font-family="Georgia, serif" font-size="58" font-style="italic" font-weight="700" fill="#9c2b1f" opacity="0.85">vs</text></svg>`)).png().toBuffer();

const out = resolve(root, "public/images/posts/field-of-dreams-2026/cover.jpg");
await sharp(Buffer.from(svg)).resize(W, H).composite([
  { input: minBuf, top: LOGO_TOP, left: minLeft },
  { input: vs, top: LOGO_TOP + Math.round(LOGO_H / 2) - 70, left: Math.round(W / 2) - 70 },
  { input: phiBuf, top: LOGO_TOP, left: phiLeft },
]).jpeg({ quality: 88 }).toFile(out);
console.log("wrote", out);
