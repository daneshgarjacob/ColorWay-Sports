#!/usr/bin/env node
// Builds the transparent MLB jersey PNG library for the daily uniform tracker.
// Reads a manifest of product-image URLs (collected from MLBShop/Fanatics Nike
// Authentic listings), downloads each shot to the archive stash, and produces a
// standardized transparent cutout per uniform:
//   ~/Desktop/colorway-archive/mlb-2026-jerseys/{team}-{uniform}.png
// White/near-white backgrounds are removed with the same border flood-fill used
// for the cricket/rugby cover cutouts (interior whites survive). Images that
// already ship with alpha are passed through. Idempotent: existing outputs are
// skipped unless --force.
// Manifest: ~/Desktop/colorway-archive/mlb-2026-jerseys/manifest.json
//   [{ "team": "phillies", "uniform": "powder-blue", "url": "https://fanatics.frgimages.com/...", "source": "https://www.mlbshop.com/..." }]
// Usage: node scripts/build-mlb-jersey-library.mjs [--force]

import sharp from "sharp";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { homedir } from "node:os";

const STASH = resolve(homedir(), "Desktop/colorway-archive/mlb-2026-jerseys");
const RAW = resolve(STASH, "raw");
const MANIFEST = resolve(STASH, "manifest.json");
const FORCE = process.argv.includes("--force");
const MAX_H = 800; // library images cap; posts resize down from here

// Flood-fill background removal from the image borders — interior whites survive.
async function cutout(buf, thresh = 235) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
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

// Fanatics MLB "Elite"/"Authentic" shots are a front+back composite (back left,
// front right) on a transparent gutter. Keep the right portion (the front
// jersey) and re-trim to content. Pass `single:true` on a manifest entry to skip
// this when a product's primary image is already a single front jersey.
async function frontOnly(buf, single) {
  if (single) return buf;
  const m = await sharp(buf).metadata();
  const left = Math.round(m.width * 0.46);
  return sharp(buf)
    .extract({ left, top: 0, width: m.width - left, height: m.height })
    .trim()
    .png()
    .toBuffer();
}

async function hasRealAlpha(buf) {
  const meta = await sharp(buf).metadata();
  if (!meta.hasAlpha) return false;
  // hasAlpha can be true on a fully opaque PNG — check the actual channel.
  const stats = await sharp(buf).stats();
  const alpha = stats.channels[stats.channels.length - 1];
  return alpha.min < 250;
}

async function download(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get("content-type") || "";
  if (!type.startsWith("image/")) throw new Error(`not an image (${type})`);
  return Buffer.from(await res.arrayBuffer());
}

await mkdir(RAW, { recursive: true });
if (!existsSync(MANIFEST)) {
  console.error(`No manifest at ${MANIFEST} — write it first.`);
  process.exit(1);
}
const entries = JSON.parse(await readFile(MANIFEST, "utf8"));
const results = { ok: [], skipped: [], failed: [] };

for (const e of entries) {
  const slug = `${e.team}-${e.uniform}`;
  const out = resolve(STASH, `${slug}.png`);
  if (existsSync(out) && !FORCE) { results.skipped.push(slug); continue; }
  try {
    const rawPath = resolve(RAW, `${slug}-raw`);
    let buf;
    if (existsSync(rawPath) && !FORCE) {
      buf = await readFile(rawPath);
    } else {
      buf = await download(e.url);
      await writeFile(rawPath, buf);
    }
    const transparent = (await hasRealAlpha(buf))
      ? await sharp(buf).trim().png().toBuffer()
      : await cutout(buf, e.thresh ?? 235);
    const cropped = await frontOnly(transparent, e.single);
    const final = await sharp(cropped)
      .resize({ height: MAX_H, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    await writeFile(out, final);
    const m = await sharp(final).metadata();
    results.ok.push(`${slug} (${m.width}x${m.height})`);
    console.log(`OK   ${slug} ${m.width}x${m.height}`);
  } catch (err) {
    results.failed.push(`${slug}: ${err.message}`);
    console.log(`FAIL ${slug}: ${err.message}`);
  }
}

console.log(`\n===== ${results.ok.length} built, ${results.skipped.length} skipped, ${results.failed.length} failed =====`);
if (results.failed.length) console.log(results.failed.map((f) => `  ${f}`).join("\n"));
