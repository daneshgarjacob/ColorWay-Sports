import recordsFile from "@/content/data/uniform-records-2026.json";
import { TEAM_LOGOS, teamSlug } from "@/lib/teamLogos";
import { buildNflTeamIndex } from "@/lib/nflTrackerTeamIndex";
import { buildWinterIndex } from "@/lib/winterTrackerIndex";
import nbaRecordsFile from "@/content/data/nba-uniform-records-2026-27.json";
import nhlRecordsFile from "@/content/data/nhl-uniform-records-2026-27.json";

// Uniform Records (site plan 11/16, item 6): every NFL team's win-loss record in
// each helmet / jersey / pants combination it has actually worn, from our own
// tracker logs joined to final scores. NBA 2026-27 too, by jersey (an NBA
// uniform is one jersey), from the nightly worn log, and NHL 2026-27 by sweater,
// W-L-OTL, from the nightly sweater log joined to cached ESPN finals. The data
// files are built by scripts/build-uniform-records.mjs; nothing here touches the
// network.
//
// Records live on /uniform-records pages only. Jake's rule: no win-loss
// records on the tracker's matchup or jersey cards.

export type RecordLeague = "nfl" | "nba" | "nhl";

export interface RecordGame {
  /** NFL only. */
  week?: number;
  /** NBA: the game went to overtime (true). NHL: "OT" or "SO" when it went past regulation. */
  ot?: boolean | "OT" | "SO";
  date: string; // YYYY-MM-DD, US Eastern
  opponent: string;
  home: boolean;
  teamScore: number;
  oppScore: number;
  result: "W" | "L" | "T";
  link: string;
}

export interface RecordCombo {
  id: string;
  helmet: string;
  jersey: string;
  jerseyName: string;
  jerseyKey: string;
  pants: string;
  hexes: [string, string, string];
  /** NBA / NHL: the official name, a secondary label ("Icon Edition", "Hometown Remix"). */
  edition?: string;
  img: string | null;
  w: number;
  l: number;
  t: number;
  /** NHL only: overtime and shootout losses, counted apart from regulation losses. */
  otl?: number;
  games: RecordGame[];
}

export interface RecordTeam {
  key: string;
  name: string;
  nickname: string;
  gamesPlayed: number;
  gamesCounted: number;
  w: number;
  l: number;
  t: number;
  /** NHL only. */
  otl?: number;
  missing: { week?: number; date: string; opponent: string; home: boolean }[];
  combos: RecordCombo[];
  // Joined at runtime:
  league: RecordLeague;
  slug: string;
  logo: string;
  color: string;
  scheduleSlug?: string;
}

export interface Split {
  label: string;
  hex: string;
  w: number;
  l: number;
  t: number;
  otl?: number;
  games: number;
}

type RecordsFile = {
  season: number;
  throughWeek: number;
  built: string;
  totals: { teams: number; gamesPlayed: number; teamGamesCounted: number; teamGamesUnlogged: number };
  teams: Omit<RecordTeam, "slug" | "logo" | "color" | "scheduleSlug" | "league">[];
};
const FILE = recordsFile as unknown as RecordsFile;

export const RECORDS_SEASON = FILE.season;
export const RECORDS_THROUGH_WEEK = FILE.throughWeek;
export const RECORDS_TOTALS = FILE.totals;

type NbaRecordsFile = Omit<RecordsFile, "season" | "throughWeek"> & { season: string; through: string };
const NBA_FILE = nbaRecordsFile as unknown as NbaRecordsFile;
export const NBA_RECORDS_SEASON = NBA_FILE.season;
export const NBA_RECORDS_THROUGH = NBA_FILE.through;
export const NBA_RECORDS_TOTALS = NBA_FILE.totals;

type NhlRecordsFile = NbaRecordsFile & { totals: NbaRecordsFile["totals"] & { preseasonExcluded: string[] } };
const NHL_FILE = nhlRecordsFile as unknown as NhlRecordsFile;
export const NHL_RECORDS_SEASON = NHL_FILE.season;
export const NHL_RECORDS_THROUGH = NHL_FILE.through;
export const NHL_RECORDS_TOTALS = NHL_FILE.totals;

const memo: Partial<Record<RecordLeague, RecordTeam[]>> = {};
/** One league's teams (NFL by default). */
export function allRecordTeams(league: RecordLeague = "nfl"): RecordTeam[] {
  const hit = memo[league];
  if (hit) return hit;
  const index: { name: string; color: string; scheduleSlug: string }[] =
    league === "nfl" ? buildNflTeamIndex() : buildWinterIndex().filter((e) => e.league === league);
  const file = league === "nfl" ? FILE : league === "nba" ? NBA_FILE : NHL_FILE;
  const out: RecordTeam[] = file.teams.map((t) => {
    const entry = index.find((e) => e.name === t.name);
    return {
      ...t,
      league,
      slug: teamSlug(t.name),
      logo: TEAM_LOGOS[t.name] ?? "",
      color: entry?.color ?? "#0025CC",
      scheduleSlug: entry?.scheduleSlug,
    };
  });
  memo[league] = out;
  return out;
}
let everyMemo: RecordTeam[] | null = null;
/** All three leagues. Full-name slugs keep them apart (carolina-panthers vs
 * florida-panthers, new-york-jets vs winnipeg-jets); a collision fails the build. */
function everyTeam(): RecordTeam[] {
  if (everyMemo) return everyMemo;
  const all = [...allRecordTeams("nfl"), ...allRecordTeams("nba"), ...allRecordTeams("nhl")];
  const seen = new Map<string, string>();
  for (const t of all) {
    const other = seen.get(t.slug);
    if (other) throw new Error(`uniform-records slug collision: ${t.slug} (${other} and ${t.name})`);
    seen.set(t.slug, t.name);
  }
  return (everyMemo = all);
}

/** Every team page, all leagues. */
export const allRecordTeamSlugs = () => everyTeam().map((t) => t.slug);
export const recordTeamBySlug = (slug: string) => everyTeam().find((t) => t.slug === slug);
/** By full club name ("Detroit Lions") or its site slug ("detroit-lions"). */
export const hasUniformRecords = (slugOrName: string) =>
  everyTeam().some((t) => t.slug === slugOrName || t.name === slugOrName);

type Rec = { w: number; l: number; t: number; otl?: number };
export const games = (r: Rec) => r.w + r.l + r.t + (r.otl ?? 0);
/** NFL "9-3" or "9-3-1" with ties; NHL always W-L-OTL ("9-3-2"). */
export const fmtRecord = (r: Rec) =>
  r.otl !== undefined ? `${r.w}-${r.l}-${r.otl}` : `${r.w}-${r.l}${r.t ? `-${r.t}` : ""}`;
/** Ties count as half a win, the NFL's own standings formula. For the NHL the same
 * sum is points percentage: an OT/shootout loss earns one of the two points. */
export const winPct = (r: Rec) => (games(r) ? (r.w + r.t / 2 + (r.otl ?? 0) / 2) / games(r) : 0);
export const fmtPct = (r: Rec) => {
  const p = winPct(r);
  return p === 1 ? "1.000" : p.toFixed(3).replace(/^0/, "");
};

/** "Silver Helmet, Honolulu Blue Jersey, Silver Pants". */
export const comboTitle = (c: RecordCombo) => `${c.helmet} Helmet, ${c.jerseyName} Jersey, ${c.pants} Pants`;
/** Plain sentence form: "the silver helmet, Honolulu Blue jersey and silver pants". */
export const comboSentence = (c: RecordCombo) =>
  `the ${colorWord(c.helmet)} helmet, ${colorWord(c.jerseyName)} jersey and ${colorWord(c.pants)} pants`;

// Plain color words read lowercase mid-sentence ("silver pants"); named colors
// and jerseys keep their capitals ("Honolulu Blue", "Rivalries Silver").
const PLAIN = new Set(["white", "black", "silver", "gray", "grey", "gold", "red", "blue", "navy", "green", "orange", "purple", "brown", "teal", "aqua", "royal", "yellow", "burgundy", "pewter", "scarlet", "cream"]);
export const colorWord = (s: string) => (PLAIN.has(s.toLowerCase()) ? s.toLowerCase() : s);

export const possessive = (nickname: string) => (nickname.endsWith("s") ? `${nickname}'` : `${nickname}'s`);

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const fmtDate = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${MON[m - 1]} ${d}`;
};

function splitBy(team: RecordTeam, part: (c: RecordCombo) => [string, string]): Split[] {
  const map = new Map<string, Split>();
  for (const c of team.combos) {
    const [label, hex] = part(c);
    const s = map.get(label) ?? { label, hex, w: 0, l: 0, t: 0, ...(c.otl !== undefined ? { otl: 0 } : {}), games: 0 };
    s.w += c.w;
    s.l += c.l;
    s.t += c.t;
    if (c.otl !== undefined) s.otl = (s.otl ?? 0) + c.otl;
    s.games += games(c);
    map.set(label, s);
  }
  return [...map.values()].sort((a, b) => b.games - a.games || winPct(b) - winPct(a));
}
export const jerseySplits = (t: RecordTeam) => splitBy(t, (c) => [c.jerseyName, c.hexes[1]]);
export const pantsSplits = (t: RecordTeam) => splitBy(t, (c) => [c.pants, c.hexes[2]]);
export const helmetSplits = (t: RecordTeam) => splitBy(t, (c) => [c.helmet, c.hexes[0]]);

export interface LeagueCombo extends RecordCombo {
  team: RecordTeam;
}

/** Every combination in the league, with its team. */
export function leagueCombos(league: RecordLeague = "nfl"): LeagueCombo[] {
  return allRecordTeams(league).flatMap((team) => team.combos.map((c) => ({ ...c, team })));
}

const byName = (a: LeagueCombo, b: LeagueCombo) =>
  a.team.name.localeCompare(b.team.name) || a.jerseyName.localeCompare(b.jerseyName);

/** The hub's leaderboards. Two games minimum for the win % and unbeaten/winless lists. */
export function leaderboards(league: RecordLeague = "nfl") {
  const all = leagueCombos(league);
  const twoPlus = all.filter((c) => games(c) >= 2);
  return {
    best: [...twoPlus]
      .sort((a, b) => winPct(b) - winPct(a) || games(b) - games(a) || byName(a, b))
      .slice(0, 15),
    unbeaten: twoPlus
      .filter((c) => c.l === 0 && !c.otl)
      .sort((a, b) => games(b) - games(a) || b.w - a.w || byName(a, b)),
    winless: twoPlus
      .filter((c) => c.w === 0)
      .sort((a, b) => games(b) - games(a) || b.l - a.l || byName(a, b)),
    mostWorn: [...all].sort((a, b) => games(b) - games(a) || winPct(b) - winPct(a) || byName(a, b)).slice(0, 15),
    oneGame: all.length - twoPlus.length,
    comboCount: all.length,
  };
}
