// Backfills the score on any game card in the MLB daily tracker that still
// carries a bare "Final" pill.
//
// Why this exists: we ship a day as soon as the uniforms are confirmed, often
// while games are still being played, and those cards get a bare Final pill
// meant to be patched later. On 2026-08-27 an audit found 411 unpatched cards
// across 32 days — most of the tracker's history, including the day before.
//
// Matches each card to its game by the "### Away at Home" heading plus the day
// heading's date, then writes "Final &middot; Winner N, Loser N" (winner first,
// the convention every patched pill already uses).
//
// Never regenerates a day block, so awards are untouched.
//
//   node scripts/mlb-backfill-scores.mjs --dry     # report only
//   node scripts/mlb-backfill-scores.mjs           # write
import { readFileSync, writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry");
const FILE = "content/posts/mlb-uniform-tracker-2026.md";
const MONTHS = {January:1,February:2,March:3,April:4,May:5,June:6,July:7,August:8,September:9,October:10,November:11,December:12};

let md = readFileSync(FILE, "utf8");

const dayRe = /^## ([A-Z][a-z]+day), ([A-Z][a-z]+) (\d{1,2})\s*$/gm;
const days = [];
let m;
while ((m = dayRe.exec(md)) !== null) {
  days.push({ label: `${m[1]}, ${m[2]} ${m[3]}`, month: MONTHS[m[2]], day: +m[3], start: m.index });
}
for (let i = 0; i < days.length; i++) days[i].end = i + 1 < days.length ? days[i + 1].start : md.length;

const cache = new Map();
async function slate(date) {
  if (cache.has(date)) return cache.get(date);
  const r = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}`);
  const j = await r.json();
  const games = [];
  for (const d of j.dates ?? [])
    for (const g of d.games ?? [])
      games.push({
        away: g.teams.away.team.name, home: g.teams.home.team.name,
        as: g.teams.away.score, hs: g.teams.home.score,
        state: g.status.detailedState,
      });
  cache.set(date, games);
  return games;
}

const BARE = /(letter-spacing: 2px; display: inline-block;">)Final(<\/span>)/;
// Must be IDEMPOTENT: it is applied to full API names ("Toronto Blue Jays")
// and to already-short heading names ("Blue Jays") alike. A naive last-word
// split turns the short form into "Jays" and breaks the match.
// A weather-shortened game is a completed game with a real score.
const FINAL_STATES = new Set(["Final", "Completed Early", "Game Over"]);
const MULTI = ["Red Sox", "White Sox", "Blue Jays"];
const short = (n) => {
  const s = n.trim();
  for (const mw of MULTI) if (s === mw || s.endsWith(` ${mw}`)) return mw;
  return s.split(" ").pop();
};
let patched = 0, skipped = 0;
const report = [];

// Walk newest-to-oldest so string offsets stay valid as we rewrite.
for (let i = days.length - 1; i >= 0; i--) {
  const d = days[i];
  const iso = `2026-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
  let sec = md.slice(d.start, d.end);
  if (!BARE.test(sec)) continue;

  const games = await slate(iso);
  const used = new Set();

  // Split the section into per-card chunks on the "### Away at Home" headings.
  const parts = sec.split(/(?=^### )/m);
  for (let pi = 0; pi < parts.length; pi++) {
    const hm = parts[pi].match(/^### (.+?) at (.+?)$/m);
    if (!hm || !BARE.test(parts[pi])) continue;
    const away = hm[1];
    // Doubleheaders carry a "(Game 1)" / "(Game 2)" suffix on the home name.
    // Strip it for matching and use the number to pick which of the day's two
    // meetings this card is.
    const dh = hm[2].match(/^(.*?)\s*\(Game (\d)\)$/);
    const home = dh ? dh[1] : hm[2];
    const gameNo = dh ? +dh[2] : null;

    // ⚠️ The tracker uses TWO heading conventions: recent days write full club
    // names ("Colorado Rockies at Washington Nationals"), older days write short
    // ones ("Angels at Orioles"). Normalise both sides to the short form before
    // matching, or 276 of 411 cards silently fail to find their game.
    const matches = games
      .map((g, gi) => ({ g, gi }))
      .filter(({ g }) => short(g.away) === short(away) && short(g.home) === short(home) &&
        FINAL_STATES.has(g.state) && typeof g.as === "number" && typeof g.hs === "number");
    const pick = gameNo ? matches[gameNo - 1] : matches.find(({ gi }) => !used.has(gi));
    const idx = pick && !used.has(pick.gi) ? pick.gi : -1;
    if (idx === -1) { skipped++; report.push(`  SKIP ${d.label}: ${away} at ${home} (no final match)`); continue; }
    used.add(idx);
    const g = games[idx];

    const [wN, wS, lN, lS] = g.as > g.hs
      ? [away, g.as, home, g.hs]
      : [home, g.hs, away, g.as];
    parts[pi] = parts[pi].replace(BARE, `$1Final &middot; ${short(wN)} ${wS}, ${short(lN)} ${lS}$2`);
    patched++;
  }
  sec = parts.join("");
  md = md.slice(0, d.start) + sec + md.slice(d.end);
}

console.log(report.join("\n"));
console.log(`\n${DRY ? "[dry run] would patch" : "patched"} ${patched} pills, skipped ${skipped}`);

if (!DRY) {
  // Safety: day headings must keep their blank line, or a day gets swallowed.
  for (const mm of md.matchAll(/^## ([A-Z][a-z]+day, [A-Z][a-z]+ \d{1,2})\s*$/gm)) {
    if (mm.index > 2 && md.slice(mm.index - 2, mm.index) !== "\n\n")
      throw new Error(`missing blank line before ${mm[1]}`);
  }
  writeFileSync(FILE, md);
  console.log("written");
}
