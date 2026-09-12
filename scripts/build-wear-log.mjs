#!/usr/bin/env node
// Builds the site's normalized uniform wear log from the existing trackers.
//   node scripts/build-wear-log.mjs
//
// Reads the MLB daily tracker, the NFL tracker, the Premier League and
// Champions League kit schedules, and the 32 NFL team schedule posts, and
// emits ONE table twice: data/wear-log.json (array of rows) and
// data/wear-log.csv (same rows). Idempotent: re-running regenerates both.
//
// Every row has the same keys, null when unknown:
//   league, season, date, gameKey, homeTeam, awayTeam, homeUniform,
//   awayUniform, homeHelmet, awayHelmet, homePants, awayPants, homeScore,
//   awayScore, status, grade, source, sourceUrl
//
// Nothing here is imported by the site. The posts are the source of truth and
// this only reads them, so fixing a card fixes the row on the next run.

import fs from "node:fs";
import path from "node:path";

const POSTS = "content/posts";
const OUT_JSON = "data/wear-log.json";
const OUT_CSV = "data/wear-log.csv";
const SITE = "https://www.colorwaysports.com/stories/";

const KEYS = [
  "league", "season", "date", "gameKey", "homeTeam", "awayTeam",
  "homeUniform", "awayUniform", "homeHelmet", "awayHelmet", "homePants",
  "awayPants", "homeScore", "awayScore", "status", "grade", "source", "sourceUrl",
];

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7,
  august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9,
  oct: 10, nov: 11, dec: 12,
};

const rows = [];
const unreadable = []; // { source, snippet }
const notes = [];      // human-readable decisions worth printing

const decode = (s) =>
  String(s ?? "")
    .replace(/&#9733;|&#x2605;/g, "★")
    .replace(/&middot;/g, "·")
    .replace(/&ndash;/g, "–")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
const pad2 = (n) => String(n).padStart(2, "0");
const iso = (y, m, d) => `${y}-${pad2(m)}-${pad2(d)}`;
const slugify = (s) =>
  String(s).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const readPost = (file) => fs.readFileSync(path.join(POSTS, file), "utf8");
const postUrl = (file) => SITE + file.replace(/\.md$/, "");
const blank = () => Object.fromEntries(KEYS.map((k) => [k, null]));
const bad = (source, snippet) => unreadable.push({ source, snippet: String(snippet).replace(/\s+/g, " ").slice(0, 80) });

// ---- team vocab --------------------------------------------------------------
const MLB_TEAMS = [
  "Baltimore Orioles", "Boston Red Sox", "New York Yankees", "Tampa Bay Rays", "Toronto Blue Jays",
  "Chicago White Sox", "Cleveland Guardians", "Detroit Tigers", "Kansas City Royals", "Minnesota Twins",
  "Houston Astros", "Los Angeles Angels", "Athletics", "Seattle Mariners", "Texas Rangers",
  "Atlanta Braves", "Miami Marlins", "New York Mets", "Philadelphia Phillies", "Washington Nationals",
  "Chicago Cubs", "Cincinnati Reds", "Milwaukee Brewers", "Pittsburgh Pirates", "St. Louis Cardinals",
  "Arizona Diamondbacks", "Colorado Rockies", "Los Angeles Dodgers", "San Diego Padres", "San Francisco Giants",
];
const NFL_TEAMS = [
  "Arizona Cardinals", "Atlanta Falcons", "Baltimore Ravens", "Buffalo Bills", "Carolina Panthers",
  "Chicago Bears", "Cincinnati Bengals", "Cleveland Browns", "Dallas Cowboys", "Denver Broncos",
  "Detroit Lions", "Green Bay Packers", "Houston Texans", "Indianapolis Colts", "Jacksonville Jaguars",
  "Kansas City Chiefs", "Las Vegas Raiders", "Los Angeles Chargers", "Los Angeles Rams", "Miami Dolphins",
  "Minnesota Vikings", "New England Patriots", "New Orleans Saints", "New York Giants", "New York Jets",
  "Philadelphia Eagles", "Pittsburgh Steelers", "San Francisco 49ers", "Seattle Seahawks",
  "Tampa Bay Buccaneers", "Tennessee Titans", "Washington Commanders",
];
// nickname = last word except the two-word ones
const NICK_OVERRIDE = { "Boston Red Sox": "Red Sox", "Chicago White Sox": "White Sox", "Toronto Blue Jays": "Blue Jays" };
const nick = (full) => NICK_OVERRIDE[full] ?? full.split(" ").pop();
const nickMap = (list) => {
  const m = new Map();
  for (const t of list) { m.set(t.toLowerCase(), t); m.set(nick(t).toLowerCase(), t); }
  return m;
};
const MLB_BY_NAME = nickMap(MLB_TEAMS);
const NFL_BY_NAME = nickMap(NFL_TEAMS);
// tracker slug used by scripts/mlb-confirmed/<date>.json
const MLB_SLUG = Object.fromEntries(MLB_TEAMS.map((t) => [t, slugify(nick(t))]));

// NFL schedule post filename -> team
const NFL_POST_TEAM = {
  "49ers": "San Francisco 49ers", "arizona-cardinals": "Arizona Cardinals", "bears": "Chicago Bears",
  "bengals": "Cincinnati Bengals", "bills": "Buffalo Bills", "broncos": "Denver Broncos",
  "browns": "Cleveland Browns", "buccaneers": "Tampa Bay Buccaneers", "chargers": "Los Angeles Chargers",
  "chiefs": "Kansas City Chiefs", "colts": "Indianapolis Colts", "commanders": "Washington Commanders",
  "cowboys": "Dallas Cowboys", "dolphins": "Miami Dolphins", "eagles": "Philadelphia Eagles",
  "falcons": "Atlanta Falcons", "jaguars": "Jacksonville Jaguars", "jets": "New York Jets",
  "lions": "Detroit Lions", "new-york-giants": "New York Giants", "packers": "Green Bay Packers",
  "panthers": "Carolina Panthers", "patriots": "New England Patriots", "raiders": "Las Vegas Raiders",
  "rams": "Los Angeles Rams", "ravens": "Baltimore Ravens", "saints": "New Orleans Saints",
  "seahawks": "Seattle Seahawks", "steelers": "Pittsburgh Steelers", "texans": "Houston Texans",
  "titans": "Tennessee Titans", "vikings": "Minnesota Vikings",
};

// Soccer: the grids use short forms, the graded headings use long ones.
// Canonical = the longest form the site itself uses in a heading.
const SOCCER_ALIAS = {
  "man united": "Manchester United", "manchester united": "Manchester United", "man utd": "Manchester United",
  "man city": "Manchester City", "manchester city": "Manchester City",
  "leeds": "Leeds United", "leeds united": "Leeds United",
  "newcastle": "Newcastle United", "newcastle united": "Newcastle United",
  "spurs": "Tottenham", "tottenham": "Tottenham", "tottenham hotspur": "Tottenham",
  "forest": "Nottingham Forest", "nottingham forest": "Nottingham Forest",
  "palace": "Crystal Palace", "crystal palace": "Crystal Palace",
  "hull": "Hull City", "hull city": "Hull City",
  "ipswich": "Ipswich Town", "ipswich town": "Ipswich Town",
  "coventry": "Coventry City", "coventry city": "Coventry City",
  "villa": "Aston Villa", "aston villa": "Aston Villa",
  "brighton": "Brighton", "brighton & hove albion": "Brighton", "brighton and hove albion": "Brighton",
  "wolves": "Wolves", "wolverhampton": "Wolves", "wolverhampton wanderers": "Wolves",
  "west ham": "West Ham", "west ham united": "West Ham",
  "atletico": "Atletico Madrid", "atletico madrid": "Atletico Madrid", "atlético madrid": "Atletico Madrid",
  "real madrid": "Real Madrid", "inter": "Inter", "inter milan": "Inter",
  "bayern": "Bayern Munich", "bayern munich": "Bayern Munich",
  "dortmund": "Borussia Dortmund", "borussia dortmund": "Borussia Dortmund",
  "psg": "PSG", "paris saint-germain": "PSG", "leipzig": "RB Leipzig", "rb leipzig": "RB Leipzig",
  "brugge": "Club Brugge", "club brugge": "Club Brugge", "bodo/glimt": "Bodo/Glimt", "bodo glimt": "Bodo/Glimt",
};
const soccerTeam = (raw) => {
  const s = decode(raw);
  return SOCCER_ALIAS[s.toLowerCase()] ?? s;
};
// Loose match for score lines ("Forest 0, Leeds 1"): alias first, then token overlap.
const soccerMatch = (name, candidates) => {
  const canon = SOCCER_ALIAS[decode(name).toLowerCase()];
  if (canon && candidates.includes(canon)) return canon;
  const tok = decode(name).toLowerCase().split(/\s+/);
  const hit = candidates.filter((c) => {
    const ct = c.toLowerCase().split(/[\s/]+/);
    return tok.every((t) => ct.includes(t)) || ct.every((t) => tok.includes(t));
  });
  return hit.length === 1 ? hit[0] : null;
};

// ---- shared parsers ----------------------------------------------------------
// "## Friday, September 11" -> "2026-09-11"
const DAY_HEAD = /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+([A-Za-z]+)\s+(\d{1,2})\s*$/;
function dayHeading(text, year) {
  const m = text.match(DAY_HEAD);
  if (!m) return null;
  const mo = MONTHS[m[1].toLowerCase()];
  return mo ? iso(year, mo, Number(m[2])) : null;
}
// splits markdown on "## " headings, keeps the heading text with each chunk
function sections(md, level) {
  const re = new RegExp(`^${"#".repeat(level)} (.+)$`, "m");
  const parts = md.split(new RegExp(`^(?=${"#".repeat(level)} )`, "m"));
  return parts
    .map((chunk) => {
      const m = chunk.match(re);
      return m ? { heading: m[1].trim(), body: chunk.slice(m[0].length) } : null;
    })
    .filter(Boolean);
}
// "Final · Twins 4, Royals 3" -> [["Twins",4],["Royals",3]]
function namedScores(text) {
  const m = decode(text).match(/([A-Za-z.' ]+?)\s+(\d+),\s+([A-Za-z.' ]+?)\s+(\d+)/);
  return m ? [[m[1].trim(), Number(m[2])], [m[3].trim(), Number(m[4])]] : null;
}
function assignScores(row, pairs, resolve) {
  if (!pairs) return;
  for (const [name, n] of pairs) {
    const team = resolve(name);
    if (team === row.homeTeam) row.homeScore = n;
    else if (team === row.awayTeam) row.awayScore = n;
  }
  if (row.homeScore === null || row.awayScore === null) {
    row.homeScore = row.awayScore = null;
    notes.push(`score names did not map for ${row.gameKey}: ${pairs.map((p) => p.join(" ")).join(", ")}`);
  }
}

// ---- 1. MLB daily tracker ----------------------------------------------------
function parseMlb() {
  const file = "mlb-uniform-tracker-2026.md";
  const md = readPost(file);
  const year = Number((md.match(/^date:\s*"(\d{4})/m) || [])[1] || 2026);
  const url = postUrl(file);
  const H3 = /^(.+?) at (.+?)(?:,\s*Game (\d+)|\s*\((?:Doubleheader )?Game (\d+)\))?\s*$/;
  const PILL = /letter-spacing: 2px; display: inline-block;">([^<]*)<\/span>/;
  // team label line then the swatch + uniform name line, once per side
  const SIDE = /line-height: 1\.2;">([^<]+)<\/p>\s*<p[^>]*><span[^>]*background: (#[0-9A-Fa-f]{3,6})[^>]*><\/span>([^<]+)<\/p>/g;
  const GRADE = /Matchup Grade:\s*([0-9.]+)\s*\/\s*10/;
  const resolve = (n) => MLB_BY_NAME.get(decode(n).toLowerCase()) ?? null;

  let postponed = 0, lateGame = 0;
  for (const day of sections(md, 2)) {
    const date = dayHeading(day.heading, year);
    if (!date) continue;
    for (const game of sections(day.body, 3)) {
      const h = game.heading.match(H3);
      if (!h) { bad(file, `${date} ### ${game.heading}`); continue; }
      const away = resolve(h[1]), home = resolve(h[2]);
      if (!away || !home) { bad(file, `${date} ### ${game.heading} (team not recognised)`); continue; }
      const gameNo = Number(h[3] || h[4] || 1);
      const pill = decode((game.body.match(PILL) || [])[1] || "");
      if (/^postponed/i.test(pill)) { postponed++; continue; }
      const sides = [...game.body.matchAll(SIDE)].slice(0, 2);
      if (sides.length < 2) { bad(file, `${date} ### ${game.heading} (found ${sides.length} jersey tiles)`); continue; }
      const row = blank();
      row.league = "mlb"; row.season = String(year); row.date = date;
      row.gameKey = `mlb-${date}-${slugify(nick(away))}-${slugify(nick(home))}${gameNo > 1 ? `-g${gameNo}` : ""}`;
      row.homeTeam = home; row.awayTeam = away;
      row.awayUniform = decode(sides[0][3]); row.homeUniform = decode(sides[1][3]);
      row.status = "confirmed";
      const scores = namedScores(pill); // a pill carrying a score is a final even without the word
      if (/^late game/i.test(pill)) lateGame++;
      else if (!/^final/i.test(pill) && !scores) bad(file, `${date} ### ${game.heading} (pill "${pill}")`);
      assignScores(row, scores, resolve);
      const g = game.body.match(GRADE);
      row.grade = g ? `${g[1]}/10` : null;
      row.source = `${POSTS}/${file}`; row.sourceUrl = url;
      rows.push(row);
    }
  }
  if (postponed) notes.push(`mlb: skipped ${postponed} Postponed card(s), no game was played`);
  if (lateGame) notes.push(`mlb: ${lateGame} "Late Game" card(s) kept as confirmed with null scores (tiles were logged, the final never patched)`);
  validateMlb();
}

// scripts/mlb-confirmed/<date>.json is the slug -> uniform label the day
// script was fed; agreeing with it is a cheap sanity check on the parser.
// The early JSONs spell labels loosely ("Road Grays", "Home Pinstripes"), so
// compare a normalised form and only print the substantive disagreements.
const uniNorm = (s) =>
  String(s).toLowerCase()
    .replace(/\b(grays|whites|pinstripes)\b/g, (w) => w.replace(/s$/, ""))
    .replace(/\bhome white pinstripe\b/g, "home pinstripe")
    .replace(/\b(alternate|script)\b/g, "")
    .replace(/\s+/g, " ").trim();
function validateMlb() {
  const dir = "scripts/mlb-confirmed";
  if (!fs.existsSync(dir)) return;
  let checked = 0, mismatched = 0;
  for (const f of fs.readdirSync(dir)) {
    const date = f.replace(/\.json$/, "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    let map;
    try { map = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { continue; }
    for (const r of rows) {
      if (r.league !== "mlb" || r.date !== date) continue;
      for (const [team, uni] of [[r.homeTeam, r.homeUniform], [r.awayTeam, r.awayUniform]]) {
        const want = map[MLB_SLUG[team]];
        if (want === undefined) continue;
        checked++;
        if (uniNorm(want) !== uniNorm(uni)) { mismatched++; notes.push(`mlb ${date} ${team}: tracker says "${uni}", mlb-confirmed says "${want}" (tracker wins)`); }
      }
    }
  }
  if (checked) notes.push(`mlb: ${checked} tiles cross-checked against scripts/mlb-confirmed, ${mismatched} mismatch(es)`);
}

// ---- 2. NFL uniform tracker ------------------------------------------------
function parseNflTracker() {
  const file = "nfl-uniform-tracker-2026.md";
  const md = readPost(file);
  const year = Number((md.match(/^date:\s*"(\d{4})/m) || [])[1] || 2026);
  const url = postUrl(file);
  const resolve = (n) => NFL_BY_NAME.get(decode(n).toLowerCase()) ?? null;
  const TEAM = /text-align:(?:left|right);">([^<]+)<\/p>/;
  const BAR = /background:(#[0-9A-Fa-f]{3,6})/g;
  const LABEL = /color:#a6acb7;text-align:(?:left|right);">([^<]+)<\/p>/;
  const GRADE = /letter-spacing:-\.5px;">([^<]+)<\/span>/;

  let unplayed = 0;
  for (const day of sections(md, 2)) {
    const date = dayHeading(day.heading, year);
    if (!date) continue;
    for (const game of sections(day.body, 3)) {
      const h = game.heading.match(/^(.+?) at (.+?)\s*$/);
      if (!h) { bad(file, `${date} ### ${game.heading}`); continue; }
      const away = resolve(h[1]), home = resolve(h[2]);
      if (!away || !home) { bad(file, `${date} ### ${game.heading} (team not recognised)`); continue; }
      const card = game.body.split("\n").find((l) => l.startsWith('<div style="border:1px solid #e3e6ec'));
      if (!card) { bad(file, `${date} ### ${game.heading} (no card)`); continue; }
      const halves = card.split(/>AT<\/span>/);
      if (halves.length !== 2) { bad(file, `${date} ### ${game.heading} (card has no AT divider)`); continue; }
      const sides = halves.map((half, i) => {
        // the right half also carries the grade footer; cut it off first
        const body = i === 1 ? half.split("border-top:1px solid #eef0f4")[0] : half;
        const bars = [...body.matchAll(BAR)].map((m) => m[1].toUpperCase());
        return { team: decode((body.match(TEAM) || [])[1] || ""), bars, label: decode((body.match(LABEL) || [])[1] || "") };
      });
      if (sides.some((s) => s.bars.length < 3 || !s.label)) { bad(file, `${date} ### ${game.heading} (bars/label missing)`); continue; }
      if (!sides.every((s) => /^final$/i.test(s.label))) { unplayed++; continue; }
      const row = blank();
      row.league = "nfl"; row.season = String(year); row.date = date;
      row.gameKey = `nfl-${date}-${slugify(nick(away))}-${slugify(nick(home))}`;
      row.homeTeam = home; row.awayTeam = away;
      // the last three bars on each half are Helmet, Jersey, Pants in that order
      const [ah, aj, ap] = sides[0].bars.slice(-3);
      const [hh, hj, hp] = sides[1].bars.slice(-3);
      row.awayHelmet = ah; row.awayUniform = aj; row.awayPants = ap;
      row.homeHelmet = hh; row.homeUniform = hj; row.homePants = hp;
      row.status = "confirmed";
      const g = decode((card.match(GRADE) || [])[1] || "");
      row.grade = g && g !== "–" ? g : null;
      row.source = `${POSTS}/${file}`; row.sourceUrl = url;
      rows.push(row);
    }
  }
  if (unplayed) notes.push(`nfl tracker: skipped ${unplayed} card(s) labelled "Not yet worn" (includes the preseason archive cards that were never logged)`);
}

// ---- 3. Premier League + Champions League kit schedules ------------------
function parseSoccer(file, league) {
  const md = readPost(file);
  const url = postUrl(file);
  const season = "2026-27";
  const yearFor = (mo) => (mo >= 7 ? 2026 : 2027);
  const fixKey = (home, away) => `${home}|${away}`;

  // grades: "### Home vs Away: A+" headings and close-up result lines
  const grades = new Map();
  for (const sec of sections(md, 3)) {
    const h = sec.heading.match(/^(.+?) vs (.+?)(?::\s*([A-F][+-]?))?\s*$/);
    if (!h) continue;
    const key = fixKey(soccerTeam(h[1]), soccerTeam(h[2]));
    const inline = sec.body.match(/Graded\s+([A-F][+-]?)\s*</);
    const g = h[3] || (inline && inline[1]);
    if (g) grades.set(key, g);
  }

  const CARD = new RegExp(
    'letter-spacing: 1px; color: #[0-9a-fA-F]{3,6};">(MON|TUE|WED|THU|FRI|SAT|SUN) &middot; ([A-Z]{3}) (\\d{1,2})</div>\\s*' +
    '<div style="font-size: 0\\.95em[^>]*>([^<]+)</div>\\s*' +
    '<div style="font-size: 0\\.78em; font-weight: 700; color: ([^;"]+);">([^<]*)</div>\\s*' +
    '<div style="font-size: 0\\.78em; font-weight: 700; color: ([^;"]+);">([^<]*)</div>\\s*' +
    '(?:<div style="font-size: 0\\.7em[^>]*>([^<]*)</div>)?',
    "g",
  );
  const CONFIRMED = "#1a7f37";
  let count = 0;
  for (const m of md.matchAll(CARD)) {
    count++;
    const [, , mon, dd, fixture, c1, k1, c2, k2, foot] = m;
    const mo = MONTHS[mon.toLowerCase()];
    if (!mo) { bad(file, `chip ${mon} ${dd} ${fixture}`); continue; }
    const fx = decode(fixture).match(/^(.+?) vs (.+)$/);
    if (!fx) { bad(file, `fixture "${decode(fixture)}"`); continue; }
    const home = soccerTeam(fx[1]), away = soccerTeam(fx[2]);
    const date = iso(yearFor(mo), mo, Number(dd));
    const footer = decode(foot || "");
    const played = /^(full time|final)\b/i.test(footer);

    const kit = (txt, colour) => {
      const t = decode(txt);
      if (/to be confirmed/i.test(t)) {
        const label = t.replace(/,?\s*to be confirmed/i, "").trim();
        return { status: "tbc", label: /^(kit)?$/i.test(label) ? null : label };
      }
      if (/expected/i.test(t)) return { status: "expected", label: t.replace(/,?\s*expected/i, "").trim() || null };
      if (colour.toLowerCase() === CONFIRMED || played) return { status: "confirmed", label: t || null };
      return { status: "expected", label: t || null };
    };
    const kh = kit(k1, c1), ka = kit(k2, c2);
    const rank = { tbc: 0, expected: 1, confirmed: 2 };
    const status = rank[kh.status] <= rank[ka.status] ? kh.status : ka.status;

    const row = blank();
    row.league = league; row.season = season; row.date = date;
    row.gameKey = `${league}-${date}-${slugify(away)}-${slugify(home)}`;
    row.homeTeam = home; row.awayTeam = away;
    row.homeUniform = kh.label; row.awayUniform = ka.label;
    row.status = status;
    if (played) {
      const num = footer.match(/(?:full time|final)\s*·\s*(\d+)\s*-\s*(\d+)/i);
      if (num) { row.homeScore = Number(num[1]); row.awayScore = Number(num[2]); }
      else assignScores(row, namedScores(footer), (n) => soccerMatch(n, [home, away]));
    }
    const gm = footer.match(/Graded\s+([A-F][+-]?)/i);
    row.grade = grades.get(fixKey(home, away)) ?? (gm ? gm[1] : null);
    row.source = `${POSTS}/${file}`; row.sourceUrl = url;
    rows.push(row);
  }
  if (!count) bad(file, "no matchday cards matched");
}

// ---- 4. NFL team schedule posts ---------------------------------------------
// Mirrors lib/nflWeek.ts: the same WEEK / opponent / label cell markup.
function parseNflSchedules() {
  const CELL_RE = /<div style="font-size: 0\.68em[^>]*>WEEK (\d+)<\/div><div style="font-size: 0\.95em[^>]*>([^<]+)<\/div><div style="font-size: 0\.76em[^>]*>([^<]+)<\/div>/g;
  const files = fs.readdirSync(POSTS).filter((f) => f.endsWith("-uniform-schedule-2026.md")).sort();

  // pass 1: read every cell. A neutral-site cell can read "Colts · London" with
  // no vs/at, so the home side is settled in pass 2 from the opponent's post.
  const cells = []; // { file, team, week, opp, side: "vs"|"at"|null, label }
  const sideOf = new Map(); // `${team}|${week}|${opp}` -> "vs"|"at"
  for (const file of files) {
    const md = readPost(file);
    const found = [...md.matchAll(CELL_RE)];
    if (!found.length) continue; // MLB/NBA/NHL schedule posts have no WEEK cells
    const team = NFL_POST_TEAM[file.replace(/-uniform-schedule-2026\.md$/, "")];
    if (!team) { bad(file, "WEEK cells but the post is not in the NFL team map"); continue; }
    const seen = new Set();
    for (const [, wk, oppRaw, labelRaw] of found) {
      const week = Number(wk);
      const oppText = decode(oppRaw);
      if (/^bye\b/i.test(oppText)) continue;
      // "vs Bears", "at Panthers", "vs Commanders (LDN)", "Colts · London"
      const om = oppText.match(/^(?:(vs|at)\s+)?(.+?)(?:\s*\(.*\)|\s*·.*)?$/i);
      const opp = om && NFL_BY_NAME.get(om[2].trim().toLowerCase());
      if (!opp) { bad(file, `WEEK ${week} "${oppText}" "${decode(labelRaw)}"`); continue; }
      if (seen.has(week)) continue; // a post repeating a week's cell is not a second game
      seen.add(week);
      const side = om[1] ? om[1].toLowerCase() : null;
      if (side) sideOf.set(`${team}|${week}|${opp}`, side);
      cells.push({ file, team, week, opp, side, label: decode(labelRaw) });
    }
  }

  // pass 2: rows
  const posts = new Set();
  const conflicts = new Set();
  for (const c of cells) {
    let side = c.side;
    const back = sideOf.get(`${c.opp}|${c.week}|${c.team}`);
    if (!side) {
      if (back) { side = back === "vs" ? "at" : "vs"; notes.push(`nfl schedules: ${c.file} WEEK ${c.week} "${c.opp}" has no vs/at; the ${nick(c.opp)} post lists it as "${back}", so ${side === "vs" ? c.team : c.opp} is home`); }
      else { bad(c.file, `WEEK ${c.week} "${c.opp}" has no vs/at and the opponent's post does not settle it`); continue; }
    }
    posts.add(c.file);
    const isHome = side === "vs";
    const home = isHome ? c.team : c.opp, away = isHome ? c.opp : c.team;
    // Both posts claiming "vs" (or both "at") is a neutral-site game written
    // loosely. Each row keeps its own post's claim, but the key is alphabetical
    // so the two rows still join, and the conflict is printed for a fix.
    let key = `nfl-2026-wk${c.week}-${slugify(nick(away))}-${slugify(nick(home))}`;
    if (back && back === side) {
      const pair = [nick(c.team), nick(c.opp)].sort();
      key = `nfl-2026-wk${c.week}-${slugify(pair[0])}-${slugify(pair[1])}`;
      const tag = `WEEK ${c.week} ${pair.join(" / ")}`;
      if (!conflicts.has(tag)) { conflicts.add(tag); notes.push(`nfl schedules: ${tag}: both posts say "${side}", so the home side is unresolved; rows keep each post's claim under the shared key ${key}`); }
    }
    const starred = c.label.startsWith("★");
    // "Navy · MNF", "White · Thanksgiving": the jersey is the first segment
    const uniform = c.label.replace(/^★\s*/, "").split("·")[0].trim() || null;
    const row = blank();
    row.league = "nfl"; row.season = "2026"; row.date = null;
    row.gameKey = key;
    row.homeTeam = home; row.awayTeam = away;
    if (isHome) row.homeUniform = uniform; else row.awayUniform = uniform;
    row.status = starred ? "announced" : "expected";
    row.source = `${POSTS}/${c.file}`; row.sourceUrl = postUrl(c.file);
    rows.push(row);
  }
  notes.push(`nfl schedules: ${posts.size} team posts read; one row per cell, so each game appears twice (once from each side's post) with only that side's jersey filled in`);
}

// ---- run ----------------------------------------------------------------------
parseMlb();
parseNflTracker();
parseSoccer("premier-league-kit-schedule-2026-27.md", "epl");
parseSoccer("champions-league-kit-schedule-2026-27.md", "ucl");
parseNflSchedules();

const LEAGUE_ORDER = { mlb: 0, nfl: 1, epl: 2, ucl: 3 };
rows.sort((a, b) =>
  (LEAGUE_ORDER[a.league] - LEAGUE_ORDER[b.league]) ||
  String(a.date ?? "9999").localeCompare(String(b.date ?? "9999")) ||
  a.gameKey.localeCompare(b.gameKey, undefined, { numeric: true }) ||
  a.source.localeCompare(b.source));

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify(rows, null, 2) + "\n");
const csvCell = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
fs.writeFileSync(OUT_CSV, [KEYS.join(","), ...rows.map((r) => KEYS.map((k) => csvCell(r[k])).join(","))].join("\n") + "\n");

// ---- summary -----------------------------------------------------------------
const byLeague = {};
for (const r of rows) {
  const L = (byLeague[r.league] ??= { total: 0, status: {}, min: null, max: null });
  L.total++;
  L.status[r.status] = (L.status[r.status] || 0) + 1;
  if (r.date) {
    if (!L.min || r.date < L.min) L.min = r.date;
    if (!L.max || r.date > L.max) L.max = r.date;
  }
}
console.log(`wrote ${rows.length} rows -> ${OUT_JSON}, ${OUT_CSV}\n`);
for (const [league, L] of Object.entries(byLeague)) {
  const st = Object.entries(L.status).map(([k, v]) => `${k} ${v}`).join(", ");
  const range = L.min ? `${L.min} .. ${L.max}` : "no dates";
  console.log(`${league.padEnd(4)} ${String(L.total).padStart(5)} rows   ${range}   (${st})`);
}
if (notes.length) { console.log("\nnotes:"); for (const n of notes) console.log(`  - ${n}`); }
console.log(`\nunreadable cards: ${unreadable.length}`);
for (const u of unreadable) console.log(`  ${u.source}: ${u.snippet}`);
