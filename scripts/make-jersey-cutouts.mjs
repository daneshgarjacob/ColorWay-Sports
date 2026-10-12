#!/usr/bin/env node
// Transparent jersey cutouts for the "Direction 5" matchup cards (Jake OK 10/12).
//
//   node scripts/make-jersey-cutouts.mjs            # all three tracker folders
//   node scripts/make-jersey-cutouts.mjs mlb-daily-tracker   # one folder
//   node scripts/make-jersey-cutouts.mjs --force    # redo even when up to date
//   node scripts/make-jersey-cutouts.mjs --qa       # also write contact sheets to review-screens/
//
// For every jersey image in the tracker folders it writes <name>-cut.webp next to
// it: subject only (Apple Vision subject lift), trimmed, longest side 560px, alpha
// kept, WebP q82 (~15-30 KB, about half a tile JPG). Originals are never touched.
// Idempotent: a file whose cut is newer than the source is skipped.
//
// macOS ONLY (Vision framework). This is a local authoring tool - it never runs on
// Vercel; the build only ever sees the finished .webp files.
//
// scripts/data/jersey-cutout-skips.json:
//   "noCut":  { "<source web path>": "reason" }  -> no cutout; the card falls back to
//             the original on a tile. An existing stale cut is deleted.
//   "flood":  { "<source web path>": "reason" }  -> skip Vision, use the edge flood
//             fill (pure-white backgrounds where Vision eats white jersey panels).
// Vision finding no subject also falls back to the flood fill automatically.
//
// After running: node scripts/compress-images.mjs (AGENTS.md image diet).

import sharp from "sharp";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";

const ROOT = process.cwd();
const FOLDERS = ["mlb-daily-tracker", "nhl-daily-tracker", "nfl-tracker-jerseys"];
const POSTS = path.join(ROOT, "public/images/posts");
const SKIPS_FILE = path.join(ROOT, "scripts/data/jersey-cutout-skips.json");
const SWIFT = path.join(ROOT, "scripts/jersey-lift.swift");
const MAX = 560;
const WEBP = { quality: 82, alphaQuality: 90, effort: 6, smartSubsample: true };

const argv = process.argv.slice(2);
const FORCE = argv.includes("--force");
const QA = argv.includes("--qa");
const only = argv.filter((a) => !a.startsWith("--"));
const folders = only.length ? only : FOLDERS;

if (process.platform !== "darwin") {
  console.error("make-jersey-cutouts: macOS only (Apple Vision). Nothing done.");
  process.exit(1);
}

const skips = fs.existsSync(SKIPS_FILE)
  ? JSON.parse(fs.readFileSync(SKIPS_FILE, "utf8"))
  : { noCut: {}, flood: {} };
skips.noCut ??= {};
skips.flood ??= {};

const cutPathFor = (p) => p.replace(/\.(jpe?g|png|webp)$/i, "-cut.webp");
const web = (abs) => "/" + path.relative(path.join(ROOT, "public"), abs).split(path.sep).join("/");
const isSource = (f) => /\.(jpe?g|png|webp)$/i.test(f) && !/-cut\.webp$/i.test(f);

// ---- compile the Swift helper once (cached by source mtime) ---------------
function liftBinary() {
  const m = Math.floor(fs.statSync(SWIFT).mtimeMs);
  const bin = path.join(os.tmpdir(), `colorway-jersey-lift-${m}`);
  if (!fs.existsSync(bin)) {
    console.error("compiling scripts/jersey-lift.swift ...");
    execFileSync("swiftc", ["-O", SWIFT, "-o", bin], { stdio: "inherit" });
  }
  return bin;
}

function runLift(pairs) {
  return new Promise((resolve, reject) => {
    if (!pairs.length) return resolve([]);
    const p = spawn(liftBinary(), ["--batch"], { stdio: ["pipe", "pipe", "inherit"] });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.on("error", reject);
    p.on("close", () => resolve(out.trim().split("\n")));
    p.stdin.end(pairs.map(([a, b]) => `${a}\t${b}`).join("\n") + "\n");
  });
}

// ---- edge flood fill for pure-white backgrounds ---------------------------
// Grows from border pixels that are near-white, through neighbours that are
// near-white AND close to the pixel they came from. Tight on purpose so white
// jersey panels separated by a seam/shadow survive.
async function floodCut(src) {
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const bg = new Uint8Array(W * H);
  const minc = (i) => Math.min(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
  const diff = (i, j) =>
    Math.abs(data[i * 3] - data[j * 3]) + Math.abs(data[i * 3 + 1] - data[j * 3 + 1]) + Math.abs(data[i * 3 + 2] - data[j * 3 + 2]);
  const q = new Int32Array(W * H);
  let qh = 0, qt = 0;
  const seed = (i) => { if (!bg[i] && minc(i) > 235) { bg[i] = 1; q[qt++] = i; } };
  for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
  while (qh < qt) {
    const i = q[qh++], x = i % W, y = (i / W) | 0;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
      if (j < 0 || bg[j]) continue;
      if (minc(j) > 228 && diff(i, j) < 30) { bg[j] = 1; q[qt++] = j; }
    }
  }
  // alpha = foreground, eroded 1px, softened
  const a = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) {
    const x = i % W, y = (i / W) | 0;
    const fg = !bg[i] && !(x > 0 && bg[i - 1]) && !(x < W - 1 && bg[i + 1]) && !(y > 0 && bg[i - W]) && !(y < H - 1 && bg[i + W]);
    a[i] = fg ? 255 : 0;
  }
  const alpha = await sharp(a, { raw: { width: W, height: H, channels: 1 } }).blur(0.8).extractChannel(0).raw().toBuffer();
  return sharp(data, { raw: { width: W, height: H, channels: 3 } }).joinChannel(alpha, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();
}

// ---- Vision mask + original pixels, with hole fill ------------------------
// Vision sometimes punches holes in white numbers/panels (Colts Indiana Nights
// "8"). A jersey never has a real see-through hole, so any transparent region
// that does not reach the image border is filled back in.
async function visionCut(src, maskPng) {
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const m = await sharp(maskPng).resize(W, H, { fit: "fill" }).extractChannel(0).raw().toBuffer();
  const out = Buffer.from(m);
  const outside = new Uint8Array(W * H);
  const q = new Int32Array(W * H);
  let qh = 0, qt = 0;
  const seed = (i) => { if (!outside[i] && m[i] < 128) { outside[i] = 1; q[qt++] = i; } };
  for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
  while (qh < qt) {
    const i = q[qh++], x = i % W, y = (i / W) | 0;
    if (x > 0) seed(i - 1); if (x < W - 1) seed(i + 1); if (y > 0) seed(i - W); if (y < H - 1) seed(i + W);
  }
  let holes = 0;
  // fill each hole plus a 2px ring, so the soft mask edge around it doesn't leave a faint outline
  for (let i = 0; i < W * H; i++) if (m[i] < 128 && !outside[i]) {
    holes++;
    const x = i % W, y = (i / W) | 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && xx < W && yy >= 0 && yy < H) out[yy * W + xx] = 255;
    }
  }
  const png = await sharp(data, { raw: { width: W, height: H, channels: 3 } })
    .joinChannel(out, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();
  return { png, holes };
}

// ---- trim to alpha bbox, resize, encode -----------------------------------
async function finish(input, out) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  let x0 = W, y0 = H, x1 = -1, y1 = -1, solid = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const al = data[(y * W + x) * 4 + 3];
    if (al > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (al > 128) solid++;
  }
  if (x1 < 0) throw new Error("empty mask");
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: x0, top: y0, width: w, height: h })
    .resize({ width: MAX, height: MAX, fit: "inside", withoutEnlargement: true })
    .webp(WEBP)
    .toFile(out);
  return { fill: solid / (w * h) };
}

async function hasRealAlpha(src) {
  const m = await sharp(src).metadata();
  if (!m.hasAlpha) return false;
  const s = await sharp(src).stats();
  return !s.isOpaque;
}

// ---- main -----------------------------------------------------------------
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cw-cut-"));
const log = [];
let made = 0, skipped = 0, bytes = 0, count = 0;

for (const folder of folders) {
  const dir = path.join(POSTS, folder);
  const files = fs.readdirSync(dir).filter(isSource).sort();
  const visionJobs = [];
  for (const f of files) {
    const src = path.join(dir, f), out = cutPathFor(src), w = web(src);
    if (skips.noCut[w]) {
      if (fs.existsSync(out)) { fs.unlinkSync(out); log.push(`${w}: noCut - removed stale cut`); }
      continue;
    }
    // up to date = cut newer than the source (and, for a flood entry, newer than the skips file)
    const newerThan = skips.flood[w] && fs.existsSync(SKIPS_FILE)
      ? Math.max(fs.statSync(src).mtimeMs, fs.statSync(SKIPS_FILE).mtimeMs) : fs.statSync(src).mtimeMs;
    if (!FORCE && fs.existsSync(out) && fs.statSync(out).mtimeMs > newerThan) { skipped++; continue; }
    if (skips.flood[w]) {
      const r = await finish(await floodCut(src), out);
      made++; log.push(`${w}: flood (forced) fill ${r.fill.toFixed(2)}`);
    } else if (await hasRealAlpha(src)) {
      const r = await finish(src, out);
      made++; log.push(`${w}: already transparent, trimmed fill ${r.fill.toFixed(2)}`);
    } else {
      visionJobs.push({ src, out, w, tmpPng: path.join(tmp, `${folder}__${f}.png`) });
    }
  }
  const res = await runLift(visionJobs.map((j) => [j.src, j.tmpPng]));
  for (let k = 0; k < visionJobs.length; k++) {
    const j = visionJobs[k], status = res[k] ?? "err no output";
    try {
      if (status.startsWith("ok")) {
        const v = await visionCut(j.src, j.tmpPng);
        const r = await finish(v.png, j.out);
        made++; log.push(`${j.w}: vision ${status.slice(3)} inst, fill ${r.fill.toFixed(2)}${v.holes ? `, filled ${v.holes}px of holes` : ""}`);
      } else {
        const r = await finish(await floodCut(j.src), j.out);
        made++; log.push(`${j.w}: vision "${status}" -> flood fallback, fill ${r.fill.toFixed(2)}`);
      }
    } catch (e) {
      log.push(`${j.w}: FAILED ${e.message}`);
    }
  }
  for (const f of fs.readdirSync(dir)) if (/-cut\.webp$/.test(f)) { count++; bytes += fs.statSync(path.join(dir, f)).size; }
}
fs.rmSync(tmp, { recursive: true, force: true });

for (const l of log) console.log(l);
console.log(`\nmade ${made}, up to date ${skipped}. cutouts on disk: ${count}, ${(bytes / 1024).toFixed(0)} KB total, avg ${(bytes / Math.max(count, 1) / 1024).toFixed(1)} KB`);

// ---- QA contact sheets on the card's navy gradient ------------------------
if (QA) {
  const COLS = 8, ROWS = 5, CW = 200, CH = 250, LH = 30;
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  fs.mkdirSync(path.join(ROOT, "review-screens"), { recursive: true });
  for (const folder of folders) {
    const dir = path.join(POSTS, folder);
    const cuts = fs.readdirSync(dir).filter((f) => /-cut\.webp$/.test(f)).sort();
    for (let s = 0; s * COLS * ROWS < cuts.length; s++) {
      const page = cuts.slice(s * COLS * ROWS, (s + 1) * COLS * ROWS);
      const W = COLS * CW, H = Math.ceil(page.length / COLS) * (CH + LH);
      const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#142a52"/><stop offset="0.55" stop-color="#0b1a2f"/><stop offset="1" stop-color="#08121f"/></linearGradient>
<radialGradient id="r"><stop offset="0" stop-color="rgb(132,170,240)" stop-opacity="0.30"/><stop offset="0.5" stop-color="rgb(80,128,230)" stop-opacity="0.14"/><stop offset="1" stop-color="rgb(47,107,237)" stop-opacity="0"/></radialGradient></defs>
<rect width="100%" height="100%" fill="url(#g)"/>
${page.map((f, i) => { const x = (i % COLS) * CW, y = Math.floor(i / COLS) * (CH + LH);
  return `<ellipse cx="${x + CW / 2}" cy="${y + CH / 2}" rx="${CW / 2}" ry="${CH / 2}" fill="url(#r)"/><text x="${x + CW / 2}" y="${y + CH + 18}" font-family="Helvetica" font-size="10" fill="#fff" text-anchor="middle">${esc(f.replace(/-cut\.webp$/, "").slice(0, 34))}</text>`; }).join("\n")}
</svg>`);
      const comps = [];
      for (let i = 0; i < page.length; i++) {
        const b = await sharp(path.join(dir, page[i])).resize({ width: CW - 16, height: CH - 16, fit: "inside" }).png().toBuffer();
        const m = await sharp(b).metadata();
        comps.push({ input: b, left: (i % COLS) * CW + Math.round((CW - m.width) / 2), top: Math.floor(i / COLS) * (CH + LH) + Math.round((CH - m.height) / 2) });
      }
      const out = path.join(ROOT, "review-screens", `cutout-qa-${folder}-${s + 1}.jpg`);
      await sharp(bg).composite(comps).jpeg({ quality: 82 }).toFile(out);
      console.log("QA sheet", path.relative(ROOT, out), page.length);
    }
  }
}
