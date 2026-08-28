// Writes a "Key Dates" block into the 32 NHL team uniform-schedule posts.
//
// Sibling of scripts/nba-schedule-key-dates.mjs. The NHL posts shipped as
// closets with no dates on them, which left them thinner than the NBA set even
// though hockey's season starts three weeks earlier.
//
// ⚠️ SOURCE MATTERS — the same two traps the NBA script documents both bite here:
//
//   1. ESPN's PER-TEAM schedule endpoint silently omits games. Do not use it.
//      This sweeps the DATED SCOREBOARD day by day instead, which is complete:
//      all 32 clubs come back with 84 games each.
//   2. `e.date` is UTC. A 7:00pm ET puck drop is stamped the following calendar
//      day, so trusting e.date pushes most of the league's opener a day late.
//      We use the date we QUERIED, which is the US date the scoreboard groups by.
//
// ⚠️ The 2026-27 regular season runs TUESDAY, SEPTEMBER 29, 2026 through
// Saturday, April 10, 2027, and it is an EIGHTY-FOUR game schedule, not 82.
// Verified 2026-08-28: the sweep returns 1,344 distinct regular-season games
// with no duplicates, which is exactly 32 clubs x 84 / 2, and every club comes
// back at 84. Assuming an early-October start or an 82-game season drops real
// games and puts a wrong opener on all 32 pages.
//
// Outdoor games (Winter Classic, Stadium Series) are the most uniform-relevant
// dates in hockey, so the block carries a row for them — but only when one is
// actually in the feed. As of 2026-08-28 the NHL has not published them, so the
// row is omitted rather than printed as an empty promise. Re-run once they land.
//
// Responses are cached under /.cache (gitignored) so re-runs are instant.
//
// Usage: node scripts/nhl-schedule-key-dates.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const POSTS = join(root, "content", "posts");
const CACHE = join(root, ".cache", "nhl-scoreboard-2026-27");

const SEASON_START = "2026-09-20";
const SEASON_END = "2027-04-11";
const GAMES_PER_TEAM = 84;
const TODAY = "2026-08-28";

// slug (minus -uniform-schedule-2026-27.md) -> ESPN displayName.
const TEAMS = {
  avalanche: "Colorado Avalanche", blackhawks: "Chicago Blackhawks",
  "blue-jackets": "Columbus Blue Jackets", blues: "St. Louis Blues",
  bruins: "Boston Bruins", canadiens: "Montreal Canadiens",
  canucks: "Vancouver Canucks", capitals: "Washington Capitals",
  devils: "New Jersey Devils", ducks: "Anaheim Ducks", flames: "Calgary Flames",
  "florida-panthers": "Florida Panthers", flyers: "Philadelphia Flyers",
  "golden-knights": "Vegas Golden Knights", hurricanes: "Carolina Hurricanes",
  islanders: "New York Islanders", lightning: "Tampa Bay Lightning",
  "los-angeles-kings": "Los Angeles Kings", "maple-leafs": "Toronto Maple Leafs",
  "minnesota-wild": "Minnesota Wild", "new-york-rangers": "New York Rangers",
  oilers: "Edmonton Oilers", penguins: "Pittsburgh Penguins",
  predators: "Nashville Predators", "red-wings": "Detroit Red Wings",
  sabres: "Buffalo Sabres", "seattle-kraken": "Seattle Kraken",
  senators: "Ottawa Senators", sharks: "San Jose Sharks", stars: "Dallas Stars",
  "utah-mammoth": "Utah Mammoth", "winnipeg-jets": "Winnipeg Jets",
};

const START = "<!-- nhl-key-dates:start -->";
const END = "<!-- nhl-key-dates:end -->";

const fmt = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", timeZone: "UTC",
  });

async function sweep() {
  mkdirSync(CACHE, { recursive: true });
  const games = [];
  const seen = new Set();
  for (
    let d = new Date(`${SEASON_START}T00:00:00Z`);
    d <= new Date(`${SEASON_END}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const key = d.toISOString().slice(0, 10).replace(/-/g, "");
    const f = join(CACHE, `${key}.json`);
    let j;
    if (existsSync(f)) {
      j = JSON.parse(readFileSync(f, "utf8"));
    } else {
      const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=${key}`);
      if (!r.ok) throw new Error(`ESPN scoreboard ${key}: ${r.status}`);
      j = await r.json();
      writeFileSync(f, JSON.stringify(j));
    }
    // ⚠️ The date we QUERIED, never e.date — see the header note.
    const gameDate = `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`;
    for (const e of j.events ?? []) {
      // ⚠️ Preseason shares the scoreboard with the regular season in late
      // September. type 2 is the regular season; without this the sweep folds
      // exhibition games into the opener.
      if (e.season?.type !== 2) continue;
      const c = e.competitions[0];
      const home = c.competitors.find((x) => x.homeAway === "home")?.team.displayName;
      const away = c.competitors.find((x) => x.homeAway === "away")?.team.displayName;
      if (!home || !away || home === "TBD" || away === "TBD") continue;
      const id = `${gameDate}|${away}|${home}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const v = c.venue ?? {};
      games.push({
        date: gameDate, home, away,
        venue: v.fullName ?? "",
        city: v.address?.city ?? "",
        country: v.address?.country ?? "",
      });
    }
  }
  return games;
}

// A club's home arena is the venue it hosts in most often. Anything else it
// "hosts" is a neutral site: an outdoor game, or a game moved abroad. Those are
// exactly the games that get a one-off sweater, so they are worth surfacing.
function homeArenas(games) {
  const tally = new Map();
  for (const g of games) {
    if (!tally.has(g.home)) tally.set(g.home, new Map());
    const m = tally.get(g.home);
    m.set(g.venue, (m.get(g.venue) ?? 0) + 1);
  }
  const out = new Map();
  for (const [team, m] of tally) {
    out.set(team, [...m.entries()].sort((a, b) => b[1] - a[1])[0][0]);
  }
  return out;
}

// Two very different kinds of neutral-site game, and they read wrong if you
// merge them. ESPN's `indoor` flag cannot separate them on its own: AT&T
// Stadium reports indoor:true because of the roof, yet the February 2027 game
// there is a Stadium Series outdoor game.
const specialLabel = (g) =>
  g.country && g.country !== "USA" && g.country !== "Canada"
    ? "Global Series"
    : "Outdoor Game";

const row = (label, value, sub) =>
  `<div style="display: flex; align-items: baseline; gap: 12px; padding: 9px 4px; border-bottom: 1px solid #eef0f4;">` +
  `<span style="flex: 0 0 122px; font-size: 0.72em; font-weight: 800; text-transform: uppercase; letter-spacing: 1.4px; color: #8892a0;">${label}</span>` +
  `<span style="flex: 1 1 auto; font-size: 0.95em; color: #14284b; font-weight: 700;">${value}` +
  (sub ? `<span style="display: block; font-size: 0.85em; color: #57607a; font-weight: 600; margin-top: 2px;">${sub}</span>` : "") +
  `</span></div>`;

const games = await sweep();
console.log(`swept ${games.length} published games`);
const arenas = homeArenas(games);

let written = 0;
const neutralSeen = [];
for (const [slug, name] of Object.entries(TEAMS)) {
  const file = join(POSTS, `${slug}-uniform-schedule-2026-27.md`);
  let md = readFileSync(file, "utf8");

  const mine = games
    .filter((g) => g.home === name || g.away === name)
    .map((g) => ({
      date: g.date,
      isHome: g.home === name,
      opp: g.home === name ? g.away : g.home,
      venue: g.venue,
      city: g.city,
      country: g.country,
      neutral: g.venue !== arenas.get(g.home),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (mine.length !== GAMES_PER_TEAM) {
    throw new Error(`${slug}: expected ${GAMES_PER_TEAM} games, got ${mine.length}`);
  }

  const opener = mine[0];
  const homeOpener = mine.find((g) => g.isHome && !g.neutral);
  const special = mine.filter((g) => g.neutral);
  const finale = mine[mine.length - 1];
  const homeCount = mine.filter((g) => g.isHome).length;
  const vs = (g) => `${g.isHome ? "vs" : "at"} ${g.opp}`;
  for (const g of special) neutralSeen.push(`${slug} ${g.date} ${specialLabel(g)} ${g.venue}`);

  const hMatch = md.match(/^## The (.+) Game-by-Game Uniform Schedule$/m);
  if (!hMatch) { console.log(`SKIP ${slug}: no game-by-game heading`); continue; }
  const [heading, short] = [hMatch[0], hMatch[1]];

  const block =
    `${START}\n` +
    `<div style="margin: 1.5em 0; background: #ffffff; border: 1px solid #e3e7ec; border-radius: 14px; padding: 8px 18px 14px;">` +
    `<p style="margin: 10px 0 6px; font-size: 0.72em; font-weight: 800; text-transform: uppercase; letter-spacing: 1.6px; color: #2f6bed;">${short} 2026-27 Key Dates</p>` +
    // A club that starts at home would otherwise print the same game twice.
    (opener === homeOpener
      ? row("Opening Night", fmt(opener.date), `${vs(opener)} &middot; home opener`)
      : row("Opening Night", fmt(opener.date), vs(opener)) +
        row("Home Opener", fmt(homeOpener.date), vs(homeOpener))) +
    special
      .map((g) =>
        row(
          specialLabel(g),
          fmt(g.date),
          `${vs(g)} &middot; ${g.venue}, ${g.city}${g.country && g.country !== "USA" ? `, ${g.country}` : ""}`
        )
      )
      .join("") +
    row("Season Finale", fmt(finale.date), vs(finale)) +
    row("Home &amp; Road", `${homeCount} home, ${GAMES_PER_TEAM - homeCount} away`, `across the ${GAMES_PER_TEAM}-game season`) +
    `<p style="font-size: 0.75em; color: #8892a0; margin: 12px 0 2px; line-height: 1.5;">From the NHL&rsquo;s published 2026-27 schedule, which runs September 29 to April 10. Dates can move for national television. The sweater worn in each game is logged below as the season runs.</p>` +
    `</div>\n${END}`;

  // The posts shipped with a stock opening line: "<Club> open 2026-27 at
  // <their own arena> in October 2026." Both halves are wrong for most of the
  // league — the season starts September 29, and half the clubs open on the
  // road — and it sat three lines above a Key Dates block saying otherwise.
  // ESPN styles it "crypto.com Arena"; lowercase mid-sentence reads as a typo.
  const arena = (arenas.get(name) ?? "").replace(/^./, (c) => c.toUpperCase());
  // `.+?` not `[^.]+?`: Crypto.com Arena has a dot in it. The trailing phrase
  // anchors the match, and the guard below means an already-fixed post is a
  // no-op rather than a warning.
  const introRe = /^The .+? open 2026-27 at .+? in October 2026\./m;
  if (introRe.test(md)) {
    const intro = opener.isHome
      ? `The ${name} open 2026-27 at ${arena} on ${fmt(opener.date)} against the ${opener.opp}.`
      : `The ${name} open 2026-27 on the road against the ${opener.opp} on ${fmt(opener.date)}, ` +
        `then play the home opener at ${arena} on ${fmt(homeOpener.date)}.`;
    md = md.replace(introRe, intro);
  } else if (/in October 2026/.test(md)) {
    console.log(`NOTE ${slug}: stale October opener line present but unmatched`);
  }

  const existing = new RegExp(`${START}[\\s\\S]*?${END}\\n?`);
  md = existing.test(md)
    ? md.replace(existing, `${block}\n`)
    : md.replace(heading, `${heading}\n\n${block}\n`);
  md = md.replace(/^updatedDate:\s*["']?\d{4}-\d{2}-\d{2}["']?\s*$/m, `updatedDate: "${TODAY}"`);

  writeFileSync(file, md);
  written++;
  console.log(
    `ok  ${slug.padEnd(20)} opener ${opener.date} ${vs(opener).padEnd(26)} home ${homeOpener.date}  ${homeCount}H/${GAMES_PER_TEAM - homeCount}A`
  );
}
console.log(`\n${written} NHL schedule posts updated.`);
console.log(neutralSeen.length ? `neutral-site games found:\n  ${neutralSeen.join("\n  ")}` : "no neutral-site / outdoor games in the feed yet");
