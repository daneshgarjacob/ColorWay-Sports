import { nflUniformUsage, type NflTeamEntry } from "@/lib/nflTrackerTeamIndex";
import { winterUniformUsage, type WinterTeamEntry } from "@/lib/winterTrackerIndex";
import { NBA_TILE_COLORS } from "@/lib/nbaTileColors";

// The numbers in the "From the ColorWay Uniform Log" box on team schedule posts.
//
// Everything is counted from the two calendar indexes the story page has already
// built for that post, so the box adds no file reads and no new bundle weight.
// Returns null rather than a guess whenever the data is not there.

export interface UniformLogTile {
  count: number;
  label: string;
}

export interface UniformLogData {
  heading: string;
  /** One line under the heading saying what is being counted. */
  note?: string;
  tiles: UniformLogTile[];
  href: string;
}

const MAX_TILES = 4;

// Grid and log labels mix the jersey with the rest of that game's look ("Navy ·
// White Pants · TNF", "All White (Announced)", "Purple / White"). The box counts
// jerseys, so everything but the jersey's own name comes off.
function jerseyName(label: string): string {
  const parts = label.replace(/\s*\((Announced|Confirmed)\)/gi, "").split(" · ");
  const jersey = parts.find((p) => !/\b(Helmet|Pants|Socks)$/i.test(p)) ?? parts[0];
  return jersey
    .split(" / ")[0]
    .replace(/^All\s+/i, "")
    .replace(/\s+on\s+\w+$/i, "")
    .replace(/\s+(Primary|Debut)$/i, "")
    .trim();
}

// Up to four tiles. Past that, the top three stay and the rest fold into "Other",
// so the tiles always add up to the games counted.
function toTiles(usage: { label: string; total: number }[]): UniformLogTile[] {
  const counts = new Map<string, number>();
  for (const u of usage) {
    const name = jerseyName(u.label);
    counts.set(name, (counts.get(name) ?? 0) + u.total);
  }
  const tiles = [...counts].map(([label, count]) => ({ count, label })).sort((a, b) => b.count - a.count);
  if (tiles.length <= MAX_TILES) return tiles;
  const other = tiles.slice(MAX_TILES - 1).reduce((sum, t) => sum + t.count, 0);
  return [...tiles.slice(0, MAX_TILES - 1), { count: other, label: "Other" }];
}

/** NFL: the whole season off the post's own grid, byes excluded. */
export function nflUniformLog(team: NflTeamEntry): UniformLogData | null {
  const usage = nflUniformUsage(team);
  const games = usage.reduce((sum, u) => sum + u.total, 0);
  // A blank cell in the grid means a game we can't name, so the count can't be trusted.
  if (games === 0 || usage.some((u) => !u.uniform)) return null;
  return {
    heading: `The 2026 ${team.nickname} Closet, In Numbers`,
    note: `The Full 2026 Season Schedule: ${games} Games`,
    tiles: toTiles(usage.map((u) => ({ label: u.uniform, total: u.total }))),
    href: `/nfl-tracker/${team.key}`,
  };
}

// Readers know "Gold", not "Icon Edition" (Jake 11/2). Falls back to the edition
// name for any jersey without a tile color.
function nbaColorLabel(teamKey: string, uniform: string): string {
  const edition = uniform.match(/\b(Association|Icon|Statement|City|Classic|Specter)\b/i)?.[1];
  const color = edition && NBA_TILE_COLORS[`${teamKey}-${edition.toLowerCase()}.jpg`];
  return color ? `${color} (${edition})` : uniform;
}

/** NBA/NHL: confirmed games only, which is all winterUniformUsage counts. */
export function winterUniformLog(team: WinterTeamEntry): UniformLogData | null {
  const usage = winterUniformUsage(team);
  const games = usage.reduce((sum, u) => sum + u.total, 0);
  if (games < 3) return null;
  return {
    heading: `${team.nickname} ${team.league === "nba" ? "Jerseys" : "Sweaters"} So Far: ${games} Games Logged`,
    tiles: toTiles(usage.map((u) => ({
      label: team.league === "nba" ? nbaColorLabel(team.key, u.uniform) : u.uniform,
      total: u.total,
    }))),
    href: `/${team.league}-tracker/${team.key}`,
  };
}
