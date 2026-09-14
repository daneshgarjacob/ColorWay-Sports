// The whole NFL slate for the current week, built from the 32 team schedule
// grids, for the league hub page (`nfl-uniform-schedule-2026`).
//
// Why: the hub ranks around position 5 for "nfl uniform schedule 2026" but
// converts at ~5% CTR, and people search the week-specific phrasings ("nfl
// week 2 uniforms", "what jerseys are nfl teams wearing this week") that the
// page never answered. Each team grid already carries the jersey and whether
// the club has confirmed it, so the week board costs no extra upkeep.

import { buildNflTeamIndex, type NflGame, type NflTeamEntry } from "./nflTrackerTeamIndex";
import { nflCurrentWeek, type WearAnswer } from "./teamWearAnswers";

export type SlateSide = {
  team: NflTeamEntry;
  game: NflGame;
  /** The jersey alone, e.g. "White" out of "White · TNF". */
  uniform: string;
  /** Broadcast window or venue tags split off the grid label ("TNF", "Melbourne"). */
  tags: string[];
};

// Grid labels mix the jersey with game context ("White · TNF", "Royal ·
// Melbourne"); only the jersey belongs in the uniform line.
const TAG = /^(TNF|SNF|MNF|Wed(nesday)?|Thu(rsday)?|Sat(urday)?|Christmas|Thanksgiving|Black Friday|Netflix|London|Dublin|Paris|Madrid|Munich|Berlin|Melbourne|Rio|São Paulo|Sao Paulo|Mexico City|Toronto)$/i;

function side(team: NflTeamEntry, game: NflGame): SlateSide {
  const parts = game.uniform.split(/\s*·\s*/).filter(Boolean);
  const tags = parts.filter((p) => TAG.test(p));
  let uniform = parts.filter((p) => !TAG.test(p)).join(" · ") || game.uniform;
  // "Titans Blue" on the Titans row reads as a doubled name.
  if (uniform.startsWith(`${team.nickname} `)) uniform = uniform.slice(team.nickname.length + 1);
  return { team, game, uniform, tags };
}

export type SlateGame = {
  away: SlateSide | null;
  /** Display name when the away club's grid couldn't be matched. */
  awayName: string;
  home: SlateSide;
  /** Exact date when a post states it, else the week window. */
  when: string;
};

export type NflWeekSlate = {
  week: number;
  window: string;
  games: SlateGame[];
  byes: NflTeamEntry[];
  confirmedSides: number;
  totalSides: number;
};

const LAST_WEEK = 18;

export function buildNflWeekSlate(now: Date): NflWeekSlate | null {
  const index = buildNflTeamIndex();
  if (index.length === 0) return null;
  const week = Math.min(nflCurrentWeek(now), LAST_WEEK);

  const byNickname = (n: string) =>
    index.find((t) => t.nickname === n || t.name === n || t.name.endsWith(` ${n}`));

  const games: SlateGame[] = [];
  const byes: NflTeamEntry[] = [];
  let window = "";

  for (const team of index) {
    const game = team.games.find((g) => g.week === week);
    if (!game) continue;
    window = window || game.window;
    if (game.bye) {
      byes.push(team);
      continue;
    }
    if (!game.home) continue;

    // Neutral-site games carry a location suffix ("Bills (London)").
    const oppName = game.opponent.replace(/\s*\(.*\)\s*$/, "");
    const awayTeam = byNickname(oppName);
    const awayGame = awayTeam?.games.find((g) => g.week === week && !g.bye) ?? null;

    games.push({
      away: awayTeam && awayGame ? side(awayTeam, awayGame) : null,
      awayName: awayTeam?.nickname ?? oppName,
      home: side(team, game),
      when: game.date ?? awayGame?.date ?? game.window,
    });
  }

  // Dated games first in calendar order ("Sunday, September 20"), then the
  // games that only have the week window, each group alphabetical by home club.
  const ts = (s: string) => {
    const t = Date.parse(`${s} 2026`);
    return Number.isNaN(t) ? Infinity : t;
  };
  games.sort(
    (a, b) => ts(a.when) - ts(b.when) || a.home.team.nickname.localeCompare(b.home.team.nickname),
  );

  const sides = games.flatMap((g) => [g.home, g.away]).filter(Boolean) as SlateSide[];
  return {
    week,
    window,
    games,
    byes,
    confirmedSides: sides.filter((s) => s.game.confirmed).length,
    totalSides: sides.length,
  };
}

/** Visible Q&As for the board, reused as FAQ schema. */
export function nflWeekAnswers(slate: NflWeekSlate): WearAnswer[] {
  const confirmed = slate.games
    .filter((g) => g.home.game.confirmed || g.away?.game.confirmed)
    .slice(0, 4)
    .map((g) => {
      const away = g.away ? `${g.away.team.nickname} in ${g.away.uniform}` : g.awayName;
      return `${away} at ${g.home.team.nickname} in ${g.home.uniform}`;
    });
  const summary = `${slate.games.length} games in Week ${slate.week} (${slate.window}). ${slate.confirmedSides} of ${slate.totalSides} uniforms are confirmed by the teams so far${confirmed.length ? `, including ${confirmed.join("; ")}` : ""}. The board on this page lists every matchup.`;
  return [
    { q: `What are the NFL uniforms for Week ${slate.week}?`, a: summary },
    { q: "What jerseys are NFL teams wearing this week?", a: summary },
  ];
}
