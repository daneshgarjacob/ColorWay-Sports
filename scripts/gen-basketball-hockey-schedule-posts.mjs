// Builds the 2026-27 uniform schedule post for every NBA and NHL club.
//
// Why now, before a game has been played: the schedule post is the format that
// earns on this site, and the two winter leagues had none. These ship with the
// club's real uniform closet and its own ColorWay coverage, and the week-by-week
// grid gets filled in as uniforms are announced and games are played. Same shape
// as the NFL and MLB posts, so /nba-tracker and /nhl-tracker can read them later
// exactly the way /nfl-tracker reads the football grids.
//
// Related coverage is pulled from the posts already tagged with each club, so no
// two pages carry the same body: a club we have written about ten times links out
// ten different ways.
//
// Usage: node scripts/gen-basketball-hockey-schedule-posts.mjs [--force]
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const POSTS = resolve(root, "content/posts");
const FORCE = process.argv.includes("--force");

// name, primary hex, secondary hex, arena, conference/division
const NBA = [
  ["Atlanta Hawks", "#E03A3E", "#C1D32F", "State Farm Arena", "Eastern"],
  ["Boston Celtics", "#007A33", "#BA9653", "TD Garden", "Eastern"],
  ["Brooklyn Nets", "#000000", "#FFFFFF", "Barclays Center", "Eastern"],
  ["Charlotte Hornets", "#1D1160", "#00788C", "Spectrum Center", "Eastern"],
  ["Chicago Bulls", "#CE1141", "#000000", "United Center", "Eastern"],
  ["Cleveland Cavaliers", "#860038", "#FDBB30", "Rocket Arena", "Eastern"],
  ["Dallas Mavericks", "#00538C", "#002B5E", "American Airlines Center", "Western"],
  ["Denver Nuggets", "#0E2240", "#FEC524", "Ball Arena", "Western"],
  ["Detroit Pistons", "#C8102E", "#1D42BA", "Little Caesars Arena", "Eastern"],
  ["Golden State Warriors", "#1D428A", "#FFC72C", "Chase Center", "Western"],
  ["Houston Rockets", "#CE1141", "#000000", "Toyota Center", "Western"],
  ["Indiana Pacers", "#002D62", "#FDBB30", "Gainbridge Fieldhouse", "Eastern"],
  ["LA Clippers", "#C8102E", "#1D428A", "Intuit Dome", "Western"],
  ["Los Angeles Lakers", "#552583", "#FDB927", "Crypto.com Arena", "Western"],
  ["Memphis Grizzlies", "#5D76A9", "#12173F", "FedExForum", "Western"],
  ["Miami Heat", "#98002E", "#F9A01B", "Kaseya Center", "Eastern"],
  ["Milwaukee Bucks", "#00471B", "#EEE1C6", "Fiserv Forum", "Eastern"],
  ["Minnesota Timberwolves", "#0C2340", "#236192", "Target Center", "Western"],
  ["New Orleans Pelicans", "#0C2340", "#C8102E", "Smoothie King Center", "Western"],
  ["New York Knicks", "#006BB6", "#F58426", "Madison Square Garden", "Eastern"],
  ["Oklahoma City Thunder", "#007AC1", "#EF3B24", "Paycom Center", "Western"],
  ["Orlando Magic", "#0077C0", "#C4CED4", "Kia Center", "Eastern"],
  ["Philadelphia 76ers", "#006BB6", "#ED174C", "Xfinity Mobile Arena", "Eastern"],
  ["Phoenix Suns", "#1D1160", "#E56020", "PHX Arena", "Western"],
  ["Portland Trail Blazers", "#E03A3E", "#000000", "Moda Center", "Western"],
  ["Sacramento Kings", "#5A2D81", "#63727A", "Golden 1 Center", "Western"],
  ["San Antonio Spurs", "#C4CED4", "#000000", "Frost Bank Center", "Western"],
  ["Toronto Raptors", "#CE1141", "#000000", "Scotiabank Arena", "Eastern"],
  ["Utah Jazz", "#002B5C", "#F9A01B", "Delta Center", "Western"],
  ["Washington Wizards", "#002B5C", "#E31837", "Capital One Arena", "Eastern"],
];

const NHL = [
  ["Anaheim Ducks", "#F47A38", "#B9975B", "Honda Center", "Western"],
  ["Boston Bruins", "#FFB81C", "#000000", "TD Garden", "Eastern"],
  ["Buffalo Sabres", "#002654", "#FCB514", "KeyBank Center", "Eastern"],
  ["Calgary Flames", "#C8102E", "#F1BE48", "Scotiabank Saddledome", "Western"],
  ["Carolina Hurricanes", "#CC0000", "#000000", "Lenovo Center", "Eastern"],
  ["Chicago Blackhawks", "#CF0A2C", "#000000", "United Center", "Western"],
  ["Colorado Avalanche", "#6F263D", "#236192", "Ball Arena", "Western"],
  ["Columbus Blue Jackets", "#002654", "#CE1126", "Nationwide Arena", "Eastern"],
  ["Dallas Stars", "#006847", "#8F8F8C", "American Airlines Center", "Western"],
  ["Detroit Red Wings", "#CE1126", "#FFFFFF", "Little Caesars Arena", "Eastern"],
  ["Edmonton Oilers", "#041E42", "#FF4C00", "Rogers Place", "Western"],
  ["Florida Panthers", "#C8102E", "#041E42", "Amerant Bank Arena", "Eastern"],
  ["Los Angeles Kings", "#111111", "#A2AAAD", "Crypto.com Arena", "Western"],
  ["Minnesota Wild", "#154734", "#A6192E", "Grand Casino Arena", "Western"],
  ["Montreal Canadiens", "#AF1E2D", "#192168", "Bell Centre", "Eastern"],
  ["Nashville Predators", "#FFB81C", "#041E42", "Bridgestone Arena", "Western"],
  ["New Jersey Devils", "#CE1126", "#000000", "Prudential Center", "Eastern"],
  ["New York Islanders", "#00539B", "#F47D30", "UBS Arena", "Eastern"],
  ["New York Rangers", "#0038A8", "#CE1126", "Madison Square Garden", "Eastern"],
  ["Ottawa Senators", "#C52032", "#C2912C", "Canadian Tire Centre", "Eastern"],
  ["Philadelphia Flyers", "#F74902", "#000000", "Xfinity Mobile Arena", "Eastern"],
  ["Pittsburgh Penguins", "#FCB514", "#000000", "PPG Paints Arena", "Eastern"],
  ["San Jose Sharks", "#006D75", "#EA7200", "SAP Center", "Western"],
  ["Seattle Kraken", "#001628", "#99D9D9", "Climate Pledge Arena", "Western"],
  ["St. Louis Blues", "#002F87", "#FCB514", "Enterprise Center", "Western"],
  ["Tampa Bay Lightning", "#002868", "#FFFFFF", "Benchmark International Arena", "Eastern"],
  ["Toronto Maple Leafs", "#00205B", "#FFFFFF", "Scotiabank Arena", "Eastern"],
  ["Utah Hockey Club", "#71AFE5", "#090909", "Delta Center", "Western"],
  ["Vancouver Canucks", "#00205B", "#00843D", "Rogers Arena", "Western"],
  ["Vegas Golden Knights", "#B4975A", "#333F42", "T-Mobile Arena", "Western"],
  ["Washington Capitals", "#041E42", "#C8102E", "Capital One Arena", "Eastern"],
  ["Winnipeg Jets", "#041E42", "#004C97", "Canada Life Centre", "Western"],
];

const TWO_WORD = ["Trail Blazers", "Red Wings", "Blue Jackets", "Maple Leafs", "Golden Knights", "Hockey Club"];
const nickname = (name) => TWO_WORD.find((n) => name.endsWith(n)) ?? name.split(" ").slice(-1)[0];
const slugify = (s) => s.toLowerCase().replace(/\./g, "").replace(/\s+/g, "-");

// A bare nickname is only safe when exactly one club in ANY sport answers to it.
// Kings belongs to two clubs inside these two leagues; Rangers, Panthers and Jets
// each collide with a football or baseball club we already have a post for. All of
// those carry the city instead, in the slug and in the headline.
const otherLeagueNicknames = readdirSync(POSTS)
  .filter((f) => /-uniform-schedule-\d{4}\.md$/.test(f))
  .flatMap((f) => matter(readFileSync(resolve(POSTS, f), "utf8")).data.teams ?? [])
  .map((slug) => nickname(slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")));

const nickCount = {};
for (const n of [...NBA, ...NHL].map(([n]) => n)) nickCount[nickname(n)] = (nickCount[nickname(n)] ?? 0) + 1;
for (const n of otherLeagueNicknames) nickCount[n] = (nickCount[n] ?? 0) + 1;
const shortFor = (name) => (nickCount[nickname(name)] === 1 ? nickname(name) : name);

// Existing ColorWay coverage, per club, so every page links somewhere different.
const library = readdirSync(POSTS)
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const { data } = matter(readFileSync(resolve(POSTS, f), "utf8"));
    return { slug: f.replace(/\.md$/, ""), title: data.title ?? "", teams: data.teams ?? [], date: data.date ?? "" };
  });

function coverageFor(teamSlug, selfSlug) {
  return library
    .filter((p) => p.slug !== selfSlug && (p.teams ?? []).includes(teamSlug))
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .slice(0, 6);
}

const NBA_EDITIONS = (t) => [
  ["Association Edition", "#ffffff", "#14284b", "The white set. Worn at home for most of the season.", "1px solid #dfe3ea"],
  ["Icon Edition", t.primary, "#ffffff", "The primary color set, worn on the road and for most national windows.", null],
  ["Statement Edition", t.secondary, "#14284b", "The alternate. Usually the boldest thing in the closet.", null],
  ["City Edition", "#101010", "#ffffff", "Revealed league-wide on September 15, 2026. Year ten of the program.", null],
];

const NHL_EDITIONS = (t) => [
  ["Home", t.primary, "#ffffff", `The dark sweater, worn at ${t.arena}.`, null],
  ["Away", "#ffffff", "#14284b", "The white sweater, worn on the road.", "1px solid #dfe3ea"],
  ["Third Jersey", t.secondary, "#14284b", "The alternate, worn on a set number of dates each season.", null],
];

function build(team, league) {
  const [name, primary, secondary, arena, conference] = team;
  const t = { name, primary, secondary, arena, conference };
  const nick = nickname(name);
  const short = shortFor(name);
  const teamSlug = slugify(name);
  const slug = `${slugify(short)}-uniform-schedule-2026-27`;
  const isNba = league === "nba";
  const leagueName = isNba ? "NBA" : "NHL";
  const garment = isNba ? "jersey" : "sweater";
  const openDate = isNba ? "October 2026" : "October 2026";
  const editions = isNba ? NBA_EDITIONS(t) : NHL_EDITIONS(t);

  const cards = editions
    .map(
      ([label, bg, fg, blurb, border]) =>
        `  <div style="background: ${bg}; color: ${fg};${border ? ` border: ${border};` : ""} border-radius: 12px; padding: 16px 14px;"><div style="font-size: 0.72em; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.85;">${label}</div><div style="font-size: 0.88em; font-weight: 600; line-height: 1.45; margin-top: 6px;">${blurb}</div></div>`
    )
    .join("\n");

  const coverage = coverageFor(teamSlug, slug);
  const coverageBlock = coverage.length
    ? `## More ${short} Coverage\n\n${coverage.map((c) => `- [${c.title}](/stories/${c.slug})`).join("\n")}\n\n`
    : "";

  const cityLine = isNba
    ? `The one genuinely open slot is the City Edition. Every club is teasing a **September 15, 2026** reveal, and we break down [what that league-wide teaser actually is](/stories/nba-september-15-2026-uniform-reveal) separately. Until it lands, three of the four ${nick} slots are known and the fourth is not.`
    : `Third jerseys and any one-off specials get added here as ${short} announce them. The NHL schedules its alternates in blocks rather than all at once, so this page changes through the autumn.`;

  const excerpt = `Every ${short} ${garment} for 2026-27 and when they wear it. The full uniform closet now, with the game-by-game schedule filled in as the season runs.`;

  return {
    slug,
    body: `---
title: "${short} Uniform Schedule 2026-27: Every ${isNba ? "Jersey" : "Sweater"} and When They Wear It"
category: "${leagueName}"
date: "2026-08-26"
updatedDate: "2026-08-26"
excerpt: "${excerpt}"
gradient: "linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)"
cardStyle: words
kicker: Uniform Schedule
logoSrc: "/logos/leagues/${league}.png"
logoSrc2: "/logos/teams/${league}-${teamSlug}.png"
league: "${league}"
teams: ["${teamSlug}"]
---

The ${name} open 2026-27 at ${arena} in ${openDate}. This is the full ${short} uniform schedule: every ${garment} in the closet, what each one is for, and a game-by-game record of when it goes on ${isNba ? "the floor" : "the ice"}.

We build these before the season rather than after it, so the closet is here from day one and the dates fill in as they are announced. ${cityLine}

## The ${short} Uniform Closet for 2026-27

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; margin: 1.5em 0;">
${cards}
</div>

## The ${short} Game-by-Game Uniform Schedule

<div style="margin: 1.5em 0; padding: 1.5em; background: #f5f7fa; border: 1px solid #e3e6ec; border-radius: 12px;">
<p style="margin: 0 0 0.6em; font-size: 0.72em; font-weight: 800; text-transform: uppercase; letter-spacing: 1.6px; color: #5b6474;">Filling in from ${openDate}</p>
<p style="margin: 0; font-size: 0.95em; line-height: 1.55; color: #1c1c1c;">We log the ${short} ${garment} for every game, the morning after it is played, and we add confirmed special dates here the moment ${short} announce them. Nothing on this page is a guess: a date appears once it is real.</p>
</div>

${coverageBlock}## Frequently Asked Questions

**What uniforms do the ${name} have for 2026-27?**

${editions.map(([l]) => l).join(", ")}${isNba ? ", with the City Edition revealed on September 15, 2026" : ""}. The closet section above breaks down what each one is for.

**What are the ${name} wearing tonight?**

Once the season opens we log the ${short} ${garment} for every game on this page, updated the morning after each one. Confirmed special dates are added as soon as they are announced.

**How many jerseys do the ${name} wear in a season?**

${isNba ? "Four in a normal NBA season: Association, Icon, Statement and City Edition, plus a Classic Edition in the years a club runs one." : "Three in a normal NHL season: the home dark, the road white, and a third jersey, plus any one-off specials such as a Stadium Series or Winter Classic sweater."}

**Where can I see what the ${name} wore last game?**

Right here. This page is the ${short} uniform record for 2026-27. Every other club is in the [${leagueName} uniform schedule hub](/stories/${league}-uniform-schedule-2026-27), and we run the same format for [every NFL club](/stories/nfl-uniform-schedule-2026) and [every MLB club](/stories/mlb-uniform-schedule-2026).

## The Bottom Line

The ${short} closet for 2026-27 is set apart from ${isNba ? "the City Edition, which the league reveals on September 15" : "any third-jersey dates still to be announced"}. Everything else is a matter of which night it comes out, and that is what this page tracks from the opener onward.
`,
  };
}

// League hubs, mirroring nfl-uniform-schedule-2026 and mlb-uniform-schedule-2026.
// Without these the 62 team posts would be orphans reachable only from search.
function hub(league, teams) {
  const isNba = league === "nba";
  const leagueName = isNba ? "NBA" : "NHL";
  const garment = isNba ? "Jersey" : "Sweater";
  const accent = isNba ? "#C8102E" : "#0038A8";
  const rows = teams
    .map(([name]) => {
      const short = shortFor(name);
      return `<div style="padding: 11px 18px; border-top: 1px solid #eef0f4; display: flex; justify-content: space-between; gap: 12px; align-items: baseline;"><a href="/stories/${slugify(short)}-uniform-schedule-2026-27" style="font-weight: 700; font-size: 15px; color: #2f6bed; text-decoration: none;">${name}</a><span style="font-size: 12px; color: #8a919e; white-space: nowrap;">2026-27</span></div>`;
    })
    .join("\n");

  return {
    slug: `${league}-uniform-schedule-2026-27`,
    body: `---
title: "${leagueName} Uniform Schedule 2026-27: Every Team's ${garment}s and When They Wear Them"
category: "${leagueName}"
date: "2026-08-26"
updatedDate: "2026-08-26"
excerpt: "Every ${leagueName} team's 2026-27 uniform schedule in one place. All ${teams.length} clubs, their full closets, and the dates as they are confirmed."
gradient: "linear-gradient(135deg, ${accent} 0%, #14284b 100%)"
cardStyle: words
kicker: Uniform Schedule
logoSrc: "/logos/leagues/${league}.png"
league: "${league}"
teams: []
---

Every ${leagueName} club's 2026-27 uniform schedule, in one place. Each page below carries that team's full closet, what each ${garment.toLowerCase()} is for, and a game-by-game record that fills in as the season runs.

${isNba ? "The City Edition slot is the one still open league-wide. All thirty clubs are teasing a September 15, 2026 reveal, and we break down [what that teaser actually is](/stories/nba-september-15-2026-uniform-reveal) separately." : "Third jerseys and one-off specials get added to each club's page as they are announced. The NHL schedules its alternates in blocks through the autumn rather than all at once."}

## Every ${leagueName} Team's 2026-27 Uniform Schedule

<div style="margin: 1.5em 0 2.5em; border: 1px solid #e3e6ec; border-radius: 12px; overflow: hidden; font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;"><div style="background: ${accent}; color: #ffffff; padding: 10px 18px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">All ${teams.length} clubs</div>
${rows}
</div>

## How These Pages Work

We build the closet before the season and fill in the dates as they become real. Nothing on a club page is a guess: a uniform appears against a date once the team has announced it or once the game has been played and we have logged it.

It is the same format we run for [every NFL club](/stories/nfl-uniform-schedule-2026) and [every MLB club](/stories/mlb-uniform-schedule-2026), which are the two most-read things on this site.

## Frequently Asked Questions

**Where can I find an ${leagueName} team's uniform schedule for 2026-27?**

Every club has its own page, linked above. Each one lists the full closet for the season and the game-by-game record as it fills in.

**How many uniforms does an ${leagueName} team have?**

${isNba ? "Four in a normal season: Association, Icon, Statement and City Edition, plus a Classic Edition in the years a club runs one." : "Three in a normal season: the home dark sweater, the road white, and a third jersey, plus one-off specials such as a Stadium Series or Winter Classic sweater."}

**When are the 2026-27 ${leagueName} uniforms announced?**

${isNba ? "The base sets are known. The City Edition collection is revealed league-wide on September 15, 2026." : "Clubs announce third jerseys and specials through the autumn, and we add each one to that club's page as it lands."}

## The Bottom Line

${teams.length} clubs, one format, updated all season. Start with your team above.
`,
  };
}

let written = 0, skipped = 0;
for (const [league, teams] of [["nba", NBA], ["nhl", NHL]]) {
  for (const team of teams) {
    const { slug, body } = build(team, league);
    const path = resolve(POSTS, `${slug}.md`);
    if (existsSync(path) && !FORCE) {
      console.log(`  skip (exists): ${slug}`);
      skipped++;
      continue;
    }
    writeFileSync(path, body);
    written++;
  }
}
for (const [league, teams] of [["nba", NBA], ["nhl", NHL]]) {
  const { slug, body } = hub(league, teams);
  const path = resolve(POSTS, `${slug}.md`);
  if (existsSync(path) && !FORCE) { console.log(`  skip (exists): ${slug}`); skipped++; continue; }
  writeFileSync(path, body);
  written++;
  console.log(`  hub: ${slug}`);
}

console.log(`\nwrote ${written}, skipped ${skipped}`);
