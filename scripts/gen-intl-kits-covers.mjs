// Branded 3:2 covers for the international cricket kits + rugby jerseys ranking posts.
// Same family as gen-r32-ranked-cover.mjs: dark gradient, big type, ColorWay mark
// bottom-right. The distinctive element is a ranked strip of national kit-color
// swatches (worst on the left, No. 1 on the right, matching the countdown format).
// Usage: node scripts/gen-intl-kits-covers.mjs
import sharp from "sharp";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");
const W = 1500, H = 1000;

const COVERS = [
  {
    out: "public/images/posts/international-cricket-kits-cover.jpg",
    c1: "#0E7C4A", c2: "#0a1030", accent: "#FFC23C",
    eyebrow: "COLORWAY GOES GLOBAL · TOP 10",
    line1: "GREATEST CRICKET",
    line2: "KITS, RANKED",
    sub: "From Bleed Blue to West Indies Maroon, Counting Down to No. 1",
    // rank 10 -> 1, left to right: AFG, ENG, SL, BAN, PAK, NZ, SA, AUS, WI, IND
    swatches: [
      ["#0057B8", "#D62612"], ["#0a2a6e", "#7ea8d8"], ["#1c3fa0", "#FFB300"],
      ["#006A4E", "#F42A41"], ["#01411C", "#3f9b57"], ["#0a0a0a", "#c0c0c0"],
      ["#007749", "#FFB81C"], ["#FFD100", "#006A4E"], ["#5C0632", "#8a2b52"],
      ["#1D6EE0", "#FF9933"],
    ],
  },
  {
    out: "public/images/posts/international-rugby-jerseys-cover.jpg",
    c1: "#1B3A2B", c2: "#0a0a0a", accent: "#FFB81C",
    eyebrow: "INTERNATIONAL RUGBY · TOP 10",
    line1: "MOST ICONIC RUGBY",
    line2: "JERSEYS, RANKED",
    sub: "From Murrayfield Navy to the All Blacks, Counting Down to No. 1",
    // rank 10 -> 1: SCO, FIJ, ARG, WAL, IRE, FRA, ENG, AUS, RSA, NZL
    swatches: [
      ["#0a2a5e", "#4a6a9e"], ["#f5f5f5", "#0a0a0a"], ["#75AADB", "#ffffff"],
      ["#D30731", "#ffffff"], ["#169B62", "#0d6b45"], ["#1e3f8f", "#D30731"],
      ["#f5f5f5", "#D30731"], ["#FFB81C", "#006A4E"], ["#006A4E", "#FFB81C"],
      ["#0a0a0a", "#c0c0c0"],
    ],
  },
];

const cwLogoPath = resolve(root, "public/brand/colorway-sports-logo-white.png");

for (const c of COVERS) {
  // ranked swatch strip along the top: 10 rounded jersey-color chips
  const chips = c.swatches
    .map((pair, i) => {
      const x = 100 + i * 134;
      return `<rect x="${x}" y="90" width="110" height="150" rx="14" fill="${pair[0]}" stroke="#ffffff" stroke-opacity="0.25" stroke-width="3"/>
  <rect x="${x}" y="196" width="110" height="44" rx="0" fill="${pair[1]}" opacity="0.9"/>
  <rect x="${x}" y="90" width="110" height="150" rx="14" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="3"/>
  <text x="${x + 55}" y="286" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="800" fill="#ffffff" opacity="0.55">${10 - i}</text>`;
    })
    .join("\n  ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c.c1}"/>
      <stop offset="1" stop-color="${c.c2}"/>
    </linearGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.45" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${chips}
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <text x="100" y="478" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" letter-spacing="7" fill="${c.accent}">${c.eyebrow}</text>
  <rect x="100" y="502" width="120" height="8" fill="${c.accent}"/>
  <text x="96" y="610" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="900" letter-spacing="-2" fill="#ffffff">${c.line1}</text>
  <text x="96" y="700" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="900" letter-spacing="-2" fill="#ffffff">${c.line2}</text>
  <text x="100" y="760" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#ffffff" opacity="0.92">${c.sub}</text>
</svg>`;

  const composites = [];
  if (existsSync(cwLogoPath)) {
    const logo = await sharp(cwLogoPath).resize({ height: 60 }).png().toBuffer();
    const m = await sharp(logo).metadata();
    composites.push({ input: logo, top: H - 60 - 44, left: W - (m.width || 200) - 60 });
  }

  const out = resolve(root, c.out);
  await sharp(Buffer.from(svg)).resize(W, H).composite(composites).jpeg({ quality: 86 }).toFile(out);
  console.log("wrote", out);
}
