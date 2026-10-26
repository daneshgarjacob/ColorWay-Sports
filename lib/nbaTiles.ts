import fs from "fs";
import path from "path";

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

// Read ONE literal folder, never path.join(cwd, "public", x): a dynamic path
// into public/ makes Vercel's tracer bundle all of public/ (see winterTrackerIndex).
let tiles: Set<string> | null = null;
function tileSet(): Set<string> {
  if (!tiles) {
    try {
      tiles = new Set(fs.readdirSync(path.join(process.cwd(), "public/images/posts/nba-daily-tracker")));
    } catch {
      tiles = new Set();
    }
  }
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
