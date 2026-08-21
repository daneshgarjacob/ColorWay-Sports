#!/usr/bin/env node
// Flat vector kit renders for Premier League shirts we cannot source as product
// photos. Same canvas as the real cutouts (450x600, transparent) so the two
// kinds sit side by side in tracker cards. Every design here is taken from the
// club/supplier launch descriptions, not guessed.
// Output: ~/Desktop/colorway-archive/epl-2026-27-kits/{key}.png
// Usage: node scripts/gen-epl-kit-renders.mjs
import sharp from 'sharp';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

const OUT = resolve(homedir(), 'Desktop/colorway-archive/epl-2026-27-kits');

// key, body base, body pattern, sleeves, collar, cuffs
// pattern: {type:'solid'} | {type:'vstripes',colors,widths} | {type:'hpin',colors,gap}
const KITS = [
  { key: 'coventry-home', sleeves: '#4a9bd4', collar: '#12284B', cuffs: '#ffffff',
    pattern: { type: 'vstripes', colors: ['#4a9bd4', '#ffffff', '#12284B', '#ffffff'], widths: [46, 22, 3, 22] } },
  { key: 'hull-home', sleeves: '#101010', collar: '#101010', cuffs: '#F5A100',
    pattern: { type: 'vstripes', colors: ['#F5A100', '#101010'], widths: [34, 34] } },
  { key: 'everton-home', sleeves: '#003399', collar: '#F5C518', cuffs: '#F5C518',
    pattern: { type: 'solid', color: '#003399' } },
  { key: 'crystal-palace-away', sleeves: '#131313', collar: '#C4122E', cuffs: '#1B458F',
    pattern: { type: 'solid', color: '#131313' } },
  { key: 'ipswich-home', sleeves: '#0044a9', collar: '#ffffff', cuffs: '#ffffff',
    pattern: { type: 'solid', color: '#0044a9' } },
  { key: 'sunderland-home', sleeves: '#d0021b', collar: '#101010', cuffs: '#101010',
    pattern: { type: 'vstripes', colors: ['#d0021b', '#ffffff'], widths: [32, 32] } },
  { key: 'forest-home', sleeves: '#DD0000', collar: '#ffffff', cuffs: '#ffffff',
    pattern: { type: 'solid', color: '#DD0000' } },
  { key: 'leeds-home', sleeves: '#ffffff', collar: '#FFCD00', cuffs: '#1D428A',
    pattern: { type: 'hpin', base: '#ffffff', colors: ['#1D428A', '#FFCD00'], gap: 26 } },
  { key: 'brighton-home', sleeves: '#0057B8', collar: '#ffffff', cuffs: '#ffffff',
    pattern: { type: 'vstripes', colors: ['#0057B8', '#ffffff'], widths: [34, 34] } },
  { key: 'aston-villa-away', sleeves: '#131313', collar: '#F9C623', cuffs: '#670E36',
    pattern: { type: 'solid', color: '#131313' } },
  { key: 'bournemouth-home', sleeves: '#101010', collar: '#DA020E', cuffs: '#DA020E',
    pattern: { type: 'vstripes', colors: ['#DA020E', '#101010'], widths: [34, 34] } },
  { key: 'fulham-home', sleeves: '#f5f5f5', collar: '#101010', cuffs: '#101010',
    pattern: { type: 'solid', color: '#f5f5f5' } },
];

// Shared geometry (viewBox 0 0 450 600). Body and sleeves are separate shapes
// so striped bodies keep plain sleeves, which is how the schematic reads best.
const BODY = 'M132,92 L166,64 C186,96 264,96 284,64 L318,92 L326,560 Q225,586 124,560 Z';
const LSLV = 'M132,92 L124,300 L34,286 L58,120 Z';
const RSLV = 'M318,92 L392,120 L416,286 L326,300 Z';
const LCUFF = 'M124,300 L34,286 L36,262 L125,275 Z';
const RCUFF = 'M326,300 L416,286 L414,262 L325,275 Z';
const COLLAR = 'M166,64 C186,96 264,96 284,64 L296,74 C270,114 180,114 154,74 Z';

function bodyFill(p, defs) {
  if (p.type === 'solid') return p.color;
  if (p.type === 'vstripes') {
    const total = p.widths.reduce((a, b) => a + b, 0);
    let x = 0;
    const rects = p.colors.map((c, i) => {
      const r = `<rect x="${x}" y="0" width="${p.widths[i]}" height="600" fill="${c}"/>`;
      x += p.widths[i];
      return r;
    }).join('');
    defs.push(`<pattern id="pv" width="${total}" height="600" patternUnits="userSpaceOnUse" x="9">${rects}</pattern>`);
    return 'url(#pv)';
  }
  if (p.type === 'hpin') {
    const h = p.gap * p.colors.length;
    const lines = p.colors.map((c, i) => `<rect x="0" y="${i * p.gap}" width="450" height="2.5" fill="${c}"/>`).join('');
    defs.push(`<pattern id="ph" width="450" height="${h}" patternUnits="userSpaceOnUse"><rect width="450" height="${h}" fill="${p.base}"/>${lines}</pattern>`);
    return 'url(#ph)';
  }
}

for (const k of KITS) {
  const defs = [];
  const fill = bodyFill(k.pattern, defs);
  // Soft self-shadow down the sides so flat color reads as a garment, not a swatch.
  defs.push('<linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">' +
    '<stop offset="0" stop-color="#000" stop-opacity="0.16"/>' +
    '<stop offset="0.12" stop-color="#000" stop-opacity="0"/>' +
    '<stop offset="0.88" stop-color="#000" stop-opacity="0"/>' +
    '<stop offset="1" stop-color="#000" stop-opacity="0.16"/></linearGradient>');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 600" width="450" height="600">
  <defs>${defs.join('')}</defs>
  <path d="${LSLV}" fill="${k.sleeves}"/>
  <path d="${RSLV}" fill="${k.sleeves}"/>
  <path d="${BODY}" fill="${fill}"/>
  <path d="${BODY}" fill="url(#shade)"/>
  <path d="${LSLV}" fill="url(#shade)"/>
  <path d="${RSLV}" fill="url(#shade)"/>
  <path d="${LCUFF}" fill="${k.cuffs}"/>
  <path d="${RCUFF}" fill="${k.cuffs}"/>
  <path d="${COLLAR}" fill="${k.collar}"/>
  <path d="${BODY}" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="2"/>
  <path d="${LSLV}" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="2"/>
  <path d="${RSLV}" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="2"/>
</svg>`;
  const out = `${OUT}/${k.key}.png`;
  const info = await sharp(Buffer.from(svg)).png({ palette: true, colors: 128, dither: 0.3 }).toFile(out);
  console.log(`wrote ${k.key}.png (${Math.round(info.size / 1024)}KB)`);
}
