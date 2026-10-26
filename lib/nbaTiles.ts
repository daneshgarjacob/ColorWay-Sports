import tileFiles from "./nbaTileFiles.json";

// NBA jersey tiles (480x600 product shots on white) in
// public/images/posts/nba-daily-tracker/<nickname>-<edition>.jpg.
// The one place that maps our data's team keys (tricodes) and the official
// uniform calls to a tile file. Missing tiles (most City / Specter) return "".

const DIR = "/images/posts/nba-daily-tracker";

/** Tricode -> tile nickname. */
export const NBA_TILE_NICK: Record<string, string> = {
  ATL: "hawks", BOS: "celtics", BKN: "nets", CHA: "hornets", CHI: "bulls", CLE: "cavaliers",
  DAL: "mavericks", DEN: "nuggets", DET: "pistons", GSW: "warriors", HOU: "rockets", IND: "pacers",
  LAC: "clippers", LAL: "lakers", MEM: "grizzlies", MIA: "heat", MIL: "bucks", MIN: "timberwolves",
  NOP: "pelicans", NYK: "knicks", OKC: "thunder", ORL: "magic", PHI: "76ers", PHX: "suns",
  POR: "trail-blazers", SAC: "kings", SAS: "spurs", TOR: "raptors", UTA: "jazz", WAS: "wizards",
};

/** Official call ("Icon Edition", "Association White", "Vice City Edition") -> tile edition. */
function edition(call: string): string | null {
  if (/^Association/.test(call)) return "association";
  if (/^Icon/.test(call)) return "icon";
  if (/^Statement/.test(call)) return "statement";
  if (/^Classic/.test(call)) return "classic";
  if (/City/.test(call)) return "city";
  return null;
}

// The tile list ships as JSON, not a readdir of public/: pages that re-render
// on Vercel after deploy (homepage ISR at ET midnight) have no public/ folder to
// read, so a runtime readdir returned nothing and every game fell back to logos
// (10/26). After adding or renaming a tile, regenerate it:
//   node scripts/gen-nba-tile-list.mjs
const tiles = new Set<string>(tileFiles as string[]);
function tileSet(): Set<string> {
  return tiles;
}

/** Tile path for a club's jersey call, or "" when we have no tile for it. */
export function nbaTile(tri: string, call: string | undefined): string {
  const nick = NBA_TILE_NICK[tri];
  const ed = call ? edition(call) : null;
  if (!nick || !ed) return "";
  const file = `${nick}-${ed}.jpg`;
  return tileSet().has(file) ? `${DIR}/${file}` : "";
}
