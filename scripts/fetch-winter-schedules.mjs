// Pulls every NBA and NHL club's 2026-27 regular-season schedule from ESPN and
// writes it to content/data/winter-schedules.json, which the /nba-tracker and
// /nhl-tracker calendar pages read at build time.
//
// Fetched once and committed rather than called at build time: the schedule is
// fixed for the season, and a build that depends on a live third-party API is a
// build that fails when that API has a bad day.
//
// Re-run when the league publishes changes (postponements, flexed dates):
//   node scripts/fetch-winter-schedules.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(root, "content/data/winter-schedules.json");

const SEASON = 2027; // ESPN labels a season by the year it ends
const slugify = (s) => s.toLowerCase().replace(/\./g, "").replace(/\s+/g, "-");

const etDate = (iso) =>
  new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/New_York" });

// ESPN renamed the Utah club; our slug follows the club, not the old name.
const SLUG_FIX = { "utah-mammoth": "utah-mammoth" };

const json = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
};

async function nbaTeams() {
  // The /teams list endpoint pages at 13 and ignores ?limit, so walk the ids and
  // read the name back from each response rather than trusting a hardcoded map.
  const out = [];
  for (let id = 1; id <= 32; id++) {
    try {
      const d = await json(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${id}`);
      const t = d?.team;
      if (t?.displayName && !t.isAllStar) out.push({ id, name: t.displayName });
    } catch { /* id gaps are expected */ }
  }
  return out;
}

async function nhlTeams() {
  const d = await json("https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams?limit=50");
  return d.sports[0].leagues[0].teams.map((x) => ({ id: x.team.id, name: x.team.displayName }));
}

async function schedule(sportPath, teamId) {
  const d = await json(
    `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/teams/${teamId}/schedule?season=${SEASON}&seasontype=2`
  );
  return (d.events ?? [])
    .map((e) => {
      const c = e.competitions?.[0];
      if (!c) return null;
      const home = c.competitors.find((x) => x.homeAway === "home");
      const away = c.competitors.find((x) => x.homeAway === "away");
      if (!home || !away) return null;
      const isHome = String(home.team.id) === String(teamId);
      const opp = isHome ? away.team : home.team;
      return {
        // ESPN stamps kickoff in UTC, so a 10pm ET tip reads as the NEXT day if you
        // slice the string. Convert to Eastern first or every night game is a day late.
        d: etDate(e.date),
        o: opp.displayName,
        a: opp.abbreviation ?? "",
        h: isHome ? 1 : 0,
      };
    })
    .filter(Boolean)
    .sort((x, y) => (x.d < y.d ? -1 : 1));
}

const data = { season: "2026-27", fetched: new Date().toISOString().slice(0, 10), teams: {} };

for (const [league, sportPath, list] of [
  ["nba", "basketball/nba", await nbaTeams()],
  ["nhl", "hockey/nhl", await nhlTeams()],
]) {
  console.log(`${league.toUpperCase()}: ${list.length} clubs`);
  for (const t of list) {
    const slug = SLUG_FIX[slugify(t.name)] ?? slugify(t.name);
    try {
      const games = await schedule(sportPath, t.id);
      if (games.length === 0) { console.log(`  ${t.name.padEnd(26)}   skipped, no games (All-Star entry)`); continue; }
      data.teams[slug] = { name: t.name, league, games };
      console.log(`  ${t.name.padEnd(26)} ${String(games.length).padStart(3)} games`);
    } catch (e) {
      console.warn(`  ${t.name.padEnd(26)} FAILED: ${e.message}`);
    }
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(data));
const total = Object.values(data.teams).reduce((n, t) => n + t.games.length, 0);
console.log(`\nwrote ${OUT}: ${Object.keys(data.teams).length} clubs, ${total} games`);
