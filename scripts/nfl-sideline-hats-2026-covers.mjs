#!/usr/bin/env node
// ColorWay Sports covers: 2026 NFL Sideline hat rankings (primary + historic).
// Three real New Era 9SEVENTY caps per cover, white background knocked out,
// floating on a themed gradient with spotlights. 1500x1000 (3:2).
// Watermark is applied separately via scripts/watermark.mjs (bottom-middle).

import sharp from "sharp";
import { writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(__dirname, "../public/images/posts/nfl-sideline-hats-2026-ranked");
const W = 1500, H = 1000;

// Knock out the border-connected white background, keep interior whites (logos).
async function knockoutWhite(path, targetH) {
  const { data, info } = await sharp(path)
    .resize({ height: targetH })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const lum = (i) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  // Aggressive flood so the product shot's soft drop shadow goes too, not just pure white.
  const isBg = (i) => lum(i) >= 216;
  const visited = new Uint8Array(width * height);
  const stack = [];
  const pushIf = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    visited[p] = 1;
    const i = p * channels;
    if (isBg(i)) { data[i + 3] = 0; stack.push(x, y); }
  };
  for (let x = 0; x < width; x++) { pushIf(x, 0); pushIf(x, height - 1); }
  for (let y = 0; y < height; y++) { pushIf(0, y); pushIf(width - 1, y); }
  while (stack.length) {
    const y = stack.pop(), x = stack.pop();
    pushIf(x + 1, y); pushIf(x - 1, y); pushIf(x, y + 1); pushIf(x, y - 1);
  }
  // Feather the frontier: light pixels touching transparency fade out instead of
  // leaving a hard white rim where the shadow was cut.
  for (let pass = 0; pass < 3; pass++) {
    const edits = [];
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const p = y * width + x, i = p * channels;
      if (data[i + 3] === 0) continue;
      const L = lum(i);
      if (L < 198) continue;
      let touches = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        if (data[(ny * width + nx) * channels + 3] === 0) { touches = true; break; }
      }
      if (!touches) continue;
      const a = Math.max(0, Math.min(1, (240 - L) / 42));
      edits.push([i + 3, Math.round(data[i + 3] * a)]);
    }
    if (!edits.length) break;
    for (const [idx, v] of edits) data[idx] = v;
  }
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * channels + 3] > 0) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const w = maxX - minX + 1, h = maxY - minY + 1;
  const buf = await sharp(data, { raw: { width, height, channels } })
    .extract({ left: minX, top: minY, width: w, height: h })
    .png().toBuffer();
  return { buf, w, h };
}

const CENTERS = [318, 750, 1182];
const CAP_CY = 642;

function bg({ c1, c2, c3, rule }) {
  const glows = CENTERS.map((cx) =>
    `<ellipse cx="${cx}" cy="${CAP_CY + 30}" rx="272" ry="196" fill="url(#spot)"/>`).join("");
  return `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="52%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="vig" cx="50%" cy="44%" r="68%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.38"/>
      <stop offset="76%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="spot" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.32"/>
      <stop offset="70%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="70%" stop-color="#000000" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.46"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
  ${glows}
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect x="0" y="0" width="${W}" height="9" fill="${rule}"/>
</svg>`;
}

function text({ eyebrow, title, sub, accent, titleSize }) {
  return `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; fill: ${accent}; letter-spacing: 5px; }
    .title { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; fill: #ffffff; letter-spacing: -2px; }
    .sub { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; fill: #E7ECF6; letter-spacing: 1px; }
  </style>
  <text x="${W / 2}" y="150" text-anchor="middle" class="eyebrow" font-size="25">${eyebrow}</text>
  <text x="${W / 2}" y="262" text-anchor="middle" class="title" font-size="${titleSize}">${title}</text>
  <text x="${W / 2}" y="336" text-anchor="middle" class="sub" font-size="29">${sub}</text>
</svg>`;
}

async function build({ caps, out, theme, copy }) {
  let img = sharp(Buffer.from(bg(theme)));
  const loaded = await Promise.all(caps.map((f) => knockoutWhite(resolve(DIR, f), 404)));
  const comps = [];
  for (const i of [0, 2, 1]) { // outer caps first, center on top
    const { buf, w, h } = loaded[i];
    comps.push({ input: buf, left: Math.round(CENTERS[i] - w / 2), top: Math.round(CAP_CY - h / 2) });
  }
  comps.push({ input: Buffer.from(text(copy)), top: 0, left: 0 });
  const final = await img.composite(comps).jpeg({ quality: 90 }).toBuffer();
  await writeFile(resolve(DIR, out), final);
  console.log(`Wrote ${out}`);
}

// PRIMARY: Jake's three A-graded caps (Rams, Eagles, Jets) on NFL navy-to-red.
await build({
  caps: ["philadelphia-eagles-primary.jpg", "los-angeles-rams-primary.jpg", "new-york-jets-primary.jpg"],
  out: "cover-sideline-hats-ranked.jpg",
  theme: { c1: "#013369", c2: "#0C1526", c3: "#D50A0A", rule: "#D50A0A" },
  copy: {
    eyebrow: "2026 NFL SIDELINE HATS  ·  NEW ERA 9SEVENTY",
    title: "ALL 32, RANKED",
    sub: "Every Team Graded  ·  Only Three Earned an A",
    accent: "#FF8A4C",
    titleSize: 112,
  },
});

// HISTORIC: the two A+ caps (Eagles, Vikings) plus the creamsicle Bucs, on vintage leather-to-gold.
await build({
  caps: ["minnesota-vikings-historic.jpg", "philadelphia-eagles-historic.jpg", "tampa-bay-buccaneers-historic.jpg"],
  out: "cover-historic-sideline-hats-ranked.jpg",
  theme: { c1: "#46280F", c2: "#17120D", c3: "#C08A2E", rule: "#C08A2E" },
  copy: {
    eyebrow: "2026 NFL HISTORIC SIDELINE HATS  ·  NEW ERA",
    title: "ALL 26 THROWBACKS, RANKED",
    sub: "They Beat the Regular Hats  ·  Every Cap Graded",
    accent: "#F0C070",
    titleSize: 84,
  },
});
