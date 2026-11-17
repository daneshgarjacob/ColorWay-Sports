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
// Run after logging a week's NFL finals or a night's NBA pass, then commit the
// three JSON files (both records files and the score cache).

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
