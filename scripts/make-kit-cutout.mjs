#!/usr/bin/env node
// Turn a clean product-shot JPG (kit on a plain light background) into a trimmed,
// transparent PNG cutout for the branded covers.
//
// Flood-fills inward from the border so light pixels INSIDE the shirt (white trim,
// a white crest, gaps between sleeves) are kept — a naive "all near-white -> clear"
// threshold eats those. Edges get a 1px alpha feather so they don't read jagged on
// the navy cover gradient.
//
// Only works on clean laydowns on a flat background. Lifestyle shots (clotheslines,
// hands, cast shadows) will drag artifacts through the fill — source a real product
// shot instead. Retailer Shopify stores expose /products/<handle>.json with image
// URLs; that is how the Spain home shot was sourced.
//
// Usage: node scripts/make-kit-cutout.mjs <input> <output.png> [height] [tolerance]
import sharp from "sharp";
import { resolve } from "node:path";

const [, , inArg, outArg, hArg, tolArg] = process.argv;
if (!inArg || !outArg) {
  console.error("usage: make-kit-cutout.mjs <input> <output.png> [height] [tolerance]");
  process.exit(1);
}
const HEIGHT = Number(hArg ?? 600); // output height; covers use ~365-395, keep headroom
const TOL = Number(tolArg ?? 32); // how far from the corner color still counts as bg

const src = resolve(inArg);
const out = resolve(outArg);

const img = sharp(src).ensureAlpha();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

// Sample the four corners to learn the background color.
const corners = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]];
let br = 0, bg = 0, bb = 0;
for (const [x, y] of corners) {
  const i = (y * W + x) * C;
  br += data[i]; bg += data[i + 1]; bb += data[i + 2];
}
br /= 4; bg /= 4; bb /= 4;
console.log(`background sampled: rgb(${br.toFixed(0)}, ${bg.toFixed(0)}, ${bb.toFixed(0)})`);

const isBg = (i) =>
  Math.abs(data[i] - br) <= TOL &&
  Math.abs(data[i + 1] - bg) <= TOL &&
  Math.abs(data[i + 2] - bb) <= TOL;

// BFS flood-fill from every border pixel.
const clear = new Uint8Array(W * H);
const stack = [];
for (let x = 0; x < W; x++) { stack.push(x, 0, x, H - 1); }
for (let y = 0; y < H; y++) { stack.push(0, y, W - 1, y); }

while (stack.length) {
  const y = stack.pop(), x = stack.pop();
  if (x < 0 || y < 0 || x >= W || y >= H) continue;
  const p = y * W + x;
  if (clear[p]) continue;
  if (!isBg(p * C)) continue;
  clear[p] = 1;
  stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
}

// Build an alpha mask, then feather: a cleared pixel touching a kept pixel gets
// partial alpha so the silhouette edge isn't a hard staircase.
const alpha = Buffer.alloc(W * H);
for (let p = 0; p < W * H; p++) alpha[p] = clear[p] ? 0 : 255;
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    const p = y * W + x;
    if (!clear[p]) continue;
    let kept = 0;
    for (const q of [p - 1, p + 1, p - W, p + W]) if (!clear[q]) kept++;
    if (kept) alpha[p] = Math.min(255, kept * 60);
  }
}

// Build RGBA in one buffer. Do NOT use sharp's joinChannel() to attach the alpha
// separately — combined with extract() it silently produced all-black opaque pixels
// and ignored the crop.
const rgba = Buffer.alloc(W * H * 4);
for (let p = 0; p < W * H; p++) {
  rgba[p * 4] = data[p * C];
  rgba[p * 4 + 1] = data[p * C + 1];
  rgba[p * 4 + 2] = data[p * C + 2];
  rgba[p * 4 + 3] = alpha[p];
}

const cleared = clear.reduce((a, b) => a + b, 0);
console.log(`cleared ${((cleared / (W * H)) * 100).toFixed(1)}% of pixels as background`);

// Crop to the kit's bounding box from the alpha we just built. sharp's .trim() does
// not reliably crop a transparent border here, so compute the box ourselves.
let x0 = W, y0 = H, x1 = 0, y1 = 0;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (alpha[y * W + x] > 8) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
}
console.log(`bbox ${x0},${y0} -> ${x1},${y1} (${x1 - x0 + 1}x${y1 - y0 + 1})`);

// Palette-quantize: a full-RGBA kit cutout lands ~480 KB, which busts the image
// diet in AGENTS.md; 192 colors gets it to ~120 KB with the alpha edge intact.
await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
  .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
  .resize({ height: HEIGHT })
  .png({ compressionLevel: 9, palette: true, colors: 192, dither: 0.4 })
  .toFile(out);

const m = await sharp(out).metadata();
console.log(`wrote ${out} (${m.width}x${m.height})`);
