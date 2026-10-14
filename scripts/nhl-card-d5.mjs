// "Direction 5" NHL matchup card: the MLB design Jake approved 10/12
// (scripts/mlb-card-d5.mjs) with the NHL shield top-left and NHL score-bar colors.
// LIVE since 10/13 (Jake approved the mock): scripts/nhl-tracker-day.mjs emits this
// card for every NEW day. Day sections already published in the old black card keep it.
//
// Reused from MLB as-is: sideD5 (cutout on the spotlight, or the original on a light
// tile when there is no good -cut.webp, via pickJersey + jersey-cutout-skips.json),
// scoreSpan (score cells), the card shell, chip and score bar styles.
//
// Parsing hooks (same as the MLB d5 card, so build-wear-log.mjs's D5 regexes read it):
//   <img src="/images/posts/nhl-daily-tracker/..." alt="... sweater worn ...">  src FIRST, alt SECOND
//   data-label>TEAM</div>   then   <span ... background: #hex; ... vertical-align: middle;"></span><span data-uni ...>Call</span>
//   data-grade="B+" (empty = pending)  data-status>Final<  data-score="away|home">N or &ndash;<
// Nothing in lib/ parses the NHL tracker cards today (lib/winterTrackerIndex.ts reads
// scripts/data/nhl-game-log-2026-27.json and the tile folder, not the post), and
// scripts/build-wear-log.mjs does not read the NHL tracker.
//
// Rules: inline styles only. No <p> inside the card. Every <img> resets .prose img.
// Status is always "Final" (never "Live"); OT / SO go on the second line.

import { sideD5, scoreSpan } from "./mlb-card-d5.mjs";

const DISPLAY = "var(--font-display, 'Hanken Grotesk', Inter, sans-serif)";
export const IMG_RESET = "max-width: 100%; margin: 0; border-radius: 0; box-shadow: none;";

// Score-bar colors for all 32 clubs, keyed by NHL tricode (the game log's keys).
// top/bot = vertical gradient of the team block. Navy/black primaries use a LIGHTER
// shade so the block separates from the navy card; gold/yellow primaries (Predators)
// use their navy so the white abbreviation stays readable. accent = outside edge stripe.
export const NHL_TEAM = {
  ANA: { abbr: "ANA", top: "#F47A38", bot: "#c75a1f", accent: "#ffffff" },
  BOS: { abbr: "BOS", top: "#4a4a4f", bot: "#333336", accent: "#FFB81C" },
  BUF: { abbr: "BUF", top: "#1f4fa8", bot: "#003087", accent: "#FFB81C" },
  CGY: { abbr: "CGY", top: "#C8102E", bot: "#940a20", accent: "#F1BE48" },
  CAR: { abbr: "CAR", top: "#CE1126", bot: "#990b1b", accent: "#ffffff" },
  CHI: { abbr: "CHI", top: "#CF0A2C", bot: "#9a0620", accent: "#ffffff" },
  COL: { abbr: "COL", top: "#7d2c45", bot: "#5c1f32", accent: "#6CACE4" },
  CBJ: { abbr: "CBJ", top: "#1f4a85", bot: "#163a6a", accent: "#CE1126" },
  DAL: { abbr: "DAL", top: "#0a7a55", bot: "#00573c", accent: "#C4CED4" },
  DET: { abbr: "DET", top: "#CE1126", bot: "#990b1b", accent: "#ffffff" },
  EDM: { abbr: "EDM", top: "#1f4a85", bot: "#163a6a", accent: "#FF4C00" },
  FLA: { abbr: "FLA", top: "#C8102E", bot: "#940a20", accent: "#B9975B" },
  LAK: { abbr: "LAK", top: "#4a4a4f", bot: "#333336", accent: "#A2AAAD" },
  MIN: { abbr: "MIN", top: "#1e6048", bot: "#154734", accent: "#EAAA00" },
  MTL: { abbr: "MTL", top: "#AF1E2D", bot: "#82141f", accent: "#ffffff" },
  NSH: { abbr: "NSH", top: "#1f3f6e", bot: "#132b4f", accent: "#FFB81C" },
  NJD: { abbr: "NJD", top: "#CE1126", bot: "#990b1b", accent: "#ffffff" },
  NYI: { abbr: "NYI", top: "#1a62a8", bot: "#00468a", accent: "#F47D30" },
  NYR: { abbr: "NYR", top: "#1d4fb8", bot: "#00308f", accent: "#CE1126" },
  OTT: { abbr: "OTT", top: "#C8102E", bot: "#940a20", accent: "#C69214" },
  PHI: { abbr: "PHI", top: "#F74902", bot: "#c43a00", accent: "#ffffff" },
  PIT: { abbr: "PIT", top: "#4a4740", bot: "#33312b", accent: "#FCB514" },
  SJS: { abbr: "SJS", top: "#007a83", bot: "#005a61", accent: "#EA7200" },
  SEA: { abbr: "SEA", top: "#2a5a70", bot: "#1c4152", accent: "#99D9D9" },
  STL: { abbr: "STL", top: "#1f4fa8", bot: "#002F87", accent: "#FCB514" },
  TBL: { abbr: "TBL", top: "#1f4a9a", bot: "#163a7a", accent: "#ffffff" },
  TOR: { abbr: "TOR", top: "#1f4a8f", bot: "#163a72", accent: "#ffffff" },
  UTA: { abbr: "UTA", top: "#3a3d42", bot: "#26282c", accent: "#6CACE4" },
  VAN: { abbr: "VAN", top: "#1f4a8f", bot: "#163a72", accent: "#00843D" },
  VGK: { abbr: "VGK", top: "#4a565f", bot: "#333F48", accent: "#B4975A" },
  WSH: { abbr: "WSH", top: "#C8102E", bot: "#940a20", accent: "#ffffff" },
  WPG: { abbr: "WPG", top: "#1f4a85", bot: "#163a6a", accent: "#AC162C" },
};

// The shield is black with a silver rim, so on the navy card it gets a thin light
// edge and a soft glow to stay visible.
export const NHL_LOGO = {
  src: "/logos/leagues/nhl.png", alt: "NHL logo", via: "via NHL", height: "clamp(32px, 8.5vw, 42px)",
  style: "filter: drop-shadow(0 0 0.6px rgba(255,255,255,0.95)) drop-shadow(0 0 8px rgba(160,190,255,0.35));",
};

function abbrSpan(abbr, align) {
  return `<span style="flex: 1; min-width: 0; padding: 0 clamp(6px, 2.4vw, 12px); color: #ffffff; font-family: ${DISPLAY}; font-size: clamp(13px, 3vw, 16px); font-weight: 900; letter-spacing: 1.4px; text-align: ${align};">${abbr}</span>`;
}

export function gradeChip(grade) {
  return grade
    ? `<span data-grade="${grade}" style="background: linear-gradient(160deg, #2f6bed 0%, #1d4fc4 100%); color: #ffffff; font-family: ${DISPLAY}; font-size: clamp(17px, 4.4vw, 22px); font-weight: 900; line-height: 1; padding: 7px 10px; min-width: 44px; text-align: center; border-radius: 8px; letter-spacing: -0.5px; box-shadow: 0 2px 10px rgba(47,107,237,0.35);">${grade}</span>`
    : `<span data-grade="" style="background: rgba(255,255,255,0.08); border: 1px dashed rgba(255,255,255,0.35); color: rgba(255,255,255,0.7); font-family: ${DISPLAY}; font-size: clamp(17px, 4.4vw, 22px); font-weight: 800; line-height: 1; padding: 6px 9px; min-width: 44px; text-align: center; border-radius: 8px; box-sizing: border-box;">&ndash;</span>`;
}

// The card shell shared by the NHL and NFL d5 cards (same markup as MLB's cardD5,
// with the league table, logo, chip, a header caption and extra hidden hooks as inputs).
//   A, H        score-bar entries ({abbr, top, bot, accent})
//   away, home  side HTML
//   logo        { src, alt, via, height?, style? }
//   sub         second line under the status ("OT", "SO"...)
//   status      score-bar center word: "Final" (default) once played; a preview card
//               passes its kickoff ("Thu 5:15 PT") instead. Never "Live".
//   caption     small text next to the logo (optional)
//   chip        grade chip HTML (default gradeChip(grade))
//   hidden      extra machine-readable markup appended inside the card (optional)
export function cardShell({ id, logo, grade, chip, caption, A, H, away, home, awayScore, homeScore, sub, status = "Final", hidden = "" }) {
  const done = typeof awayScore === "number" && typeof homeScore === "number";
  const aWon = done && awayScore > homeScore, hWon = done && homeScore > awayScore;
  const subHtml = sub ? `<span style="color: rgba(255,255,255,0.6); font-size: 8.5px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; margin-top: 2px; white-space: nowrap;">${sub}</span>` : "";
  const capHtml = caption ? `<span style="color: rgba(255,255,255,0.78); font-size: clamp(8px, 2.2vw, 9.5px); font-weight: 800; letter-spacing: 1.6px; text-transform: uppercase; line-height: 1.25;">${caption}</span>` : "";
  return `<div style="margin: 1.4em 0 0.6em;">
<div data-card="${id}" style="position: relative; background: radial-gradient(120% 90% at 100% 0%, rgba(47,107,237,0.38) 0%, rgba(47,107,237,0) 55%), linear-gradient(160deg, #142a52 0%, #0b1a2f 55%, #08121f 100%); border-radius: 16px; padding: clamp(12px, 3.5vw, 20px); box-shadow: 0 1px 2px rgba(8,18,31,0.10), 0 10px 28px rgba(8,18,31,0.18);">
  <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 10px; margin: 0 0 4px;">
    <div style="min-width: 0; flex: 0 1 auto; display: flex; align-items: center; gap: 10px;"><img src="${logo.src}" alt="${logo.alt}" title="${logo.via}" style="display: block; height: ${logo.height ?? "clamp(26px, 7vw, 36px)"}; width: auto; ${IMG_RESET} ${logo.style ?? ""}" />${capHtml}</div>
    <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-left: auto;">
      <span style="color: rgba(255,255,255,0.78); font-size: clamp(8px, 2.2vw, 9.5px); font-weight: 800; letter-spacing: 1.6px; text-transform: uppercase; line-height: 1.25; text-align: right;">Matchup<br>Grade</span>
      ${chip ?? gradeChip(grade)}
    </div>
  </div>
  <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(4px, 2vw, 12px);">
${away}
${home}
  </div>
  <div style="margin: clamp(12px, 3vw, 16px) 0 0; display: grid; grid-template-columns: minmax(0,1fr) auto minmax(0,1fr); align-items: stretch; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.14); box-shadow: 0 4px 14px rgba(0,0,0,0.30);">
    <div style="display: flex; align-items: center; min-height: 42px; min-width: 0; background: linear-gradient(180deg, ${A.top} 0%, ${A.bot} 100%); border-left: 4px solid ${A.accent};">${abbrSpan(A.abbr, "left")}${scoreSpan("away", done ? awayScore : null, aWon)}</div>
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 clamp(6px, 2.4vw, 14px); background: #050c17;"><span data-status style="color: #ffffff; font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; white-space: nowrap;">${status}</span>${subHtml}</div>
    <div style="display: flex; align-items: center; min-height: 42px; min-width: 0; background: linear-gradient(180deg, ${H.top} 0%, ${H.bot} 100%); border-right: 4px solid ${H.accent};">${scoreSpan("home", done ? homeScore : null, hWon)}${abbrSpan(H.abbr, "right")}</div>
  </div>${hidden}
</div>
</div>`;
}

// One side of an NHL card. info = { name, short, call, swatch, image } (the same
// fields nhl-tracker-day.mjs's sideInfo works out from the log), opp = opponent short name.
export function nhlSide(info, oppShort, dateWords) {
  return sideD5({
    src: info.image,
    alt: `${info.name} ${info.call} sweater worn ${dateWords} against the ${oppShort}, from the NHL daily uniform tracker`,
    label: info.short.toUpperCase(),
    swatch: info.swatch,
    uniform: info.call,
  });
}

// lastPeriod = gameOutcome.lastPeriodType from api-web.nhle.com ("REG" | "OT" | "SO").
export function nhlCardD5({ grade, awayTri, homeTri, away, home, awayScore, homeScore, lastPeriod }) {
  return cardShell({
    id: "nhl-d5",
    logo: NHL_LOGO,
    grade,
    A: NHL_TEAM[awayTri],
    H: NHL_TEAM[homeTri],
    away,
    home,
    awayScore,
    homeScore,
    sub: lastPeriod && lastPeriod !== "REG" ? lastPeriod : "",
  });
}
