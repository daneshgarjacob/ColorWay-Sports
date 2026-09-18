#!/usr/bin/env node
// Inserts the game-by-game jersey schedule into all 30 NBA team schedule posts,
// replacing the "Filling in from October 2026" placeholder box. Sibling of
// gen-nhl-schedule-tables.mjs.
//
//   node scripts/gen-nba-schedule-tables.mjs
//
// Source: scripts/data/nba-schedule-2026-27.txt — a snapshot of the NBA's own
// scheduleLeagueV2_1.json (cdn.nba.com blocks curl; the snapshot was pulled
// through a real browser). 80 games per team as published: every club's final
// two December dates wait on the NBA Cup knockout draw. Refresh the snapshot
// and re-run when the league slots them.
//
// Expected calls are the traditional defaults, NOT league rules (the NBA lets
// clubs dress from the full wardrobe game by game): Association white at home,
// Icon Edition on the road. The in-season pass flips rows to what was worn.
//
// When a club publishes its own uniform schedule, its calls go in
// scripts/data/nba-announced-uniforms-2026-27.json (keyed by tricode, dates
// ISO). Those rows read "Announced"; that club's rows it left off read
// "Not Yet Announced" instead of guessing a default.

import fs from "node:fs";

const TEAMS = {
  "76ers": "PHI", "bucks": "MIL", "bulls": "CHI", "cavaliers": "CLE", "celtics": "BOS",
  "clippers": "LAC", "grizzlies": "MEM", "hawks": "ATL", "hornets": "CHA", "knicks": "NYK",
  "lakers": "LAL", "mavericks": "DAL", "miami-heat": "MIA", "nets": "BKN", "nuggets": "DEN",
  "oklahoma-city-thunder": "OKC", "orlando-magic": "ORL", "pacers": "IND", "pelicans": "NOP",
  "pistons": "DET", "raptors": "TOR", "rockets": "HOU", "sacramento-kings": "SAC",
  "spurs": "SAS", "suns": "PHX", "timberwolves": "MIN", "trail-blazers": "POR",
  "utah-jazz": "UTA", "warriors": "GSW", "wizards": "WAS",
};
const NAME = {
  ATL: "Hawks", BOS: "Celtics", BKN: "Nets", CHA: "Hornets", CHI: "Bulls", CLE: "Cavaliers",
  DAL: "Mavericks", DEN: "Nuggets", DET: "Pistons", GSW: "Warriors", HOU: "Rockets",
  IND: "Pacers", LAC: "Clippers", LAL: "Lakers", MEM: "Grizzlies", MIA: "Heat", MIL: "Bucks",
  MIN: "Timberwolves", NOP: "Pelicans", NYK: "Knicks", OKC: "Thunder", ORL: "Magic",
  PHI: "76ers", PHX: "Suns", POR: "Trail Blazers", SAC: "Kings", SAS: "Spurs",
  TOR: "Raptors", UTA: "Jazz", WAS: "Wizards",
};
const SHORT = Object.fromEntries(Object.entries(TEAMS).map(([slug, tri]) => [tri, NAME[tri]]));

const MONTH_NAME = ["", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const MON_ABBR = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const games = fs.readFileSync("scripts/data/nba-schedule-2026-27.txt", "utf8")
  .trim().split("\n").map((l) => { const [d, a, h] = l.split("|"); return { d, a, h }; });

const ANNOUNCED = JSON.parse(fs.readFileSync("scripts/data/nba-announced-uniforms-2026-27.json", "utf8"));

const row = (dateTxt, ha, opp, call, status = "Expected") =>
  `<div style="display: flex; align-items: baseline; gap: 10px; padding: 7px 4px; border-bottom: 1px solid #eef0f4; font-size: 0.85em;"><span style="flex: 0 0 92px; color: #8892a0; font-weight: 700; font-size: 0.85em;">${dateTxt}</span><span style="flex: 1 1 auto; color: #14284b; font-weight: 700;">${ha} ${opp}</span><span style="flex: 0 0 auto; font-weight: 800; font-size: 0.85em; color: ${status === "TBA" ? "#8892a0" : "#14284b"};">${call}</span><span style="flex: 0 0 74px; text-align: right; color: ${status === "Announced" ? "#2f6bed" : "#8892a0"}; font-weight: 700; font-size: 0.85em;">${status}</span></div>`;

const monthHead = (name) =>
  `<p style="margin: 16px 0 4px; font-size: 0.72em; font-weight: 800; text-transform: uppercase; letter-spacing: 1.6px; color: #2f6bed;">${name}</p>`;

let done = 0;
for (const [slug, tri] of Object.entries(TEAMS)) {
  const path = `content/posts/${slug}-uniform-schedule-2026-27.md`;
  if (!fs.existsSync(path)) { console.error(`✗ ${slug}: no post`); process.exitCode = 1; continue; }

  const mine = games.filter((g) => g.a === tri || g.h === tri)
    .sort((x, y) => x.d.localeCompare(y.d));
  if (mine.length !== 80) { console.error(`✗ ${slug}: ${mine.length} games (expected 80)`); process.exitCode = 1; continue; }

  const ann = ANNOUNCED[tri];
  let body = "", lastMonth = "";
  for (const g of mine) {
    const [y, m, d] = g.d.split("-").map(Number);
    const monthLabel = `${MONTH_NAME[m]} ${y}`;
    if (monthLabel !== lastMonth) { body += monthHead(monthLabel); lastMonth = monthLabel; }
    const home = g.h === tri;
    const opp = SHORT[home ? g.a : g.h];
    const ha = home ? "vs" : "at";
    if (ann && ann.games[g.d]) body += row(`${MON_ABBR[m]} ${d}`, ha, opp, ann.games[g.d], "Announced");
    else if (ann) body += row(`${MON_ABBR[m]} ${d}`, ha, opp, "Not Yet Announced", "TBA");
    else body += row(`${MON_ABBR[m]} ${d}`, ha, opp, home ? "Association White" : "Icon Edition");
  }

  const short = NAME[tri];
  let note = `Expected calls are the traditional defaults, the Association white at home and the Icon color on the road, not league rules: the NBA lets clubs dress from the full wardrobe game by game, and Statement, City and Classic nights are slotted in as the ${short} announce them.`;
  if (ann) {
    const tally = {};
    for (const call of Object.values(ann.games)) tally[call] = (tally[call] || 0) + 1;
    const n = Object.keys(ann.games).length;
    const parts = Object.entries(tally).sort((x, y) => y[1] - x[1]).map(([call, c]) => `${c} ${call.replace(" White", "")}`);
    note = `Announced rows come from the ${short}' own uniform schedule, published ${ann.announced}: ${n} of ${mine.length} dated games, ${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}. The ${mine.length - n} rows marked TBA were left off it, and we fill them in as the ${short} name them.`;
  }
  const table = `<!-- nba-game-log:start -->
<div style="margin: 1.5em 0; background: #ffffff; border: 1px solid #e3e7ec; border-radius: 14px; padding: 8px 18px 14px;"><p style="margin: 10px 0 2px; font-size: 0.72em; font-weight: 800; text-transform: uppercase; letter-spacing: 1.6px; color: #5b6474;">The Game-by-Game Jersey Schedule</p>${body}<p style="font-size: 0.75em; color: #8892a0; margin: 12px 0 2px; line-height: 1.5;">${note} Every played row flips to the jersey actually worn, updated the morning after. Two December dates are still unscheduled league-wide, waiting on the NBA Cup knockout draw.</p></div>
<!-- nba-game-log:end -->`;

  let s = fs.readFileSync(path, "utf8");
  const boxRe = /<div style="margin: 1\.5em 0; padding: 1\.5em; background: #f5f7fa; border: 1px solid #e3e6ec; border-radius: 12px;">\s*\n<p[^>]*>Filling in from October 2026<\/p>\s*\n<p[^>]*>[^<]*<\/p>\s*\n<\/div>/;
  if (s.includes("<!-- nba-game-log:start -->")) {
    s = s.replace(/<!-- nba-game-log:start -->[\s\S]*?<!-- nba-game-log:end -->/, table);
  } else if (boxRe.test(s)) {
    s = s.replace(boxRe, table);
  } else {
    console.error(`✗ ${slug}: placeholder box not matched`); process.exitCode = 1; continue;
  }
  if (s === fs.readFileSync(path, "utf8")) continue;
  s = s.replace(/^updatedDate:\s*['"]?\d{4}-\d{2}-\d{2}['"]?\s*$/m, `updatedDate: "${new Date().toISOString().slice(0, 10)}"`);
  fs.writeFileSync(path, s);
  done++;
  console.log(`✓ ${slug}: 80 games (${mine.filter((g) => g.h === tri).length} home)`);
}
console.log(`${done}/30 posts updated`);
