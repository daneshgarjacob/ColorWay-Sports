// Pieces both leagues use: slugs, results lookups, override merging, and the
// final sort. Pure.

import type { Guide, Level, Overrides, RootGame, Section, SlimGame } from "./types";
import { LEVEL_ORDER, levelOf } from "./text";

/** Same rule as lib/teamLogos teamSlug, plus accents ("San José"). */
export const slugOf = (displayName: string) =>
  displayName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.&'’]/g, "")
    .replace(/\s+/g, "-");

/** Our team-page slugs where ESPN's display name slugs differently. */
export const SLUG_ALIAS: Record<string, string> = {
  "app-state-mountaineers": "appalachian-state-mountaineers",
  "california-golden-bears": "cal-golden-bears",
  "pittsburgh-panthers": "pitt-panthers",
};
export const siteSlug = (displayName: string) => {
  const s = slugOf(displayName);
  return SLUG_ALIAS[s] ?? s;
};

export type Result = { game: SlimGame; winner: string; loser: string; ws: number; ls: number };

/** Every finished game between a and b this season, oldest first. */
export function resultsBetween(games: SlimGame[], a: string, b: string): Result[] {
  const out: Result[] = [];
  for (const g of games) {
    if (g.state !== "post") continue;
    const ids = [g.home.id, g.away.id];
    if (!ids.includes(a) || !ids.includes(b)) continue;
    const hs = g.home.score ?? 0;
    const as = g.away.score ?? 0;
    if (hs === as) continue;
    const homeWon = hs > as;
    out.push({ game: g, winner: homeWon ? g.home.id : g.away.id, loser: homeWon ? g.away.id : g.home.id, ws: Math.max(hs, as), ls: Math.min(hs, as) });
  }
  return out.sort((x, y) => Date.parse(x.game.date) - Date.parse(y.game.date));
}

/** +1 if a leads the season series with b, -1 if b does, 0 if even or unplayed. */
export function seriesEdge(games: SlimGame[], a: string, b: string): number {
  let n = 0;
  for (const r of resultsBetween(games, a, b)) n += r.winner === a ? 1 : -1;
  return Math.sign(n);
}

export function playsLater(games: SlimGame[], a: string, b: string, afterWeek: number): SlimGame | undefined {
  return games.find((g) => g.state === "pre" && g.week > afterWeek && [g.home.id, g.away.id].includes(a) && [g.home.id, g.away.id].includes(b));
}

/** Sort: Big, Helps, A Little, then kickoff. */
export function sortRows(rows: RootGame[]): RootGame[] {
  return [...rows].sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || a.at - b.at || a.id.localeCompare(b.id));
}

type GameOverride = { root?: string; level?: Level; reason?: string; hide?: boolean };

/**
 * Editor corrections from content/data/rooting-guide-overrides.json, keyed by
 * guide key then ESPN event id. `root` swaps the pick to the other team when
 * it names that team's root label.
 */
export function applyOverrides(guide: Guide, overrides: Overrides | undefined): Guide {
  const o = overrides?.[guide.key] as (Record<string, GameOverride> & { status?: { need?: string } }) | undefined;
  if (!o) return guide;
  const fix = (s: Section): Section => {
    const games = s.games
      .filter((g) => !(o[g.id] as GameOverride | undefined)?.hide)
      .map((g) => {
        const x = o[g.id] as GameOverride | undefined;
        if (!x) return g;
        const swap = x.root && x.root !== g.root && x.root === g.over;
        return {
          ...g,
          ...(swap ? { root: g.over, over: g.root, rootLogoAbbr: "", rootLogo: undefined, rootDisplayName: "" } : {}),
          level: x.level ?? g.level,
          reason: x.reason ?? g.reason,
        };
      });
    return { ...s, games: sortRows(games) };
  };
  const sections = guide.sections.map(fix);
  return {
    ...guide,
    status: { ...guide.status, need: o.status?.need ?? guide.status.need },
    sections,
    picks: sections[0]?.games.slice(0, 3).map((g) => g.root) ?? guide.picks,
  };
}

/** Build a row once the pick and weight are known; undefined when the game barely matters. */
export function row(p: {
  game: SlimGame;
  root: { name: string; abbr: string; displayName: string };
  over: string;
  matchup: string;
  when: string;
  reason: string;
  weight: number;
  level?: Level;
}): RootGame | undefined {
  const level = p.level ?? levelOf(p.weight);
  if (!level) return undefined;
  return {
    id: p.game.id,
    level,
    root: p.root.name,
    rootLogoAbbr: p.root.abbr,
    rootDisplayName: p.root.displayName,
    over: p.over,
    matchup: p.matchup,
    when: p.when,
    reason: p.reason,
    at: Date.parse(p.game.date),
    weight: Math.round(p.weight * 100) / 100,
  };
}
