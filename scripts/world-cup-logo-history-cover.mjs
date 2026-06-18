// Cover for "Every World Cup Logo, Ranked" — design-forward, photo-free, NO FIFA
// marks (compliance-safe). Abstract year "medallions" in era palettes, not the
// actual emblems, on the dark ColorWay palette.
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, "..", "public", "images", "posts", "world-cup-logo-history", "cover.jpg");

// year medallions: [year, colorA, colorB, isTop]
const meds = [
  ["1930", "#6CACE4", "#1b1b1b", false],
  ["1970", "#1b7a44", "#0e0e0e", true],
  ["1990", "#0a8a3f", "#c8102e", false],
  ["2010", "#007A4D", "#FFB81C", false],
  ["2022", "#8A1538", "#5e0f27", false],
  ["2026", "#E4007C", "#00B5E2", false],
];

const r = 92;
const gap = 38;
const totalW = meds.length * (r * 2) + (meds.length - 1) * gap;
let x = 1600 - 96 - totalW; // right-aligned block
const cy = 470;

const medSvg = meds.map(([yr, a, b, top], i) => {
  const cx = x + r + i * (r * 2 + gap);
  const gid = `g${i}`;
  return `
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
    </linearGradient></defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${gid})" stroke="${top ? "#FFD23F" : "rgba(255,255,255,0.18)"}" stroke-width="${top ? 7 : 3}"/>
    ${top ? `<circle cx="${cx}" cy="${cy - r - 26}" r="20" fill="#FFD23F"/><text x="${cx}" y="${cy - r - 18}" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800" fill="#11161D" text-anchor="middle">1</text>` : ""}
    <text x="${cx}" y="${cy + 12}" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" fill="#ffffff" text-anchor="middle" style="paint-order:stroke;stroke:rgba(0,0,0,0.35);stroke-width:3px;">${yr}</text>`;
}).join("");

const svg = `<svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B1A2F"/><stop offset="0.55" stop-color="#0d1626"/><stop offset="1" stop-color="#11161D"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)"/>
  <g opacity="0.05" stroke="#E8EBF0" stroke-width="1">
    <line x1="0" y1="300" x2="1600" y2="300"/><line x1="0" y1="640" x2="1600" y2="640"/>
  </g>

  <text x="90" y="120" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="800" letter-spacing="3" fill="#E8EBF0">COLORWAY SPORTS</text>

  ${medSvg}

  <text x="90" y="690" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="800" letter-spacing="6" fill="#FF5910">RANKED · 1930 → 2026</text>
  <text x="86" y="790" font-family="Arial, Helvetica, sans-serif" font-size="100" font-weight="800" fill="#ffffff">Every World Cup Logo</text>
</svg>`;

await sharp(Buffer.from(svg)).jpeg({ quality: 84, mozjpeg: true }).toFile(out);
console.log("wrote", out);
