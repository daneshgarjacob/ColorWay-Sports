// Cover for nba-cup-courts-2026-ranked (all 30 Emirates NBA Cup 2026 courts, ranked).
//
// Jake 10/13: covers were all starting to look the same (navy ground, chips, headline bar), and
// this one should be mostly COURT, not our framing. So: four big-market floors fill the whole
// frame as a 2x2 mosaic (Knicks, Lakers, 76ers, Jazz, in neutral city order so the cover does not
// reveal the ranking, per feedback_ranking_covers_dont_reveal_order), with one round badge in the
// middle carrying the NBA mark and the hook. No grades, no numbers.
//
// Source: the season court library, public/images/courts/nba/2026-27/cup/<slug>.jpg (NBA renders).
// Usage: node scripts/gen-nba-cup-courts-cover.mjs [out.jpg]
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const OUT = process.argv[2] || "public/images/posts/nba-cup-courts-2026-ranked/cover.jpg";
const LIB = "public/images/courts/nba/2026-27/cup";
const TILES = ["lakers", "knicks", "76ers", "jazz"]; // Los Angeles, New York, Philadelphia, Utah

const W = 1500, H = 1000, GAP = 8;
const TW = (W - GAP) / 2, TH = (H - GAP) / 2;
const GOLD = "#d9b45a";

const comps = [];
for (const [i, slug] of TILES.entries()) {
  const tile = await sharp(`${LIB}/${slug}.jpg`).resize(TW, TH, { fit: "cover", position: "centre" }).toBuffer();
  comps.push({ input: tile, left: (i % 2) * (TW + GAP), top: Math.floor(i / 2) * (TH + GAP) });
}

// Center badge: dark disc with a gold ring, the NBA mark, and the hook in three lines.
const R = 236, CX = W / 2, CY = H / 2;
const badge = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="disc" cx="0.5" cy="0.4" r="0.7"><stop offset="0%" stop-color="#1b1f2a"/><stop offset="100%" stop-color="#07080c"/></radialGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#000" flood-opacity="0.55"/></filter>
  </defs>
  <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#disc)" stroke="${GOLD}" stroke-width="10" filter="url(#shadow)"/>
  <circle cx="${CX}" cy="${CY}" r="${R - 20}" fill="none" stroke="${GOLD}" stroke-opacity="0.45" stroke-width="2"/>
  <text x="${CX}" y="${CY - 44}" text-anchor="middle" font-family="Hanken Grotesk" font-weight="800" font-size="27" letter-spacing="7" fill="${GOLD}">ALL 30 NBA CUP</text>
  <text x="${CX}" y="${CY + 72}" text-anchor="middle" font-family="Anton" font-size="104" fill="#ffffff">COURTS</text>
  <text x="${CX}" y="${CY + 144}" text-anchor="middle" font-family="Anton" font-size="62" letter-spacing="4" fill="${GOLD}">RANKED</text>
</svg>`;
comps.push({ input: Buffer.from(badge), left: 0, top: 0 });

const nba = await sharp("assets/logos-hires/leagues/nba.png").trim({ threshold: 1 }).resize({ height: 92, fit: "inside" }).toBuffer();
const nm = await sharp(nba).metadata();
comps.push({ input: nba, left: Math.round(CX - nm.width / 2), top: Math.round(CY - 178) });

// Small ColorWay wordmark on a dark pill, bottom-left over the Philadelphia tile.
const wm = await sharp("public/brand/colorway-sports-logo-white.png").resize({ height: 28 }).toBuffer();
const wmm = await sharp(wm).metadata();
const pill = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${wmm.width + 32}" height="48"><rect width="${wmm.width + 32}" height="48" rx="24" fill="#000" fill-opacity="0.62"/></svg>`);
comps.push({ input: pill, left: 28, top: H - 76 }, { input: wm, left: 44, top: H - 66 });

mkdirSync(dirname(OUT), { recursive: true });
const base = sharp({ create: { width: W, height: H, channels: 3, background: "#07080c" } });
const info = await base.composite(comps).jpeg({ quality: 84, mozjpeg: true }).toFile(OUT);
console.log(OUT, info.width + "x" + info.height, Math.round(info.size / 1024) + " KB");
