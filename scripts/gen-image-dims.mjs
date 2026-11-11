// Writes content/data/image-dims.json: { "/images/...jpg": [width, height] }
// for every local raster image a markdown post points at.
//
// Why: post images are plain <img style="width:100%"> with no width/height, so
// the browser gives each one zero height until the file arrives and then
// pushes everything under it down (layout shift, the CLS number in Clarity and
// Search Console). lib/posts.ts adds width/height from this list, which lets
// the browser reserve the right box before the image loads. It is a build-time
// list, not a runtime read of public/, because ISR re-renders on Vercel run
// without public/ (see gen-nfl-jersey-manifest.mjs). Runs before every build
// (prebuild); run it by hand after adding images if you want it in dev.
import { readFileSync, readdirSync, writeFileSync, existsSync, openSync, readSync, closeSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, out = []) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) walk(p, out);
    else if (f.name.endsWith(".md")) out.push(p);
  }
  return out;
}

/** Width and height from the first bytes of a JPEG, PNG, GIF or WebP. */
function dims(file) {
  const fd = openSync(file, "r");
  const size = Math.min(statSync(file).size, 512 * 1024);
  const b = Buffer.alloc(size);
  readSync(fd, b, 0, size, 0);
  closeSync(fd);
  // PNG
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  // GIF
  if (b.toString("ascii", 0, 3) === "GIF") return [b.readUInt16LE(6), b.readUInt16LE(8)];
  // WebP
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const kind = b.toString("ascii", 12, 16);
    if (kind === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (kind === "VP8L") {
      const bits = b.readUInt32LE(21);
      return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
    }
    if (kind === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    return null;
  }
  // JPEG: walk the markers to the first SOFn frame header.
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7) || m === 0xff) { i++; continue; }
      const len = b.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        const h = b.readUInt16BE(i + 5);
        const w = b.readUInt16BE(i + 7);
        // EXIF orientation 5-8 swaps the displayed sides; our pipeline
        // (compress-images.mjs) strips EXIF, so this is the displayed size.
        return [w, h];
      }
      i += 2 + len;
    }
  }
  return null;
}

const SRC = /(?:src=["']|\]\()(\/[^"')\s?#]+\.(?:jpe?g|png|gif|webp))/gi;
const wanted = new Set();
for (const md of walk(join(root, "content"))) {
  const text = readFileSync(md, "utf8");
  for (const m of text.matchAll(SRC)) wanted.add(m[1]);
}

const out = {};
let missing = 0;
for (const src of [...wanted].sort()) {
  let file;
  try {
    file = join(root, "public", decodeURI(src));
  } catch {
    continue;
  }
  if (!existsSync(file)) { missing++; continue; }
  const d = dims(file);
  if (d && d[0] > 0 && d[1] > 0) out[src] = d;
}
writeFileSync(join(root, "content/data/image-dims.json"), JSON.stringify(out) + "\n");
console.log(`image-dims.json: ${Object.keys(out).length} images (${missing} referenced paths not in public/)`);
