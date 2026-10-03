#!/usr/bin/env node
// Inserts the full 84-game sweater schedule into all 32 NHL team schedule posts,
// replacing the "Filling in from October 2026" placeholder box. Rows carry the
// league-default expected call (dark at home, white on the road) and are wrapped
// in <!-- nhl-game-log:start/end --> markers so the in-season daily pass can flip
// played rows to the sweater actually worn.
//
//   node scripts/gen-nhl-schedule-tables.mjs
//
// DAILY PASS (in season):
//   1. node scripts/nhl-game-photos.mjs <YYYYMMDD>   -> downloads ESPN game frames to view
//   2. add one entry per verified game to scripts/data/nhl-game-log-2026-27.json
//      ("<date> <AWAY>@<HOME>": { "confirmed": true, ... } plus any non-default side)
//   3. node scripts/gen-nhl-schedule-tables.mjs       -> rewrites all 32 tables
//      (or `npm run nhl:daily`, which also runs scripts/nhl-tracker-day.mjs --all --write
//      to refresh the daily tracker post; /nhl-tracker/<team> reads the log at build)
// Overrides (thirds, specials, confirmed calls) live in the data file, never in the
// posts, so a re-run never loses them. Final scores come live from the NHL API.
// updatedDate is bumped to today (Pacific) only on posts whose table changed.
//
// Source: api-web.nhle.com/v1/club-schedule-season/<TRI>/20262027 (the NHL's own
// feed; ESPN's per-team endpoint drops games — see the ESPN gotchas note).

import fs from "node:fs";

const TEAMS = {
  "avalanche": { tri: "COL", short: "Avalanche" },
  "blackhawks": { tri: "CHI", short: "Blackhawks" },
  "blue-jackets": { tri: "CBJ", short: "Blue Jackets" },
  "blues": { tri: "STL", short: "Blues" },
  "bruins": { tri: "BOS", short: "Bruins" },
  "canadiens": { tri: "MTL", short: "Canadiens" },
  "canucks": { tri: "VAN", short: "Canucks" },
  "capitals": { tri: "WSH", short: "Capitals" },
  "devils": { tri: "NJD", short: "Devils" },
  "ducks": { tri: "ANA", short: "Ducks" },
  "flames": { tri: "CGY", short: "Flames" },
  "florida-panthers": { tri: "FLA", short: "Panthers" },
  "flyers": { tri: "PHI", short: "Flyers" },
  "golden-knights": { tri: "VGK", short: "Golden Knights" },
  "hurricanes": { tri: "CAR", short: "Hurricanes" },
  "islanders": { tri: "NYI", short: "Islanders" },
  "lightning": { tri: "TBL", short: "Lightning" },
  "los-angeles-kings": { tri: "LAK", short: "Kings" },
  "maple-leafs": { tri: "TOR", short: "Maple Leafs" },
  "minnesota-wild": { tri: "MIN", short: "Wild" },
  "new-york-rangers": { tri: "NYR", short: "Rangers" },
  "oilers": { tri: "EDM", short: "Oilers" },
  "penguins": { tri: "PIT", short: "Penguins" },
  "predators": { tri: "NSH", short: "Predators" },
  "red-wings": { tri: "DET", short: "Red Wings" },
  "sabres": { tri: "BUF", short: "Sabres" },
  "seattle-kraken": { tri: "SEA", short: "Kraken" },
  "senators": { tri: "OTT", short: "Senators" },
  "sharks": { tri: "SJS", short: "Sharks" },
  "stars": { tri: "DAL", short: "Stars" },
  "utah-mammoth": { tri: "UTA", short: "Mammoth" },
  "winnipeg-jets": { tri: "WPG", short: "Jets" },
};

const MONTH_NAME = ["", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const MON_ABBR = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const LOG = JSON.parse(fs.readFileSync(new URL("./data/nhl-game-log-2026-27.json", import.meta.url), "utf8")).games;
const TODAY = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());

// result = "W 3-2 OT" style text for a final, or "" for an unplayed game
const row = (dateTxt, ha, opp, call, color, confirmed, result) =>
  `<div style="display: flex; align-items: baseline; gap: 10px; padding: 7px 4px; border-bottom: 1px solid #eef0f4; font-size: 0.85em;"><span style="flex: 0 0 92px; color: #8892a0; font-weight: 700; font-size: 0.85em;">${dateTxt}</span><span style="flex: 1 1 auto; color: #14284b; font-weight: 700;">${ha} ${opp}${result ? ` <span style="color: #8892a0; font-weight: 700; font-size: 0.85em; white-space: nowrap;">${result}</span>` : ""}</span><span style="flex: 0 0 auto; font-weight: 800; font-size: 0.85em; color: ${color};">${call}</span><span style="flex: 0 0 74px; text-align: right; color: ${confirmed ? "#1a8f4c" : "#8892a0"}; font-weight: 700; font-size: 0.85em;">${confirmed ? "Confirmed" : "Expected"}</span></div>`;

const resultFor = (g, home) => {
  if (!["OFF", "FINAL"].includes(g.gameState)) return "";
  const us = home ? g.homeTeam.score : g.awayTeam.score;
  const them = home ? g.awayTeam.score : g.homeTeam.score;
  const extra = g.gameOutcome?.lastPeriodType && g.gameOutcome.lastPeriodType !== "REG" ? ` ${g.gameOutcome.lastPeriodType}` : "";
  return `${us > them ? "W" : "L"} ${us}-${them}${extra}`;
};

const monthHead = (name) =>
  `<p style="margin: 16px 0 4px; font-size: 0.72em; font-weight: 800; text-transform: uppercase; letter-spacing: 1.6px; color: #2f6bed;">${name}</p>`;

let done = 0;
for (const [slug, { tri, short }] of Object.entries(TEAMS)) {
  const path = `content/posts/${slug}-uniform-schedule-2026-27.md`;
  if (!fs.existsSync(path)) { console.error(`✗ ${slug}: no post at ${path}`); process.exitCode = 1; continue; }

  const data = await fetch(`https://api-web.nhle.com/v1/club-schedule-season/${tri}/20262027`).then(r => r.json());
  const games = (data.games ?? []).filter(g => g.gameType === 2)
    .sort((a, b) => a.gameDate.localeCompare(b.gameDate));
  if (games.length !== 84) { console.error(`✗ ${slug}: ${games.length} regular-season games (expected 84)`); process.exitCode = 1; continue; }

  let body = "", lastMonth = "";
  for (const g of games) {
    const [y, m, d] = g.gameDate.split("-").map(Number);
    const monthLabel = `${MONTH_NAME[m]} ${y}`;
    if (monthLabel !== lastMonth) { body += monthHead(monthLabel); lastMonth = monthLabel; }
    const home = g.homeTeam.abbrev === tri;
    const oppTeam = home ? g.awayTeam : g.homeTeam;
    const opp = oppTeam.commonName?.default ?? oppTeam.placeName?.default ?? oppTeam.abbrev;
    const entry = LOG[`${g.gameDate} ${g.awayTeam.abbrev}@${g.homeTeam.abbrev}`] ?? {};
    const side = (home ? entry.home : entry.away) ?? {};
    const call = side.call ?? (home ? "Home Dark" : "Road White");
    body += row(`${MON_ABBR[m]} ${d}`, home ? "vs" : "at", opp, call, side.color ?? "#14284b", !!entry.confirmed, resultFor(g, home));
  }

  const table = `<!-- nhl-game-log:start -->
<div style="margin: 1.5em 0; background: #ffffff; border: 1px solid #e3e7ec; border-radius: 14px; padding: 8px 18px 14px;"><p style="margin: 10px 0 2px; font-size: 0.72em; font-weight: 800; text-transform: uppercase; letter-spacing: 1.6px; color: #5b6474;">All 84 Games, Every Sweater</p>${body}<p style="font-size: 0.75em; color: #8892a0; margin: 12px 0 2px; line-height: 1.5;">Expected calls follow the league default: the dark sweater at home, the white on the road. Third jersey and Hometown Remix nights are added the moment the ${short} announce them. Played games show the final score, and Confirmed means we checked game photos and logged the sweater the ${short} actually wore, updated the morning after the game.</p></div>
<!-- nhl-game-log:end -->`;

  let s = fs.readFileSync(path, "utf8");
  const before = s;
  const boxRe = /<div style="margin: 1\.5em 0; padding: 1\.5em; background: #f5f7fa; border: 1px solid #e3e6ec; border-radius: 12px;">\s*\n<p[^>]*>Filling in from October 2026<\/p>\s*\n<p[^>]*>[^<]*<\/p>\s*\n<\/div>/;
  if (s.includes("<!-- nhl-game-log:start -->")) {
    s = s.replace(/<!-- nhl-game-log:start -->[\s\S]*?<!-- nhl-game-log:end -->/, table);
  } else if (boxRe.test(s)) {
    s = s.replace(boxRe, table);
  } else {
    console.error(`✗ ${slug}: placeholder box not matched`); process.exitCode = 1; continue;
  }
  if (s === before) { console.log(`· ${slug}: unchanged`); continue; }
  s = s.replace(/^updatedDate:\s*['"]?\d{4}-\d{2}-\d{2}['"]?\s*$/m, `updatedDate: "${TODAY}"`);
  fs.writeFileSync(path, s);
  done++;
  console.log(`✓ ${slug}: 84 games (${games.filter(g => g.homeTeam.abbrev === tri).length} home)`);
}
console.log(`${done}/32 posts updated (updatedDate ${TODAY})`);
