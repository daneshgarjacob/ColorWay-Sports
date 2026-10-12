#!/usr/bin/env node
// Shrink the nav/card logo PNGs that ship to every reader.
// Run: node scripts/shrink-logos.mjs   (idempotent; --dry-run to preview)
//
// public/logos/teams/*.png and public/logos/leagues/*.png are displayed at
// 14-36 CSS px (nav, story cards, team links), but were 500px+ originals
// averaging ~40 KB. This resizes them IN PLACE to a longest side of 96px
// (teams) / 128px (leagues), keeping PNG transparency, and only writes when
// the result is smaller.
//
// Before shrinking, the full-size original is copied to assets/logos-hires/
// (outside public/, never served; identical bytes cost git nothing). The
// cover/graphic generators in scripts/ read logos from there, so new covers
// stay sharp. When you add a new logo: drop the full-size file in BOTH places,
// then run this script.

import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();
const DRY = process.argv.includes("--dry-run");
// League marks that also render as the big 120px fallback on story cards
// without a cover image (nfl-uniform-release-dates-2026, f1-livery-reveals).
const BIG = new Set(["nfl.png", "racing-f1.png"]);
const SETS = [
  { dir: "teams", max: 96 },
  { dir: "leagues", max: 128 },
];

let before = 0;
let after = 0;
let changed = 0;
for (const { dir, max } of SETS) {
  const pub = path.join(ROOT, "public/logos", dir);
  const hires = path.join(ROOT, "assets/logos-hires", dir);
  await fs.mkdir(hires, { recursive: true });
  for (const name of (await fs.readdir(pub)).filter((n) => n.endsWith(".png")).sort()) {
    const file = path.join(pub, name);
    const buf = await fs.readFile(file);
    before += buf.length;
    const meta = await sharp(buf).metadata();
    if (meta.format !== "png") {
      console.log(`skip (not really png: ${meta.format}) ${dir}/${name}`);
      after += buf.length;
      continue;
    }
    const hiresFile = path.join(hires, name);
    try {
      await fs.access(hiresFile);
    } catch {
      if (!DRY) await fs.writeFile(hiresFile, buf);
    }
    const cap = BIG.has(name) ? 256 : max;
    if (Math.max(meta.width, meta.height) <= cap) {
      after += buf.length;
      continue;
    }
    const out = await sharp(buf)
      .resize({ width: cap, height: cap, fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true, quality: 90, effort: 10 })
      .toBuffer();
    if (out.length < buf.length) {
      if (!DRY) await fs.writeFile(file, out);
      after += out.length;
      changed++;
    } else {
      after += buf.length;
    }
  }
}
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`${DRY ? "[dry run] " : ""}${changed} files shrunk: ${kb(before)} -> ${kb(after)}`);
