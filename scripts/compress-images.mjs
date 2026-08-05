#!/usr/bin/env node
// Image diet for public/ — keeps Vercel Fast Data Transfer in check.
// Idempotent: run any time after adding images (node scripts/compress-images.mjs).
//
// What it does:
//   1. Recompress every jpg/jpeg/png/webp over 200 KB (cap longest side at 1600px,
//      strip metadata). Opaque PNGs become JPG; transparent PNGs stay PNG.
//   2. Rewrite all /images/... references in content/, app/, components/, lib/,
//      scripts/ for any file whose extension changed.
//   3. Integrity check: every image path referenced anywhere must exist on disk.
//
// Originals are recoverable from git history. Pass --dry-run to preview.

import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");
const SKIP_DIRS = [path.join(PUBLIC, "logos")]; // tiny brand assets + the nba.png-that-is-an-svg trap
const THRESHOLD = 200 * 1024; // only touch files over 200 KB
const MAX_DIM = 1600; // article column maxes ~800px; 1600 covers retina
const JPEG_OPTS = { quality: 80, mozjpeg: true };
const WEBP_OPTS = { quality: 80 };
const TARGET = 300 * 1024; // AGENTS.md: finished images should land at or under ~300 KB
const QUALITY_FLOOR = 60; // below this the artifacts start showing on jersey shots
const REF_DIRS = ["content", "app", "components", "lib", "scripts"];
const REF_EXTS = new Set([".md", ".mdx", ".ts", ".tsx", ".js", ".mjs", ".css", ".json", ".xml"]);
const DRY = process.argv.includes("--dry-run");

async function* walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.some((s) => full === s)) continue;
      yield* walk(full);
    } else if (e.isFile()) {
      yield full;
    }
  }
}

const fmt = (b) => (b / 1024 / 1024).toFixed(2) + " MB";
const webPath = (abs) => "/" + path.relative(PUBLIC, abs).split(path.sep).join("/");

async function compressOne(file, log) {
  const ext = path.extname(file).toLowerCase();
  const before = (await fs.stat(file)).size;
  let img, meta;
  try {
    img = sharp(file);
    meta = await img.metadata();
  } catch {
    log.push({ file, action: "skip:unreadable" });
    return null;
  }

  let targetExt = ext;
  if (ext === ".png") {
    let opaque = false;
    try {
      opaque = (await sharp(file).stats()).isOpaque;
    } catch {}
    if (opaque) {
      const candidate = file.slice(0, -ext.length) + ".jpg";
      try {
        await fs.access(candidate);
        // name collision with an existing .jpg — stay png
      } catch {
        targetExt = ".jpg";
      }
    }
  }

  const resized = sharp(file).rotate().resize({
    width: MAX_DIM,
    height: MAX_DIM,
    fit: "inside",
    withoutEnlargement: true,
  });

  let buf;
  if (targetExt === ".jpg" || ext === ".jpg" || ext === ".jpeg") {
    buf = await resized.jpeg(JPEG_OPTS).toBuffer();
    if (ext === ".png") targetExt = ".jpg";
  } else if (ext === ".webp") {
    buf = await resized.webp(WEBP_OPTS).toBuffer();
  } else {
    // transparent png stays png
    buf = await resized.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
    // Lossless recompression alone rarely beats a photo-heavy PNG by the 10% margin
    // below, so anything still over THRESHOLD would be skipped as "already optimal"
    // and stay oversized. Reach for the palette encode at THRESHOLD, not at 1 MB.
    if (buf.length > THRESHOLD) {
      const pal = await sharp(file)
        .rotate()
        .resize({ width: MAX_DIM, height: MAX_DIM, fit: "inside", withoutEnlargement: true })
        .png({ palette: true, quality: 90, dither: 1.0 })
        .toBuffer();
      if (pal.length < buf.length) buf = pal;
    }
  }

  // A single pass at quality 80 leaves big photos above the 300 KB target. Step the
  // quality down until it fits, rather than declaring an oversized file "optimal".
  if (buf.length > TARGET && targetExt !== ".png") {
    const encode = (q) => targetExt === ".webp"
      ? resized.webp({ ...WEBP_OPTS, quality: q }).toBuffer()
      : resized.jpeg({ ...JPEG_OPTS, quality: q }).toBuffer();
    for (let q = JPEG_OPTS.quality - 8; q >= QUALITY_FLOOR; q -= 8) {
      const smaller = await encode(q);
      buf = smaller;
      if (buf.length <= TARGET) break;
    }
  }

  const converted = targetExt !== ext;
  const worthIt = converted ? buf.length < before : buf.length < before * 0.9;
  if (!worthIt) {
    log.push({ file, action: "skip:already-optimal", before, after: before });
    return null;
  }

  const newFile = converted ? file.slice(0, -ext.length) + targetExt : file;
  if (!DRY) {
    await fs.writeFile(newFile, buf);
    if (converted) await fs.unlink(file);
  }
  const rec = {
    old: webPath(file),
    new: webPath(newFile),
    before,
    after: buf.length,
    dims: `${meta.width}x${meta.height}`,
    action: converted ? "converted" : "recompressed",
  };
  log.push(rec);
  return rec;
}

async function refFiles() {
  const out = [];
  for (const d of REF_DIRS) {
    for await (const f of walk(path.join(ROOT, d))) {
      if (REF_EXTS.has(path.extname(f).toLowerCase())) out.push(f);
    }
  }
  return out;
}

async function main() {
  // ---- phase 1: compress ----
  const candidates = [];
  for await (const f of walk(PUBLIC)) {
    const ext = path.extname(f).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) continue;
    const { size } = await fs.stat(f);
    if (size > THRESHOLD) candidates.push({ f, size });
  }
  candidates.sort((a, b) => b.size - a.size);
  console.log(`Compressing ${candidates.length} files over ${THRESHOLD / 1024} KB${DRY ? " (dry run)" : ""}...`);

  const log = [];
  const records = [];
  const POOL = 6;
  for (let i = 0; i < candidates.length; i += POOL) {
    const chunk = candidates.slice(i, i + POOL);
    const res = await Promise.all(chunk.map(({ f }) => compressOne(f, log)));
    records.push(...res.filter(Boolean));
    if (i % 60 === 0 && i > 0) console.log(`  ...${i}/${candidates.length}`);
  }

  const beforeTotal = records.reduce((s, r) => s + r.before, 0);
  const afterTotal = records.reduce((s, r) => s + r.after, 0);

  // ---- phase 2: rewrite references for converted files ----
  const renames = records.filter((r) => r.old !== r.new).sort((a, b) => b.old.length - a.old.length);
  let replacements = 0;
  if (renames.length && !DRY) {
    const files = await refFiles();
    for (const f of files) {
      let text = await fs.readFile(f, "utf8");
      let changed = false;
      for (const r of renames) {
        if (text.includes(r.old)) {
          text = text.split(r.old).join(r.new);
          changed = true;
          replacements++;
        }
      }
      if (changed) await fs.writeFile(f, text, "utf8");
    }
  }

  // ---- phase 3: integrity check ----
  const missing = [];
  if (!DRY) {
    const files = await refFiles();
    const refRe = /["'(](\/(?:images|logos)\/[^"')\s?#]+\.(?:png|jpe?g|webp|avif|gif|svg))/gi;
    for (const f of files) {
      const text = await fs.readFile(f, "utf8");
      for (const m of text.matchAll(refRe)) {
        const p = decodeURIComponent(m[1]);
        try {
          await fs.access(path.join(PUBLIC, p));
        } catch {
          missing.push({ ref: p, in: path.relative(ROOT, f) });
        }
      }
    }
  }

  // ---- report ----
  await fs.writeFile("/tmp/image-compress-report.json", JSON.stringify({ records, missing, log }, null, 2));
  console.log("\n========== RESULT ==========");
  console.log(`Files changed:   ${records.length} (${renames.length} png->jpg conversions)`);
  console.log(`Size:            ${fmt(beforeTotal)} -> ${fmt(afterTotal)}  (saved ${fmt(beforeTotal - afterTotal)}, ${beforeTotal ? Math.round((1 - afterTotal / beforeTotal) * 100) : 0}%)`);
  console.log(`Ref rewrites:    ${replacements} file updates`);
  console.log(`Broken refs:     ${missing.length}`);
  for (const m of missing.slice(0, 20)) console.log(`  MISSING ${m.ref}  (in ${m.in})`);
  console.log("Top savings:");
  for (const r of [...records].sort((a, b) => b.before - b.after - (a.before - a.after)).slice(0, 8))
    console.log(`  ${fmt(r.before)} -> ${fmt(r.after)}  ${r.old}`);
  console.log("Full report: /tmp/image-compress-report.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
