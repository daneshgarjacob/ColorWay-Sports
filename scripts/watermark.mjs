#!/usr/bin/env node

/**
 * ColorWay Sports Watermark Tool
 *
 * Adds the ColorWay Sports logo watermark to images.
 *
 * Usage:
 *   node scripts/watermark.mjs input.jpg                    # overwrites original
 *   node scripts/watermark.mjs input.jpg output.jpg         # saves to new file
 *   node scripts/watermark.mjs path/to/folder/              # watermarks all images in folder
 *
 * Logo source: public/brand/colorway-sports-logo.png (transparent PNG, full wordmark + tagline).
 * Position: bottom-middle, horizontally centered.
 */

import sharp from "sharp";
import { readdir, stat } from "fs/promises";
import { join, extname, basename, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LOGO_PATH = resolve(__dirname, "../public/brand/colorway-sports-logo.png");

async function watermarkImage(inputPath, outputPath) {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const { width, height } = metadata;

  // Watermark width = ~22% of image width, min 200px, max 480px
  const watermarkWidth = Math.max(200, Math.min(480, Math.round(width * 0.22)));

  const resizedWatermark = await sharp(LOGO_PATH)
    .resize(watermarkWidth, null, { fit: "inside" })
    .png()
    .toBuffer();

  const wmMeta = await sharp(resizedWatermark).metadata();
  const watermarkHeight = wmMeta.height;

  // Subtle low-opacity white pad behind the logo so it stays legible on dark backgrounds
  // and blends gracefully on light backgrounds. Pad has rounded corners + small padding.
  const padPaddingX = Math.round(watermarkWidth * 0.05);
  const padPaddingY = Math.round(watermarkHeight * 0.18);
  const padWidth = watermarkWidth + padPaddingX * 2;
  const padHeight = watermarkHeight + padPaddingY * 2;
  const padRadius = Math.round(padHeight * 0.18);
  const padOpacity = 0.78;

  const padSvg = `<svg width="${padWidth}" height="${padHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${padWidth}" height="${padHeight}" rx="${padRadius}" fill="rgba(255,255,255,${padOpacity})"/>
  </svg>`;

  const padBuffer = await sharp(Buffer.from(padSvg)).png().toBuffer();

  // Composite logo on top of the pad
  const padWithLogo = await sharp(padBuffer)
    .composite([{ input: resizedWatermark, left: padPaddingX, top: padPaddingY }])
    .png()
    .toBuffer();

  // Position: bottom-middle, horizontally centered
  const margin = Math.max(16, Math.round(height * 0.025));
  const left = Math.round((width - padWidth) / 2);
  const top = height - padHeight - margin;

  await image
    .composite([{ input: padWithLogo, left, top }])
    .toFile(outputPath);

  console.log(`  Watermarked: ${basename(outputPath)}`);
}

async function processPath(inputPath, outputPath) {
  const stats = await stat(inputPath);

  if (stats.isDirectory()) {
    const files = await readdir(inputPath);
    const imageExts = [".jpg", ".jpeg", ".png", ".webp"];
    const images = files.filter(f => imageExts.includes(extname(f).toLowerCase()));

    if (images.length === 0) {
      console.log("No images found in folder.");
      return;
    }

    console.log(`Watermarking ${images.length} images in ${inputPath}...`);
    for (const file of images) {
      const inPath = join(inputPath, file);
      // Write to a temp file then move back, since sharp can't read+write same path
      const tmpPath = join(inputPath, `.wm-tmp-${file}`);
      await watermarkImage(inPath, tmpPath);
      const { rename } = await import("fs/promises");
      await rename(tmpPath, inPath);
    }
    console.log("Done!");
  } else {
    if (outputPath) {
      console.log(`Watermarking ${basename(inputPath)}...`);
      await watermarkImage(inputPath, outputPath);
    } else {
      // Same-file mode: write to temp, then rename back
      const tmpPath = join(dirname(inputPath), `.wm-tmp-${basename(inputPath)}`);
      console.log(`Watermarking ${basename(inputPath)}...`);
      await watermarkImage(inputPath, tmpPath);
      const { rename } = await import("fs/promises");
      await rename(tmpPath, inputPath);
    }
    console.log("Done!");
  }
}

// CLI
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Usage: node scripts/watermark.mjs <input> [output]");
  console.log("  input can be a single image or a folder of images");
  process.exit(1);
}

processPath(args[0], args[1]).catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
