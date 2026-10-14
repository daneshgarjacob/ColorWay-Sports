// Cover for /stories/how-nfl-picks-prime-time-games-2026 (10/14, Jake OK'd the idea:
// NFL shield + the three prime-time windows, no game photos). Layout differs from the
// prime-time-by-team cover: headline on top, the three network logos as white cards across
// the middle, hook line + ColorWay logo along the bottom.
//   node scripts/gen-how-nfl-picks-prime-time-cover.mjs
import sharp from "sharp";
const W = 1500, H = 1000;
const OUT = "public/images/posts/how-nfl-picks-prime-time-games-2026/cover.jpg";
const RED = "#D50A0A";

const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="g" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="#0b3a7a"/><stop offset="1" stop-color="#020b1c"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="750" y="150" text-anchor="middle" font-family="Hanken Grotesk" font-weight="800" font-size="30" letter-spacing="9" fill="#9fb6d8">EXPLAINED · 2026 NFL SEASON</text>
  <text x="750" y="316" text-anchor="middle" font-family="Hanken Grotesk" font-weight="900" font-size="128" letter-spacing="-2" fill="#ffffff">HOW THE NFL PICKS</text>
  <text x="750" y="466" text-anchor="middle" font-family="Hanken Grotesk" font-weight="900" font-size="128" letter-spacing="-2" fill="#ffffff">PRIME TIME</text>
  <rect x="690" y="500" width="120" height="8" fill="${RED}"/>
</svg>`);

// Logos sit straight on the navy (Jake 10/14: no white cards). SNF's black lettering is
// recoloured white (the peacock keeps its colours); MNF's white surround is flood-removed
// from the edges so only its black box shows; TNF is already a transparent shield.
async function blend(f) {
  const { data, info } = await sharp(`public/logos/networks/${f}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  if (f === "snf") {
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      if (Math.max(r, g, b) < 90 && Math.max(r, g, b) - Math.min(r, g, b) < 30) { data[i] = data[i + 1] = data[i + 2] = 255; }
    }
  }
  if (f === "mnf") {
    const seen = new Uint8Array(w * h), q = [];
    for (let x = 0; x < w; x++) q.push(x, (h - 1) * w + x);
    for (let y = 0; y < h; y++) q.push(y * w, y * w + w - 1);
    while (q.length) {
      const p = q.pop(); if (seen[p]) continue; seen[p] = 1;
      const i = p * 4; if (Math.min(data[i], data[i + 1], data[i + 2]) < 200) continue;
      data[i + 3] = 0;
      const x = p % w, y = (p / w) | 0;
      if (x > 0) q.push(p - 1); if (x < w - 1) q.push(p + 1); if (y > 0) q.push(p - w); if (y < h - 1) q.push(p + w);
    }
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}
const SLOT_W = 400, SLOT_H = 230, GAP = 30, TOP = 580;
const left0 = (W - (SLOT_W * 3 + GAP * 2)) / 2;
const comps = [{ input: bg, left: 0, top: 0 }];
for (const [i, f] of ["snf", "mnf", "tnf"].entries()) {
  const logo = await sharp(await blend(f)).trim().resize({ width: SLOT_W - 40, height: SLOT_H, fit: "inside", kernel: "lanczos3" }).png().toBuffer();
  const m = await sharp(logo).metadata();
  const x = Math.round(left0 + i * (SLOT_W + GAP));
  comps.push({ input: logo, left: x + Math.round((SLOT_W - m.width) / 2), top: TOP + Math.round((SLOT_H - m.height) / 2) });
}
const shield = await sharp("public/logos/leagues/nfl.png").resize({ height: 120 }).png().toBuffer();
comps.push({ input: shield, left: 60, top: 852 });
const cw = await sharp("public/brand/colorway-sports-logo-white.png").resize({ width: 300 }).png().toBuffer();
const cm = await sharp(cw).metadata();
comps.push({ input: cw, left: W - 60 - cm.width, top: 912 - Math.round(cm.height / 2) });

await sharp({ create: { width: W, height: H, channels: 3, background: "#020b1c" } })
  .composite(comps).jpeg({ quality: 86, mozjpeg: true }).toFile(OUT);
console.log("wrote", OUT);
