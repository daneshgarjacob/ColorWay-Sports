#!/usr/bin/env node
// Print-ready "Colorway" swatch-chip artwork for the Fourthwall store.
//
// WHY THIS DESIGN AND NOT ANOTHER: it is the only merch lane that needs zero
// trademark clearance. No team names, no logos (retired marks included), no
// city+nickname pairings, no arena names. A colour combination is not ownable,
// so these can be listed immediately, while the stadium/era-language designs
// wait on the USPTO register checks. See memory merch-own-brand.
//
// Output: ~/Desktop/colorway-archive/merch/  — 4000x4000 transparent PNGs,
// the size Fourthwall wants for DTG, plus a contact sheet for picking.
//
// Usage: node scripts/gen-merch-swatch-designs.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { homedir } from "node:os";

const OUT = resolve(homedir(), "Desktop/colorway-archive/merch");
const SIZE = 4000;
// The SVG is authored in SIZE units but rasterised at SCALE x that, so the
// trimmed artwork lands around 4,500px tall. DTG wants roughly 300dpi over a
// 12x16in print area; the first pass trimmed to 1832x2844, which is only about
// 6x9.5in and would have printed soft.
const SCALE = 1.6;

// Palettes are colour studies only. Deliberately NOT labelled with the club or
// city they evoke — that label is the part that would need clearance.
const DESIGNS = [
  { key: "colorway-01", no: "01", ink: "#1c1c1c",
    chips: ["#5B2C87", "#F2B233", "#1C1C1C", "#FFFFFF"] },
  { key: "colorway-02", no: "02", ink: "#1c1c1c",
    chips: ["#0C7C6B", "#1C1C1C", "#B08A3E", "#F2EFE6"] },
  { key: "colorway-03", no: "03", ink: "#1c1c1c",
    chips: ["#0B6B3A", "#E8C33F", "#F4EEDD", "#1C1C1C"] },
  { key: "colorway-04", no: "04", ink: "#1c1c1c",
    chips: ["#8FBCE6", "#14284B", "#FFFFFF", "#C0111F"] },
  { key: "colorway-05", no: "05", ink: "#1c1c1c",
    chips: ["#D2601A", "#4A2C14", "#F2EFE6", "#1C1C1C"] },
  { key: "colorway-06", no: "06", ink: "#1c1c1c",
    chips: ["#6E1E3C", "#C9A227", "#1C1C1C", "#F2EFE6"] },
];

// Two inks so the art works on light and dark shells. Fourthwall wants one file
// per colourway of the garment, so we emit both and let Jake pick per product.
const INKS = { dark: "#1c1c1c", light: "#F5F5F5" };

const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";
const MONO = "SFMono-Regular, Menlo, Consolas, monospace";

function svg({ chips, no, ink }) {
  // Composition notes, learned from the first pass:
  // - Hex codes hung to the RIGHT of the column pushed the whole design
  //   off-centre. They now sit in one centred row beneath the stack.
  // - The art has to FILL the square. DTG scales the file to the print area, so
  //   trailing whitespace silently shrinks the graphic on the garment.
  // - Narrower chips read as swatches; full-width bars read as a flag.
  const colW = 1180;
  const chipH = 500;
  const gap = 24;
  const x0 = (SIZE - colW) / 2;
  const stackH = chips.length * chipH + (chips.length - 1) * gap;

  const headH = 420;   // COLORWAY + No.
  const footH = 300;   // hex row + rule + tagline
  const total = headH + stackH + footH;
  const top = (SIZE - total) / 2;

  const yStack = top + headH;

  const rows = chips
    .map((c, i) => {
      const y = yStack + i * (chipH + gap);
      // A near-white chip needs a hairline or it disappears on a white shell.
      const needsRule = /^#(f|F)/.test(c);
      return (
        `<rect x="${x0}" y="${y}" width="${colW}" height="${chipH}" fill="${c}"` +
        (needsRule ? ` stroke="${ink}" stroke-width="5"` : "") +
        ` />`
      );
    })
    .join("");

  const yHex = yStack + stackH + 120;
  const hexRow = chips.map((c) => c.toUpperCase()).join("  &#183;  ");

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE * SCALE}" height="${SIZE * SCALE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <text x="${SIZE / 2}" y="${top + 190}" text-anchor="middle" font-family="${FONT}" font-size="168" font-weight="800"
        letter-spacing="52" fill="${ink}">COLORWAY</text>
  <text x="${SIZE / 2}" y="${top + 330}" text-anchor="middle" font-family="${MONO}" font-size="76"
        letter-spacing="30" fill="${ink}" opacity="0.6">No. ${no}</text>
  ${rows}
  <text x="${SIZE / 2}" y="${yHex}" text-anchor="middle" font-family="${MONO}" font-size="58"
        letter-spacing="6" fill="${ink}" opacity="0.75">${hexRow}</text>
  <line x1="${x0 + 260}" y1="${yHex + 78}" x2="${x0 + colW - 260}" y2="${yHex + 78}"
        stroke="${ink}" stroke-width="4" opacity="0.3" />
  <text x="${SIZE / 2}" y="${yHex + 178}" text-anchor="middle" font-family="${FONT}" font-size="54"
        letter-spacing="15" fill="${ink}" opacity="0.7">EVERY JERSEY. EVERY LOGO. EVERY DETAIL.</text>
</svg>`);
}


// Trim to the artwork's real bounds. A print pipeline scales the FILE, so the
// transparent margin around a centred design silently shrinks the graphic on
// the garment. sharp's .trim() does not reliably crop a transparent border
// here (same trap documented for make-kit-cutout), so compute the alpha bbox by
// hand and .extract() it, then re-pad by a small even margin.
async function trimToArt(buf, pad = 96) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return buf; // nothing drawn; hand it back untouched
  return sharp(buf)
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .extend({ top: pad, bottom: pad, left: pad, right: pad,
              background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

mkdirSync(OUT, { recursive: true });

const made = [];
for (const d of DESIGNS) {
  for (const [inkName, ink] of Object.entries(INKS)) {
    const file = join(OUT, `${d.key}-${inkName}.png`);
    const flat = await sharp(svg({ ...d, ink })).png().toBuffer();
    await sharp(await trimToArt(flat)).png({ compressionLevel: 9 }).toFile(file);
    made.push(file);
  }
  console.log(`ok  ${d.key}  ${d.chips.join(" ")}`);
}

// Contact sheet on a mid grey so both inks are judgeable at once.
const cell = 620;
const cols = 4;
const rows = Math.ceil(made.length / cols);
const thumbs = await Promise.all(
  made.map(async (f, i) => ({
    input: await sharp(f).resize(cell, cell).png().toBuffer(),
    left: (i % cols) * cell,
    top: Math.floor(i / cols) * cell,
  }))
);
const sheetPath = join(OUT, "_contact-sheet.png");
await sharp({
  create: { width: cols * cell, height: rows * cell, channels: 4,
            background: { r: 138, g: 142, b: 150, alpha: 1 } },
})
  .composite(thumbs)
  .png()
  .toFile(sheetPath);

console.log(`\n${made.length} print files + contact sheet in ${OUT}`);
