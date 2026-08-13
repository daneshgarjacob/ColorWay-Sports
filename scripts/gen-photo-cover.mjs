#!/usr/bin/env node
// Reusable 3:2 (1500x1000) photo cover for posts that DO have licensable art.
// The reveal photos are portrait and house rules forbid cropping a uniform shot,
// so the photo is contained at full height and blended into a themed field with a
// soft edge, the same trick as gen-tulane-city-edition-cover.mjs. Landscape art
// (car renders) is handled by `fit: 'cover'` instead, which has room to breathe.
// Usage: node scripts/gen-photo-cover.mjs <config-key>
import sharp from 'sharp';

const W = 1500, H = 1000;

const CONFIGS = {
  'gators-blue-helmet': {
    dir: 'public/images/posts/gators-blue-helmet-uniforms-2026',
    art: 'helmet.jpg',
    orient: 'portrait',
    deep: '#03060f', base: '#0a1a4d', accent: '#FA4616',
    eyebrow: 'FLORIDA GATORS 2026',
    line1: 'MATTE BLUE',
    line2: 'HELMET',
    sub: ['GRADE: A+', 'ORANGE JERSEY', 'FIRST ALL-BLUE'],
  },
  'ty-gibbs-mms-bristol': {
    dir: 'public/images/posts/ty-gibbs-mms-kyle-busch-bristol-2026',
    art: 'car-front.jpg',
    orient: 'landscape',
    deep: '#0a0a0a', base: '#1a1a1a', accent: '#FFD200',
    eyebrow: 'KYLE BUSCH TRIBUTE',
    line1: "M&amp;M'S IS BACK",
    line2: 'AT BRISTOL',
    sub: ['SEPT 19', 'TY GIBBS', 'NO. 54'],
  },
};

const key = process.argv[2];
const c = CONFIGS[key];
if (!c) {
  console.error(`unknown config "${key}". known: ${Object.keys(CONFIGS).join(', ')}`);
  process.exit(1);
}

const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c.base}"/>
      <stop offset="70%" stop-color="${c.deep}"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
</svg>`;

let artBuf, artLeft, fadeFrom;

if (c.orient === 'portrait') {
  // Contain to full height, park it on the right, blend the inner edge.
  artBuf = await sharp(`${c.dir}/${c.art}`).resize({ height: H, fit: 'inside' }).toBuffer();
  const meta = await sharp(artBuf).metadata();
  artLeft = W - meta.width;
  fadeFrom = artLeft;
} else {
  // Landscape art goes full bleed. Squeezing a car render into a side panel would
  // crop the nose or the tail off, so the text sits on a scrim over the art instead.
  artBuf = await sharp(`${c.dir}/${c.art}`).resize({ width: W, height: H, fit: 'cover' }).toBuffer();
  artLeft = 0;
  fadeFrom = 0;
}

const subText = c.sub.join('  ·  ');
const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${c.deep}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${c.deep}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="${fadeFrom}" y="0" width="${c.orient === 'portrait' ? 300 : 900}" height="${H}" fill="url(#fade)"/>

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

console.log(`wrote ${c.dir}/cover.jpg — ${info.width}x${info.height}, ${Math.round(info.size / 1024)}KB`);
