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
 */

import sharp from "sharp";
import { readdir, stat } from "fs/promises";
import { join, extname, basename, dirname } from "path";

const LOGO_SVG = `<svg width="200" height="48" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <g transform="translate(20,24)">
      <rect x="-6" y="-18" width="8" height="14" rx="4" fill="#0021A5" transform="rotate(-24)" opacity="0.95"/>
      <rect x="-6" y="-18" width="8" height="14" rx="4" fill="#4A90D9" transform="rotate(-8)" opacity="0.95"/>
      <rect x="-6" y="-18" width="8" height="14" rx="4" fill="#FF5910" transform="rotate(8)" opacity="0.95"/>
      <rect x="-6" y="-18" width="8" height="14" rx="4" fill="#6B9E8F" transform="rotate(24)" opacity="0.95"/>
      <circle cx="0" cy="0" r="3" fill="#FF5910" opacity="0.95"/>
    </g>
    <text x="38" y="21" font-family="Inter, Helvetica, Arial, sans-serif" font-weight="800" font-size="16" letter-spacing="-0.3">
      <tspan fill="#fff">Color</tspan><tspan fill="#FF5910">Way</tspan><tspan fill="#fff"> Sports</tspan><tspan fill="#FF5910">.</tspan>
    </text>
    <text x="38" y="34" font-family="Inter, Helvetica, Arial, sans-serif" font-weight="500" font-size="6" letter-spacing="1.5" fill="rgba(255,255,255,0.7)" text-transform="uppercase">
      COLORWAYSPORTS.COM
    </text>
  </g>
</svg>`;

async function watermarkImage(inputPath, outputPath) {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const { width, height } = metadata;

  // Scale watermark based on image size
  const watermarkWidth = Math.max(150, Math.round(width * 0.18));
  const watermarkHeight = Math.round(watermarkWidth * 0.24);

  const watermarkBuffer = Buffer.from(LOGO_SVG);
  const resizedWatermark = await sharp(watermarkBuffer)
    .resize(watermarkWidth, watermarkHeight, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Add semi-transparent dark background behind watermark for readability
  const padding = Math.round(watermarkWidth * 0.08);
  const bgWidth = watermarkWidth + padding * 2;
  const bgHeight = watermarkHeight + padding * 2;

  const backgroundSvg = `<svg width="${bgWidth}" height="${bgHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${bgWidth}" height="${bgHeight}" rx="6" fill="rgba(0,0,0,0.45)"/>
  </svg>`;

  const bgBuffer = await sharp(Buffer.from(backgroundSvg)).png().toBuffer();

  const bgWithLogo = await sharp(bgBuffer)
    .composite([{
      input: resizedWatermark,
      left: padding,
      top: padding,
    }])
    .png()
    .toBuffer();

  // Position: bottom-right with margin
  const margin = Math.round(width * 0.02);

  await image
    .composite([{
      input: bgWithLogo,
      left: width - bgWidth - margin,
      top: height - bgHeight - margin,
    }])
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
      const outPath = join(inputPath, file); // overwrite in place for folders
      await watermarkImage(inPath, outPath);
    }
    console.log("Done!");
  } else {
    const out = outputPath || inputPath;
    console.log(`Watermarking ${basename(inputPath)}...`);
    await watermarkImage(inputPath, out);
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
