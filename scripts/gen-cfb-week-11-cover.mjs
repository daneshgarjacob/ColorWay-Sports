// Cover for the college football Week 11 uniform guide (Nov 10 - 14, 2026). Logos only: no uniform is pictured that has not been announced.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
const require = createRequire('/Users/jakedaneshgar/Developer/colorway/.claude/worktrees/daily-diagnostic-social-posts-50b707/package.json');
const sharp = require('sharp');
const OUT = 'public/images/posts/college-football-week-11-uniforms-2026/cover.jpg';
const W = 1500, H = 1000, M = 70, BG = '#0d0f14', ACC = '#BF5700', PAPER = '#f3efe7', PAD = 20;
async function tw(str, size, ls) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="200"><rect width="2400" height="200" fill="#ffffff"/><text x="20" y="130" font-family="Hanken Grotesk" font-weight="800" font-size="${size}" letter-spacing="${ls}" fill="#000000">${str}</text></svg>`;
  const { info } = await sharp(Buffer.from(svg)).png().trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
  return info.width;
}
const K1 = 'CFB WEEK 11 UNIFORMS', K2 = 'NOV 10 - 14';
const w1 = Math.round(await tw(K1, 22, 4) + PAD * 2), w2 = Math.round(await tw(K2, 22, 4) + PAD * 2);
const RX = 620, GAP = 10;
const TW = Math.floor((W - RX - GAP) / 2), TH = Math.floor((H - GAP) / 2);
const M4 = [
  { a: 'ncaa-texas-longhorns', h: 'ncaa-lsu-tigers', l: 'TEXAS AT LSU', ac: '#BF5700', hc: '#461D7C' },
  { a: 'ncaa-utah-utes', h: 'ncaa-arizona-wildcats', l: 'UTAH AT ARIZONA', ac: '#CC0000', hc: '#0C234B' },
  { a: 'ncaa-usc-trojans', h: 'ncaa-indiana-hoosiers', l: 'USC AT INDIANA', ac: '#990000', hc: '#7D110C' },
  { a: 'ncaa-missouri-tigers', h: 'ncaa-georgia-bulldogs', l: 'MISSOURI AT GEORGIA', ac: '#111111', hc: '#BA0C2F' },
];
const pos = (i) => ({ x: RX + (i % 2) * (TW + GAP), y: Math.floor(i / 2) * (TH + GAP), w: i % 2 ? W - (RX + TW + GAP) : TW, h: i >= 2 ? H - (TH + GAP) : TH });
const tiles = M4.map((m, i) => { const p = pos(i); return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${PAPER}"/><rect x="${p.x}" y="${p.y}" width="${p.w}" height="16" fill="${m.ac}"/><rect x="${p.x}" y="${p.y + p.h - 16}" width="${p.w}" height="16" fill="${m.hc}"/><text x="${p.x + p.w / 2}" y="${p.y + 238}" text-anchor="middle" font-family="Hanken Grotesk" font-weight="800" font-size="28" fill="${BG}" fill-opacity="0.45">at</text><text x="${p.x + p.w / 2}" y="${p.y + p.h - 44}" text-anchor="middle" font-family="Hanken Grotesk" font-weight="800" font-size="18" letter-spacing="2" fill="${BG}" fill-opacity="0.8">${m.l}</text>`; }).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="g" cx="0.2" cy="0.3" r="0.75"><stop offset="0%" stop-color="#2a1a0c"/><stop offset="100%" stop-color="${BG}"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>
<g transform="translate(${M} 62) skewX(-8)"><rect width="${w1}" height="46" fill="${ACC}"/><text x="${PAD}" y="32" font-family="Hanken Grotesk" font-weight="800" font-size="22" fill="#fff" letter-spacing="4">${K1}</text></g>
<g transform="translate(${M} 120) skewX(-8)"><rect width="${w2}" height="46" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="2"/><text x="${PAD}" y="32" font-family="Hanken Grotesk" font-weight="800" font-size="22" fill="#fff" letter-spacing="4">${K2}</text></g>
<g transform="translate(${M} 330) skewX(-6)"><text font-family="Anton" font-size="118" fill="${ACC}">WEEK 11</text></g>
<g transform="translate(${M} 455) skewX(-6)"><text font-family="Anton" font-size="118" fill="#fff">UNIFORMS</text></g>
<text x="${M}" y="520" font-family="Hanken Grotesk" font-weight="800" font-size="25" fill="#fff" fill-opacity="0.85">Texas at LSU, Utah at Arizona,</text>
<text x="${M}" y="556" font-family="Hanken Grotesk" font-weight="800" font-size="25" fill="#fff" fill-opacity="0.85">and Marshall's Play For The 75</text>
<rect x="${M}" y="610" width="${RX - M - 40}" height="150" rx="14" fill="${PAPER}"/><rect x="${M}" y="776" width="${RX - M - 40}" height="96" rx="14" fill="${PAPER}" fill-opacity="0.92"/>${tiles}</svg>`;
const comps = [];
async function logo(f, cx, cy, h, w) { const b = await sharp(f).resize({ height: h, width: w, fit: 'inside' }).toBuffer(); const m = await sharp(b).metadata(); comps.push({ input: b, left: Math.round(cx - m.width / 2), top: Math.round(cy - m.height / 2) }); }
const sw = RX - M - 40;
const teams = ['ncaa-marshall-thundering-herd', 'ncaa-florida-gators', 'ncaa-kentucky-wildcats', 'ncaa-texas-longhorns'];
for (let i = 0; i < teams.length; i++) await logo(`assets/logos-hires/teams/${teams[i]}.png`, M + sw * (i + 0.5) / teams.length, 685, 104, 106);
const confs = ['ncaa-conf-sec', 'ncaa-conf-big-ten', 'ncaa-conf-big-12', 'ncaa-conf-sun-belt'];
for (let i = 0; i < confs.length; i++) await logo(`assets/logos-hires/leagues/${confs[i]}.png`, M + sw * (i + 0.5) / confs.length, 824, 70, 110);
for (let i = 0; i < M4.length; i++) { const p = pos(i), cx = p.x + p.w / 2; await logo(`assets/logos-hires/teams/${M4[i].a}.png`, cx, p.y + 130, 150, 220); await logo(`assets/logos-hires/teams/${M4[i].h}.png`, cx, p.y + 345, 150, 220); }
const wm = await sharp('public/brand/colorway-sports-logo-white.png').resize({ height: 30 }).toBuffer();
comps.push({ input: wm, left: M, top: 920 });
mkdirSync(dirname(OUT), { recursive: true });
const info = await sharp(Buffer.from(svg)).composite(comps).jpeg({ quality: 84 }).toFile(OUT);
console.log(`${OUT} ${info.width}x${info.height} ${Math.round(info.size / 1024)}KB`);
