#!/usr/bin/env node
// Traditional Jersey Index grid visual — every 2026 playoff HOME jersey, series x game.
// Whites read instantly against the dark field. Our own data (parsed live from the four
// tracker posts), our own jersey art. Inspired by the genre, built from scratch.
//
// Outputs:
//   public/images/posts/nba-traditional-jersey-index/jersey-grid-full.jpg  (in-post, 1600w)
//   ~/Desktop/nba-traditional-jersey-index-ig.png                          (1080x1350 IG export)
//
// Re-run after each Finals game (then `node scripts/compress-images.mjs` and commit).

import sharp from "sharp";
import { readFile, writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import os from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const TRACKERS = [
  { file: "content/posts/nba-playoffs-2026-round-1-jersey-tracker.md", round: "ROUND 1" },
  { file: "content/posts/nba-playoffs-2026-round-2-jersey-tracker.md", round: "ROUND 2" },
  { file: "content/posts/nba-playoffs-2026-conference-finals-jersey-tracker.md", round: "CONFERENCE FINALS" },
  { file: "content/posts/nba-finals-2026-jersey-tracker-knicks-spurs.md", round: "NBA FINALS" },
];
// R2 corrected 6/11: published 8/21 was a tally error; cards + prose confirm 7 (Pistons' first
// non-white home game of the playoffs was R2 G5). Lakers gold at home counts as traditional
// per the published franchise ruling in the Round 1 breakdown post.
const EXPECT = { "ROUND 1": [16, 48], "ROUND 2": [7, 21], "CONFERENCE FINALS": [3, 11], "NBA FINALS": [4, 5] };
const TRADITIONAL_RULING = (jersey) => /lakers-icon-gold/.test(jersey);

const NICK = (full) => full.trim().split(" ").pop().toUpperCase()
  .replace("76ERS", "SIXERS").replace("BLAZERS", "BLAZERS");

async function parse() {
  const rounds = [];
  for (const t of TRACKERS) {
    const text = await readFile(resolve(ROOT, t.file), "utf8");
    const headRe = /^#{2,3} Game (\d+): (.+?) at (.+?)\s*$/gm;
    const heads = [...text.matchAll(headRe)];
    const games = [];
    for (let i = 0; i < heads.length; i++) {
      const start = heads[i].index;
      const lineEnd = text.indexOf("\n", start);
      const next = text.slice(lineEnd).search(/^#{2,3} /m);
      const block = next === -1 ? text.slice(start) : text.slice(start, lineEnd + next);
      const imgs = [...block.matchAll(/src="(\/images\/jerseys\/nba\/[^"]+)"/g)].map((m) => m[1]);
      if (imgs.length < 2) {
        console.warn(`SKIP (needs 2 jersey imgs): ${t.round} ${heads[i][0].trim()}`);
        continue;
      }
      const white = /white/i.test(imgs[1]);
      games.push({
        game: parseInt(heads[i][1], 10),
        away: heads[i][2].trim(),
        home: heads[i][3].trim(),
        homeJersey: imgs[1],
        white,
        traditional: white || TRADITIONAL_RULING(imgs[1]),
      });
    }
    // group into series by team pair, keep first-seen order of the pair's Game 1 (or first card)
    const series = [];
    const byKey = new Map();
    for (const g of [...games].sort((a, b) => a.game - b.game)) {
      const key = [g.away, g.home].sort().join("|");
      if (!byKey.has(key)) {
        byKey.set(key, { key, games: new Map() });
        series.push(byKey.get(key));
      }
      byKey.get(key).games.set(g.game, g);
    }
    for (const s of series) {
      const g1 = s.games.get(1);
      s.label = g1 ? `${NICK(g1.home)} vs ${NICK(g1.away)}` : s.key;
    }
    rounds.push({ round: t.round, series });
  }
  return rounds;
}

function statsOf(rounds) {
  const per = {};
  let W = 0, T = 0;
  for (const r of rounds) {
    let w = 0, n = 0;
    for (const s of r.series) for (const g of s.games.values()) { n++; if (g.traditional) w++; }
    per[r.round] = [w, n]; W += w; T += n;
  }
  return { per, W, T };
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function render(rounds, stats, cfg, outPath) {
  const { W: width, pad, headerH, colHdrH, bandH, rowH, footerH, railW, jerseyH, titleSize, statSize } = cfg;
  const nRows = rounds.reduce((s, r) => s + r.series.length, 0);
  const height = pad + headerH + colHdrH + rounds.length * bandH + nRows * rowH + footerH + pad;
  const gridX = pad + railW;
  const colW = (width - pad - gridX) / 7;

  let svg = "";
  let composites = [];

  // background
  svg += `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#10131f"/><stop offset="55%" stop-color="#0a0c16"/><stop offset="100%" stop-color="#06070d"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${width}" height="6" fill="#FF5910"/>
  <rect x="0" y="${height - 6}" width="${width}" height="6" fill="#FF5910"/>`;

  // header
  const hx = pad, hy = pad + Math.round(headerH * 0.18);
  svg += `<text x="${hx}" y="${hy}" font-family="Menlo, monospace" font-size="${Math.round(titleSize * 0.34)}" font-weight="700" letter-spacing="3" fill="#FF5910">● THE TRADITIONAL JERSEY INDEX</text>`;
  svg += `<text x="${hx}" y="${hy + Math.round(titleSize * 1.15)}" font-family="Helvetica, Arial, sans-serif" font-size="${titleSize}" font-weight="800" fill="#ffffff">Home Whites in the 2026 NBA Playoffs</text>`;
  svg += `<text x="${hx}" y="${hy + Math.round(titleSize * 1.15) + Math.round(statSize * 1.25)}" font-family="Helvetica, Arial, sans-serif" font-size="${statSize}" font-weight="900" fill="#FF5910">${stats.W} of ${stats.T} games · ${Math.round((stats.W / stats.T) * 100)}%</text>`;
  svg += `<text x="${hx}" y="${hy + Math.round(titleSize * 1.15) + Math.round(statSize * 1.25) + Math.round(statSize * 0.78)}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(statSize * 0.42)}" fill="#9aa3b5">Every home jersey of the postseason, series by series · through NBA Finals Game 5 · colorwaysports.com</text>`;

  // column headers
  let y = pad + headerH;
  for (let c = 0; c < 7; c++) {
    svg += `<text x="${gridX + c * colW + colW / 2}" y="${y + colHdrH - 12}" text-anchor="middle" font-family="Menlo, monospace" font-size="${Math.round(colHdrH * 0.42)}" font-weight="700" letter-spacing="2" fill="#9aa3b5">G${c + 1}</text>`;
  }
  y += colHdrH;

  for (const r of rounds) {
    const [w, n] = stats.per[r.round];
    const pct = Math.round((w / n) * 100);
    const accent = pct >= 50 ? "#00c864" : "#e0455a";
    // round band
    svg += `<rect x="${pad}" y="${y + 6}" width="${width - pad * 2}" height="${bandH - 12}" rx="8" fill="rgba(255,255,255,0.05)"/>`;
    svg += `<text x="${pad + 18}" y="${y + bandH / 2 + Math.round(bandH * 0.14)}" font-family="Menlo, monospace" font-size="${Math.round(bandH * 0.34)}" font-weight="700" letter-spacing="2.5" fill="#ffffff">${r.round}${r.round === "NBA FINALS" ? " · IN PROGRESS" : ""}</text>`;
    svg += `<text x="${width - pad - 18}" y="${y + bandH / 2 + Math.round(bandH * 0.14)}" text-anchor="end" font-family="Menlo, monospace" font-size="${Math.round(bandH * 0.34)}" font-weight="700" letter-spacing="2" fill="${accent}">HOME WHITES ${w} OF ${n} (${pct}%)</text>`;
    y += bandH;

    for (const s of r.series) {
      // row separator + label
      svg += `<line x1="${pad}" y1="${y + rowH}" x2="${width - pad}" y2="${y + rowH}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
      svg += `<text x="${pad}" y="${y + rowH / 2 + 5}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(rowH * 0.155)}" font-weight="700" fill="#dfe4ee">${esc(s.label)}</text>`;
      for (let c = 1; c <= 7; c++) {
        const cx = gridX + (c - 1) * colW + colW / 2;
        const g = s.games.get(c);
        if (!g) {
          svg += `<circle cx="${cx}" cy="${y + rowH / 2}" r="3" fill="rgba(255,255,255,0.10)"/>`;
          continue;
        }
        composites.push({ file: resolve(ROOT, "public" + g.homeJersey), cx, cy: y + rowH / 2 });
        if (g.traditional) {
          svg += `<circle cx="${cx}" cy="${y + rowH / 2}" r="${jerseyH * 0.62}" fill="rgba(255,255,255,0.07)"/>`;
        }
        if (g.traditional && !g.white) {
          svg += `<text x="${cx + jerseyH * 0.55}" y="${y + rowH / 2 - jerseyH * 0.4}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(jerseyH * 0.22)}" font-weight="700" fill="#FFC72C">†</text>`;
        }
      }
      y += rowH;
    }
  }

  // footer
  svg += `<text x="${pad}" y="${height - pad - Math.round(footerH * 0.3)}" font-family="Menlo, monospace" font-size="${Math.round(footerH * 0.24)}" font-weight="700" letter-spacing="2" fill="#9aa3b5">WHITE = TRADITIONAL HOME LOOK · † LAKERS GOLD COUNTS AS TRADITIONAL (FRANCHISE RULING)</text>`;
  svg += `<text x="${width - pad}" y="${height - pad - Math.round(footerH * 0.3)}" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(footerH * 0.26)}" font-weight="800" fill="#ffffff">ColorWay <tspan fill="#FF5910">Sports</tspan></text>`;

  const base = sharp({ create: { width, height: Math.round(height), channels: 4, background: "#0a0c16" } });
  const svgBuf = Buffer.from(`<svg width="${width}" height="${Math.round(height)}" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`);

  const layers = [{ input: svgBuf, top: 0, left: 0 }];
  for (const c of composites) {
    const img = await sharp(c.file).resize({ height: jerseyH, width: Math.round(colW * 0.86), fit: "inside" }).toBuffer();
    const meta = await sharp(img).metadata();
    layers.push({ input: img, top: Math.round(c.cy - meta.height / 2), left: Math.round(c.cx - meta.width / 2) });
  }
  await base.composite(layers).png().toFile(outPath);
  console.log(`wrote ${outPath}`);
}

const rounds = await parse();
const stats = statsOf(rounds);
console.log("Parsed:", JSON.stringify(stats.per), `TOTAL ${stats.W}/${stats.T}`);
for (const [r, [w, n]] of Object.entries(EXPECT)) {
  const got = stats.per[r] || [0, 0];
  if (got[0] !== w || got[1] !== n) console.warn(`MISMATCH ${r}: expected ${w}/${n}, parsed ${got[0]}/${got[1]}`);
}

const outDir = resolve(ROOT, "public/images/posts/nba-traditional-jersey-index");
await mkdir(outDir, { recursive: true });

// in-post version
await render(rounds, stats, {
  W: 1600, pad: 64, headerH: 230, colHdrH: 46, bandH: 64, rowH: 132,
  footerH: 80, railW: 300, jerseyH: 108, titleSize: 52, statSize: 44,
}, resolve(outDir, "jersey-grid-full.png"));

// IG 4:5 version (1080x1350): compute rowH to fit exactly
const nRows = rounds.reduce((s, r) => s + r.series.length, 0);
const igPad = 40, igHeader = 168, igColHdr = 32, igBand = 36, igFooter = 52;
const igRowH = Math.floor((1350 - igPad * 2 - igHeader - igColHdr - rounds.length * igBand - igFooter) / nRows);
await render(rounds, stats, {
  W: 1080, pad: igPad, headerH: igHeader, colHdrH: igColHdr, bandH: igBand, rowH: igRowH,
  footerH: igFooter, railW: 196, jerseyH: Math.round(igRowH * 0.82), titleSize: 34, statSize: 30,
}, resolve(os.homedir(), "Desktop/nba-traditional-jersey-index-ig.png"));
