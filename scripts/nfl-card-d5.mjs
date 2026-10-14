// "Direction 5" NFL matchup card: the MLB design Jake approved 10/12
// (scripts/mlb-card-d5.mjs) with the NFL shield top-left, the week under it, NFL
// score-bar colors, and the helmet / jersey / pants icon row kept under each jersey.
// MOCK STAGE (10/13): nothing calls this yet. scripts/nfl-tracker-card.py still
// emits the old black card until Jake approves review-screens/card-d5-nfl-nhl-mock.html.
//
// Reused from MLB: the card shell, grade chip, score bar and score cells (through
// scripts/nhl-card-d5.mjs's cardShell, which is MLB's cardD5 with inputs), pickJersey
// (cutout when public/<name>-cut.webp exists and is not in jersey-cutout-skips.json,
// else the original on a light tile). The icon row is a straight port of dark_row()
// in scripts/nfl_uniform_icons.py, byte-for-byte, so the Python regexes still match it.
//
// Parsing hooks kept (who reads them):
//   data-color="#HEX" x6, helmet/jersey/pants, away first      lib/nflTrackerCards.ts, gen-week-in-color.mjs, nfl_uniform_icons.card_hexes
//   zero-size <span ... background:#HEX;> token per icon       scripts/build-wear-log.mjs style bar readers
//   <img src="/images/posts/nfl-tracker-jerseys/..." alt=...>  lib/nflTrackerCards.ts (img), lib/nflTeamLatest.ts
//   <p data-label ...font-weight:900;...">BILLS</p><p data-uni ...>White &middot; White &middot; White</p>
//       label + combo pair, no whitespace between              lib/nflTeamLatest.ts
//       combo style ENDS "text-transform:uppercase;opacity:.85;margin:4px 0 0;font-weight:600;"   lib/nflTrackerCards.ts
//   "Week N" visible text, followed by "<"                     gen-week-in-color.mjs, lib/nflTeamLatest.ts
//   hidden data-pill span, style ENDS "letter-spacing:2px;display:inline-block;", text "Final &middot; <score>"
//                                                              lib/nflTrackerCards.ts (final + score), lib/nflTeamLatest.ts, gen-week-in-color.mjs
//   grade chip style ENDS "letter-spacing:-.5px;"              scripts/nfl-tracker-card.py grade regex
//   data-grade / data-status / data-score                      the shared D5 hooks (build-wear-log.mjs D5_*)
// The <p>s use compact CSS ("text-align:center", no space) so app/globals.css's
// .prose p[style*="text-align: center"] 80% rule never matches them; every .prose p
// default (margin, line-height, size, color) is overridden inline.

import fs from "node:fs";
import { cardShell } from "./nhl-card-d5.mjs";
import { pickJersey } from "./mlb-card-d5.mjs";

const DISPLAY = "var(--font-display, 'Hanken Grotesk', Inter, sans-serif)";
const IMG_RESET = "max-width: 100%; margin: 0; border-radius: 0; box-shadow: none;";

// Score-bar colors for all 32 clubs, keyed by the jersey-file slug (last word of the
// club name, lowercased: "bills", "49ers", "commanders"). Navy/black/brown primaries
// use a LIGHTER shade so the block separates from the navy card. accent = edge stripe.
export const NFL_TEAM = {
  cardinals:  { abbr: "ARI", top: "#97233F", bot: "#6e1a2e", accent: "#FFB612" },
  falcons:    { abbr: "ATL", top: "#A71930", bot: "#7a1223", accent: "#ffffff" },
  ravens:     { abbr: "BAL", top: "#3a2a96", bot: "#241773", accent: "#9E7C0C" },
  bills:      { abbr: "BUF", top: "#1f4fa8", bot: "#00338D", accent: "#C60C30" },
  panthers:   { abbr: "CAR", top: "#0085CA", bot: "#006aa3", accent: "#BFC0BF" },
  bears:      { abbr: "CHI", top: "#1f3b6e", bot: "#152a52", accent: "#C83803" },
  bengals:    { abbr: "CIN", top: "#FB4F14", bot: "#c43a0a", accent: "#ffffff" },
  browns:     { abbr: "CLE", top: "#5a3d1a", bot: "#40290f", accent: "#FF3C00" },
  cowboys:    { abbr: "DAL", top: "#1f4a85", bot: "#163a6a", accent: "#869397" },
  broncos:    { abbr: "DEN", top: "#FB4F14", bot: "#c43a0a", accent: "#ffffff" },
  lions:      { abbr: "DET", top: "#0076B6", bot: "#005a8c", accent: "#B0B7BC" },
  packers:    { abbr: "GB",  top: "#2d5446", bot: "#1f3c32", accent: "#FFB612" },
  texans:     { abbr: "HOU", top: "#1f4a6a", bot: "#163650", accent: "#A71930" },
  colts:      { abbr: "IND", top: "#1f4f8f", bot: "#163c70", accent: "#ffffff" },
  jaguars:    { abbr: "JAX", top: "#006778", bot: "#004f5c", accent: "#D7A22A" },
  chiefs:     { abbr: "KC",  top: "#E31837", bot: "#b0102a", accent: "#FFB81C" },
  raiders:    { abbr: "LV",  top: "#4a4a4f", bot: "#333336", accent: "#A5ACAF" },
  chargers:   { abbr: "LAC", top: "#0080C6", bot: "#0064a0", accent: "#FFC20E" },
  rams:       { abbr: "LAR", top: "#1f4fb0", bot: "#003594", accent: "#FFD100" },
  dolphins:   { abbr: "MIA", top: "#008E97", bot: "#006d74", accent: "#FC4C02" },
  vikings:    { abbr: "MIN", top: "#4F2683", bot: "#3b1c63", accent: "#FFC62F" },
  patriots:   { abbr: "NE",  top: "#1f4a85", bot: "#163a6a", accent: "#C60C30" },
  saints:     { abbr: "NO",  top: "#4a4740", bot: "#33312b", accent: "#D3BC8D" },
  giants:     { abbr: "NYG", top: "#1f4aa8", bot: "#16397f", accent: "#A71930" },
  jets:       { abbr: "NYJ", top: "#1a6b50", bot: "#125740", accent: "#ffffff" },
  eagles:     { abbr: "PHI", top: "#0a6670", bot: "#004C54", accent: "#A5ACAF" },
  steelers:   { abbr: "PIT", top: "#4a4740", bot: "#33312b", accent: "#FFB612" },
  "49ers":    { abbr: "SF",  top: "#AA0000", bot: "#7d0000", accent: "#B3995D" },
  seahawks:   { abbr: "SEA", top: "#1f4a85", bot: "#163a6a", accent: "#69BE28" },
  buccaneers: { abbr: "TB",  top: "#D50A0A", bot: "#a00707", accent: "#B1BABF" },
  titans:     { abbr: "TEN", top: "#1f4a85", bot: "#163a6a", accent: "#4B92DB" },
  commanders: { abbr: "WSH", top: "#7a1e1e", bot: "#5a1414", accent: "#FFB612" },
};
export const nflKey = (fullName) => fullName.split(" ").pop().toLowerCase();

export const NFL_LOGO = { src: "/logos/leagues/nfl.png", alt: "NFL logo", via: "via NFL", height: "clamp(30px, 8vw, 40px)" };

// ---- helmet / jersey / pants icons: port of scripts/nfl_uniform_icons.py ----
const PARTS = ["helmet", "jersey", "pants"];
const SHAPES = {
  helmet: {
    body: "M9 41C7 25 17 11 33 11C46 11 54 20 55.5 30L52 33.5H43C40 33.5 38.8 36.6 40.6 39.2L44.5 45C46 47.6 44.6 51 41.4 51H15C11.6 51 9.4 47 9 41Z",
    details: ["M17 20C22 15 27 13 33 13"],
    ear: [27, 36, 3.2],
    mask: ["M52 33.5H60.5V47.5H44", "M45.6 40.5H60.5", "M55.5 30L60.5 33.5"],
  },
  jersey: {
    body: "M22 8.5L27 7C28 11 29.8 13.5 32 13.5C34.2 13.5 36 11 37 7L42 8.5L55.5 15.5L58 30.5L47.5 32.5V56.5H16.5V32.5L6 30.5L8.5 15.5Z",
    details: ["M27 7L32 15.5L37 7", "M16.5 32.5L17.4 19", "M47.5 32.5L46.6 19"],
  },
  pants: {
    body: "M15.5 8H48.5L50.5 33L49 55H36.5L32.8 26H31.2L27.5 55H15L13.5 33Z",
    details: ["M15.1 13.5H48.9", "M32 13.5V26"],
  },
};
function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * ch((n >> 16) & 255) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255);
}
function icon(kind, fill, size = 40) {
  fill = fill.toUpperCase();
  const s = SHAPES[kind];
  const outline = "rgba(255,255,255,.35)", mask = "rgba(255,255,255,.78)";
  const detail = lum(fill) > 0.45 ? "rgba(20,34,63,.22)" : "rgba(255,255,255,.28)";
  const ns = 'vector-effect="non-scaling-stroke"';
  let g = `<path d="${s.body}" fill="${fill}" stroke="${outline}" stroke-width="1.5" stroke-linejoin="round" ${ns}/>`;
  g += s.details.map((p) => `<path d="${p}" fill="none" stroke="${detail}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" ${ns}/>`).join("");
  if (s.ear) g += `<circle cx="${s.ear[0]}" cy="${s.ear[1]}" r="${s.ear[2]}" fill="${detail}"/>`;
  g += (s.mask ?? []).map((p) => `<path d="${p}" fill="none" stroke="${mask}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" ${ns}/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" style="display:block;overflow:visible;" aria-hidden="true" data-part="${kind}" data-color="${fill}">${g}</svg>`;
}
const token = (hex) => `<span style="position:absolute;width:0;height:0;overflow:hidden;background:${hex.toUpperCase()};"></span>`;
export function darkRow(hexes) {
  const figs = PARTS.map((k, i) =>
    `<div data-part="${k}" style="flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:3px;">${icon(k, hexes[i], 40)}${token(hexes[i])}` +
    `<span style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55);">${k[0].toUpperCase() + k.slice(1)}</span></div>`).join("");
  return `<div style="display:flex;gap:6px;margin:10px 0 0;width:100%;">${figs}</div>`;
}

// ---- jersey image: same as mlb-card-d5.mjs jerseyBox (not exported there), plus
// min-height: 0 so a tall cutout cannot stretch its aspect-ratio box past the
// other side's (the Bills box grew 7px taller than the Rams box on a phone). ----
const SPOT = "radial-gradient(closest-side at 50% 48%, rgba(132,170,240,0.30) 0%, rgba(80,128,230,0.14) 50%, rgba(47,107,237,0) 100%)";
function jerseyBox(src, alt) {
  const j = pickJersey(src);
  if (j.cut) {
    return `<div style="width: 100%; aspect-ratio: 5 / 6; min-height: 0; max-height: 300px; background: ${SPOT}; padding: 4% 6% 2%; box-sizing: border-box;"><img src="${j.src}" alt="${alt}" style="display: block; width: 100%; height: 100%; object-fit: contain; ${IMG_RESET} filter: drop-shadow(0 10px 14px rgba(0,0,0,0.45)) drop-shadow(0 2px 3px rgba(0,0,0,0.30));" /></div>`;
  }
  return `<div style="width: 100%; aspect-ratio: 5 / 6; min-height: 0; max-height: 300px; padding: 4% 6% 2%; box-sizing: border-box;"><div style="width: 100%; height: 100%; background: #eef0f5; border-radius: 10px; padding: 6%; box-sizing: border-box;"><img src="${j.src}" alt="${alt}" style="display: block; width: 100%; height: 100%; object-fit: contain; ${IMG_RESET}" /></div></div>`;
}

// One side. words = the combination line ["Royal", "Royal", "Sol"] (the old card's
// own wording wins; nfl-tracker-card.py's NAMES map is the fallback). hexes =
// helmet, jersey, pants. status = "Confirmed" / "Projected" before kickoff, "" after.
export function nflSide({ src, alt, label, words, hexes, status = "" }) {
  const statusHtml = status
    ? `<p data-status style="color:#ffffff;font-size:8.5px;line-height:1.3;letter-spacing:1.6px;text-align:center;text-transform:uppercase;opacity:.55;margin:4px 0 0;font-weight:700;">${status}</p>`
    : "";
  return `    <div style="min-width: 0; display: flex; flex-direction: column; align-items: center;">${jerseyBox(src, alt)}` +
    `<p data-label style="color:#ffffff;font-family:${DISPLAY};font-size:clamp(12px, 2.6vw, 14px);line-height:1.15;letter-spacing:.6px;text-align:center;text-transform:uppercase;margin:6px 0 0;font-weight:900;">${label}</p>` +
    `<p data-uni style="color:#ffffff;font-size:10px;line-height:1.35;letter-spacing:1.2px;text-align:center;text-transform:uppercase;opacity:.85;margin:4px 0 0;font-weight:600;">${words.join(" &middot; ")}</p>` +
    statusHtml + darkRow(hexes) + `</div>`;
}

// Compact grade chip: the old NFL card's grade regex (letter-spacing:-.5px;">X<) still reads it.
function nflChip(grade) {
  return grade
    ? `<span data-grade="${grade}" style="background:linear-gradient(160deg, #2f6bed 0%, #1d4fc4 100%);color:#ffffff;font-family:${DISPLAY};font-size:clamp(17px, 4.4vw, 22px);font-weight:900;line-height:1;padding:7px 10px;min-width:44px;text-align:center;border-radius:8px;box-shadow:0 2px 10px rgba(47,107,237,0.35);letter-spacing:-.5px;">${grade}</span>`
    : `<span data-grade="" style="background:rgba(255,255,255,0.08);border:1px dashed rgba(255,255,255,0.35);color:rgba(255,255,255,0.7);font-family:${DISPLAY};font-size:clamp(17px, 4.4vw, 22px);font-weight:800;line-height:1;padding:6px 9px;min-width:44px;text-align:center;border-radius:8px;box-sizing:border-box;letter-spacing:-.5px;">&ndash;</span>`;
}

// week = 5, windowLabel = "Monday Night Football". score = "Bills 37, Rams 34 (OT)"
// (winner first, the old pill text) for the hidden compat pill; awayScore/homeScore
// numbers drive the score bar. sub = second line under FINAL ("OT").
export function nflCardD5({ grade, week, windowLabel, awayName, homeName, away, home, awayScore, homeScore, score, sub }) {
  const caption = `<span style="display: block; color: #ffffff; font-size: clamp(10px, 2.6vw, 11.5px); letter-spacing: 1.4px;">Week ${week}</span><span style="display: block; color: rgba(255,255,255,0.6); font-weight: 700; margin-top: 1px;">${windowLabel}</span>`;
  const done = typeof awayScore === "number" && typeof homeScore === "number";
  const pill = done ? `Final &middot; ${score}` : `Week ${week} &middot; ${windowLabel}`;
  const hidden = `\n  <span data-pill aria-hidden="true" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;letter-spacing:2px;display:inline-block;">${pill}</span>`;
  return cardShell({
    id: "nfl-d5",
    logo: NFL_LOGO,
    chip: nflChip(grade),
    caption,
    A: NFL_TEAM[nflKey(awayName)],
    H: NFL_TEAM[nflKey(homeName)],
    away,
    home,
    awayScore,
    homeScore,
    sub,
    hidden,
  });
}

// Every jersey in the library has a score-bar entry? (run: node scripts/nfl-card-d5.mjs --check)
if (process.argv[1]?.endsWith("nfl-card-d5.mjs") && process.argv.includes("--check")) {
  const dir = "public/images/posts/nfl-tracker-jerseys";
  const slugs = new Set(fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).map((f) => f.split("-")[0]));
  const missing = [...slugs].filter((s) => !NFL_TEAM[s]);
  console.log(`${Object.keys(NFL_TEAM).length} teams in NFL_TEAM; jersey slugs without an entry: ${missing.join(", ") || "none"}`);
}
