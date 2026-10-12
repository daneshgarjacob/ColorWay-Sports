// "Direction 5" MLB matchup card (Jake approved 10/12): deep navy gradient with
// the brand-blue glow, transparent jersey cutouts on a soft spotlight, round or
// league logo top-left, MATCHUP GRADE chip top-right, and a broadcast-style score
// bar along the bottom. Mockup: review-screens/card-redesign.html (first section).
//
// Shared by scripts/mlb-tracker-day.mjs (emits NEW cards) and
// scripts/mlb-backfill-scores.mjs (fills the score into a card emitted before the
// game ended). Already-published old-style cards are never rewritten.
//
// Parsing hooks (keep these stable - lib/ and scripts/ read them):
//   <img src="/images/posts/mlb-daily-tracker/..." alt="... jersey worn ...">  src FIRST, alt SECOND
//   data-label>TEAM</div>   then   <span ... background: #hex; ... vertical-align: middle;"></span><span data-uni ...>Uniform</span>
//   data-cap="Cap"  data-grade="B-" (empty = pending)  data-status>Final<  data-score="away|home">N or &ndash;<
//
// Rules: inline styles only. No <p> inside the card (app/globals.css narrows
// centered <p> to 80%). Every <img> overrides the .prose img shadow/radius/margin.

import fs from "node:fs";

const DISPLAY = "var(--font-display, 'Hanken Grotesk', Inter, sans-serif)";

// Score-bar colors for all 30 clubs. top/bot = vertical gradient of the team
// block; navy/black primaries use a LIGHTER shade so the block separates from the
// navy card. accent = the outside edge stripe (picked to read on navy).
export const MLB_TEAM = {
  "diamondbacks": { abbr: "ARI", top: "#A71930", bot: "#7a1223", accent: "#E3D4AD" },
  "braves":       { abbr: "ATL", top: "#2a4a85", bot: "#1d3666", accent: "#CE1141" },
  "orioles":      { abbr: "BAL", top: "#DF4601", bot: "#a83501", accent: "#ffffff" },
  "red-sox":      { abbr: "BOS", top: "#BD3039", bot: "#8c1f27", accent: "#ffffff" },
  "cubs":         { abbr: "CHC", top: "#1f4aa8", bot: "#0E3386", accent: "#CC3433" },
  "white-sox":    { abbr: "CWS", top: "#4a4a4f", bot: "#333336", accent: "#C4CED4" },
  "reds":         { abbr: "CIN", top: "#C6011F", bot: "#8f0016", accent: "#ffffff" },
  "guardians":    { abbr: "CLE", top: "#1d5684", bot: "#123f66", accent: "#E50022" },
  "rockies":      { abbr: "COL", top: "#4d4d8c", bot: "#38386b", accent: "#C4CED4" },
  "tigers":       { abbr: "DET", top: "#24467e", bot: "#1a3563", accent: "#FA4616" },
  "astros":       { abbr: "HOU", top: "#1f4c86", bot: "#163a6a", accent: "#EB6E1F" },
  "royals":       { abbr: "KC",  top: "#1a5fa3", bot: "#0f4a82", accent: "#BD9B60" },
  "angels":       { abbr: "LAA", top: "#BA0021", bot: "#870018", accent: "#C4CED4" },
  "dodgers":      { abbr: "LAD", top: "#005A9C", bot: "#0b3a66", accent: "#ffffff" },
  "marlins":      { abbr: "MIA", top: "#00A3E0", bot: "#0077a8", accent: "#EF3340" },
  "brewers":      { abbr: "MIL", top: "#24467e", bot: "#1a3563", accent: "#FFC52F" },
  "twins":        { abbr: "MIN", top: "#1f4a80", bot: "#163a66", accent: "#D31145" },
  "mets":         { abbr: "NYM", top: "#1f4c96", bot: "#163a7a", accent: "#FF5910" },
  "yankees":      { abbr: "NYY", top: "#2a4a80", bot: "#1c3766", accent: "#ffffff" },
  "athletics":    { abbr: "ATH", top: "#12614f", bot: "#0b4a3d", accent: "#EFB21E" },
  "phillies":     { abbr: "PHI", top: "#E81828", bot: "#b0101c", accent: "#ffffff" },
  "pirates":      { abbr: "PIT", top: "#4a4740", bot: "#33312b", accent: "#FDB827" },
  "padres":       { abbr: "SD",  top: "#5c4636", bot: "#45342a", accent: "#FFC425" },
  "giants":       { abbr: "SF",  top: "#FD5A1E", bot: "#c9430f", accent: "#EFD19F" },
  "mariners":     { abbr: "SEA", top: "#1f4a80", bot: "#163a66", accent: "#1fa39a" },
  "cardinals":    { abbr: "STL", top: "#C41E3A", bot: "#8f1229", accent: "#FEDB00" },
  "rays":         { abbr: "TB",  top: "#1f4a80", bot: "#163a66", accent: "#8FBCE6" },
  "rangers":      { abbr: "TEX", top: "#1f4c96", bot: "#16397a", accent: "#C0111F" },
  "blue-jays":    { abbr: "TOR", top: "#1d5aa8", bot: "#12427d", accent: "#E8291C" },
  "nationals":    { abbr: "WSH", top: "#AB0003", bot: "#7d0002", accent: "#ffffff" },
};

// ---- jersey image: cutout when we have a good one, else original on a tile ----
const SKIPS_FILE = "scripts/data/jersey-cutout-skips.json";
const noCut = fs.existsSync(SKIPS_FILE) ? JSON.parse(fs.readFileSync(SKIPS_FILE, "utf8")).noCut ?? {} : {};
export const cutOf = (src) => src.replace(/\.(jpe?g|png|webp)$/i, "-cut.webp");
export function pickJersey(src) {
  const cut = cutOf(src);
  if (!noCut[src] && fs.existsSync(`public${cut}`)) return { src: cut, cut: true };
  return { src, cut: false };
}
// a card may carry the -cut.webp; map it back to the original tile file
export function originalOf(src) {
  if (!/-cut\.webp$/i.test(src)) return src;
  const base = src.replace(/-cut\.webp$/i, "");
  for (const ext of [".jpg", ".png", ".jpeg", ".webp"]) if (fs.existsSync(`public${base}${ext}`)) return base + ext;
  return src;
}

const SPOT = "radial-gradient(closest-side at 50% 48%, rgba(132,170,240,0.30) 0%, rgba(80,128,230,0.14) 50%, rgba(47,107,237,0) 100%)";
const IMG_RESET = "max-width: 100%; margin: 0; border-radius: 0; box-shadow: none;";

function jerseyBox(src, alt) {
  const j = pickJersey(src);
  if (j.cut) {
    return `<div style="width: 100%; aspect-ratio: 5 / 6; max-height: 320px; background: ${SPOT}; padding: 4% 6% 2%; box-sizing: border-box;"><img src="${j.src}" alt="${alt}" style="display: block; width: 100%; height: 100%; object-fit: contain; ${IMG_RESET} filter: drop-shadow(0 10px 14px rgba(0,0,0,0.45)) drop-shadow(0 2px 3px rgba(0,0,0,0.30));" /></div>`;
  }
  // fallback: the original product shot on a subtle light tile
  return `<div style="width: 100%; aspect-ratio: 5 / 6; max-height: 320px; padding: 4% 6% 2%; box-sizing: border-box;"><div style="width: 100%; height: 100%; background: #eef0f5; border-radius: 10px; padding: 6%; box-sizing: border-box;"><img src="${j.src}" alt="${alt}" style="display: block; width: 100%; height: 100%; object-fit: contain; ${IMG_RESET}" /></div></div>`;
}

export function sideD5({ src, alt, label, swatch, uniform, cap }) {
  const capHtml = cap ? ` <span data-cap="${cap}" style="color: rgba(255,255,255,0.78); opacity: 0.8;">&middot; ${cap} cap</span>` : "";
  return `    <div style="min-width: 0;">${jerseyBox(src, alt)}<div data-label style="margin: 6px 0 0; color: #ffffff; font-size: clamp(12px, 2.6vw, 14px); font-weight: 900; letter-spacing: 0.6px; text-transform: uppercase; line-height: 1.15; text-align: center;">${label}</div>
      <div style="margin: 3px 0 0; font-size: 10px; line-height: 1.35; letter-spacing: 1.2px; text-transform: uppercase; font-weight: 600; color: rgba(255,255,255,0.78); text-align: center;"><span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${swatch}; border: 1px solid rgba(255,255,255,0.5); margin-right: 5px; vertical-align: middle;"></span><span data-uni style="color: rgba(255,255,255,0.78);">${uniform}</span>${capHtml}</div></div>`;
}

// score cell. value = number, or null while the game is unfinished (en dash).
export function scoreSpan(side, value, won) {
  const pending = value === null || value === undefined;
  const color = !pending && won ? "#ffffff" : "rgba(255,255,255,0.6)";
  const weight = !pending && won ? 900 : 700;
  return `<span data-score="${side}" style="display: flex; align-items: center; justify-content: center; min-width: clamp(34px, 9vw, 52px); align-self: stretch; background: rgba(0,0,0,0.26); color: ${color}; font-family: ${DISPLAY}; font-size: clamp(18px, 4.6vw, 24px); font-weight: ${weight}; font-variant-numeric: tabular-nums; letter-spacing: -0.5px;">${pending ? "&ndash;" : value}</span>`;
}
// matches a pending score cell, for the backfill
export const PENDING_SCORE = /<span data-score="(away|home)" style="[^"]*">&ndash;<\/span>/g;

function abbrSpan(abbr, align) {
  return `<span style="flex: 1; min-width: 0; padding: 0 clamp(6px, 2.4vw, 12px); color: #ffffff; font-family: ${DISPLAY}; font-size: clamp(13px, 3vw, 16px); font-weight: 900; letter-spacing: 1.4px; text-align: ${align};">${abbr}</span>`;
}

export function cardD5({ logo, grade, away, home, awaySlug, homeSlug, awayScore, homeScore, sub }) {
  const A = MLB_TEAM[awaySlug], H = MLB_TEAM[homeSlug];
  const done = typeof awayScore === "number" && typeof homeScore === "number";
  const aWon = done && awayScore > homeScore, hWon = done && homeScore > awayScore;
  const chip = grade
    ? `<span data-grade="${grade}" style="background: linear-gradient(160deg, #2f6bed 0%, #1d4fc4 100%); color: #ffffff; font-family: ${DISPLAY}; font-size: clamp(17px, 4.4vw, 22px); font-weight: 900; line-height: 1; padding: 7px 10px; min-width: 44px; text-align: center; border-radius: 8px; letter-spacing: -0.5px; box-shadow: 0 2px 10px rgba(47,107,237,0.35);">${grade}</span>`
    : `<span data-grade="" style="background: rgba(255,255,255,0.08); border: 1px dashed rgba(255,255,255,0.35); color: rgba(255,255,255,0.7); font-family: ${DISPLAY}; font-size: clamp(17px, 4.4vw, 22px); font-weight: 800; line-height: 1; padding: 6px 9px; min-width: 44px; text-align: center; border-radius: 8px; box-sizing: border-box;">&ndash;</span>`;
  const subHtml = sub ? `<span style="color: rgba(255,255,255,0.6); font-size: 8.5px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; margin-top: 2px; white-space: nowrap;">${sub}</span>` : "";
  return `<div style="margin: 1.4em 0 0.6em;">
<div data-card="mlb-d5" style="background: radial-gradient(120% 90% at 100% 0%, rgba(47,107,237,0.38) 0%, rgba(47,107,237,0) 55%), linear-gradient(160deg, #142a52 0%, #0b1a2f 55%, #08121f 100%); border-radius: 16px; padding: clamp(12px, 3.5vw, 20px); box-shadow: 0 1px 2px rgba(8,18,31,0.10), 0 10px 28px rgba(8,18,31,0.18);">
  <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 10px; margin: 0 0 4px;">
    <div style="min-width: 0; flex: 0 1 auto;"><img src="${logo.src}" alt="${logo.alt}" title="via MLB" style="display: block; height: clamp(19px, 6vw, 30px); width: auto; ${IMG_RESET}" /></div>
    <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-left: auto;">
      <span style="color: rgba(255,255,255,0.78); font-size: clamp(8px, 2.2vw, 9.5px); font-weight: 800; letter-spacing: 1.6px; text-transform: uppercase; line-height: 1.25; text-align: right;">Matchup<br>Grade</span>
      ${chip}
    </div>
  </div>
  <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(4px, 2vw, 12px);">
${away}
${home}
  </div>
  <div style="margin: clamp(12px, 3vw, 16px) 0 0; display: grid; grid-template-columns: minmax(0,1fr) auto minmax(0,1fr); align-items: stretch; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.14); box-shadow: 0 4px 14px rgba(0,0,0,0.30);">
    <div style="display: flex; align-items: center; min-height: 42px; min-width: 0; background: linear-gradient(180deg, ${A.top} 0%, ${A.bot} 100%); border-left: 4px solid ${A.accent};">${abbrSpan(A.abbr, "left")}${scoreSpan("away", done ? awayScore : null, aWon)}</div>
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 clamp(6px, 2.4vw, 14px); background: #050c17;"><span data-status style="color: #ffffff; font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">Final</span>${subHtml}</div>
    <div style="display: flex; align-items: center; min-height: 42px; min-width: 0; background: linear-gradient(180deg, ${H.top} 0%, ${H.bot} 100%); border-right: 4px solid ${H.accent};">${scoreSpan("home", done ? homeScore : null, hWon)}${abbrSpan(H.abbr, "right")}</div>
  </div>
</div>
</div>`;
}
