#!/usr/bin/env node
// Builds content/data/uniform-records-2026.json: every NFL team's win-loss record
// in each helmet / jersey / pants combination it has actually worn this season.
//
//   node scripts/build-uniform-records.mjs            # use cached scores, fetch only weeks not final yet
//   node scripts/build-uniform-records.mjs --refresh  # re-fetch every week's scores from ESPN
//
// Sources, in order of trust:
//   1. The NFL uniform tracker (content/posts/nfl-uniform-tracker-2026.md), read
//      through lib/nflTrackerCards.ts. Only cards whose pill reads "Final" count:
//      those are logged from game photos. Projected / "expected" looks never count.
//   2. WORN_WITHOUT_CARD below: games the tracker logs in its prose (from game
//      photos) but that never got a card. Each entry names the tracker section.
//   3. Final scores from ESPN's public scoreboard, fetched HERE and cached in
//      content/data/nfl-scores-2026.json. The site build never calls the network.
//      The tracker's own score is cross-checked against ESPN; a mismatch is printed.
//
// Guard: the script exits non-zero if any team's combo games don't add up to the
// games we counted, if counted + unlogged games don't equal the team's ESPN games
// played, or if a tracker "Final" can't be matched to an ESPN final.
//
// It also writes content/data/nba-uniform-records-2026-27.json (NBA section at the
// bottom: confirmed rows of scripts/data/nba-worn-2026-27.json, record by jersey).
//
// And content/data/nhl-uniform-records-2026-27.json (NHL section at the very
// bottom: confirmed rows of scripts/data/nhl-game-log-2026-27.json, record by
// jersey, W-L-OTL, finals from ESPN cached in content/data/nhl-scores-2026-27.json).
//
// Run after logging a week's NFL finals or a night's NBA / NHL pass, then commit
// the JSON files (the three records files and both score caches).

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

// lib/nflTrackerCards.ts is TypeScript; Node 22 reads it with type stripping on.
if (!process.execArgv.includes("--experimental-strip-types") && !process.features?.typescript) {
  const r = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--no-warnings", ...process.execArgv, fileURLToPath(import.meta.url), ...process.argv.slice(2)],
    { stdio: "inherit" },
  );
  process.exit(r.status ?? 1);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(ROOT);
const { nflTrackerCards } = await import(pathToFileURL(path.join(ROOT, "lib/nflTrackerCards.ts")).href);

const SEASON = 2026;
const SCORES_FILE = "content/data/nfl-scores-2026.json";
const OUT_FILE = "content/data/uniform-records-2026.json";
const TRACKER = "/stories/nfl-uniform-tracker-2026";
const REFRESH = process.argv.includes("--refresh");

// ---------------------------------------------------------------------------
// Official jersey names the site already uses, keyed by the tracker card's jersey
// photo (public/images/posts/nfl-tracker-jerseys/<key>.jpg). Each is checked
// against the tracker's own write-up of that game. Anything not listed shows the
// card's plain jersey color ("Honolulu Blue", "White"), which is what readers know.
const JERSEY_NAMES = {
  "lions-silver-rivalries": "Rivalries Silver",
  "cardinals-natural-rivalries": "Rivalries Sand",
  "colts-anthracite-rivalries": "Rivalries Anthracite",
  "packers-green-rivalries": "Rivalries Hunter Green",
  "jaguars-natural-rivalries": "Bold City Alabaster",
  "bills-nickel-city-gray": "Nickel City Gray",
  "browns-alpha-dawg": "Alpha Dawg Brown",
  "ravens-purple-rising": "Purple Rising",
  "giants-royal-legacy-alternate": "Legacy Blue Throwback",
  "giants-vintage-white-alternate": "Vintage White",
  "chargers-navy-super-chargers": "Super Chargers Navy",
  "cowboys-white-alternate": "Arctic White Color Rush",
  "panthers-blue-alternate": "Panther Blue",
  "broncos-navy-alternate": "Midnight Navy",
  "eagles-kelly-green-alternate": "Kelly Green",
  "jaguars-teal-prowler-throwback": "Prowler Teal Throwback",
  "seahawks-royal-throwback": "Royal Blue Throwback",
  "patriots-red-throwback": "Pat Patriot Red Throwback",
  "saints-white-alternate": "White Alternate",
  "texans-red-battle": "Battle Red",
  "falcons-black-throwback": "1966 Black Throwback",
  "jets-white-classic-alternate": "Classic White",
  "broncos-mile-high-orange": "Orange Crush Throwback",
  "broncos-orange-home": "Sunset Orange",
  "broncos-white-road": "Summit White",
  "vikings-purple-classic": "Classic Purple Throwback",
};
// Photos that show the same jersey as another photo: count them as one jersey.
const JERSEY_ALIASES = {
  "49ers-white-80th": "49ers-white-road", // the regular white with the 80th season patch
  "cowboys-white": "cowboys-white-home", // Week 10 card has no photo; prose: white jersey, royal blue numbers
};
// Cards without a jersey photo: [team, card jersey word] -> name.
const WORD_NAMES = {
  "San Francisco 49ers|Red 1994": "1994 Red Throwback",
};

// Games the tracker logs from game photos in its prose but never drew a card for.
// Words copied from that section of content/posts/nfl-uniform-tracker-2026.md.
const WORN_WITHOUT_CARD = [
  {
    week: 10,
    away: "Jacksonville Jaguars",
    home: "Tennessee Titans",
    // "Jacksonville wore the black helmet, white jersey and black pants."
    awaySide: { helmet: "Black", jersey: "White", pants: "Black", jerseyKey: "jaguars-white-road", hexes: ["#101820", "#FFFFFF", "#101820"] },
    // "Tennessee debuted Music City, its Rivalries uniform: the Titans Blue helmet ... navy Music City jersey ... navy pants"
    homeSide: { helmet: "Titans Blue", jersey: "Navy", pants: "Navy", jerseyKey: "titans-music-city", name: "Music City Navy", hexes: ["#4B92DB", "#0C2340", "#0C2340"] },
  },
];

// ---------------------------------------------------------------------------
const nick = (full) => full.split(" ").slice(-1)[0];
const keyOf = (full) => nick(full).toLowerCase().replace(/[^a-z0-9]+/g, "-");
const titleWord = (s) => s.replace(/\b([a-z])/g, (c) => c.toUpperCase());
const etDate = (iso) =>
  new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/New_York" }); // YYYY-MM-DD

async function fetchWeek(week) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${week}&dates=${SEASON}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (uniform-records build script)" } });
  if (!res.ok) throw new Error(`ESPN week ${week}: HTTP ${res.status}`);
  const j = await res.json();
  return (j.events ?? []).map((e) => {
    const c = e.competitions[0];
    const side = (ha) => c.competitors.find((t) => t.homeAway === ha);
    const h = side("home");
    const a = side("away");
    return {
      id: e.id,
      week,
      date: etDate(e.date),
      kickoff: e.date,
      home: h.team.displayName,
      away: a.team.displayName,
      homeScore: Number(h.score),
      awayScore: Number(a.score),
      final: e.status?.type?.name === "STATUS_FINAL",
    };
  });
}

// ---------------------------------------------------------------------------
const cards = nflTrackerCards().filter((c) => c.final);
const throughWeek = Math.max(...cards.map((c) => c.week));

let cache = fs.existsSync(SCORES_FILE) ? JSON.parse(fs.readFileSync(SCORES_FILE, "utf8")) : { weeks: {} };
for (let w = 1; w <= throughWeek; w++) {
  const have = cache.weeks[w];
  if (REFRESH || !have || have.some((g) => !g.final)) {
    process.stdout.write(`fetching ESPN week ${w}... `);
    cache.weeks[w] = await fetchWeek(w);
    console.log(`${cache.weeks[w].length} games`);
  }
}
cache = {
  note: "Final scores from ESPN's public scoreboard, cached by scripts/build-uniform-records.mjs. The site build reads this file and never calls ESPN.",
  season: SEASON,
  fetched: new Date().toISOString().slice(0, 10),
  weeks: cache.weeks,
};
fs.writeFileSync(SCORES_FILE, JSON.stringify(cache, null, 1) + "\n");

const espnGames = Object.values(cache.weeks).flat().filter((g) => g.week <= throughWeek);
const findEspn = (week, away, home) =>
  espnGames.find((g) => g.week === week && ((g.away === away && g.home === home) || (g.away === home && g.home === away)));

// ---------------------------------------------------------------------------
// The jersey photo for a jersey key, only when that exact file exists.
const PHOTOS = JSON.parse(fs.readFileSync("content/data/nfl-tracker-jersey-files.json", "utf8"));
const photoFor = (key) => {
  const f = PHOTOS.find((p) => p.replace(/\.\w+$/, "") === key);
  return f ? `/images/posts/nfl-tracker-jerseys/${f}` : undefined;
};

// Every worn game, both sides.
const errors = [];
const warnings = [];
const logged = []; // { team, opp, home, week, espn, helmet, jersey, pants, jerseyKey, name, img }

function jerseyIdentity(team, side) {
  const [helmet, jersey, pants] = side.words.map((w) => titleWord(w.toLowerCase()));
  let jerseyKey = side.img ? side.img.split("/").pop().replace(/\.\w+$/, "") : `${keyOf(team)}-${jersey.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  jerseyKey = JERSEY_ALIASES[jerseyKey] ?? jerseyKey;
  const rawWord = side.words[1];
  const name = JERSEY_NAMES[jerseyKey] ?? WORD_NAMES[`${team}|${rawWord}`] ?? jersey;
  return { helmet, jersey, pants, jerseyKey, name, img: photoFor(jerseyKey), hexes: side.hexes };
}

for (const c of cards) {
  const espn = findEspn(c.week, c.away, c.home);
  if (!espn) {
    errors.push(`Week ${c.week} ${c.away} at ${c.home}: tracker says Final but no ESPN game found`);
    continue;
  }
  if (!espn.final) {
    errors.push(`Week ${c.week} ${c.away} at ${c.home}: tracker says Final but ESPN is not final`);
    continue;
  }
  if (c.sides.some((s) => s.words.length !== 3)) {
    errors.push(`Week ${c.week} ${c.away} at ${c.home}: card lacks a helmet · jersey · pants line`);
    continue;
  }
  // Cross-check the tracker's score line ("Lions 35, Patriots 10").
  if (c.score) {
    const nums = [...c.score.matchAll(/([A-Za-z0-9 .]+?)\s+(\d+)/g)].map((m) => [m[1].trim(), Number(m[2])]);
    for (const [who, pts] of nums) {
      const isHome = espn.home.endsWith(who);
      const isAway = espn.away.endsWith(who);
      const want = isHome ? espn.homeScore : isAway ? espn.awayScore : null;
      if (want !== null && want !== pts)
        warnings.push(`Week ${c.week} ${c.away} at ${c.home}: tracker says ${who} ${pts}, ESPN says ${want} (ESPN used)`);
    }
  } else warnings.push(`Week ${c.week} ${c.away} at ${c.home}: tracker Final has no score line (ESPN used)`);

  [c.away, c.home].forEach((team, i) => {
    logged.push({ team, opp: i ? c.away : c.home, home: i === 1, week: c.week, espn, ...jerseyIdentity(team, c.sides[i]) });
  });
}

for (const g of WORN_WITHOUT_CARD) {
  const espn = findEspn(g.week, g.away, g.home);
  if (!espn?.final) {
    errors.push(`WORN_WITHOUT_CARD week ${g.week} ${g.away} at ${g.home}: no ESPN final`);
    continue;
  }
  if (logged.some((l) => l.espn.id === espn.id)) continue; // the card has since been drawn
  for (const [team, opp, home, s] of [
    [g.away, g.home, false, g.awaySide],
    [g.home, g.away, true, g.homeSide],
  ]) {
    const jerseyKey = s.jerseyKey;
    logged.push({
      team, opp, home, week: g.week, espn,
      helmet: s.helmet, jersey: s.jersey, pants: s.pants, jerseyKey,
      name: s.name ?? JERSEY_NAMES[jerseyKey] ?? s.jersey,
      img: photoFor(jerseyKey),
      hexes: s.hexes,
    });
  }
}

// ---------------------------------------------------------------------------
const teamNames = [...new Set(espnGames.flatMap((g) => [g.home, g.away]))].sort();
const teams = [];
for (const team of teamNames) {
  const mine = logged.filter((l) => l.team === team).sort((a, b) => a.espn.kickoff.localeCompare(b.espn.kickoff));
  const played = espnGames.filter((g) => g.final && (g.home === team || g.away === team));
  const missing = played
    .filter((g) => !mine.some((l) => l.espn.id === g.id))
    .map((g) => ({ week: g.week, date: g.date, opponent: g.home === team ? g.away : g.home, home: g.home === team }));

  const combos = new Map();
  for (const l of mine) {
    const id = `${l.jerseyKey}|${l.helmet}|${l.pants}`.toLowerCase();
    const teamScore = l.home ? l.espn.homeScore : l.espn.awayScore;
    const oppScore = l.home ? l.espn.awayScore : l.espn.homeScore;
    const result = teamScore > oppScore ? "W" : teamScore < oppScore ? "L" : "T";
    const c =
      combos.get(id) ??
      { id: "", helmet: l.helmet, jersey: l.jersey, jerseyName: l.name, jerseyKey: l.jerseyKey, pants: l.pants, hexes: l.hexes, img: l.img ?? null, w: 0, l: 0, t: 0, games: [] };
    if (!c.img && l.img) c.img = l.img;
    c[result.toLowerCase()]++;
    c.games.push({ week: l.week, date: l.espn.date, opponent: l.opp, home: l.home, teamScore, oppScore, result, link: TRACKER });
    combos.set(id, c);
  }
  // Readable, URL-safe combo ids: "rivalries-silver-electric-blue-silver".
  const list = [...combos.values()].map((c) => ({
    ...c,
    id: `${c.jerseyName}-${c.helmet}-${c.pants}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  }));
  list.sort((a, b) => b.games.length - a.games.length || b.w - a.w || a.jerseyName.localeCompare(b.jerseyName));

  const counted = mine.length;
  const comboSum = list.reduce((n, c) => n + c.games.length, 0);
  if (comboSum !== counted) errors.push(`${team}: combo games ${comboSum} != counted ${counted}`);
  if (counted + missing.length !== played.length)
    errors.push(`${team}: counted ${counted} + unlogged ${missing.length} != ESPN games played ${played.length}`);
  const dupWeeks = mine.map((l) => l.week).filter((w, i, a) => a.indexOf(w) !== i);
  if (dupWeeks.length) errors.push(`${team}: logged twice in week ${dupWeeks.join(", ")}`);

  // Two different jerseys must never read the same on the page.
  const byName = new Map();
  for (const c of list) {
    const other = byName.get(c.jerseyName);
    if (other && other !== c.jerseyKey) warnings.push(`${team}: two jerseys both read "${c.jerseyName}" (${other}, ${c.jerseyKey})`);
    byName.set(c.jerseyName, c.jerseyKey);
  }

  const rec = list.reduce((r, c) => ({ w: r.w + c.w, l: r.l + c.l, t: r.t + c.t }), { w: 0, l: 0, t: 0 });
  // Independent check: ESPN's own results for the same games.
  const espnRec = { w: 0, l: 0, t: 0 };
  for (const l of mine) {
    const ts = l.home ? l.espn.homeScore : l.espn.awayScore;
    const os = l.home ? l.espn.awayScore : l.espn.homeScore;
    espnRec[ts > os ? "w" : ts < os ? "l" : "t"]++;
  }
  if (rec.w !== espnRec.w || rec.l !== espnRec.l || rec.t !== espnRec.t) errors.push(`${team}: record mismatch vs ESPN`);

  teams.push({ key: keyOf(team), name: team, nickname: nick(team), gamesPlayed: played.length, gamesCounted: counted, ...rec, missing, combos: list });
}

const out = {
  league: "nfl",
  season: SEASON,
  throughWeek,
  built: new Date().toISOString().slice(0, 10),
  note: "Built by scripts/build-uniform-records.mjs from the ColorWay Sports NFL uniform tracker (worn looks only, logged from game photos) and ESPN final scores. Do not hand-edit.",
  totals: {
    teams: teams.length,
    gamesPlayed: espnGames.filter((g) => g.final).length,
    teamGamesCounted: teams.reduce((n, t) => n + t.gamesCounted, 0),
    teamGamesUnlogged: teams.reduce((n, t) => n + t.missing.length, 0),
  },
  teams,
};

for (const w of warnings) console.warn("warn:", w);
if (errors.length) {
  for (const e of errors) console.error("ERROR:", e);
  console.error(`\n${errors.length} guard failure(s); ${OUT_FILE} not written.`);
  process.exit(1);
}
fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 1) + "\n");
const gaps = teams.filter((t) => t.missing.length);
console.log(
  `${OUT_FILE}: ${teams.length} teams through Week ${throughWeek}, ${out.totals.teamGamesCounted} team-games counted, ${out.totals.teamGamesUnlogged} unlogged` +
    (gaps.length ? ` (${gaps.map((t) => `${t.nickname} wk ${t.missing.map((m) => m.week).join("/")}`).join("; ")})` : ""),
);

// ===========================================================================
// NBA 2026-27. Source: scripts/data/nba-worn-2026-27.json, the nightly worn log
// behind the 30 NBA schedule posts. It already carries final scores, so no
// network call. Only rows marked confirmed (both jerseys seen in game photos)
// count. Jerseys are named by COLOR (lib/nbaTileColors.ts, Jake 11/2), with the
// league's edition name kept as a secondary label.
const NBA_OUT = "content/data/nba-uniform-records-2026-27.json";
const NBA_TEAMS = {
  ATL: "Atlanta Hawks", BOS: "Boston Celtics", BKN: "Brooklyn Nets", CHA: "Charlotte Hornets", CHI: "Chicago Bulls",
  CLE: "Cleveland Cavaliers", DAL: "Dallas Mavericks", DEN: "Denver Nuggets", DET: "Detroit Pistons",
  GSW: "Golden State Warriors", HOU: "Houston Rockets", IND: "Indiana Pacers", LAC: "LA Clippers",
  LAL: "Los Angeles Lakers", MEM: "Memphis Grizzlies", MIA: "Miami Heat", MIL: "Milwaukee Bucks",
  MIN: "Minnesota Timberwolves", NOP: "New Orleans Pelicans", NYK: "New York Knicks", OKC: "Oklahoma City Thunder",
  ORL: "Orlando Magic", PHI: "Philadelphia 76ers", PHX: "Phoenix Suns", POR: "Portland Trail Blazers",
  SAC: "Sacramento Kings", SAS: "San Antonio Spurs", TOR: "Toronto Raptors", UTA: "Utah Jazz", WAS: "Washington Wizards",
};
// Same tricode -> tile nickname map as lib/nbaTiles.ts.
const tileNick = (tri) => ({ BKN: "nets", GSW: "warriors", LAC: "clippers", MIN: "timberwolves", NOP: "pelicans", OKC: "thunder", PHI: "76ers", POR: "trail-blazers", SAS: "spurs" })[tri] ?? NBA_TEAMS[tri].split(" ").slice(-1)[0].toLowerCase();
const edition = (call) =>
  /^Association/.test(call) ? "association" : /^Icon/.test(call) ? "icon" : /^Statement/.test(call) ? "statement" : /^Classic/.test(call) ? "classic" : /City/.test(call) ? "city" : null;
const EDITION_LABEL = { association: "Association Edition", icon: "Icon Edition", statement: "Statement Edition", classic: "Classic Edition", city: "City Edition" };
const NBA_HEX = {
  White: "#FFFFFF", Black: "#111111", Red: "#C8102E", "Royal Blue": "#1D428A", Navy: "#0C2340", Purple: "#552583",
  Blue: "#006BB6", Silver: "#A7A9AC", Orange: "#F58426", Green: "#007A33", Yellow: "#FDB927", Wine: "#860038",
  Teal: "#00788C", "Light Blue": "#7AC1E4", Gray: "#8D9093", Gold: "#FFC72C", Cream: "#EEE1C6",
};
const { NBA_TILE_COLORS } = await import(pathToFileURL(path.join(ROOT, "lib/nbaTileColors.ts")).href);
const NBA_TILE_FILES = new Set(JSON.parse(fs.readFileSync("lib/nbaTileFiles.json", "utf8")));

const nbaLog = JSON.parse(fs.readFileSync("scripts/data/nba-worn-2026-27.json", "utf8")).games;
const nbaSchedule = fs
  .readFileSync("scripts/data/nba-schedule-2026-27.txt", "utf8")
  .split("\n")
  .map((l) => l.trim().split("|"))
  .filter((p) => p.length === 3)
  .map(([date, away, home]) => ({ date, away, home, key: `${date} ${away}@${home}` }));
const nbaThrough = Object.keys(nbaLog).sort().pop().slice(0, 10);
const nbaErrors = [];
const nbaWarn = [];
const nbaRows = []; // one per team-game

for (const g of nbaSchedule.filter((s) => s.date <= nbaThrough)) {
  const row = nbaLog[g.key];
  if (!row?.score || !row.confirmed) continue; // reported as unlogged below
  for (const [tri, opp, isHome] of [
    [g.away, g.home, false],
    [g.home, g.away, true],
  ]) {
    const call = row[isHome ? "home" : "away"]?.call;
    const ed = call && edition(call);
    if (!ed) {
      nbaErrors.push(`${g.key}: ${tri} call "${call}" is not a known edition`);
      continue;
    }
    const tile = `${tileNick(tri)}-${ed}.jpg`;
    const color = NBA_TILE_COLORS[tile];
    if (!color) nbaWarn.push(`${g.key}: no color for ${tile}, showing "${call}"`);
    const teamScore = isHome ? row.score.home : row.score.away;
    const oppScore = isHome ? row.score.away : row.score.home;
    nbaRows.push({
      tri, opp, home: isHome, date: g.date, teamScore, oppScore, ot: !!row.ot,
      result: teamScore > oppScore ? "W" : "L",
      edition: ed, call, color: color ?? call,
      img: NBA_TILE_FILES.has(tile) ? `/images/posts/nba-daily-tracker/${tile}` : null,
    });
  }
}

const nbaTeams = Object.entries(NBA_TEAMS).map(([tri, name]) => {
  const mine = nbaRows.filter((r) => r.tri === tri).sort((a, b) => a.date.localeCompare(b.date));
  const scheduled = nbaSchedule.filter((s) => s.date <= nbaThrough && (s.away === tri || s.home === tri));
  const missing = scheduled
    .filter((s) => !mine.some((r) => r.date === s.date))
    .map((s) => ({ date: s.date, opponent: NBA_TEAMS[s.home === tri ? s.away : s.home], home: s.home === tri }));
  const combos = new Map();
  for (const r of mine) {
    const c = combos.get(r.edition) ?? {
      id: "", jerseyName: r.color, edition: EDITION_LABEL[r.edition], jerseyKey: `${tileNick(tri)}-${r.edition}`,
      helmet: "", jersey: r.color, pants: "", hexes: [NBA_HEX[r.color] ?? "#888888", NBA_HEX[r.color] ?? "#888888", NBA_HEX[r.color] ?? "#888888"],
      img: r.img, w: 0, l: 0, t: 0, games: [],
    };
    c[r.result.toLowerCase()]++;
    c.games.push({
      date: r.date, opponent: NBA_TEAMS[r.opp], home: r.home, teamScore: r.teamScore, oppScore: r.oppScore,
      result: r.result, ot: r.ot, link: "/stories/nba-uniform-tracker-2026-27",
    });
    combos.set(r.edition, c);
  }
  const list = [...combos.values()];
  // Two editions in the same color (a White Association and a White Classic) keep the edition in the name.
  const clash = new Set(list.filter((c) => list.filter((o) => o.jerseyName === c.jerseyName).length > 1));
  for (const c of clash) c.jerseyName = `${c.jerseyName} ${c.edition.replace(/ Edition$/, "")}`;
  for (const c of list) c.id = c.jerseyName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  list.sort((a, b) => b.games.length - a.games.length || b.w - a.w);
  const sum = list.reduce((n, c) => n + c.games.length, 0);
  if (sum !== mine.length) nbaErrors.push(`${name}: combo games ${sum} != counted ${mine.length}`);
  if (mine.length + missing.length !== scheduled.length)
    nbaErrors.push(`${name}: counted ${mine.length} + unlogged ${missing.length} != scheduled ${scheduled.length}`);
  const rec = list.reduce((r, c) => ({ w: r.w + c.w, l: r.l + c.l, t: 0 }), { w: 0, l: 0, t: 0 });
  return {
    key: name.split(" ").slice(-1)[0].toLowerCase(), name, nickname: name.endsWith("Trail Blazers") ? "Trail Blazers" : name.split(" ").slice(-1)[0],
    gamesPlayed: scheduled.length, gamesCounted: mine.length, ...rec, missing, combos: list,
  };
});

for (const w of nbaWarn) console.warn("warn (nba):", w);
if (nbaErrors.length) {
  for (const e of nbaErrors) console.error("ERROR (nba):", e);
  console.error(`\n${nbaErrors.length} NBA guard failure(s); ${NBA_OUT} not written.`);
  process.exit(1);
}
const nbaOut = {
  league: "nba",
  season: "2026-27",
  through: nbaThrough,
  built: new Date().toISOString().slice(0, 10),
  note: "Built by scripts/build-uniform-records.mjs from scripts/data/nba-worn-2026-27.json (confirmed rows only, scores from the same log). Do not hand-edit.",
  totals: {
    teams: nbaTeams.length,
    teamGamesCounted: nbaTeams.reduce((n, t) => n + t.gamesCounted, 0),
    teamGamesUnlogged: nbaTeams.reduce((n, t) => n + t.missing.length, 0),
  },
  teams: nbaTeams,
};
fs.writeFileSync(NBA_OUT, JSON.stringify(nbaOut, null, 1) + "\n");
console.log(`${NBA_OUT}: ${nbaTeams.length} teams through ${nbaThrough}, ${nbaOut.totals.teamGamesCounted} team-games counted, ${nbaOut.totals.teamGamesUnlogged} unlogged`);

// ===========================================================================
// NHL 2026-27. Source: scripts/data/nhl-game-log-2026-27.json, the nightly sweater
// log behind the 32 NHL schedule posts and the daily tracker. Only rows marked
// confirmed (both sweaters seen in game photos) count. A side with no "call" wore
// the league default (dark at home, white on the road).
//
// The log carries no scores, so finals come from ESPN's NHL scoreboard, fetched
// HERE one date at a time and cached in content/data/nhl-scores-2026-27.json with
// ESPN's standings snapshot. Records are NHL-style W-L-OTL: a loss in overtime or
// a shootout is counted apart from a regulation loss.
//
// Preseason: every ESPN event carries its season type. Only type 2 (regular
// season) counts; a log row that matches a preseason game is listed and skipped.
// The 2026-27 regular season opened Sept. 29 (NHL and ESPN both list those games
// as regular season), so the log's late-September and early-October rows count.
//
// Guards (script exits non-zero, nothing written):
//   - every confirmed log row has an ESPN regular-season final
//   - per team: jersey games sum to games counted; counted + unlogged = ESPN games played
//   - per team: counted + unlogged results = ESPN's standings W-L-OTL through the
//     cutoff (standings minus any finals played after the cutoff)
const NHL_OUT = "content/data/nhl-uniform-records-2026-27.json";
const NHL_SCORES = "content/data/nhl-scores-2026-27.json";
const NHL_TRACKER = "/stories/nhl-uniform-tracker-2026-27";
const NHL_FIRST_DATE = "2026-09-20"; // first preseason date, so preseason rows are seen and excluded
const NHL_TEAMS = JSON.parse(fs.readFileSync("content/data/nhl-teams.json", "utf8")).teams;
const NHL_LOG = JSON.parse(fs.readFileSync("scripts/data/nhl-game-log-2026-27.json", "utf8")).games;
const ESPN_NHL = { NJ: "NJD", SJ: "SJS", LA: "LAK", TB: "TBL", UTAH: "UTA" };
const nhlTri = (abbr) => ESPN_NHL[abbr] ?? abbr;
const NHL_TILE_DIR = "public/images/posts/nhl-daily-tracker";
const nhlTileFiles = new Set(fs.readdirSync(NHL_TILE_DIR));

// Hometown Remix main colors, from the team reveal posts (content/posts/nhl-hometown-remix-2026-27.md).
// The log's "color" field is only the text color for the call, so it is never used as the sweater color.
const REMIX = {
  ANA: ["Green", "#00843D"], BOS: ["Brown", "#6B4226", "Varsity Sweater"], BUF: ["Royal Blue", "#003087"], CGY: ["Red", "#C8102E"],
  CAR: ["Gray", "#5B6770"], CHI: ["Kelly Green", "#00843D"], COL: ["White", "#FFFFFF"], CBJ: ["Gray", "#8A9099"],
  DAL: ["White", "#FFFFFF"], DET: ["Red", "#CE1126"], EDM: ["Black", "#111111"], FLA: ["Coral", "#E05A47"],
  LAK: ["Purple", "#5B2C83"], MIN: ["Black", "#111111"], MTL: ["White", "#FFFFFF"], NSH: ["Navy", "#041E42"],
  NJD: ["Black", "#111111"], NYI: ["White", "#FFFFFF"], NYR: ["Navy", "#0A1D3F"], OTT: ["Black", "#111111"],
  PHI: ["Gray", "#8A8D8F"], PIT: ["Blue", "#1E4FA0"], SJS: ["Teal", "#006D75"], SEA: ["Deep Sea Blue", "#001628"],
  STL: ["Black", "#111111"], TBL: ["Black", "#111111"], TOR: ["Cream", "#EEE1C6"], UTA: ["Mountain Blue", "#7FA9D1"],
  VAN: ["Navy", "#00205B"], VGK: ["Black", "#111111"], WSH: ["Blue", "#1F5E96"], WPG: ["Navy", "#041E42"],
};
// Thirds, throwbacks and specials, keyed by the jersey key (the tile the log points
// at, or a call override below): [plain color, kind, official name, hex].
const NHL_SPECIALS = {
  "canucks-skate": ["Black", "Third", "Black Skate Alternate", "#111111"],
  "jets-heritage": ["Navy", "Heritage", "Heritage Alternate", "#041E42"],
  "jets-heritage-classic": ["White", "Heritage Classic", "2026 Heritage Classic Sweater", "#FFFFFF"],
  "canadiens-heritage-classic": ["Red", "Heritage Classic", "2026 Heritage Classic Sweater", "#AF1E2D"],
  "hurricanes-red": ["Red", "Alternate", "Red Sweater", "#CE1126"],
  "capitals-screaming-eagle": ["Red", "Third", "Screaming Eagle", "#C8102E"],
  "oilers-tan": ["Tan", "Third", "Oil Country Tan Alternate", "#E8DCC0"],
  "sabres-goathead": ["Black", "Third", "Black and Red Goathead", "#111111"],
  "golden-knights-steel-grey": ["Gray", "Third", "Steel Grey Alternate", "#333F48"],
  "penguins-gold": ["Gold", "Third", "Gold Third", "#FCB514"],
  "rangers-navy-shield": ["Navy", "Third", "Navy Shield Third", "#0A1D3F"],
  "senators-red": ["Red", "Third", "Red Third", "#C8102E"],
  "avalanche-navy": ["Navy", "Third", "Navy Alternate (Colorado Flag C)", "#041E42"],
  "blue-jackets-cannon": ["Navy", "Third", "Cannon Third", "#002654"],
  "flames-2004-retro": ["Black", "Throwback", "2004 Retro Black C", "#111111"],
  "blackhawks-black": ["Black", "Third", "Black Alternate", "#111111"],
  "red-wings-centennial": ["Red", "Centennial", "Centennial Sweater", "#CE1126"],
  "rangers-centennial": ["Light Blue", "Centennial", "Centennial Jersey", "#3A73C4"],
  "blackhawks-centennial": ["Red", "Centennial", "Centennial Jersey", "#CF0A2C"],
  "sharks-cali-fin": ["Black", "Third", "Cali Fin Third", "#111111"],
  "stars-the-99": ["Black", "Third", "The 99 Alternate", "#111111"],
};
// Calls whose sweater is not the tile they point at.
const NHL_CALL_KEYS = {
  "WPG|Heritage Classic": "jets-heritage-classic", // the white outdoor sweater; the tile shows the navy alternate
  "MTL|Heritage Classic": "canadiens-heritage-classic",
  "CHI|Centennial Jersey": "blackhawks-centennial", // 2025-26 Centennial, worn 2026-11-17; tile is the near-identical home red
};
// Tile photo for an override key (none for the Jets' white Heritage Classic: no tile of it exists).
const NHL_KEY_TILE = { "canadiens-heritage-classic": "canadiens-heritage.jpg", "blackhawks-centennial": "blackhawks-home.jpg" };

const nhlErrors = [];
const nhlWarn = [];

function nhlJersey(tri, isHome, side) {
  const t = NHL_TEAMS[tri];
  const call = side?.call ?? (isHome ? "Home Dark" : "Road White");
  const base = call.replace(/ Debut$/, "");
  let key = NHL_CALL_KEYS[`${tri}|${base}`];
  if (!key) {
    if (/^Home Dark\b/.test(base)) key = `${t.key}-home`;
    else if (/^Road White\b/.test(base)) key = `${t.key}-road`;
    else if (base === "Hometown Remix") key = `${t.key}-remix`;
    else if (side?.image) key = side.image.split("/").pop().replace(/\.\w+$/, "");
    else nhlErrors.push(`${tri} "${call}": no tile and no jersey key, add it to NHL_CALL_KEYS`);
  }
  let color, kind, official, hex;
  if (key === `${t.key}-home`) [color, kind, official, hex] = [t.homeLabel.replace(/^Home /, ""), "Home", "Home Sweater", t.homeSwatch];
  else if (key === `${t.key}-road`) [color, kind, official, hex] = ["White", "Road", "Road Sweater", "#FFFFFF"];
  else if (key === `${t.key}-remix`) {
    const r = REMIX[tri];
    [color, kind, official, hex] = [r[0], "Remix", r[2] ? `Hometown Remix: ${r[2]}` : "Hometown Remix", r[1]];
  } else if (NHL_SPECIALS[key]) [color, kind, official, hex] = NHL_SPECIALS[key];
  else {
    nhlErrors.push(`${tri} "${call}": jersey key ${key} has no name, add it to NHL_SPECIALS`);
    [color, kind, official, hex] = [call, "", call, "#888888"];
  }
  const file = NHL_KEY_TILE[key] ?? `${key}.jpg`;
  const img = nhlTileFiles.has(file) ? `/images/posts/nhl-daily-tracker/${file}` : null;
  return { key, call, color, name: `${color} ${kind}`.trim(), edition: official, hex, img };
}

// --- ESPN scores, cached per date -------------------------------------------
const confirmedRows = Object.entries(NHL_LOG).filter(([, v]) => v.confirmed);
const nhlThrough = confirmedRows.map(([k]) => k.slice(0, 10)).sort().pop();
const todayEt = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
const addDay = (iso, n) => new Date(Date.parse(iso + "T12:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);

async function fetchNhlDate(iso) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=${iso.replace(/-/g, "")}`;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (uniform-records build script)" } });
    if (res.ok) {
      const j = await res.json();
      return (j.events ?? []).map((e) => {
        const c = e.competitions[0];
        const side = (ha) => c.competitors.find((x) => x.homeAway === ha);
        const h = side("home");
        const a = side("away");
        const detail = e.status?.type?.detail ?? "";
        const period = e.status?.period ?? 0;
        return {
          id: e.id,
          date: iso,
          start: e.date,
          seasonType: e.season?.type ?? null,
          away: nhlTri(a.team.abbreviation),
          home: nhlTri(h.team.abbreviation),
          awayScore: Number(a.score),
          homeScore: Number(h.score),
          final: e.status?.type?.name === "STATUS_FINAL",
          // "Final/OT", "Final/SO" (and "Final/2OT" style on long nights).
          extra: /SO/.test(detail) ? "SO" : /OT/.test(detail) || period > 3 ? "OT" : null,
        };
      });
    }
    if (attempt >= 5) throw new Error(`ESPN NHL ${iso}: HTTP ${res.status}`);
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
}

let nhlCache = fs.existsSync(NHL_SCORES) ? JSON.parse(fs.readFileSync(NHL_SCORES, "utf8")) : { dates: {} };
nhlCache.dates ??= {};
// Through the cutoff for the records, then on to today so the standings snapshot
// can be wound back to the cutoff.
for (let d = NHL_FIRST_DATE; d <= todayEt; d = addDay(d, 1)) {
  const have = nhlCache.dates[d];
  if (REFRESH || !have || have.some((g) => !g.final) || d >= addDay(nhlThrough, 1)) {
    nhlCache.dates[d] = await fetchNhlDate(d);
  }
}
for (const d of Object.keys(nhlCache.dates)) if (d > todayEt) delete nhlCache.dates[d];

const standRes = await fetch("https://site.api.espn.com/apis/v2/sports/hockey/nhl/standings", {
  headers: { "User-Agent": "Mozilla/5.0 (uniform-records build script)" },
});
if (!standRes.ok) throw new Error(`ESPN NHL standings: HTTP ${standRes.status}`);
const standJson = await standRes.json();
const standings = {};
for (const conf of standJson.children ?? []) {
  for (const e of conf.standings?.entries ?? []) {
    const stat = (n) => Number(e.stats.find((s) => s.name === n)?.value ?? NaN);
    standings[nhlTri(e.team.abbreviation)] = { w: stat("wins"), l: stat("losses"), otl: stat("otLosses"), gp: stat("gamesPlayed") };
  }
}
nhlCache = {
  note: "NHL final scores and a standings snapshot from ESPN's public API, cached by scripts/build-uniform-records.mjs. The site build reads the records file built from this and never calls ESPN.",
  season: "2026-27",
  fetched: new Date().toISOString(),
  standings,
  dates: Object.fromEntries(Object.entries(nhlCache.dates).sort(([a], [b]) => a.localeCompare(b))),
};
fs.writeFileSync(NHL_SCORES, JSON.stringify(nhlCache, null, 1) + "\n");

const nhlEvents = Object.values(nhlCache.dates).flat();
const regular = nhlEvents.filter((g) => g.seasonType === 2);
const regThrough = regular.filter((g) => g.date <= nhlThrough && g.final);
const findNhl = (date, away, home) =>
  nhlEvents.find((g) => g.date === date && g.away === away && g.home === home) ??
  nhlEvents.find((g) => Math.abs(Date.parse(g.date) - Date.parse(date)) <= 86_400_000 && g.away === away && g.home === home);

// --- Join the log to ESPN ------------------------------------------------------
const nhlRows = [];
const nhlPreseason = [];
const usedIds = new Set();
for (const [k, v] of confirmedRows) {
  const [date, pair] = k.split(" ");
  const [A, H] = pair.split("@");
  if (!NHL_TEAMS[A] || !NHL_TEAMS[H]) {
    nhlErrors.push(`${k}: unknown tricode`);
    continue;
  }
  const g = findNhl(date, A, H);
  if (!g) {
    nhlErrors.push(`${k}: confirmed in the log but no ESPN game found`);
    continue;
  }
  if (g.seasonType !== 2) {
    nhlPreseason.push(`${k} (ESPN season type ${g.seasonType})`);
    continue;
  }
  if (!g.final) {
    nhlErrors.push(`${k}: confirmed in the log but ESPN is not final`);
    continue;
  }
  if (usedIds.has(g.id)) {
    nhlErrors.push(`${k}: two log rows match ESPN game ${g.id}`);
    continue;
  }
  usedIds.add(g.id);
  for (const [tri, opp, isHome] of [
    [A, H, false],
    [H, A, true],
  ]) {
    const j = nhlJersey(tri, isHome, isHome ? v.home : v.away);
    const teamScore = isHome ? g.homeScore : g.awayScore;
    const oppScore = isHome ? g.awayScore : g.homeScore;
    nhlRows.push({
      tri, opp, home: isHome, date: g.date, start: g.start, espnId: g.id, teamScore, oppScore,
      result: teamScore > oppScore ? "W" : g.extra ? "OTL" : "L",
      extra: g.extra, ...j,
    });
  }
}

const recOf = (list) => ({
  w: list.filter((r) => r.result === "W").length,
  l: list.filter((r) => r.result === "L").length,
  otl: list.filter((r) => r.result === "OTL").length,
});
const espnResult = (g, tri) => {
  const us = g.home === tri ? g.homeScore : g.awayScore;
  const them = g.home === tri ? g.awayScore : g.homeScore;
  return us > them ? "W" : g.extra ? "OTL" : "L";
};

const nhlTeams = Object.entries(NHL_TEAMS)
  .sort(([, a], [, b]) => a.name.localeCompare(b.name))
  .map(([tri, t]) => {
    const mine = nhlRows.filter((r) => r.tri === tri).sort((a, b) => a.start.localeCompare(b.start));
    const played = regThrough.filter((g) => g.home === tri || g.away === tri);
    const missingGames = played.filter((g) => !usedIds.has(g.id));
    const missing = missingGames.map((g) => ({ date: g.date, opponent: NHL_TEAMS[g.home === tri ? g.away : g.home].name, home: g.home === tri }));

    const combos = new Map();
    for (const r of mine) {
      const c = combos.get(r.key) ?? {
        id: "", jerseyName: r.name, edition: r.edition, jerseyKey: r.key, helmet: "", jersey: r.color, pants: "",
        hexes: [r.hex, r.hex, r.hex], img: r.img, w: 0, l: 0, t: 0, otl: 0, games: [],
      };
      c[r.result.toLowerCase()]++;
      c.games.push({
        date: r.date, opponent: NHL_TEAMS[r.opp].name, home: r.home, teamScore: r.teamScore, oppScore: r.oppScore,
        result: r.result === "W" ? "W" : "L", ...(r.extra ? { ot: r.extra } : {}), link: NHL_TRACKER,
      });
      combos.set(r.key, c);
    }
    const list = [...combos.values()];
    for (const c of list) c.id = c.jerseyName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const ids = list.map((c) => c.id);
    if (new Set(ids).size !== ids.length) nhlErrors.push(`${t.name}: two jerseys read the same (${ids.join(", ")})`);
    list.sort((a, b) => b.games.length - a.games.length || b.w - a.w || a.jerseyName.localeCompare(b.jerseyName));

    const sum = list.reduce((n, c) => n + c.games.length, 0);
    if (sum !== mine.length) nhlErrors.push(`${t.name}: jersey games ${sum} != counted ${mine.length}`);
    if (mine.length + missing.length !== played.length)
      nhlErrors.push(`${t.name}: counted ${mine.length} + unlogged ${missing.length} != ESPN games played ${played.length}`);
    const dupDates = mine.map((r) => r.date).filter((d, i, a) => a.indexOf(d) !== i);
    if (dupDates.length) nhlErrors.push(`${t.name}: logged twice on ${dupDates.join(", ")}`);

    const rec = list.reduce((r, c) => ({ w: r.w + c.w, l: r.l + c.l, t: 0, otl: r.otl + c.otl }), { w: 0, l: 0, t: 0, otl: 0 });
    const fromRows = recOf(mine);
    if (rec.w !== fromRows.w || rec.l !== fromRows.l || rec.otl !== fromRows.otl) nhlErrors.push(`${t.name}: jersey records do not add up`);

    // Standings guard: our counted games + the unlogged ones must equal ESPN's
    // standings line, wound back to the cutoff.
    const s = standings[tri];
    if (!s) nhlErrors.push(`${t.name}: missing from ESPN standings`);
    else {
      const after = regular.filter((g) => g.final && g.date > nhlThrough && (g.home === tri || g.away === tri));
      const at = { w: s.w, l: s.l, otl: s.otl };
      for (const g of after) at[espnResult(g, tri).toLowerCase()]--;
      const unlogged = { w: 0, l: 0, otl: 0 };
      for (const g of missingGames) unlogged[espnResult(g, tri).toLowerCase()]++;
      const ours = { w: rec.w + unlogged.w, l: rec.l + unlogged.l, otl: rec.otl + unlogged.otl };
      if (ours.w !== at.w || ours.l !== at.l || ours.otl !== at.otl)
        nhlErrors.push(
          `${t.name}: ours ${ours.w}-${ours.l}-${ours.otl} (incl. ${missingGames.length} unlogged) != ESPN standings ${at.w}-${at.l}-${at.otl} through ${nhlThrough}`,
        );
      if (s.gp - after.length !== played.length) nhlErrors.push(`${t.name}: ESPN standings GP ${s.gp} - ${after.length} later != ${played.length} scoreboard games`);
    }

    return {
      key: t.key, name: t.name, nickname: t.short, tri,
      gamesPlayed: played.length, gamesCounted: mine.length, ...rec, missing, combos: list,
    };
  });

for (const w of nhlWarn) console.warn("warn (nhl):", w);
if (nhlPreseason.length) console.log(`NHL: ${nhlPreseason.length} preseason log row(s) excluded:\n  ${nhlPreseason.join("\n  ")}`);
else console.log("NHL: no preseason rows in the confirmed log (every confirmed row is an ESPN regular-season game)");
if (nhlErrors.length) {
  for (const e of nhlErrors) console.error("ERROR (nhl):", e);
  console.error(`\n${nhlErrors.length} NHL guard failure(s); ${NHL_OUT} not written.`);
  process.exit(1);
}
const nhlOut = {
  league: "nhl",
  season: "2026-27",
  through: nhlThrough,
  built: new Date().toISOString().slice(0, 10),
  note: "Built by scripts/build-uniform-records.mjs from scripts/data/nhl-game-log-2026-27.json (confirmed rows, regular season only) and ESPN finals cached in content/data/nhl-scores-2026-27.json. Records are W-L-OTL. Do not hand-edit.",
  totals: {
    teams: nhlTeams.length,
    gamesPlayed: regThrough.length,
    teamGamesCounted: nhlTeams.reduce((n, t) => n + t.gamesCounted, 0),
    teamGamesUnlogged: nhlTeams.reduce((n, t) => n + t.missing.length, 0),
    preseasonExcluded: nhlPreseason,
  },
  teams: nhlTeams,
};
fs.writeFileSync(NHL_OUT, JSON.stringify(nhlOut, null, 1) + "\n");
console.log(
  `${NHL_OUT}: ${nhlTeams.length} teams through ${nhlThrough}, ${regThrough.length} ESPN regular-season finals, ${nhlOut.totals.teamGamesCounted} team-games counted, ${nhlOut.totals.teamGamesUnlogged} unlogged`,
);
