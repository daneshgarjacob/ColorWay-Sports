#!/usr/bin/env node
// Guard: every game card on a tracker must name ONLY the two teams in the
// "### Away at Home" heading above it — in the visible labels, the hidden
// score pill, and the jersey image filenames. Added 11/15/2026 after a new
// 49ers-Cowboys card was copied from the Rams-Cardinals card and went live
// still saying "RAMS / CARDINALS". Runs in prebuild, so a bad card fails the
// build instead of shipping.  Usage: node scripts/check-tracker-cards.mjs [files...]
import fs from "node:fs";
import path from "node:path";

const NICK = {
  nfl: "Cardinals Falcons Ravens Bills Panthers Bears Bengals Browns Cowboys Broncos Lions Packers Texans Colts Jaguars Chiefs Raiders Chargers Rams Dolphins Vikings Patriots Saints Giants Jets Eagles Steelers 49ers Seahawks Buccaneers Titans Commanders",
  nba: "Hawks Celtics Nets Hornets Bulls Cavaliers Mavericks Nuggets Pistons Warriors Rockets Pacers Clippers Lakers Grizzlies Heat Bucks Timberwolves Pelicans Knicks Thunder Magic 76ers Suns Trail Blazers Kings Spurs Raptors Jazz Wizards",
  nhl: "Ducks Bruins Sabres Flames Hurricanes Blackhawks Avalanche Blue Jackets Stars Red Wings Oilers Panthers Kings Predators Devils Islanders Rangers Senators Flyers Penguins Sharks Kraken Blues Lightning Maple Leafs Mammoth Canucks Golden Knights Capitals Jets Wild Canadiens",
};
const TWO_WORD = ["Trail Blazers", "Blue Jackets", "Red Wings", "Maple Leafs", "Golden Knights"];
function nicknames(league) {
  let s = NICK[league];
  const out = [];
  for (const t of TWO_WORD) if (s.includes(t)) { out.push(t); s = s.replace(t, ""); }
  return out.concat(s.split(/\s+/).filter(Boolean));
}
const slug = (n) => n.toLowerCase().replace(/\s+/g, "-");

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["nfl", "nba", "nhl"].map((l) =>
      fs.readdirSync(path.join(root, "content/posts"))
        .filter((f) => f.startsWith(`${l}-uniform-tracker-`))
        .map((f) => path.join(root, "content/posts", f))).flat();

let errors = 0;
for (const file of files) {
  const league = path.basename(file).slice(0, 3);
  if (!NICK[league]) continue;
  const nicks = nicknames(league);
  const lines = fs.readFileSync(file, "utf8").split("\n");
  let heading = null, headingLine = 0;
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^###\s+(.+?)\s+(?:at|vs\.?)\s+(.+?)\s*$/);
    if (h) { heading = [h[1], h[2]]; headingLine = i + 1; continue; }
    if (/^#{1,2}\s/.test(lines[i])) heading = null;
    if (!lines[i].includes("data-card=")) continue;
    // collect card block up to the next heading
    let j = i, block = [];
    while (j < lines.length && !/^#{1,3}\s/.test(lines[j])) block.push(lines[j++]);
    const html = block.join("\n");
    i = j - 1;
    if (!heading) continue;
    const own = nicks.filter((n) => heading.some((t) => t.endsWith(n)));
    if (own.length !== 2) continue; // heading not two known teams; skip
    const text = html.replace(/<[^>]+>/g, " ").replace(/&middot;/g, " ");
    const where = `${path.relative(root, file)}:${headingLine} (${heading.join(" at ")})`;
    // 1) visible text + pill: no other team's nickname
    for (const n of nicks) {
      if (own.includes(n) || own.some((o) => o.includes(n))) continue;
      if (new RegExp(`\\b${n}\\b`, "i").test(text)) {
        console.error(`✗ ${where}: card text mentions "${n}"`); errors++;
      }
    }
    // 2) both own teams are named in the card
    for (const n of own) if (!new RegExp(`\\b${n}\\b`, "i").test(text)) {
      console.error(`✗ ${where}: card never names "${n}"`); errors++;
    }
    // 3) jersey images belong to the two teams
    for (const m of html.matchAll(/src="([^"]+)"/g)) {
      const base = path.basename(m[1]).toLowerCase();
      if (base.startsWith(league) || m[1].includes("/logos/leagues/")) continue;
      const owner = nicks.find((n) => base.startsWith(slug(n) + "-"));
      if (owner && !own.includes(owner)) {
        console.error(`✗ ${where}: image ${base} belongs to the ${owner}`); errors++;
      }
    }
  }
}
if (errors) { console.error(`\ncheck-tracker-cards: ${errors} problem(s). Fix the card labels before shipping.`); process.exit(1); }
console.log(`check-tracker-cards: ${files.length} tracker(s) clean`);
