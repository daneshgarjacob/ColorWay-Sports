// Rooting Guide shared types (11/20). Everything in lib/rootingGuide/ except
// feeds.ts is pure: no fetch, no fs, no Next imports, so the rules can be run
// from scripts/rooting-guide-check.mjs against live ESPN data.

export type Level = "Big" | "Helps" | "A Little";

/** One "Root For" row. Same shape as the approved mockup JSON, plus the ESPN event id. */
export type RootGame = {
  id: string;
  level: Level;
  root: string;
  rootLogoAbbr: string;
  /** Site logo path for the team to root for, when we have one (filled by the page layer). */
  rootLogo?: string;
  /** ESPN display name of the team to root for, so the page layer can find its logo. */
  rootDisplayName: string;
  over: string;
  matchup: string;
  when: string;
  reason: string;
  /** Kickoff, ms (sort key). */
  at: number;
  /** Internal weight the level came from (kept for the check script). */
  weight: number;
};

export type DoneGame = { id: string; result: string; when: string; verdict: string; reason: string };

export type Section = { title: string; sub: string; games: RootGame[]; done?: DoneGame[]; footnote?: string };

export type Fact = { label: string; value: string };

export type Guide = {
  /** "nfl/los-angeles-chargers" */
  key: string;
  league: "NFL" | "College Football";
  team: string;
  nickname: string;
  /** "the Chargers" / "USC": how the team reads mid-sentence. */
  theName: string;
  logoName: string;
  weekLabel: string;
  week: number;
  season: number;
  h1: string;
  title: string;
  description: string;
  status: { tag: string; line: string; need: string; facts: Fact[] };
  own: { label: string; matchup: string; when: string; reason: string };
  sections: Section[];
  faq: { q: string; a: string }[];
  /** "Eagles, Broncos, Panthers": the first three picks, for My Teams. */
  picks: string[];
  /** Kept out of search (an unranked college team's short page). */
  noindex?: boolean;
};

/** A guide, or the honest short page when there is nothing to guide. */
export type GuideResult =
  | { kind: "guide"; guide: Guide }
  | { kind: "outside"; key: string; team: string; nickname: string; line: string; weekLabel: string }
  | { kind: "updating"; key: string };

/* ------------------------------------------------------------ feed shapes -- */

export type Side = {
  id: string;
  abbr: string;
  location: string;
  name: string;
  displayName: string;
  score?: number;
  /** "7-3" as the scoreboard had it. */
  record?: string;
};

export type SlimGame = {
  id: string;
  week: number;
  /** ISO, UTC. */
  date: string;
  /** False when the kickoff time is not set yet. */
  timeValid: boolean;
  state: "pre" | "in" | "post";
  /** "Final", "Final/OT", "4th 2:13" */
  detail: string;
  neutral: boolean;
  home: Side;
  away: Side;
  tv?: string;
  headline?: string;
  /** Conference title games and the like (not regular season). */
  championship?: boolean;
};

export type NflTeam = {
  id: string;
  abbr: string;
  name: string;
  location: string;
  displayName: string;
  conf: "AFC" | "NFC";
  /** "AFC West" */
  div: string;
  seed: number;
  w: number;
  l: number;
  t: number;
  /** ESPN clincher code: x, y, z, *, e. */
  clincher?: string;
};

export type NflData = {
  season: number;
  week: number;
  lastWeek: number;
  teams: NflTeam[];
  /** Every regular-season game we have, all weeks. */
  games: SlimGame[];
  /** Team ids on bye, by week. */
  byes: Record<number, string[]>;
};

export type CfbTeam = {
  id: string;
  abbr: string;
  location: string;
  name: string;
  displayName: string;
  confId: string;
  conf: string;
  w: number;
  l: number;
  confW: number;
  confL: number;
  /** ESPN's order inside the conference standings (1 = first). */
  confSeed: number;
};

export type CfbData = {
  season: number;
  week: number;
  lastWeek: number;
  poll: "cfp" | "ap";
  /** Ranked team ids in order, index 0 = No. 1. */
  ranked: string[];
  teams: CfbTeam[];
  games: SlimGame[];
};

export type Overrides = Record<
  string,
  { status?: { need?: string } } & Record<string, { root?: string; level?: Level; reason?: string; hide?: boolean } | { need?: string } | undefined>
>;
