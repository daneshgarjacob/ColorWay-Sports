// FOX MLB scorebug old vs new: cover (1500x1000) + in-post side-by-side comparison.
// Old = 2025 World Series bug, new = 2026 NLCS Game 1 bug (Oct 11, 2026).
// Usage: node scripts/gen-fox-scorebug-cover.mjs
import sharp from "sharp";
import path from "node:path";

const dir = "public/images/posts/national-mlb-scorebugs-2026-ranked";
const OLD = path.join(dir, "fox-scorebug.jpg");
const NEW = path.join(dir, "fox-scorebug-2026-nlcs.jpg");
const LOGO = "public/brand/colorway-sports-logo-white.png";
const FONT = "'Helvetica Neue', Arial, sans-serif";

const bgSvg = (w, h) => Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1a1d22"/>
      <stop offset="1" stop-color="#0d0f12"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`);

const pill = (text, color, textColor = "#fff") => {
  const w = 22 + text.length * 17;
  return {
    buf: Buffer.from(`
<svg width="${w}" height="40" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="40" rx="8" fill="${color}"/>
  <text x="${w / 2}" y="28" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="20" letter-spacing="3" fill="${textColor}">${text}</text>
</svg>`),
    w,
  };
};

async function fitHeight(file, h) {
  const buf = await sharp(file).resize({ height: h, kernel: "lanczos3" }).png().toBuffer();
  const { width } = await sharp(buf).metadata();
  return { buf, width, height: h };
}

async function roundCorners(img, r = 14) {
  const mask = Buffer.from(
    `<svg width="${img.width}" height="${img.height}"><rect width="${img.width}" height="${img.height}" rx="${r}" fill="#fff"/></svg>`
  );
  const buf = await sharp(img.buf).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  return { ...img, buf };
}

// ---------- Cover: 1500x1000, old on top, new below ----------
// Each half is a full-width band: a blurred, darkened copy of that bug's own frame
// fills the width, and the sharp bug sits centered on it.
async function band(file, W, H, imgH) {
  const bg = await sharp(file)
    .resize(W, H, { fit: "cover" })
    .blur(28)
    .modulate({ brightness: 0.55 })
    .png()
    .toBuffer();
  const img = await roundCorners(await fitHeight(file, imgH), 14);
  const left = Math.round((W - img.width) / 2);
  const top = Math.round((H - img.height) / 2);
  const buf = await sharp(bg).composite([{ input: img.buf, left, top }]).png().toBuffer();
  return { buf, imgLeft: left, imgTop: top };
}

async function cover() {
  const W = 1500, H = 1000, divider = 6;
  const bandH = (H - divider) / 2; // 497
  const imgH = 465;
  const oldBand = await band(OLD, W, bandH, imgH);
  const newBand = await band(NEW, W, bandH, imgH);
  const newY = bandH + divider;

  const oldPill = pill("OLD", "#ffffff", "#111111");
  const newPill = pill("NEW", "#f5c400", "#111111");
  const logoW = 200;
  const logo = await sharp(LOGO).resize({ width: logoW }).png().toBuffer();
  const logoMeta = await sharp(logo).metadata();

  await sharp(bgSvg(W, H))
    .composite([
      { input: oldBand.buf, left: 0, top: 0 },
      { input: newBand.buf, left: 0, top: newY },
      { input: oldPill.buf, left: oldBand.imgLeft + 16, top: oldBand.imgTop + 14 },
      { input: newPill.buf, left: newBand.imgLeft + 16, top: newY + newBand.imgTop + 14 },
      { input: logo, left: W - logoW - 26, top: H - logoMeta.height - 22 },
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(path.join(dir, "fox-scorebug-old-vs-new-cover.jpg"));
}

// ---------- In-post comparison: side by side ----------
async function comparison() {
  const pad = 24, labelH = 54, rowH = 440;
  const oldImg = await roundCorners(await fitHeight(OLD, rowH), 12);
  const newImg = await roundCorners(await fitHeight(NEW, rowH), 12);
  const W = pad * 3 + oldImg.width + newImg.width;
  const H = pad * 2 + labelH + rowH;
  const label = (text, w) =>
    Buffer.from(`
<svg width="${w}" height="${labelH}" xmlns="http://www.w3.org/2000/svg">
  <text x="${w / 2}" y="36" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="26" letter-spacing="2" fill="#ffffff">${text}</text>
</svg>`);
  await sharp(bgSvg(W, H))
    .composite([
      { input: label("OLD: 2025 WORLD SERIES", oldImg.width), left: pad, top: pad },
      { input: label("NEW: 2026 NLCS", newImg.width), left: pad * 2 + oldImg.width, top: pad },
      { input: oldImg.buf, left: pad, top: pad + labelH },
      { input: newImg.buf, left: pad * 2 + oldImg.width, top: pad + labelH },
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(path.join(dir, "fox-scorebug-old-vs-new.jpg"));
  return { W, H };
}

await cover();
const c = await comparison();
console.log("wrote cover 1500x1000 and comparison", c);
