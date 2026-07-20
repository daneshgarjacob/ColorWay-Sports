// Inserts a "see the visual uniform calendar" callout into each club's
// uniform-schedule post, linking to /mlb-tracker/<team>. Idempotent: skips any
// post that already links to /mlb-tracker/. Usage: node scripts/link-team-calendars.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// [schedule-post slug, team key, display name, primary color]
const TEAMS = [
  ["yankees-uniform-schedule-2026", "yankees", "Yankees", "#0C2340"],
  ["red-sox-uniform-schedule-2026", "red-sox", "Red Sox", "#BD3039"],
  ["blue-jays-uniform-schedule-2026", "blue-jays", "Blue Jays", "#134A8E"],
  ["rays-uniform-schedule-2026", "rays", "Rays", "#8FBCE6"],
  ["orioles-uniform-schedule-2026", "orioles", "Orioles", "#DF4601"],
  ["guardians-uniform-schedule-2026", "guardians", "Guardians", "#00385D"],
  ["twins-uniform-schedule-2026", "twins", "Twins", "#002B5C"],
  ["white-sox-uniform-schedule-2026", "white-sox", "White Sox", "#27251F"],
  ["tigers-uniform-schedule-2026", "tigers", "Tigers", "#0C2340"],
  ["royals-uniform-schedule-2026", "royals", "Royals", "#004687"],
  ["astros-uniform-schedule-2026", "astros", "Astros", "#EB6E1F"],
  ["mariners-uniform-schedule-2026", "mariners", "Mariners", "#0C2C56"],
  ["rangers-uniform-schedule-2026", "rangers", "Rangers", "#003278"],
  ["angels-uniform-schedule-2026", "angels", "Angels", "#BA0021"],
  ["athletics-uniform-schedule-2026", "athletics", "Athletics", "#003831"],
  ["braves-uniform-schedule-2026", "braves", "Braves", "#CE1141"],
  ["phillies-uniform-schedule-2026", "phillies", "Phillies", "#E81828"],
  ["mets-uniform-schedule-2026", "mets", "Mets", "#FF5910"],
  ["marlins-uniform-schedule-2026", "marlins", "Marlins", "#00A3E0"],
  ["nationals-uniform-schedule-2026", "nationals", "Nationals", "#AB0003"],
  ["brewers-uniform-schedule-2026", "brewers", "Brewers", "#12284B"],
  ["cubs-uniform-schedule-2026", "cubs", "Cubs", "#0E3386"],
  ["cardinals-uniform-schedule-2026", "cardinals", "Cardinals", "#C41E3A"],
  ["pirates-uniform-schedule-2026", "pirates", "Pirates", "#FDB827"],
  ["reds-uniform-schedule-2026", "reds", "Reds", "#C6011F"],
  ["dodgers-uniform-schedule-2026", "dodgers", "Dodgers", "#005A9C"],
  ["padres-uniform-schedule-2026", "padres", "Padres", "#2F241D"],
  ["giants-uniform-schedule-2026", "giants", "Giants", "#FD5A1E"],
  ["diamondbacks-uniform-schedule-2026", "diamondbacks", "Diamondbacks", "#A71930"],
  ["rockies-uniform-schedule-2026", "rockies", "Rockies", "#333366"],
];

const block = (key, name, color) => `<div style="margin: 1.6em 0; padding: 16px 18px; border-radius: 14px; background: linear-gradient(135deg, ${color} 0%, ${color}cc 100%);">
  <p style="margin: 0 0 4px; font-size: 0.7em; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.72);">Live 2026 Tracker</p>
  <p style="margin: 0 0 10px; font-size: 1.05em; font-weight: 800; color: #ffffff; line-height: 1.35;">See every jersey the ${name} have actually worn this season, day by day.</p>
  <a href="/mlb-tracker/${key}" style="display: inline-block; padding: 8px 16px; background: #ffffff; color: ${color}; border-radius: 999px; font-size: 0.82em; font-weight: 800; text-decoration: none; letter-spacing: 0.03em;">Open the ${name} uniform calendar →</a>
</div>`;

let changed = 0, skipped = 0, missing = 0;

for (const [slug, key, name, color] of TEAMS) {
  const path = resolve(root, "content/posts", `${slug}.md`);
  let md;
  try {
    md = readFileSync(path, "utf8");
  } catch {
    console.log(`  MISSING  ${slug}.md`);
    missing++;
    continue;
  }
  if (md.includes("/mlb-tracker/")) {
    skipped++;
    continue;
  }
  // Insert immediately before the first H2 so it sits under the intro.
  const idx = md.indexOf("\n## ");
  if (idx === -1) {
    console.log(`  NO H2   ${slug}.md`);
    missing++;
    continue;
  }
  const out = `${md.slice(0, idx)}\n\n${block(key, name, color)}\n${md.slice(idx)}`;
  writeFileSync(path, out);
  changed++;
}

console.log(`\ninserted: ${changed}   already-linked: ${skipped}   problems: ${missing}`);
