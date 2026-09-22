#!/usr/bin/env node
// Writes the dated "what are they wearing tonight" block into all 30 MLB team
// uniform-schedule posts. Run it as part of the morning MLB pass:
//   node scripts/mlb-wearing-blocks.mjs [YYYY-MM-DD]
//
// Why this exists: the team SCHEDULE posts are what rank for "what jerseys are
// the <team> wearing today" (Phillies 193 clicks / 28d, Red Sox 209), but they
// answered with a static rotation rule rather than tonight's actual uniform,
// while the daily work went to the tracker pages instead. This puts the daily
// freshness on the pages that already rank.
//
// The block is labelled Expected until the uniform is confirmed. Overwrite the
// `uniform` field with the real jersey once it is known; re-running is safe.

import fs from "node:fs";
import path from "node:path";
import { fetchCaps } from "./mlb-caps.mjs";

const MARK = "data-mlb-wearing";
const ROOT = "content/posts";
const NAVY = "#14284b";

const SLUG = {
  "Baltimore Orioles":"orioles","Boston Red Sox":"red-sox","New York Yankees":"yankees",
  "Tampa Bay Rays":"rays","Toronto Blue Jays":"blue-jays","Chicago White Sox":"white-sox",
  "Cleveland Guardians":"guardians","Detroit Tigers":"tigers","Kansas City Royals":"royals",
  "Minnesota Twins":"twins","Houston Astros":"astros","Los Angeles Angels":"angels",
  "Athletics":"athletics","Seattle Mariners":"mariners","Texas Rangers":"rangers",
  "Atlanta Braves":"braves","Miami Marlins":"marlins","New York Mets":"mets",
  "Philadelphia Phillies":"phillies","Washington Nationals":"nationals","Chicago Cubs":"cubs",
  "Cincinnati Reds":"reds","Milwaukee Brewers":"brewers","Pittsburgh Pirates":"pirates",
  "St. Louis Cardinals":"cardinals","Arizona Diamondbacks":"diamondbacks",
  "Colorado Rockies":"rockies","Los Angeles Dodgers":"dodgers","San Diego Padres":"padres",
  "San Francisco Giants":"giants",
};
// Last word of the club name, EXCEPT where that is ambiguous or wrong. Without
// these three, both Sox pages rendered "What the Sox Are Wearing" and Toronto
// rendered "What the Jays Are Wearing". Same override list as mlb-tracker-day.mjs.
const SHORT_OVERRIDE = { "red-sox":"Red Sox", "white-sox":"White Sox", "blue-jays":"Blue Jays" };
const SHORT = Object.fromEntries(Object.entries(SLUG).map(([n,s]) => [s, SHORT_OVERRIDE[s] ?? n.split(" ").pop()]));
// team-specific road/home naming where the generic label would be wrong
const ROAD = { padres:"Road Khakis", braves:"Road Atlanta Set" };
const HOME = { giants:"Home Creams", braves:"Home Braves Set" };

// `--league-only` writes just the league guide block and the slate file and
// leaves the 30 team posts alone. The full run (no flag) is still the daily pass.
const LEAGUE_ONLY = process.argv.includes("--league-only");
const date = process.argv.slice(2).find(a => /^\d{4}-\d{2}-\d{2}$/.test(a))
  || new Date().toISOString().slice(0,10);
const pretty = new Date(date + "T12:00:00Z").toLocaleDateString("en-US",
  { weekday:"long", month:"long", day:"numeric", year:"numeric", timeZone:"UTC" });

const api = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}`;
const data = await fetch(api).then(r => r.json());
const games = data?.dates?.[0]?.games ?? [];

// Confirmed uniforms for the date, if we have them yet. Fill this in as they
// come in during the evening pass, then re-run. Anything not listed stays
// labelled Expected.
//   scripts/mlb-confirmed/YYYY-MM-DD.json  ->  { "phillies": "Home Pinstripes" }
let confirmed = {};
const confirmedPath = `scripts/mlb-confirmed/${date}.json`;
if (fs.existsSync(confirmedPath)) {
  confirmed = JSON.parse(fs.readFileSync(confirmedPath, "utf8"));
  console.log(`  using ${Object.keys(confirmed).length} confirmed uniforms from ${confirmedPath}`);
}
// Doubleheaders: a "<slug>|<gameNumber>" key beats the plain key for that game,
// the same rule mlb-tracker-day.mjs uses. The team blocks describe the last game
// of the day, so on 9/22 the Rays post reads the gray from "rays|2".
const conf = (slug, gn) => confirmed[`${slug}|${gn}`] ?? confirmed[slug];

// Caps only ride along with a confirmed jersey, straight from the feed.
const caps = await fetchCaps(date, SLUG);

const state = {}; // slug -> {opp, home, time}
const slate = [];  // the night's games, earliest first, for the homepage band
for (const g of games) {
  const h = g.teams.home.team.name, a = g.teams.away.team.name;
  const t = new Date(g.gameDate).toLocaleTimeString("en-US",
    { hour:"numeric", minute:"2-digit", timeZone:"America/New_York" }) + " ET";
  const gn = g.gameNumber ?? 1;
  if (SLUG[h]) state[SLUG[h]] = { opp: a, home: true,  time: t, gn };
  if (SLUG[a]) state[SLUG[a]] = { opp: h, home: false, time: t, gn };
  if (SLUG[h] && SLUG[a]) {
    slate.push({ away: a, awaySlug: SLUG[a], home: h, homeSlug: SLUG[h], time: t, start: g.gameDate, gameNumber: gn });
  }
}
slate.sort((x, y) => String(x.start).localeCompare(String(y.start)));

// The slate file is what the homepage MLB band counts against, so the band can
// say "N of M games confirmed" at build time without hitting the feed itself.
// One file per date, beside the confirmed uniforms it pairs with.
fs.mkdirSync("scripts/mlb-slate", { recursive: true });
fs.writeFileSync(
  `scripts/mlb-slate/${date}.json`,
  JSON.stringify({ date, games: slate.map(({ start, ...g }) => g) }, null, 2) + "\n",
);

function block(slug) {
  const s = state[slug];
  const team = SHORT[slug];
  let big, sub, line, why;
  if (!s) {
    big = "NO GAME TODAY";
    sub = `Check back on the next ${team} game`;
    line = `The ${team} are off.`;
    why = "";
  } else {
    const isConfirmed = Boolean(conf(slug, s.gn));
    big = isConfirmed ? conf(slug, s.gn) : (s.home ? (HOME[slug] || "Home Uniform") : (ROAD[slug] || "Road Grays"));
    sub = isConfirmed ? "Confirmed" : "Expected &middot; we confirm it the morning after";
    line = s.home ? `${s.opp} at ${team} &middot; ${s.time}` : `${team} at ${s.opp} &middot; ${s.time}`;
    why = isConfirmed
      ? `Confirmed for tonight's game against the ${s.opp.split(" ").pop()}.`
      : s.home
        ? "At home the exact jersey follows the rotation in the table below, which is set by the day of the week and whether it is a day or night game."
        : "Road games are the gray road set every time, regardless of the day.";
  }
  const colour = !s ? "#5a6472" : (conf(slug, s.gn) ? "#1a7f37" : "#14284b");
  // NOTE: emitted as a SINGLE line on purpose. A multi-line block made the
  // replace-regex run past its own closing tag and eat the following affiliate
  // block on re-run. One line means the match can only ever be this block.
  return `<div ${MARK} style="margin: 1.75em 0; border: 2px solid ${NAVY}; border-radius: 16px; overflow: hidden;">` +
    `<div style="background: ${NAVY}; padding: 9px 16px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">` +
    `<span style="font-size: 0.7em; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #ffffff;">What the ${team} Are Wearing</span>` +
    `<span style="font-size: 0.7em; font-weight: 700; color: rgba(255,255,255,0.9);">${pretty}</span></div>` +
    `<div style="padding: 1.5em; text-align: center; background: #ffffff;">` +
    `<div style="font-size: 2em; font-weight: 900; color: ${colour}; line-height: 1.1;">${big}</div>` +
    `<div style="font-size: 0.78em; color: #777; margin-top: 6px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${sub}</div>` +
    `<div style="margin-top: 14px; font-size: 1em; color: #1c1c1c; font-weight: 600;">${line}</div>` +
    (why ? `<div style="margin-top: 8px; font-size: 0.95em; color: #444; line-height: 1.55;">${why}</div>` : "") +
    (s && conf(slug, s.gn) && caps[slug] ? `<div data-cap="${caps[slug]}" style="margin-top: 10px; font-size: 0.9em; color: #1c1c1c; font-weight: 700;">Cap: ${caps[slug]}</div>` : "") +
    `<a href="/mlb-tracker/${slug}" style="display: inline-block; margin-top: 16px; padding: 10px 22px; background: ${NAVY}; color: #ffffff; border-radius: 999px; font-weight: 800; font-size: 0.85em; text-decoration: none;">Every jersey they have worn &rarr;</a>` +
    `</div></div>\n`;
}

// ---- the league guide's own dated block ------------------------------------
// The pillar guide (mlb-uniform-schedule-2026) is where the tracker sends
// "what are they wearing tonight" traffic, and until 2026-09-15 it answered
// nothing dated. Same mechanism as the team blocks: written by this script in
// the daily pass, one line, its own marker so the two never collide.
const LEAGUE_MARK = "data-mlb-league-wearing";
const LEAGUE_POST = path.join(ROOT, "mlb-uniform-schedule-2026.md");

function leagueBlock() {
  const confirmedGames = slate.filter(g => conf(g.awaySlug, g.gameNumber) && conf(g.homeSlug, g.gameNumber));
  const first = slate[0]?.time;
  let big, sub, line, colour, cta = "Every jersey worn tonight &rarr;";
  if (!slate.length) {
    big = "NO GAMES TODAY";
    sub = "Baseball is off";
    line = "There is no MLB slate today. Every jersey from our last logged night is on the daily tracker.";
    colour = "#5a6472";
    cta = "Every jersey we have logged &rarr;";
  } else if (!confirmedGames.length) {
    big = `0 of ${slate.length} Games Confirmed`;
    sub = "We confirm each one as the lineups come out";
    line = `${slate.length} games tonight, first pitch ${first}. Nothing is confirmed yet, so the tracker is the place to watch.`;
    colour = NAVY;
  } else {
    big = `${confirmedGames.length} of ${slate.length} Games Confirmed`;
    sub = "Confirmed by us, game by game";
    line = `${slate.length} games tonight, first pitch ${first}. We confirm each jersey as the lineups come out, so this number climbs through the night.`;
    colour = "#1a7f37";
  }
  const rows = confirmedGames.map(g =>
    `<div style="padding: 7px 0; border-bottom: 1px solid #f0f2f5; font-size: 0.92em; color: #1c1c1c; line-height: 1.45;">` +
    `<strong>${SHORT[g.awaySlug]}</strong> ${conf(g.awaySlug, g.gameNumber)} at <strong>${SHORT[g.homeSlug]}</strong> ${conf(g.homeSlug, g.gameNumber)}</div>`
  ).join("");
  return `<div ${LEAGUE_MARK} style="margin: 1.75em 0; border: 2px solid ${NAVY}; border-radius: 16px; overflow: hidden;">` +
    `<div style="background: ${NAVY}; padding: 9px 16px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">` +
    `<span style="font-size: 0.7em; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #ffffff;">What MLB Teams Are Wearing Tonight</span>` +
    `<span style="font-size: 0.7em; font-weight: 700; color: rgba(255,255,255,0.9);">${pretty}</span></div>` +
    `<div style="padding: 1.5em; text-align: center; background: #ffffff;">` +
    `<div style="font-size: 2em; font-weight: 900; color: ${colour}; line-height: 1.1;">${big}</div>` +
    `<div style="font-size: 0.78em; color: #777; margin-top: 6px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${sub}</div>` +
    `<div style="margin-top: 14px; font-size: 0.95em; color: #444; line-height: 1.55;">${line}</div>` +
    (rows ? `<div style="margin: 16px auto 0; max-width: 560px; text-align: left; border-top: 1px solid #e3e7ec;">${rows}</div>` : "") +
    `<a href="/stories/mlb-uniform-tracker-2026" style="display: inline-block; margin-top: 16px; padding: 10px 22px; background: ${NAVY}; color: #ffffff; border-radius: 999px; font-weight: 800; font-size: 0.85em; text-decoration: none;">${cta}</a>` +
    `</div></div>\n`;
}

function writeBlock(file, marker, html) {
  const re = new RegExp(`^<div ${marker}[^\\n]*\\n`, "m");
  let src = fs.readFileSync(file, "utf8");
  if (re.test(src)) {
    src = src.replace(re, html);
  } else {
    const parts = src.split("---");
    if (parts.length < 3) { console.error("!! frontmatter", file); process.exit(1); }
    const body = parts.slice(2).join("---").replace(/^\n+/, "");
    src = `---${parts[1]}---\n\n${html}\n${body}`;
  }
  src = src.replace(/^updatedDate:\s*['"]?[0-9-]+['"]?\s*$/m, `updatedDate: "${date}"`);
  fs.writeFileSync(file, src);
}

writeBlock(LEAGUE_POST, LEAGUE_MARK, leagueBlock());
console.log(`league guide block written for ${pretty} (${slate.length} games, ` +
  `${slate.filter(g => conf(g.awaySlug, g.gameNumber) && conf(g.homeSlug, g.gameNumber)).length} confirmed)`);

const re = new RegExp(`^<div ${MARK}[^\\n]*\\n`, "m");
let n = 0;
for (const slug of (LEAGUE_ONLY ? [] : Object.values(SLUG))) {
  const p = path.join(ROOT, `${slug}-uniform-schedule-2026.md`);
  if (!fs.existsSync(p)) { console.error("!! missing", p); process.exit(1); }
  let src = fs.readFileSync(p, "utf8");
  const b = block(slug);
  if (re.test(src)) {
    src = src.replace(re, b);
  } else {
    const parts = src.split("---");
    if (parts.length < 3) { console.error("!! frontmatter", slug); process.exit(1); }
    const body = parts.slice(2).join("---").replace(/^\n+/, "");
    src = `---${parts[1]}---\n\n${b}\n${body}`;
  }
  src = src.replace(/^updatedDate:\s*['"]?[0-9-]+['"]?\s*$/m, `updatedDate: "${date}"`);
  fs.writeFileSync(p, src);
  n++;
}
console.log(`${n} MLB schedule posts updated for ${pretty} (${games.length} games)`);
