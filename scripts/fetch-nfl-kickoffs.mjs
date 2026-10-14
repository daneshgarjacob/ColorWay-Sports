// Writes content/data/nfl-kickoffs-2026.json: every 2026 NFL regular-season
// game with its exact kickoff time, from ESPN's week scoreboard.
//
// Why: the 32 team schedule grids only carry the week, not the day or kickoff,
// so the game-day titles on the schedule posts ("What Are the Packers Wearing
// Today?", lib/gameDayTitle.ts) need a real date to know when "today" is.
//
// Source is the WEEK SCOREBOARD (?seasontype=2&week=N), not the per-team
// schedule endpoint, which silently drops games (see the ESPN feed gotchas
// memory). `kickoff` is stored as UTC and converted to Eastern by the reader,
// never sliced: a 8:15pm ET kickoff is stamped the next UTC day.
//
// Re-run when the league flexes a game or sets late-season Saturday dates:
//   node scripts/fetch-nfl-kickoffs.mjs
import { writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "content", "data", "nfl-kickoffs-2026.json");
const URL = (w) =>
  `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026&seasontype=2&week=${w}`;

const games = [];
for (let week = 1; week <= 18; week++) {
  const res = await fetch(URL(week));
  if (!res.ok) throw new Error(`Week ${week}: HTTP ${res.status}`);
  const j = await res.json();
  for (const e of j.events ?? []) {
    const c = e.competitions[0];
    const home = c.competitors.find((t) => t.homeAway === "home");
    const away = c.competitors.find((t) => t.homeAway === "away");
    games.push({
      week,
      away: away.team.shortDisplayName,
      home: home.team.shortDisplayName,
      kickoff: e.date,
      // False when ESPN only has a placeholder time (late-season TBD dates).
      timeSet: c.timeValid !== false,
      venue: c.venue?.fullName ?? "",
      neutral: Boolean(c.neutralSite),
    });
  }
}

// Sanity check: 17 games per club.
const perTeam = new Map();
for (const g of games) for (const t of [g.away, g.home]) perTeam.set(t, (perTeam.get(t) ?? 0) + 1);
const odd = [...perTeam].filter(([, n]) => n !== 17);
if (perTeam.size !== 32 || odd.length) {
  throw new Error(`Unexpected schedule shape: ${perTeam.size} clubs, off counts ${JSON.stringify(odd)}`);
}

writeFileSync(
  OUT,
  JSON.stringify({ source: "ESPN week scoreboard", fetched: new Date().toISOString(), games }, null, 1) + "\n",
);
console.log(`Wrote ${games.length} games to ${OUT}`);
