// Writes a "Key Dates" block into the 30 NBA team uniform-schedule posts.
//
// The posts shipped as closets with no dates on them. This adds the real
// 2026-27 dates readers search for — opening night, the home opener, Christmas
// Day, the finale — so the pages answer a question before the season starts.
//
// ⚠️ SOURCE MATTERS. ESPN's PER-TEAM schedule endpoint
// (/teams/<id>/schedule?season=2027) silently omits games: on 2026-08-27 it put
// the Thunder, Spurs, Lakers, Warriors, Nuggets and Clippers openers a day late
// and dropped four clubs' Christmas games entirely. Do not use it. This script
// sweeps the DATED SCOREBOARD endpoint day by day instead, which is complete:
// all 30 clubs come back with the same 80 published games, plus 12 league-wide
// TBD slots for the NBA Cup knockout. 80 published + 2 Cup-dependent = 82.
//
// Responses are cached under /.cache (gitignored) so re-runs are instant.
//
// Usage: node scripts/nba-schedule-key-dates.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const POSTS = join(root, "content", "posts");
const CACHE = join(root, ".cache", "nba-scoreboard-2026-27");

const SEASON_START = "2026-10-18";
const SEASON_END = "2027-04-15";

// slug (minus -uniform-schedule-2026-27.md) -> ESPN displayName.
const TEAMS = {
  "76ers": "Philadelphia 76ers", bucks: "Milwaukee Bucks", bulls: "Chicago Bulls",
  cavaliers: "Cleveland Cavaliers", celtics: "Boston Celtics", clippers: "LA Clippers",
  grizzlies: "Memphis Grizzlies", hawks: "Atlanta Hawks", hornets: "Charlotte Hornets",
  knicks: "New York Knicks", lakers: "Los Angeles Lakers", mavericks: "Dallas Mavericks",
  "miami-heat": "Miami Heat", nets: "Brooklyn Nets", nuggets: "Denver Nuggets",
  "oklahoma-city-thunder": "Oklahoma City Thunder", "orlando-magic": "Orlando Magic",
  pacers: "Indiana Pacers", pelicans: "New Orleans Pelicans", pistons: "Detroit Pistons",
  raptors: "Toronto Raptors", rockets: "Houston Rockets",
  "sacramento-kings": "Sacramento Kings", spurs: "San Antonio Spurs",
  suns: "Phoenix Suns", timberwolves: "Minnesota Timberwolves",
  "trail-blazers": "Portland Trail Blazers", "utah-jazz": "Utah Jazz",
  warriors: "Golden State Warriors", wizards: "Washington Wizards",
};

const START = "<!-- nba-key-dates:start -->";
const END = "<!-- nba-key-dates:end -->";

const fmt = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", timeZone: "UTC",
  });

async function sweep() {
  mkdirSync(CACHE, { recursive: true });
  const games = [];
  const seen = new Set();
  for (let d = new Date(`${SEASON_START}T00:00:00Z`); d <= new Date(`${SEASON_END}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10).replace(/-/g, "");
    const f = join(CACHE, `${key}.json`);
    let j;
    if (existsSync(f)) {
      j = JSON.parse(readFileSync(f, "utf8"));
    } else {
      const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${key}`);
      if (!r.ok) throw new Error(`ESPN scoreboard ${key}: ${r.status}`);
      j = await r.json();
      writeFileSync(f, JSON.stringify(j));
    }
    // ⚠️ Use the DATE WE QUERIED, not e.date. e.date is UTC, so a 7:30pm ET tip
    // is stamped the following calendar day and every night game lands on the
    // wrong date — which is what silently moved six openers and four Christmas
    // games the first time this ran. The scoreboard groups by US date already.
    const gameDate = `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`;
    for (const e of j.events ?? []) {
      const c = e.competitions[0];
      const home = c.competitors.find((x) => x.homeAway === "home").team.displayName;
      const away = c.competitors.find((x) => x.homeAway === "away").team.displayName;
      if (home === "TBD" || away === "TBD") continue; // NBA Cup knockout placeholders
      const id = `${gameDate}|${away}|${home}`;
      if (seen.has(id)) continue;
      seen.add(id);
      games.push({ date: gameDate, home, away });
    }
  }
  return games;
}

const row = (label, value, sub) =>
  `<div style="display: flex; align-items: baseline; gap: 12px; padding: 9px 4px; border-bottom: 1px solid #eef0f4;">` +
  `<span style="flex: 0 0 122px; font-size: 0.72em; font-weight: 800; text-transform: uppercase; letter-spacing: 1.4px; color: #8892a0;">${label}</span>` +
  `<span style="flex: 1 1 auto; font-size: 0.95em; color: #14284b; font-weight: 700;">${value}` +
  (sub ? `<span style="display: block; font-size: 0.85em; color: #57607a; font-weight: 600; margin-top: 2px;">${sub}</span>` : "") +
  `</span></div>`;

const games = await sweep();
console.log(`swept ${games.length} published games`);

let written = 0;
for (const [slug, name] of Object.entries(TEAMS)) {
  const file = join(POSTS, `${slug}-uniform-schedule-2026-27.md`);
  let md = readFileSync(file, "utf8");

  const mine = games
    .filter((g) => g.home === name || g.away === name)
    .map((g) => ({ date: g.date, isHome: g.home === name, opp: g.home === name ? g.away : g.home }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (mine.length !== 80) throw new Error(`${slug}: expected 80 published games, got ${mine.length}`);

  const opener = mine[0];
  const homeOpener = mine.find((g) => g.isHome);
  const xmas = mine.find((g) => g.date === "2026-12-25");
  const finale = mine[mine.length - 1];
  const homeCount = mine.filter((g) => g.isHome).length;
  const vs = (g) => `${g.isHome ? "vs" : "at"} ${g.opp}`;

  const hMatch = md.match(/^## The (.+) Game-by-Game Uniform Schedule$/m);
  if (!hMatch) { console.log(`SKIP ${slug}: no game-by-game heading`); continue; }
  const [heading, short] = [hMatch[0], hMatch[1]];

  const block =
    `${START}\n` +
    `<div style="margin: 1.5em 0; background: #ffffff; border: 1px solid #e3e7ec; border-radius: 14px; padding: 8px 18px 14px;">` +
    `<p style="margin: 10px 0 6px; font-size: 0.72em; font-weight: 800; text-transform: uppercase; letter-spacing: 1.6px; color: #2f6bed;">${short} 2026-27 Key Dates</p>` +
    row("Opening Night", fmt(opener.date), vs(opener)) +
    row("Home Opener", fmt(homeOpener.date), vs(homeOpener)) +
    (xmas
      ? row("Christmas Day", "Friday, December 25", vs(xmas))
      : row("Christmas Day", "Not on the slate", `${short} are not part of the five-game Christmas lineup`)) +
    row("Season Finale", fmt(finale.date), vs(finale)) +
    row("Home &amp; Road", `${homeCount} home, ${80 - homeCount} away`, "of the 80 games published so far") +
    `<p style="font-size: 0.75em; color: #8892a0; margin: 12px 0 2px; line-height: 1.5;">From the NBA&rsquo;s published 2026-27 schedule. Two more games per club are added once the NBA Cup knockout bracket is set, and dates can move for national television. The jersey worn in each game is logged below as the season runs.</p>` +
    `</div>\n${END}`;

  const existing = new RegExp(`${START}[\\s\\S]*?${END}\\n?`);
  md = existing.test(md)
    ? md.replace(existing, `${block}\n`)
    : md.replace(heading, `${heading}\n\n${block}\n`);
  md = md.replace(/^updatedDate:\s*["']?\d{4}-\d{2}-\d{2}["']?\s*$/m, 'updatedDate: "2026-08-27"');

  writeFileSync(file, md);
  written++;
  console.log(`ok  ${slug.padEnd(22)} opener ${opener.date} ${vs(opener).padEnd(28)} xmas ${xmas ? "YES" : "-"}`);
}
console.log(`\n${written} NBA schedule posts updated.`);
