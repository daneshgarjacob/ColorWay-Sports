// Adds an in-body prose paragraph to each club's uniform-schedule post linking
// to the two hub pages those posts were missing: the MLB daily uniform tracker
// and the 30-team uniform schedule pillar. Sits directly under the existing
// /mlb-tracker/<team> calendar CTA so a reader gets calendar, tracker, and
// pillar in one place.
//
// Idempotent: skips any post that already links to the daily tracker.
// Usage: node scripts/link-team-posts-to-hubs.mjs [--dry]
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");

const TRACKER = "/stories/mlb-uniform-tracker-2026";
const PILLAR = "/stories/mlb-uniform-schedule-2026";

// [schedule-post slug, display name]
const TEAMS = [
  ["yankees-uniform-schedule-2026", "Yankees"],
  ["red-sox-uniform-schedule-2026", "Red Sox"],
  ["blue-jays-uniform-schedule-2026", "Blue Jays"],
  ["rays-uniform-schedule-2026", "Rays"],
  ["orioles-uniform-schedule-2026", "Orioles"],
  ["guardians-uniform-schedule-2026", "Guardians"],
  ["twins-uniform-schedule-2026", "Twins"],
  ["white-sox-uniform-schedule-2026", "White Sox"],
  ["tigers-uniform-schedule-2026", "Tigers"],
  ["royals-uniform-schedule-2026", "Royals"],
  ["astros-uniform-schedule-2026", "Astros"],
  ["mariners-uniform-schedule-2026", "Mariners"],
  ["rangers-uniform-schedule-2026", "Rangers"],
  ["angels-uniform-schedule-2026", "Angels"],
  ["athletics-uniform-schedule-2026", "Athletics"],
  ["braves-uniform-schedule-2026", "Braves"],
  ["phillies-uniform-schedule-2026", "Phillies"],
  ["mets-uniform-schedule-2026", "Mets"],
  ["marlins-uniform-schedule-2026", "Marlins"],
  ["nationals-uniform-schedule-2026", "Nationals"],
  ["brewers-uniform-schedule-2026", "Brewers"],
  ["cubs-uniform-schedule-2026", "Cubs"],
  ["cardinals-uniform-schedule-2026", "Cardinals"],
  ["pirates-uniform-schedule-2026", "Pirates"],
  ["reds-uniform-schedule-2026", "Reds"],
  ["dodgers-uniform-schedule-2026", "Dodgers"],
  ["padres-uniform-schedule-2026", "Padres"],
  ["giants-uniform-schedule-2026", "Giants"],
  ["diamondbacks-uniform-schedule-2026", "Diamondbacks"],
  ["rockies-uniform-schedule-2026", "Rockies"],
];

// Five phrasings, rotated by index, so 30 pages do not carry one identical
// sentence. Each one earns its place by telling the reader something real:
// this page is the plan, the tracker is the receipts.
const VARIANTS = [
  (n) =>
    `This page is the plan. For the receipts, our [MLB daily uniform tracker](${TRACKER}) logs what the ${n} and all 29 other clubs actually wore in every game, updated every morning, and our [2026 MLB uniform schedule guide](${PILLAR}) maps the same thing across the whole league.`,
  (n) =>
    `Want to see whether the ${n} stuck to the plan? Our [MLB daily uniform tracker](${TRACKER}) records every jersey worn league-wide each night, and the [full 2026 MLB uniform schedule guide](${PILLAR}) covers how all 30 clubs run their rotations.`,
  (n) =>
    `A schedule is a forecast. Our [MLB daily uniform tracker](${TRACKER}) is the record, logging what the ${n} and every other team actually put on each day, and the [2026 MLB uniform schedule guide](${PILLAR}) puts all 30 rotations side by side.`,
  (n) =>
    `If you are trying to call tonight's ${n} uniform before first pitch, pair this page with our [MLB daily uniform tracker](${TRACKER}), which logs every team's look every day, and the league-wide [2026 MLB uniform schedule guide](${PILLAR}).`,
  (n) =>
    `The ${n} do not always follow the script. Our [MLB daily uniform tracker](${TRACKER}) catches what they actually wore, game by game, and our [2026 MLB uniform schedule guide](${PILLAR}) does the same forecasting work for the other 29 clubs.`,
];

let changed = 0, skipped = 0, missing = 0;

TEAMS.forEach(([slug, name], i) => {
  const path = resolve(root, "content/posts", `${slug}.md`);
  let md;
  try {
    md = readFileSync(path, "utf8");
  } catch {
    console.log(`  MISSING  ${slug}.md`);
    missing++;
    return;
  }

  if (md.includes("mlb-uniform-tracker-2026")) {
    skipped++;
    return;
  }

  // Anchor: the closing </div> of the existing calendar CTA block.
  const anchor = md.indexOf(`href="/mlb-tracker/`);
  if (anchor === -1) {
    console.log(`  NO CTA   ${slug}.md`);
    missing++;
    return;
  }
  const close = md.indexOf("</div>", anchor);
  if (close === -1) {
    console.log(`  NO CLOSE ${slug}.md`);
    missing++;
    return;
  }
  const insertAt = close + "</div>".length;

  const para = `\n\n${VARIANTS[i % VARIANTS.length](name)}`;
  md = md.slice(0, insertAt) + para + md.slice(insertAt);

  if (!DRY) writeFileSync(path, md);
  changed++;
  console.log(`  ${DRY ? "would add" : "added   "} ${slug}.md`);
});

console.log(`\n${DRY ? "[dry run] " : ""}added: ${changed}  already linked: ${skipped}  problems: ${missing}`);
