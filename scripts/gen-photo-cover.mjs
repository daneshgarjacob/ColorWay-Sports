#!/usr/bin/env node
// Reusable 3:2 (1500x1000) photo cover for posts that have licensable art.
//
// DEFAULT IS 'bleed' WITH NO TEXT. Jake, 2026-08-13: a cover photo that fills the
// frame does not need words on it. Only add words when the art cannot fill the
// frame on its own and there is dead space to fill.
//
// mode 'bleed'   -> art fills 1500x1000, no words. Use this unless you can't.
// mode 'contain' -> art is contained on a themed field, words fill the gap.
//
// Note: the no-crop rule (feedback_never_crop_jersey_product_shots) is about
// JERSEY PRODUCT SHOTS and tracker tiles, not editorial reveal photography.
// Cropping a photo-shoot image to 3:2 for a cover is fine and already the norm.
//
// Usage: node scripts/gen-photo-cover.mjs <config-key>
import sharp from 'sharp';

const W = 1500, H = 1000;

const CONFIGS = {
  'buccaneers-schedule': {
    dir: 'public/images/posts/buccaneers-uniform-schedule-2026',
    art: 'pewter-uniform.jpg',
    mode: 'bleed',
    position: 'north',
  },
  'cal-joe-roth': {
    dir: 'public/images/posts/cal-joe-roth-uniforms-2026',
    art: 'full-uniform.jpg',
    mode: 'bleed',
    focusY: 0.40,
  },
  'gators-blue-helmet': {
    dir: 'public/images/posts/gators-blue-helmet-uniforms-2026',
    // Helmet worn WITH the orange jersey, so the crop can run from the top of
    // the shell down into the orange the way Jake wants it framed.
    art: 'helmet-orange.jpg',
    mode: 'bleed',
    focusY: 0.28,
  },
  'ty-gibbs-mms-bristol': {
    dir: 'public/images/posts/ty-gibbs-mms-kyle-busch-bristol-2026',
    art: 'car-front.jpg',
    mode: 'bleed',
    position: 'centre',
  },
  'tennessee-schedule': {
    dir: 'public/images/posts/tennessee-uniform-schedule-2026',
    // Tunnel shot from the Smokey Grey reveal. Framed high so the crop keeps the
    // helmet, the Ayres Hall shoulder print and the top of the numbers, which are
    // the three things that identify this set at thumbnail size.
    art: 'smokey-grey.jpg',
    mode: 'bleed',
    focusY: 0.34,
  },
};

const key = process.argv[2];
const c = CONFIGS[key];
if (!c) {
  console.error(`unknown config "${key}". known: ${Object.keys(CONFIGS).join(', ')}`);
  process.exit(1);
}

if (c.mode === 'bleed') {
  // `focusY` is where the centre of the 3:2 window sits vertically in the source,
  // 0 = very top, 1 = very bottom. Gravity presets only give top/middle/bottom,
  // and framing a helmet down through the jersey needs finer control than that.
  const wide = await sharp(`${c.dir}/${c.art}`).resize({ width: W }).toBuffer();
  const wm = await sharp(wide).metadata();
  let buf = wide;
  if (wm.height > H) {
    const focusY = typeof c.focusY === 'number' ? c.focusY : 0.5;
    const top = Math.max(0, Math.min(wm.height - H, Math.round(focusY * wm.height - H / 2)));
    buf = await sharp(wide).extract({ left: 0, top, width: W, height: H }).toBuffer();
  }
  const info = await sharp(buf)
    .resize({ width: W, height: H, fit: 'cover' })
    .jpeg({ quality: 88 })
    .toFile(`${c.dir}/cover.jpg`);
  console.log(`wrote ${c.dir}/cover.jpg — ${info.width}x${info.height}, ${Math.round(info.size / 1024)}KB (bleed, focusY ${c.focusY ?? 0.5})`);
} else {
  // Contained: art can't fill the frame, so a themed field plus words earns its place.
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c.base}"/>
      <stop offset="70%" stop-color="${c.deep}"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
  </svg>`;

  const artBuf = await sharp(`${c.dir}/${c.art}`).resize({ height: H, fit: 'inside' }).toBuffer();
  const meta = await sharp(artBuf).metadata();
  const artLeft = W - meta.width;

  const subText = c.sub.join('  ·  ');
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${c.deep}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${c.deep}" stop-opacity="0"/>
    </linearGradient></defs>
    <rect x="${artLeft}" y="0" width="300" height="${H}" fill="url(#fade)"/>
    <text x="74" y="330" font-family="Arial, Helvetica, sans-serif" font-size="27"
          font-weight="800" fill="${c.accent}" letter-spacing="6">${c.eyebrow}</text>
    <text x="72" y="437" font-family="Arial, Helvetica, sans-serif" font-size="92"
          font-weight="900" fill="#ffffff" letter-spacing="-2">${c.line1}</text>
    <text x="72" y="531" font-family="Arial, Helvetica, sans-serif" font-size="92"
          font-weight="900" fill="#ffffff" letter-spacing="-2">${c.line2}</text>
    <rect x="76" y="583" width="140" height="7" rx="3.5" fill="${c.accent}"/>
    <text x="74" y="651" font-family="Arial, Helvetica, sans-serif" font-size="24"
          font-weight="700" fill="#ffffff" opacity="0.93" letter-spacing="1.2">${subText}</text>
    <text x="74" y="742" font-family="Arial, Helvetica, sans-serif" font-size="20"
          font-weight="700" fill="#ffffff" opacity="0.45" letter-spacing="4">COLORWAY SPORTS</text>
  </svg>`;

  const info = await sharp(Buffer.from(bg))
    .composite([
      { input: artBuf, left: artLeft, top: 0 },
      { input: Buffer.from(overlay), left: 0, top: 0 },
    ])
    .jpeg({ quality: 88 })
    .toFile(`${c.dir}/cover.jpg`);
  console.log(`wrote ${c.dir}/cover.jpg — ${info.width}x${info.height}, ${Math.round(info.size / 1024)}KB (contained, with text)`);
}
