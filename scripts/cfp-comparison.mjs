#!/usr/bin/env node

import sharp from "sharp";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

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

async function createComparison() {
  const canvasWidth = 1200;
  const canvasHeight = 630;
  const logoHeight = 380;
  const logoWidth = 260;

  // Read the old SVG logo
  const oldSvgPath = join(root, "public/images/posts/cfp-new-logo-2025/cfp-old-logo.svg");
  const oldSvgContent = readFileSync(oldSvgPath, "utf-8");

  // Render old SVG to PNG - contain within area
  const oldLogoPng = await sharp(Buffer.from(oldSvgContent))
    .resize(logoWidth, logoHeight, { fit: "contain", background: { r: 26, g: 26, b: 26, alpha: 0 } })
    .png()
    .toBuffer();

  // Read the new logo JPG - it's 1400x1600, resize to fit keeping aspect ratio
  const newLogoPath = join(root, "public/images/posts/cfp-new-logo-2025/cfp-new-logo-2025.jpg");
  // Crop to the core logo area (remove the gold border lines at top/bottom)
  const newLogoPng = await sharp(newLogoPath)
    .extract({ left: 200, top: 100, width: 1000, height: 1400 })
    .resize(logoWidth, logoHeight, { fit: "contain", background: { r: 26, g: 26, b: 26, alpha: 0 } })
    .png()
    .toBuffer();

  // Create dark background with gold accent lines
  const bgSvg = `<svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${canvasWidth}" height="${canvasHeight}" fill="#1a1a1a"/>
    <line x1="0" y1="25" x2="${canvasWidth}" y2="25" stroke="#C5A44E" stroke-width="2"/>
    <line x1="0" y1="${canvasHeight - 25}" x2="${canvasWidth}" y2="${canvasHeight - 25}" stroke="#C5A44E" stroke-width="2"/>
  </svg>`;

  // Create arrow
  const arrowSvg = `<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
    <polygon points="25,20 55,40 25,60" fill="rgba(197,164,78,0.6)"/>
  </svg>`;
  const arrowPng = await sharp(Buffer.from(arrowSvg)).png().toBuffer();

  // Create "Old" and "New" labels
  const oldLabelSvg = `<svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
    <text x="60" y="30" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-weight="700" font-size="24" fill="rgba(255,255,255,0.6)">Old</text>
  </svg>`;
  const newLabelSvg = `<svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
    <text x="60" y="30" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-weight="700" font-size="24" fill="#C5A44E">New</text>
  </svg>`;
  const oldLabelPng = await sharp(Buffer.from(oldLabelSvg)).png().toBuffer();
  const newLabelPng = await sharp(Buffer.from(newLabelSvg)).png().toBuffer();

  // Watermark
  const watermarkWidth = Math.round(canvasWidth * 0.18);
  const watermarkHeight = Math.round(watermarkWidth * 0.24);
  const watermarkBuffer = await sharp(Buffer.from(LOGO_SVG))
    .resize(watermarkWidth, watermarkHeight, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const padding = Math.round(watermarkWidth * 0.08);
  const bgWidth = watermarkWidth + padding * 2;
  const bgHeight = watermarkHeight + padding * 2;
  const wmBgSvg = `<svg width="${bgWidth}" height="${bgHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${bgWidth}" height="${bgHeight}" rx="6" fill="rgba(0,0,0,0.55)"/>
  </svg>`;
  const wmBgPng = await sharp(Buffer.from(wmBgSvg)).png().toBuffer();
  const wmComposite = await sharp(wmBgPng)
    .composite([{ input: watermarkBuffer, left: padding, top: padding }])
    .png()
    .toBuffer();

  // Position calculations - center both logos vertically
  const centerY = Math.round((canvasHeight - logoHeight) / 2) + 15;
  const oldX = Math.round(canvasWidth * 0.17) - Math.round(logoWidth / 2);
  const newX = Math.round(canvasWidth * 0.63) - Math.round(logoWidth / 2);
  const arrowX = Math.round(canvasWidth * 0.40) - 40;
  const arrowY = Math.round(canvasHeight / 2) - 40;
  const margin = Math.round(canvasWidth * 0.02);

  // Compose everything
  await sharp(Buffer.from(bgSvg))
    .composite([
      { input: oldLogoPng, left: oldX, top: centerY },
      { input: newLogoPng, left: newX, top: centerY },
      { input: arrowPng, left: arrowX, top: arrowY },
      { input: oldLabelPng, left: oldX + Math.round(logoWidth / 2) - 60, top: centerY - 35 },
      { input: newLabelPng, left: newX + Math.round(logoWidth / 2) - 60, top: centerY - 35 },
      { input: wmComposite, left: canvasWidth - bgWidth - margin, top: canvasHeight - bgHeight - margin },
    ])
    .jpeg({ quality: 92 })
    .toFile(join(root, "public/images/posts/cfp-new-logo-2025/cfp-comparison-cover.jpg"));

  console.log("Created cfp-comparison-cover.jpg");
}

createComparison().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
