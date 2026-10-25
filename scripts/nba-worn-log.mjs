#!/usr/bin/env node
// NBA nightly worn-jersey pass. Pulls ESPN's NBA scoreboard for one date and
// writes the finals into scripts/data/nba-worn-2026-27.json, pre-filling each
// team's worn call = its announced edition with confirmed:false. The nightly
// pass then only has to confirm or override from photos.
//
// NIGHTLY STEPS (the morning after, for last night's ET date):
//   1. node scripts/nba-worn-log.mjs 20261025
//        adds every final for that date (score, OT), worn = announced, confirmed:false.
//        Existing entries keep their calls and confirmed flag; only the score is
//        refreshed. Add --dry to print without writing.
//   2. Check each game's photos (team X/IG game posts, nba.com team galleries,
//      ESPN highlights: the script prints each game's ESPN link). In the JSON:
//        - jersey matches the schedule: set "confirmed": true and a "source".
//        - jersey changed: set that side's "call" to what was worn (same spelling
//          as the announced file, e.g. "Association White"), optional "detail"
//          for a one-off qualifier, then "confirmed": true.
//   3. node scripts/gen-nba-schedule-tables.mjs
//        rewrites the 30 team schedule posts' tables (played rows: worn + score,
//        Changed when the call differs). /nba-tracker/<team> reads the same JSON
//        at build, so nothing else to run.
//
// Never set confirmed:true without having seen both jerseys.

import fs from "node:fs";

const FILE = "scripts/data/nba-worn-2026-27.json";
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const ymd = args.find((a) => /^\d{8}$/.test(a));
if (!ymd) {
  console.error("Usage: node scripts/nba-worn-log.mjs YYYYMMDD [--dry]");
  process.exit(1);
}
const iso = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;

// ESPN abbreviations -> the NBA tricodes used in the schedule snapshot.
const ESPN_TRI = { GS: "GSW", NY: "NYK", NO: "NOP", SA: "SAS", UTAH: "UTA", WSH: "WAS" };
const tri = (abbr) => ESPN_TRI[abbr] ?? abbr;

const announced = JSON.parse(fs.readFileSync("scripts/data/nba-announced-uniforms-2026-27.json", "utf8"));
const scheduled = new Set(
  fs.readFileSync("scripts/data/nba-schedule-2026-27.txt", "utf8").trim().split("\n").map((l) => l.trim()),
);
const log = JSON.parse(fs.readFileSync(FILE, "utf8"));

const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${ymd}`);
if (!res.ok) {
  console.error(`ESPN scoreboard ${res.status}`);
  process.exit(1);
}
const { events = [] } = await res.json();

let added = 0, updated = 0, pending = 0;
for (const ev of events) {
  const comp = ev.competitions?.[0];
  if (!comp) continue;
  const home = comp.competitors.find((c) => c.homeAway === "home");
  const away = comp.competitors.find((c) => c.homeAway === "away");
  const a = tri(away.team.abbreviation), h = tri(home.team.abbreviation);
  const key = `${iso} ${a}@${h}`;
  const link = `https://www.espn.com/nba/game/_/gameId/${ev.id}`;
  if (!comp.status?.type?.completed) {
    console.log(`… ${key}: not final (${comp.status?.type?.description ?? "?"})`);
    pending++;
    continue;
  }
  if (!scheduled.has(`${iso}|${a}|${h}`)) {
    console.warn(`⚠ ${key}: not in nba-schedule-2026-27.txt (preseason/Cup knockout/abbr?), skipped`);
    continue;
  }
  const score = { away: Number(away.score), home: Number(home.score) };
  const ot = (comp.status?.period ?? 4) > 4;
  const cur = log.games[key];
  if (cur) {
    cur.score = score;
    if (ot) cur.ot = true;
    updated++;
    console.log(`= ${key}: ${score.away}-${score.home}${ot ? " OT" : ""} (kept calls, confirmed=${Boolean(cur.confirmed)})  ${link}`);
    continue;
  }
  const entry = { score };
  if (ot) entry.ot = true;
  entry.away = { call: announced[a]?.games?.[iso] ?? "Icon Edition" };
  entry.home = { call: announced[h]?.games?.[iso] ?? "Association White" };
  entry.confirmed = false;
  entry.source = `ESPN scoreboard final; jerseys pre-filled from announced schedule (${link})`;
  log.games[key] = entry;
  added++;
  console.log(`+ ${key}: ${score.away}-${score.home}${ot ? " OT" : ""}  ${entry.away.call} @ ${entry.home.call}  ${link}`);
}

log.games = Object.fromEntries(Object.entries(log.games).sort(([x], [y]) => x.localeCompare(y)));
if (!dry && (added || updated)) fs.writeFileSync(FILE, JSON.stringify(log, null, 2) + "\n");
console.log(`${iso}: ${added} added, ${updated} refreshed, ${pending} not final${dry ? " (dry run, nothing written)" : ""}`);
if (added) console.log("Next: confirm each new game from photos (set confirmed:true), then node scripts/gen-nba-schedule-tables.mjs");
