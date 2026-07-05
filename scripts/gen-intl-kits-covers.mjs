// Branded 3:2 covers for the international cricket kits + rugby jerseys ranking posts.
// v2 (7/5, Jake's request): the color-chip strip is replaced with a lineup of the
// ACTUAL jerseys — transparent cutouts flood-filled from the repo's sourced retailer
// product shots (content images cricket-*/rugby-*-jersey.jpg). England rugby ships
// with native alpha from World Rugby Shop, so its source PNG lives in the repo too.
// Same family as the other branded covers: dark gradient, eyebrow + big type,
// ColorWay mark bottom-right. Usage: node scripts/gen-intl-kits-covers.mjs
import sharp from "sharp";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");
const W = 1500, H = 1000;

// Flood-fill background removal from the image borders — interior whites survive.
async function cutout(src, thresh) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const isBg = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return mn > thresh && (mx - mn) < 28;
  };
  const seen = new Uint8Array(w * h);
  const q = [];
  for (let x = 0; x < w; x++) q.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) q.push(y * w, y * w + w - 1);
  while (q.length) {
    const p = q.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    const i = p * 4;
    if (!isBg(i)) continue;
    data[i + 3] = 0;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) q.push(p - 1);
    if (x < w - 1) q.push(p + 1);
    if (y > 0) q.push(p - w);
    if (y < h - 1) q.push(p + w);
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).trim().png().toBuffer();
}

const COVERS = [
  {
    out: "public/images/posts/international-cricket-kits-cover.jpg",
    c1: "#0E7C4A", c2: "#0a1030", accent: "#FFC23C",
    eyebrow: "COLORWAY GOES GLOBAL · TOP 10",
    line1: "GREATEST CRICKET",
    line2: "KITS, RANKED",
    sub: "From Bleed Blue to West Indies Maroon, Counting Down to No. 1",
    // real kits, left to right: England blue, NZ black, SA green, Australia gold, WI maroon
    kits: [
      { src: "public/images/posts/cricket-england-jersey.jpg", thresh: 200 },
      { src: "public/images/posts/cricket-new-zealand-jersey.jpg", thresh: 200 },
      { src: "public/images/posts/cricket-south-africa-jersey.jpg", thresh: 205 },
      { src: "public/images/posts/cricket-australia-jersey.jpg", thresh: 205 },
      { src: "public/images/posts/cricket-west-indies-jersey.jpg", thresh: 205 },
    ],
  },
  {
    out: "public/images/posts/international-rugby-jerseys-cover.jpg",
    c1: "#1B3A2B", c2: "#0a0a0a", accent: "#FFB81C",
    eyebrow: "INTERNATIONAL RUGBY · TOP 10",
    line1: "MOST ICONIC RUGBY",
    line2: "JERSEYS, RANKED",
    sub: "From Murrayfield Navy to the All Blacks, Counting Down to No. 1",
    // real kits, left to right: France blue, England white (native alpha), Wallabies gold, Springboks green, All Blacks
    kits: [
      { src: "public/images/posts/rugby-france-jersey.jpg", thresh: 205 },
      { src: "public/images/posts/rugby-england-jersey-alpha.png", native: true },
      { src: "public/images/posts/rugby-australia-jersey.jpg", thresh: 205 },
      { src: "public/images/posts/rugby-south-africa-jersey.jpg", thresh: 205 },
      { src: "public/images/posts/rugby-new-zealand-jersey.jpg", thresh: 200 },
    ],
  },
];

const cwLogoPath = resolve(root, "public/brand/colorway-sports-logo-white.png");

for (const c of COVERS) {
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
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <text x="100" y="478" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" letter-spacing="7" fill="${c.accent}">${c.eyebrow}</text>
  <rect x="100" y="502" width="120" height="8" fill="${c.accent}"/>
  <text x="96" y="610" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="900" letter-spacing="-2" fill="#ffffff">${c.line1}</text>
  <text x="96" y="700" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="900" letter-spacing="-2" fill="#ffffff">${c.line2}</text>
  <text x="100" y="760" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#ffffff" opacity="0.92">${c.sub}</text>
</svg>`;

  const composites = [];

  // Jersey lineup across the top: five real kits at uniform height.
  const KIT_H = 300, Y = 70, X0 = 105, STEP = 265;
  for (let i = 0; i < c.kits.length; i++) {
    const k = c.kits[i];
    const p = resolve(root, k.src);
    if (!existsSync(p)) { console.warn("missing kit:", k.src); continue; }
    const buf = k.native
      ? await sharp(p).trim().png().toBuffer()
      : await cutout(p, k.thresh);
    const kit = await sharp(buf).resize({ height: KIT_H, withoutEnlargement: false }).png().toBuffer();
    const m = await sharp(kit).metadata();
    composites.push({ input: kit, top: Y + (i % 2) * 18, left: X0 + i * STEP + Math.round((240 - m.width) / 2) });
  }

  if (existsSync(cwLogoPath)) {
    const logo = await sharp(cwLogoPath).resize({ height: 60 }).png().toBuffer();
    const m = await sharp(logo).metadata();
    composites.push({ input: logo, top: H - 60 - 44, left: W - (m.width || 200) - 60 });
  }

  const out = resolve(root, c.out);
  await sharp(Buffer.from(svg)).resize(W, H).composite(composites).jpeg({ quality: 86 }).toFile(out);
  console.log("wrote", out);
}
