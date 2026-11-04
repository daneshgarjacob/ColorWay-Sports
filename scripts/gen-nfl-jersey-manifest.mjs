// Writes content/data/nfl-tracker-jersey-files.json: the file names in
// public/images/posts/nfl-tracker-jerseys (originals only, no "-cut.webp").
//
// Why: lib/nflTrackerTeamIndex.ts picks each week's jersey photo by name. Pages
// re-rendered by ISR (the homepage after midnight, schedule posts on game days)
// run without public/, so a readdir there found nothing and every NFL My Teams
// card and "this week" box lost its jersey (11/4, Chargers showed the logo).
// The list ships with the code instead. Runs before every build (prebuild);
// run it by hand after adding a jersey photo if you want it in dev right away.
import { readdirSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const files = readdirSync(join(root, "public/images/posts/nfl-tracker-jerseys"))
  .filter((f) => !/-cut\.webp$/i.test(f) && !f.startsWith("."))
  .sort();
writeFileSync(join(root, "content/data/nfl-tracker-jersey-files.json"), JSON.stringify(files, null, 1) + "\n");
console.log(`nfl-tracker-jersey-files.json: ${files.length} files`);
