#!/usr/bin/env node
// Did our roof call actually happen? Scores the "Expected" OPEN/CLOSED calls in
// scripts/roof-status-day.mjs against what the ballpark really did.
//
//   node scripts/roof-verify.mjs YYYY-MM-DD
//
// ⭐ THE SOURCE (found 2026-08-28): statsapi's per-game live feed carries
// `gameData.weather`, and for a retractable-roof park it is an unambiguous roof
// indicator once the game is underway:
//   roof OPEN   -> a real reading: "Clear 77F 19 mph, R To L"
//   roof CLOSED -> "Roof Closed", 0 mph, None
//   fixed dome  -> "Dome", 0 mph, None   (Tampa Bay; never a decision)
// Verified against Toronto 8/25-8/27 (open all three, real wind each time) and
// Arizona + Miami 8/25-8/26 (Roof Closed both days), which matches the
// documented tendency of all four clubs.
//
// ⚠️ PRE-GAME IS NOT TRUSTWORTHY. Before first pitch the roofed parks all report
// the same indoor placeholder (72F / 0 mph), so a pre-game "Roof Closed" may be
// a default rather than a decision. This script therefore only scores games that
// are actually In Progress or Final, and says so for anything earlier.
//
// The roof posts promise "Expected - final call about 90 minutes before first
// pitch". This closes that loop: run it the next morning to see whether the
// forecast heuristic in roof-status-day.mjs is any good.
import fs from "node:fs";

const date = process.argv[2];
if (!date) { console.error("usage: roof-verify.mjs YYYY-MM-DD"); process.exit(1); }

// slug -> the club whose home park it is
const ROOFED = {
  "Arizona Diamondbacks": "chase-field-retractable-roof-diamondbacks",
  "Houston Astros": "daikin-park-roof-open-astros-2026",
  "Texas Rangers": "rangers-roof-open-globe-life-field-2026",
  "Seattle Mariners": "tmobile-park-roof-open-mariners-2026",
  "Milwaukee Brewers": "american-family-field-roof-open-brewers-2026",
  "Toronto Blue Jays": "rogers-centre-roof-open-blue-jays-2026",
  "Miami Marlins": "loandepot-park-roof-open-marlins-2026",
};

const sched = await (await fetch(
  `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}`
)).json();

const rows = [];
for (const d of sched.dates ?? []) {
  for (const g of d.games) {
    const home = g.teams.home.team.name;
    if (!ROOFED[home]) continue;
    rows.push({ home, pk: g.gamePk, state: g.status.detailedState });
  }
}

if (!rows.length) { console.log(`no roofed-venue home games on ${date}`); process.exit(0); }

// What did the post claim, and FOR WHICH DAY? The roof blocks are rewritten
// every morning and only ever hold the current day, so scoring them against an
// older date compares today's status to a past game and reports nonsense
// mismatches. The block always prints its own date (that is the deliberate
// staleness safeguard), so read it and refuse to score a day it does not match.
const LONG_DATE = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
  timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric",
});

function claimed(slug) {
  const md = fs.readFileSync(`content/posts/${slug}.md`, "utf8");
  const postDate = md.match(/Today's Roof Status<\/span>\s*<span[^>]*>([^<]+)<\/span>/)?.[1]?.trim();
  const m = md.match(/line-height: 1;">([A-Z ]+)<\/div>/);
  return { call: m ? m[1].trim() : "?", postDate };
}

let scored = 0, right = 0;
for (const r of rows) {
  const feed = await (await fetch(
    `https://statsapi.mlb.com/api/v1.1/game/${r.pk}/feed/live`
  )).json();
  const w = feed.gameData?.weather ?? {};
  const cond = w.condition ?? "";
  const live = r.state === "Final" || r.state === "In Progress" || r.state === "Game Over";

  // Refinement found 8/28: the field flips from the placeholder to the REAL
  // call once the ballpark decides, ~90 min before first pitch - Toronto went
  // from "Roof Closed 72F/0mph" to "Clear 69F, 8 mph, Out To RF" while still
  // Pre-Game. So a pre-game reading with real wind confirms OPEN early. The
  // asymmetry matters: a pre-game "Roof Closed" is UNDECIDABLE, because the
  // placeholder is byte-identical to a genuine early closed call.
  const placeholder = /roof closed|dome/i.test(cond) && /^0 mph/.test(w.wind ?? "");
  const actual =
    /dome/i.test(cond) && live ? "DOME"
    : live ? (/roof closed/i.test(cond) ? "CLOSED" : "OPEN")
    : !placeholder && cond ? "OPEN"      // pre-game, real conditions -> decided
    : "TOO EARLY";

  const { call, postDate } = claimed(ROOFED[r.home]);
  const stale = postDate && postDate !== LONG_DATE;
  let verdict = "";
  if (stale) {
    verdict = `post is on ${postDate}, not ${LONG_DATE} - only the current day is scoreable`;
  } else if (actual === "TOO EARLY") {
    verdict = "not yet - pre-game reports a 72F/0mph placeholder, re-run after first pitch";
  } else if (actual === "DOME") {
    verdict = "fixed dome, no call to make";
  } else {
    scored++;
    if (call === actual + " ROOF" || call === actual) { right++; verdict = "CORRECT"; }
    else verdict = `WRONG - post says ${call}`;
  }

  console.log(
    `${r.home.padEnd(22)} said ${call.padEnd(12)} actual ${actual.padEnd(10)} ` +
    `${cond ? `[${cond}, ${w.temp}F, ${w.wind}]`.padEnd(42) : "".padEnd(42)} ${verdict}`
  );
}

if (scored) console.log(`\n${right}/${scored} correct on ${date}`);
else console.log(`\nnothing scoreable yet on ${date}`);
