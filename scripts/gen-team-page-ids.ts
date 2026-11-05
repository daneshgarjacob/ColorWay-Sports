// Writes content/data/team-page-ids.json: every /teams/<league>/<slug> page that
// exists, so the header's team links (a browser component that can't read the
// disk) know which clubs have a team page and which still go to /stories?team=.
// Rerun when a schedule post adds or drops a club:
//   npx tsx --tsconfig tsconfig.json scripts/gen-team-page-ids.ts
import fs from "fs";
import { getMyTeamCards } from "@/lib/myTeams";

const ids = getMyTeamCards().map((c) => c.id).sort();
fs.writeFileSync("content/data/team-page-ids.json", JSON.stringify(ids, null, 0) + "\n");
console.log(`${ids.length} team pages`);
