#!/usr/bin/env node
// The Uniform Standings (weekly Monday series): every NFL, NBA and NHL team's
// record BY JERSEY, from our own game-by-game logs.
//
//   node scripts/uniform-standings.mjs                      # through the latest logged date
//   node scripts/uniform-standings.mjs --through 2026-11-23 # cut off at a date (US Eastern)
//   node scripts/uniform-standings.mjs --window 7           # "this week" length in days (default 7)
//
// READ-ONLY. Reads the three records files written by
// scripts/build-uniform-records.mjs (run that first if a night's logs are new):
//   content/data/uniform-records-2026.json        NFL, combos = helmet/jersey/pants
//   content/data/nba-uniform-records-2026-27.json NBA, one combo per jersey
//   content/data/nhl-uniform-records-2026-27.json NHL, one combo per sweater, W-L-OTL
// and the schedule posts' frontmatter (content/posts/*-uniform-schedule-2026*.md)
// for the outbound links. Prints markdown to stdout; writes nothing.
//
// Counting rules (same as lib/uniformRecords.ts):
//   - NFL combos are folded into one row per JERSEY (jerseyKey), across pants/helmets.
//   - Win % counts a tie as half a win. NHL uses points %: an OT/SO loss is half.
//   - Hot / cold lists need MIN games (below). Streaks: a "winless" run counts NHL
//     OT/SO losses and NFL ties as not-wins.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : dflt;
};
const MIN = { nfl: 3, nba: 5, nhl: 5 };
const TOP = 5;
const WINDOW = Number(arg("window", 7));

const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
const FILES = {
  nfl: read("content/data/uniform-records-2026.json"),
  nba: read("content/data/nba-uniform-records-2026-27.json"),
  nhl: read("content/data/nhl-uniform-records-2026-27.json"),
};
const latest = Object.values(FILES)
  .flatMap((f) => f.teams.flatMap((t) => t.combos.flatMap((c) => c.games.map((g) => g.date))))
  .sort()
  .at(-1);
const THROUGH = arg("through", latest);
const addDays = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const WEEK_START = addDays(THROUGH, -(WINDOW - 1)); // inclusive
const BEFORE = addDays(WEEK_START, -1);

// --- schedule posts: team slug -> post slug -------------------------------------------
const teamSlug = (name) => name.toLowerCase().replace(/[.&']/g, "").replace(/\s+/g, "-");
const SCHEDULE = { nfl: new Map(), nba: new Map(), nhl: new Map() };
const postsDir = path.join(ROOT, "content/posts");
for (const file of fs.readdirSync(postsDir)) {
  const m = /-uniform-schedule-(2026|2026-27)\.md$/.exec(file);
  if (!m) continue;
  const raw = fs.readFileSync(path.join(postsDir, file), "utf8");
  const fm = /^---\n([\s\S]*?)\n---/.exec(raw)?.[1] ?? "";
  const league = /^league:\s*"?([a-z]+)"?/m.exec(fm)?.[1];
  if (!SCHEDULE[league]) continue;
  // teams: ["a", "b"]  or a block list ("  - a").
  const inline = /^teams:\s*\[(.*)\]/m.exec(fm)?.[1];
  const block = /^teams:\s*\n((?:[ \t]+-[^\n]*\n?)+)/m.exec(fm)?.[1];
  const slugs = inline ? [...inline.matchAll(/"?([a-z0-9-]+)"?/g)].map((t) => t[1]) : block ? [...block.matchAll(/-\s*"?([a-z0-9-]+)"?/g)].map((t) => t[1]) : [];
  for (const t of slugs) SCHEDULE[league].set(t, file.replace(/\.md$/, ""));
}

// --- fold the files into one row per team jersey ---------------------------------------
const LEAGUE_NAME = { nfl: "NFL", nba: "NBA", nhl: "NHL" };
const lc = (s) => s.toLowerCase();
const gaps = [];

// Plain color words read lowercase ("red jersey"); named colors keep capitals
// ("Honolulu Blue jersey", "Midnight Green jersey"), as in lib/uniformRecords.ts.
const PLAIN = new Set(["white", "black", "silver", "gray", "grey", "gold", "red", "blue", "navy", "green", "orange", "purple", "brown", "teal", "aqua", "royal", "yellow", "burgundy", "pewter", "scarlet", "cream", "light", "powder", "and", "pink", "tan", "coral", "wine", "cardinal", "sand", "alabaster", "anthracite"]);
const colorWord = (s) => (s.split(/\s+/).every((w) => PLAIN.has(w.toLowerCase())) ? s.toLowerCase() : s);
function label(league, c) {
  const color = colorWord(c.jersey);
  if (league === "nfl") {
    // "red jersey"; with the official name when it says more than the color.
    return lc(c.jerseyName) === lc(c.jersey) ? `${color} jersey` : `${color} jersey (${c.jerseyName})`;
  }
  if (league === "nba") return `${color} jersey (${c.edition})`;
  // NHL: "blue home sweater", "white road sweater", "gray Hometown Remix".
  if (/^(Home|Road) Sweater$/.test(c.edition)) return `${color} ${lc(c.edition)}`;
  if (lc(c.edition) === `${lc(c.jersey)} sweater`) return `${color} sweater`;
  if (/^Hometown Remix/.test(c.edition)) return `${color} Hometown Remix${c.edition.includes(":") ? ` (${c.edition.split(":")[1].trim()})` : ""}`;
  // Thirds and specials: the official name, with the color in front when the name lacks one.
  return c.edition.toLowerCase().includes(lc(c.jersey)) ? c.edition : `${color} ${c.edition}`;
}

function rowsFor(league, cut) {
  const out = [];
  for (const t of FILES[league].teams) {
    if (t.missing?.length && cut === THROUGH)
      gaps.push(`${LEAGUE_NAME[league]} ${t.name}: ${t.missing.length} unlogged game(s): ${t.missing.map((g) => `${g.date} ${g.home ? "vs" : "at"} ${g.opponent}`).join(", ")}`);
    const byJersey = new Map();
    for (const c of t.combos) {
      const key = league === "nfl" ? c.jerseyKey : c.id;
      const r = byJersey.get(key) ?? { team: t, league, key, names: new Map(), color: c.jersey, edition: c.edition, img: c.img, games: [] };
      r.names.set(c.jerseyName, (r.names.get(c.jerseyName) ?? 0) + c.games.length);
      r.games.push(...c.games.filter((g) => g.date <= cut));
      byJersey.set(key, r);
    }
    for (const r of byJersey.values()) {
      if (r.names.size > 1 && cut === THROUGH)
        gaps.push(`${LEAGUE_NAME[league]} ${t.name}: one jersey photo (${r.key}) logged under ${r.names.size} names: ${[...r.names.keys()].join(" / ")}. Folded into one row.`);
      const jerseyName = [...r.names].sort((a, b) => b[1] - a[1])[0][0];
      r.label = label(league, { jersey: r.color, jerseyName, edition: r.edition });
      r.games.sort((a, b) => a.date.localeCompare(b.date));
      Object.assign(r, tally(league, r.games));
      if (r.n) out.push(r);
    }
  }
  return out;
}

function tally(league, games) {
  const w = games.filter((g) => g.result === "W").length;
  const otl = league === "nhl" ? games.filter((g) => g.result === "L" && g.ot).length : 0;
  const l = games.filter((g) => g.result === "L").length - otl;
  const t = games.filter((g) => g.result === "T").length;
  const n = games.length;
  const pct = n ? (w + t / 2 + otl / 2) / n : 0;
  return { w, l, t, otl, n, pct, streak: streak(games) };
}
function streak(games) {
  if (!games.length) return { kind: null, len: 0 };
  const won = (g) => g.result === "W";
  const kind = won(games.at(-1)) ? "W" : "winless";
  let len = 0;
  for (let i = games.length - 1; i >= 0 && won(games[i]) === (kind === "W"); i--) len++;
  return { kind, len, since: games[games.length - len].date };
}

const rec = (league, r) => (league === "nhl" ? `${r.w}-${r.l}-${r.otl}` : `${r.w}-${r.l}${r.t ? `-${r.t}` : ""}`);
const pct = (p) => (p === 1 ? "1.000" : p.toFixed(3).replace(/^0/, ""));
const MON = ["Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];
const day = (iso) => `${MON[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8))}`;
const teamLink = (t) => `[${t.name}](/uniform-records/${teamSlug(t.name)})`;
const nick = (t) => t.nickname;
const byName = (a, b) => a.team.name.localeCompare(b.team.name) || a.label.localeCompare(b.label);
const hotSort = (a, b) => b.pct - a.pct || b.n - a.n || byName(a, b);
const coldSort = (a, b) => a.pct - b.pct || b.n - a.n || byName(a, b);

function table(head, rows) {
  return [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");
}

const lines = [];
const say = (s = "") => lines.push(s);
say(`<!-- uniform-standings.mjs: through ${THROUGH}, week window ${WEEK_START} to ${THROUGH}, built ${new Date().toISOString().slice(0, 10)} -->`);
say(`# The Uniform Standings, Through ${day(THROUGH)}`);
say();
say(`Week window: ${day(WEEK_START)} to ${day(THROUGH)}. Minimum games for hot/cold: NFL ${MIN.nfl}, NBA ${MIN.nba}, NHL ${MIN.nhl}.`);

const summary = {};
for (const league of ["nfl", "nba", "nhl"]) {
  const L = LEAGUE_NAME[league];
  const now = rowsFor(league, THROUGH);
  const then = new Map(rowsFor(league, BEFORE).map((r) => [`${r.team.name}|${r.key}`, r]));
  const qual = now.filter((r) => r.n >= MIN[league]);
  const teamGames = now.reduce((s, r) => s + r.n, 0);
  const lastNfl = league === "nfl" ? Math.max(...now.flatMap((r) => r.games.map((g) => g.week ?? 0))) : null;
  summary[league] = { jerseys: now.length, qualified: qual.length, teamGames };

  say();
  say(`## ${L}`);
  say();
  say(`${now.length} jerseys worn, ${qual.length} with ${MIN[league]}+ games, ${teamGames} team-games logged${lastNfl ? ` (through Week ${lastNfl})` : ""}. File totals: ${JSON.stringify(FILES[league].totals)}.`);

  const fmtRow = (r) => [teamLink(r.team), r.label, rec(league, r), pct(r.pct), String(r.n)];
  const H = ["Team", "Jersey", league === "nhl" ? "W-L-OTL" : "Record", league === "nhl" ? "Pts %" : "Win %", "GP"];
  say();
  say(`### Hottest ${L} Jerseys (${MIN[league]}+ Games)`);
  say();
  const hot = [...qual].sort(hotSort);
  const hotCut = hot[TOP - 1]?.pct;
  say(table(H, hot.filter((r, i) => i < TOP || r.pct === hotCut).map(fmtRow)));
  say();
  say(`### Coldest ${L} Jerseys (${MIN[league]}+ Games)`);
  say();
  const cold = [...qual].sort(coldSort);
  const coldCut = cold[TOP - 1]?.pct;
  say(table(H, cold.filter((r, i) => i < TOP || r.pct === coldCut).map(fmtRow)));

  // Streaks alive (3+), any number of games.
  say();
  say(`### Active Streaks (3+ Games, Through ${day(THROUGH)})`);
  say();
  const streaks = now
    .filter((r) => r.streak.len >= 3)
    .sort((a, b) => b.streak.len - a.streak.len || (a.streak.kind === "W" ? -1 : 1) || byName(a, b));
  say(
    table(
      ["Team", "Jersey", "Streak", "Since", "Season"],
      streaks.map((r) => [teamLink(r.team), r.label, `${r.streak.kind === "W" ? "Won" : "Winless in"} ${r.streak.len}`, day(r.streak.since), rec(league, r)]),
    ),
  );

  // This week: movers among jerseys worn in the window.
  const moved = now
    .map((r) => {
      const before = then.get(`${r.team.name}|${r.key}`);
      const wk = r.games.filter((g) => g.date >= WEEK_START);
      return { r, before, wk: tally(league, wk) };
    })
    .filter((m) => m.wk.n > 0);
  say();
  say(`### This Week (${day(WEEK_START)} to ${day(THROUGH)})`);
  say();
  const bestWeek = [...moved].sort((a, b) => b.wk.w - a.wk.w || a.wk.n - b.wk.n || byName(a.r, b.r)).filter((m) => m.wk.w >= 2 || m.wk.n - m.wk.w >= 2);
  if (league !== "nfl") {
  say("Jerseys worn 2+ times this week:");
  say();
  say(
    table(
      ["Team", "Jersey", "This Week", "Before", "Now"],
      moved
        .filter((m) => m.wk.n >= 2)
        .sort((a, b) => b.wk.pct - a.wk.pct || b.wk.n - a.wk.n || byName(a.r, b.r))
        .map((m) => [teamLink(m.r.team), m.r.label, rec(league, m.wk), m.before ? rec(league, m.before) : "debut", rec(league, m.r)]),
    ),
  );
  }
  void bestWeek;
  // Status changes: unbeaten -> beaten, winless -> first win, debuts, entered the qualified pool.
  const changes = [];
  for (const m of moved) {
    const b = m.before;
    const label = `${nick(m.r.team)} ${m.r.label}`;
    if (!b) {
      changes.push(`DEBUT: ${label} went ${rec(league, m.r)} (${m.r.games.map((g) => `${day(g.date)} ${g.result} ${g.teamScore}-${g.oppScore} ${g.home ? "vs" : "at"} ${g.opponent}${g.ot ? ` ${typeof g.ot === "string" ? g.ot : "OT"}` : ""}`).join("; ")})`);
      continue;
    }
    if (b.w === b.n && b.n >= 2 && m.r.w < m.r.n) {
      const loss = m.r.games.find((g) => g.date >= WEEK_START && g.result !== "W");
      changes.push(`UNBEATEN RUN ENDED: ${label} was ${rec(league, b)}, now ${rec(league, m.r)} (first non-win ${day(loss.date)}, ${loss.teamScore}-${loss.oppScore} ${loss.home ? "vs" : "at"} ${loss.opponent})`);
    }
    if (b.w === 0 && b.n >= 2 && m.r.w > 0) {
      const win = m.r.games.find((g) => g.date >= WEEK_START && g.result === "W");
      changes.push(`FIRST WIN: ${label} was ${rec(league, b)}, now ${rec(league, m.r)} (${day(win.date)}, ${win.teamScore}-${win.oppScore} ${win.home ? "vs" : "at"} ${win.opponent})`);
    }
    if (b.n >= MIN[league] && Math.abs(m.r.pct - b.pct) >= 0.15)
      changes.push(`BIG MOVE: ${label} ${pct(b.pct)} -> ${pct(m.r.pct)} (${rec(league, b)} -> ${rec(league, m.r)})`);
  }
  say();
  say("Status changes this week:");
  say();
  for (const c of changes.sort()) say(`- ${c}`);
  if (!changes.length) say("- none");

  // Jersey gaps: the teams whose record swings most between two jerseys (each 3+ games).
  say();
  say(`### Biggest Jersey Gaps (Two Jerseys, 3+ Games Each)`);
  say();
  const gapRows = [];
  for (const team of FILES[league].teams) {
    const js = now.filter((r) => r.team === team && r.n >= 3).sort((a, b) => b.pct - a.pct);
    if (js.length >= 2) gapRows.push({ team, hi: js[0], lo: js.at(-1), gap: js[0].pct - js.at(-1).pct });
  }
  say(
    table(
      ["Team", "Best", "Worst", "Gap"],
      gapRows
        .sort((a, b) => b.gap - a.gap || a.team.name.localeCompare(b.team.name))
        .slice(0, 8)
        .map((g) => [teamLink(g.team), `${g.hi.label} ${rec(league, g.hi)}`, `${g.lo.label} ${rec(league, g.lo)}`, pct(g.gap)]),
    ),
  );

  // League-wide totals by jersey type (white vs color; edition).
  say();
  say(`### ${L} League-Wide By Jersey Type`);
  say();
  const kind = (r) =>
    league === "nfl"
      ? /white/i.test(r.color) ? "White jerseys" // off-white (Jaguars Bold City Alabaster) counts as color, as in nfl-teams-wearing-white-at-home-record-2026
         : "Color jerseys"
      : league === "nba"
        ? r.edition
        : /^(Home|Road) Sweater$/.test(r.edition) || /^Hometown Remix/.test(r.edition) ? r.edition.replace(/:.*/, "") : "Thirds, throwbacks and specials";
  const groups = new Map();
  for (const r of now) {
    for (const g of r.games) {
      const keys = [kind(r), `${kind(r)}, ${g.home ? "home" : "road"}`];
      for (const k of keys) groups.set(k, [...(groups.get(k) ?? []), g]);
    }
  }
  say(table(["Type", "Record", "Pct", "GP"], [...groups].map(([k, g]) => ({ k, ...tally(league, g) })).sort((a, b) => a.k.split(",")[0].localeCompare(b.k.split(",")[0]) || a.k.length - b.k.length || b.n - a.n).map((x) => [x.k, rec(league, x), pct(x.pct), String(x.n)])));

  // Team table.
  say();
  say(`### ${L} Uniform Standings: Every Team`);
  say();
  const teams = [...FILES[league].teams].sort((a, b) => a.name.localeCompare(b.name));
  say(
    table(
      ["Team", "Record", "Record By Jersey", "Schedule"],
      teams.map((t) => {
        const js = now.filter((r) => r.team === t).sort((a, b) => b.n - a.n || b.pct - a.pct || a.label.localeCompare(b.label));
        const all = tally(league, js.flatMap((r) => r.games));
        const sched = SCHEDULE[league].get(teamSlug(t.name));
        if (!sched) gaps.push(`${L} ${t.name}: no schedule post found to link.`);
        return [
          teamLink(t),
          rec(league, all),
          js.map((r) => `${r.label.replace(/ (jersey|sweater)\b/, "")} **${rec(league, r)}**`).join(" · "),
          sched ? `[Schedule](/stories/${sched})` : "",
        ];
      }),
    ),
  );
  // Sanity: per-team sum vs file's team record.
  for (const t of FILES[league].teams) {
    const js = now.filter((r) => r.team === t);
    const all = tally(league, js.flatMap((r) => r.games));
    if (THROUGH >= latest && all.w !== t.w) gaps.push(`${L} ${t.name}: jersey rows sum to ${all.w} wins, file says ${t.w}.`);
  }
}

say();
say("## Data Notes");
say();
for (const g of [...new Set(gaps)]) say(`- ${g}`);
if (!gaps.length) say("- none");
say(`- Summary: ${JSON.stringify(summary)}`);

process.stdout.write(lines.join("\n") + "\n");
