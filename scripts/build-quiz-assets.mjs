#!/usr/bin/env node
// Logo quiz images for /quiz/[slug] (site plan 11/16, item #3).
//
// Each quiz in content/data/quizzes/*.json names the social folder its TikTok
// version was built from ("source") and, per question, the crop box as fractions
// of that folder's logos/<abbr>.png (the same numbers as the folder's build.py,
// so the site shows exactly the piece the TikTok showed). This script cuts:
//
//   public/quiz/<slug>/q<n>.webp  the piece, square, 320px (shown in the lens)
//   public/quiz/<slug>/a<n>.webp  the full logo, 360px (shown with the answer)
//
// File names are numbers, not team names, so the answer is not sitting in the
// image URL. Hard cap: every file must be <= 40 KB (plan ground rule 3); the
// script fails loudly if one is not. Idempotent: rerun any time.
//
// Needs the source folders under ~/Desktop/ColorWay Sports/social, so it runs on
// Jake's machine, not on Vercel. The output files are committed.
//
// Jersey quizzes ("type": "jersey") set "source" to a folder in public/ and give
// each item a "file"; the crop box is a fraction of that image, same math. The
// answer image (a<n>.webp) is then the whole jersey.
//
//   node scripts/build-quiz-assets.mjs            all quizzes
//   node scripts/build-quiz-assets.mjs nfl-logo-quiz-hard

import sharp from "sharp";
import { readdirSync, readFileSync, mkdirSync, statSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(root, "content/data/quizzes");
const SOCIAL = join(os.homedir(), "Desktop/ColorWay Sports/social");
const MAX_BYTES = 40 * 1024;
const PIECE_PX = 320;
const LOGO_PX = 360;

const only = process.argv[2];
let failed = false;

for (const file of readdirSync(DATA).filter((f) => f.endsWith(".json")).sort()) {
  const quiz = JSON.parse(readFileSync(join(DATA, file), "utf8"));
  if (only && quiz.slug !== only) continue;
  // Jersey quizzes cut from images already in the repo ("public/..." source,
  // each item names its file); logo quizzes cut from the social logos folder.
  const inRepo = quiz.source.startsWith("public/");
  const srcDir = inRepo ? join(root, quiz.source) : join(SOCIAL, quiz.source, "logos");
  if (!existsSync(srcDir)) {
    console.error(`✗ ${quiz.slug}: source folder missing: ${srcDir}`);
    failed = true;
    continue;
  }
  const outDir = join(root, "public/quiz", quiz.slug);
  mkdirSync(outDir, { recursive: true });

  let total = 0;
  for (const [i, item] of quiz.items.entries()) {
    const n = i + 1;
    const logo = join(srcDir, item.file ?? `${item.abbr}.png`);
    const { width: w, height: h } = await sharp(logo).metadata();
    // Same integer math as quiz_builder.py make_crop, so the pixels match the TikTok.
    const [x0, y0, x1, y1] = item.box;
    const left = Math.floor(x0 * w);
    const top = Math.floor(y0 * h);
    const cw = Math.floor(x1 * w) - left;
    const ch = Math.floor(y1 * h) - top;
    const side = Math.max(cw, ch);
    const piece = await sharp(logo).ensureAlpha().extract({ left, top, width: cw, height: ch }).png().toBuffer();
    const square = await sharp({ create: { width: side, height: side, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0 } } })
      .composite([{ input: piece, left: Math.floor((side - cw) / 2), top: Math.floor((side - ch) / 2) }])
      .png()
      .toBuffer();
    const q = join(outDir, `q${n}.webp`);
    await sharp(square).resize(PIECE_PX, PIECE_PX, { kernel: "lanczos3" }).webp({ quality: 86, alphaQuality: 90 }).toFile(q);
    const a = join(outDir, `a${n}.webp`);
    await sharp(logo).resize(LOGO_PX, LOGO_PX, { fit: "inside" }).webp({ quality: 86, alphaQuality: 90 }).toFile(a);

    for (const f of [q, a]) {
      const size = statSync(f).size;
      total += size;
      if (size > MAX_BYTES) {
        console.error(`✗ ${f} is ${(size / 1024).toFixed(1)} KB (cap 40 KB)`);
        failed = true;
      }
    }
  }
  console.log(`✓ ${quiz.slug}: ${quiz.items.length} pieces + logos, ${(total / 1024).toFixed(0)} KB total`);
}

if (failed) process.exit(1);
