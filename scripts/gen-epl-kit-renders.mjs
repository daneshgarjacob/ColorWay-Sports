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
  // Corrected 8/21 against the real shirt: white base with equal textured sky
  // stripes and a navy collar, not sky-dominant. Kept for reference; the library
  // now uses the CCFC store laydown cutout instead.
  { key: 'coventry-home', sleeves: '#3D9BD6', collar: '#12284B', cuffs: '#ffffff',
    pattern: { type: 'vstripes', colors: ['#3D9BD6', '#ffffff'], widths: [34, 34] } },
  { key: 'hull-home', sleeves: '#101010', collar: '#101010', cuffs: '#F5A100',
    pattern: { type: 'vstripes', colors: ['#F5A100', '#101010'], widths: [34, 34] } },
  { key: 'everton-home', sleeves: '#003399', collar: '#F5C518', cuffs: '#F5C518',
    pattern: { type: 'solid', color: '#003399' } },
  { key: 'crystal-palace-away', sleeves: '#131313', collar: '#C4122E', cuffs: '#1B458F',
    pattern: { type: 'solid', color: '#131313' } },
  // The 26/27 Macron home: white with the 1976 pinstriped sash. Checked against
  // the product photo 8/28 - the band runs viewer top-LEFT to bottom-RIGHT
  // (a "\" diagonal), red stripe group on the leading edge, then a white
  // spine, then the blue group. Shoulders carry matching pinstripe panels,
  // red on the viewer-left sleeve, blue on the right.
  { key: 'crystal-palace-home', sleeves: '#ffffff', collar: '#1B458F', cuffs: '#1B458F',
    pattern: { type: 'sash', base: '#ffffff', red: '#C4122E', blue: '#1B458F' } },
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
  // ---- Added 2026-08-30 for matchweek 2 Sunday -----------------------------
  // adidas 26/27 home: clean red base, classic polo collar and striped sleeve
  // cuffs, styled on the 1977 Domestic Cup shirt for that win's 50th year.
  { key: 'manchester-united-home', sleeves: '#DA020E', collar: '#ffffff', cuffs: '#ffffff',
    pattern: { type: 'solid', color: '#DA020E' } },
  // Umbro 26/27 away: a reinterpretation of the 1996-98 away stripe, cream
  // yellow base carrying black and red HORIZONTAL pinstripes.
  { key: 'ipswich-away', sleeves: '#EFE3A6', collar: '#101010', cuffs: '#101010',
    pattern: { type: 'hpin', base: '#EFE3A6', colors: ['#101010', '#C4122E'], gap: 26 } },
  // Nike 26/27 home: deep blue with Midwest Gold accents and the rampant lion
  // crest, the first modern Chelsea home shirt not to use the modern logo.
  { key: 'chelsea-home', sleeves: '#034694', collar: '#C9A227', cuffs: '#C9A227',
    pattern: { type: 'solid', color: '#034694' } },
  // Nike 26/27 away: the home pinstripe inverted, white base with blue
  // pinstripes, carrying the 125th-anniversary collar inscription.
  { key: 'brighton-away', sleeves: '#ffffff', collar: '#0057B8', cuffs: '#0057B8',
    pattern: { type: 'vstripes', colors: ['#ffffff', '#0057B8'], widths: [30, 5] } },
  // adidas 26/27 THIRD, not the away: bright sky blue with neon pink details.
  // Fulham's away is a red and black checkerboard, which clashes with
  // Sunderland's red stripes, so the third is what travels to the Stadium of Light.
  { key: 'fulham-third', sleeves: '#4FBDEC', collar: '#FF4FA3', cuffs: '#FF4FA3',
    pattern: { type: 'solid', color: '#4FBDEC' } },
  // Joma 26/27 away: deep navy with cream vertical pinstripes and a thick cream
  // crew neck, cut from Savile Row tailoring. Reads black on a broadcast, but
  // Brentford's third is yellow, so navy is the only dark shirt they own.
  { key: 'brentford-away', sleeves: '#161C3D', collar: '#EFE7D2', cuffs: '#EFE7D2',
    pattern: { type: 'vstripes', colors: ['#161C3D', '#EFE7D2'], widths: [30, 5] } },
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
  if (p.type === 'sash') {
    // Drawn as explicit geometry, not a pattern: a rotated stripe group reads
    // cleanly as ONE band, where a tiled pattern would repeat across the body.
    // rotate(-22) leans the stripes' tops left, giving the "\" direction the
    // real shirt has. Stripes are drawn tall (y -300..900) so rotation never
    // exposes an end inside the clip.
    // Measured against the product shot: the full band (both groups + the
    // white spine) is ~a third of the chest, not most of it. Seven stripes a
    // group, 4.5 wide on an 8 pitch; centred at x=242 so the rotated band
    // enters at the viewer-left shoulder and exits at the right hem.
    const stripe = (x, c) => `<rect x="${x}" y="-300" width="4.5" height="1200" fill="${c}"/>`;
    let bands = '';
    for (let i = 0; i < 7; i++) bands += stripe(186 + i * 8, p.red);
    for (let i = 0; i < 7; i++) bands += stripe(246 + i * 8, p.blue);
    defs.push('<clipPath id="bodyclip"><path d="' + BODY + '"/></clipPath>');
    p._overlay = `<g clip-path="url(#bodyclip)"><g transform="rotate(-22 225 300)">${bands}</g></g>`;
    return p.base;
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
  let extra = '';
  if (k.pattern.type === 'sash') {
    // Shoulder panels: short matching pinstripes at the top of each sleeve,
    // clipped to the sleeve path so they follow the seam. Cuffs get a second
    // thin red band over the blue base, the trim the real cuff carries.
    defs.push('<clipPath id="lclip"><path d="' + LSLV + '"/></clipPath>');
    defs.push('<clipPath id="rclip"><path d="' + RSLV + '"/></clipPath>');
    // Each shoulder group rotates about its OWN sleeve, not the body centre -
    // rotating about (225,300) displaced these clean out of the sleeve clips,
    // which is why the first render showed bare shoulders.
    const shoulder = (clip, x0, cx, c) => {
      let g = '';
      for (let i = 0; i < 5; i++) g += `<rect x="${x0 + i * 9}" y="40" width="5" height="150" fill="${c}"/>`;
      return `<g clip-path="url(#${clip})"><g transform="rotate(-22 ${cx} 120)">${g}</g></g>`;
    };
    extra = shoulder('lclip', 58, 80, k.pattern.red) + shoulder('rclip', 352, 372, k.pattern.blue) +
      `<g clip-path="url(#lcuffclip)"><rect x="20" y="270" width="120" height="8" fill="#C4122E"/></g>` +
      `<g clip-path="url(#rcuffclip)"><rect x="310" y="270" width="120" height="8" fill="#C4122E"/></g>`;
    defs.push('<clipPath id="lcuffclip"><path d="' + LCUFF + '"/></clipPath>');
    defs.push('<clipPath id="rcuffclip"><path d="' + RCUFF + '"/></clipPath>');
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 600" width="450" height="600">
  <defs>${defs.join('')}</defs>
  <path d="${LSLV}" fill="${k.sleeves}"/>
  <path d="${RSLV}" fill="${k.sleeves}"/>
  <path d="${BODY}" fill="${fill}"/>
  ${k.pattern._overlay ?? ''}
  <path d="${BODY}" fill="url(#shade)"/>
  <path d="${LSLV}" fill="url(#shade)"/>
  <path d="${RSLV}" fill="url(#shade)"/>
  <path d="${LCUFF}" fill="${k.cuffs}"/>
  <path d="${RCUFF}" fill="${k.cuffs}"/>
  <path d="${COLLAR}" fill="${k.collar}"/>
  <path d="${BODY}" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="2"/>
  <path d="${LSLV}" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="2"/>
  <path d="${RSLV}" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="2"/>
  ${extra}
</svg>`;
  const out = `${OUT}/${k.key}.png`;
  const info = await sharp(Buffer.from(svg)).png({ palette: true, colors: 128, dither: 0.3 }).toFile(out);
  console.log(`wrote ${k.key}.png (${Math.round(info.size / 1024)}KB)`);
}
