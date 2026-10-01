// The whole NFL slate for the current week, built from the 32 team schedule
// grids, for the league hub page (`nfl-uniform-schedule-2026`).
//
// Why: the hub ranks around position 5 for "nfl uniform schedule 2026" but
// converts at ~5% CTR, and people search the week-specific phrasings ("nfl
// week 2 uniforms", "what jerseys are nfl teams wearing this week") that the
// page never answered. Each team grid already carries the jersey and whether
// the club has confirmed it, so the week board costs no extra upkeep.
//
// The uniform figures on the board take their helmet / jersey / pants colours
// from the NFL uniform tracker cards (lib/nflTrackerCards.ts), which Jake logs
// for every game anyway.

import { buildNflTeamIndex, type NflGame, type NflTeamEntry } from "./nflTrackerTeamIndex";
import { nflCurrentWeek, type WearAnswer } from "./teamWearAnswers";
import { findTrackerCard, type TrackerCard } from "./nflTrackerCards";

/**
 * How much of a side's uniform is known, and in what colours.
 * - worn: the game is Final on the tracker; colours are what was worn
 * - confirmed: the club announced the whole look (tracker card says "Confirmed")
 * - jersey: only the jersey is official; helmet and pants stay TBA
 * - tba: nothing official yet
 * Colours come only from the tracker card. With no card, or no official word,
 * the figure stays TBA rather than guessing.
 */
export type SideLook = {
  state: "worn" | "confirmed" | "jersey" | "tba";
  helmet?: string;
  jersey?: string;
  pants?: string;
  socks?: string;
  /** "Black · White · Gold", only for fully known looks. */
  combo?: string;
};

function lookFor(game: NflGame, card: TrackerCard | undefined, i: 0 | 1): SideLook {
  const s = card?.sides[i];
  if (!card || !s) return { state: "tba" };
  const [helmet, jersey, pants] = s.hexes;
  const combo = s.words.length === 3 ? s.words.join(" · ") : undefined;
  if (card.final) return { state: "worn", helmet, jersey, pants, socks: s.socks, combo };
  if (/^confirmed$/i.test(s.status)) return { state: "confirmed", helmet, jersey, pants, socks: s.socks, combo };
  if (/jersey confirmed/i.test(s.status) || game.confirmed) return { state: "jersey", jersey };
  return { state: "tba" };
}

export type SlateSide = {
  team: NflTeamEntry;
  game: NflGame;
  /** The jersey alone, e.g. "White" out of "White · TNF". */
  uniform: string;
  /** Broadcast window or venue tags split off the grid label ("TNF", "Melbourne"). */
  tags: string[];
  look: SideLook;
};

// Grid labels mix the jersey with game context ("White · TNF", "Royal ·
// Melbourne"); only the jersey belongs in the uniform line.
const TAG = /^(TNF|SNF|MNF|Wed(nesday)?|Thu(rsday)?|Sat(urday)?|Christmas|Thanksgiving|Black Friday|Netflix|London|Dublin|Paris|Madrid|Munich|Berlin|Melbourne|Rio|São Paulo|Sao Paulo|Mexico City|Toronto)$/i;

function side(team: NflTeamEntry, game: NflGame, card: TrackerCard | undefined, i: 0 | 1): SlateSide {
  const parts = game.uniform.split(/\s*·\s*/).filter(Boolean);
  const tags = parts.filter((p) => TAG.test(p));
  let uniform = parts.filter((p) => !TAG.test(p)).join(" · ") || game.uniform;
  // "Titans Blue" on the Titans row reads as a doubled name.
  if (uniform.startsWith(`${team.nickname} `)) uniform = uniform.slice(team.nickname.length + 1);
  return { team, game, uniform, tags, look: lookFor(game, card, i) };
}

export type SlateGame = {
  away: SlateSide | null;
  /** Display name when the away club's grid couldn't be matched. */
  awayName: string;
  home: SlateSide;
  /** Exact date when a post or the tracker states it, else the week window. */
  when: string;
  /** Kickoff / TV / venue off the tracker card ("Thursday Night Football", "9:30 ET · London"). */
  label: string;
  /** "Bears 27, Eagles 7" once the tracker has the game Final. */
  score?: string;
  /** Tracker position: kickoff order within a day. */
  order: number;
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
    const card = awayTeam ? findTrackerCard(week, awayTeam.name, team.name) : undefined;

    games.push({
      away: awayTeam && awayGame ? side(awayTeam, awayGame, card, 0) : null,
      awayName: awayTeam?.nickname ?? oppName,
      home: side(team, game, card, 1),
      when: game.date ?? awayGame?.date ?? card?.day ?? game.window,
      label: card?.label ?? "",
      score: card?.score,
      order: card?.order ?? Number.MAX_SAFE_INTEGER,
    });
  }

  // Dated games first in calendar order ("Sunday, September 20"), then the
  // games that only have the week window. Within a day, the tracker's kickoff
  // order, then alphabetical by home club.
  const ts = (s: string) => {
    const t = Date.parse(`${s} 2026`);
    return Number.isNaN(t) ? Infinity : t;
  };
  games.sort(
    (a, b) =>
      ts(a.when) - ts(b.when) ||
      a.order - b.order ||
      a.home.team.nickname.localeCompare(b.home.team.nickname),
  );

  const sides = games.flatMap((g) => [g.home, g.away]).filter(Boolean) as SlateSide[];
  return {
    week,
    window,
    games,
    byes,
    confirmedSides: sides.filter((s) => s.game.confirmed || s.look.state !== "tba").length,
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
