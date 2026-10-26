import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { TEAM_LOGOS, teamSlug } from "@/lib/teamLogos";
import { nbaTile } from "@/lib/nbaTiles";

// Per-club NBA and NHL uniform calendars, the winter counterpart to
// /nfl-tracker and /mlb-tracker.
//
// Football's calendar could be parsed straight out of the schedule posts because
// those already carry a week-by-week grid. Basketball and hockey have no such
// grid yet, so the fixture list comes from content/data/winter-schedules.json
// (fetched once from ESPN by scripts/fetch-winter-schedules.mjs) and the uniform
// against each date fills in as the season is logged.
//
// Nothing here invents a uniform. A game with no logged jersey says so.

const postsDirectory = path.join(process.cwd(), "content/posts");
const dataFile = path.join(process.cwd(), "content/data/winter-schedules.json");
// NHL: the club table and the nightly game log that also drives the 32 schedule
// posts and the daily tracker post (scripts/nhl-tracker-day.mjs). A game counts
// here only once it is marked confirmed in the log.
const nhlTeamsFile = path.join(process.cwd(), "content/data/nhl-teams.json");
const nhlLogFile = path.join(process.cwd(), "scripts/data/nhl-game-log-2026-27.json");

// Known NHL jersey tiles. Read ONE literal folder, never path.join(cwd, "public", x):
// a dynamic path into public/ makes Vercel's file tracer bundle all of public/
// (~300 MB) into every function that imports this module. That blew the 250 MB
// function limit and failed the 2026-10-02 deploys.
let nhlTiles: Set<string> | null = null;
function nhlTileExists(src: string): boolean {
  if (!nhlTiles) {
    try {
      nhlTiles = new Set(
        fs.readdirSync(path.join(process.cwd(), "public/images/posts/nhl-daily-tracker")).map(
          (f) => `/images/posts/nhl-daily-tracker/${f}`,
        ),
      );
    } catch {
      nhlTiles = new Set();
    }
  }
  return nhlTiles.has(src);
}
const NHL_TILES = "/images/posts/nhl-daily-tracker";

// NBA: the official announced uniform schedule and the nightly worn log (finals
// from scripts/nba-worn-log.mjs, jerseys confirmed from game photos). The same
// worn log drives the tables in the 30 NBA team schedule posts
// (scripts/gen-nba-schedule-tables.mjs). A game counts as worn here only once
// it is marked confirmed in the log.
const nbaAnnouncedFile = path.join(process.cwd(), "scripts/data/nba-announced-uniforms-2026-27.json");
const nbaWornFile = path.join(process.cwd(), "scripts/data/nba-worn-2026-27.json");
const NBA_TRI: Record<string, string> = {
  "atlanta-hawks": "ATL", "boston-celtics": "BOS", "brooklyn-nets": "BKN", "charlotte-hornets": "CHA",
  "chicago-bulls": "CHI", "cleveland-cavaliers": "CLE", "dallas-mavericks": "DAL", "denver-nuggets": "DEN",
  "detroit-pistons": "DET", "golden-state-warriors": "GSW", "houston-rockets": "HOU", "indiana-pacers": "IND",
  "la-clippers": "LAC", "los-angeles-lakers": "LAL", "memphis-grizzlies": "MEM", "miami-heat": "MIA",
  "milwaukee-bucks": "MIL", "minnesota-timberwolves": "MIN", "new-orleans-pelicans": "NOP", "new-york-knicks": "NYK",
  "oklahoma-city-thunder": "OKC", "orlando-magic": "ORL", "philadelphia-76ers": "PHI", "phoenix-suns": "PHX",
  "portland-trail-blazers": "POR", "sacramento-kings": "SAC", "san-antonio-spurs": "SAS", "toronto-raptors": "TOR",
  "utah-jazz": "UTA", "washington-wizards": "WAS",
};
interface NbaWornEntry {
  score?: { away: number; home: number };
  ot?: boolean;
  confirmed?: boolean;
  away?: { call?: string };
  home?: { call?: string };
}
interface NbaGameState { scheduled?: string; uniform?: string; result?: string }

/** "<tri>|<date>" -> announced call, final result and (confirmed games only) the jersey worn. */
function nbaByTeamDate(): Map<string, NbaGameState> {
  const out = new Map<string, NbaGameState>();
  let ann: Record<string, { games: Record<string, string> }> = {};
  let worn: Record<string, NbaWornEntry> = {};
  try { ann = JSON.parse(fs.readFileSync(nbaAnnouncedFile, "utf8")); } catch {}
  try { worn = JSON.parse(fs.readFileSync(nbaWornFile, "utf8")).games ?? {}; } catch {}
  for (const [tri, t] of Object.entries(ann)) {
    for (const [d, call] of Object.entries(t.games ?? {})) out.set(`${tri}|${d}`, { scheduled: call });
  }
  for (const [k, e] of Object.entries(worn)) {
    const m = /^(\d{4}-\d{2}-\d{2}) ([A-Z]{3})@([A-Z]{3})$/.exec(k);
    if (!m || !e.score) continue;
    const [, date, away, home] = m;
    for (const [tri, isHome] of [[away, false], [home, true]] as const) {
      const key = `${tri}|${date}`;
      const st = out.get(key) ?? {};
      const mine = isHome ? e.score.home : e.score.away;
      const theirs = isHome ? e.score.away : e.score.home;
      st.result = `${mine > theirs ? "W" : "L"} ${mine}-${theirs}${e.ot ? " OT" : ""}`;
      if (e.confirmed) {
        st.uniform = (isHome ? e.home : e.away)?.call ?? st.scheduled ?? (isHome ? "Association White" : "Icon Edition");
      }
      out.set(key, st);
    }
  }
  return out;
}

export interface NhlTeam {
  name: string;
  short: string;
  key: string;
  slug: string;
  post: string;
  division: string;
  homeLabel: string;
  homeSwatch: string;
}
interface NhlSide { call?: string; color?: string; image?: string; swatch?: string }
interface NhlLogEntry { confirmed?: boolean; home?: NhlSide; away?: NhlSide }

export function nhlTeams(): Record<string, NhlTeam> {
  if (!fs.existsSync(nhlTeamsFile)) return {};
  return JSON.parse(fs.readFileSync(nhlTeamsFile, "utf8")).teams;
}

/** "<tri>|<date>" -> announced non-default call, filled by nhlConfirmedByTeamDate. */
const expectedCalls = new Map<string, string>();

/** "<tri>|<date>" -> what that club wore that night, for confirmed games only. */
function nhlConfirmedByTeamDate(): Map<string, { uniform: string; image: string; swatch: string }> {
  const out = new Map<string, { uniform: string; image: string; swatch: string }>();
  if (!fs.existsSync(nhlLogFile)) return out;
  const teams = nhlTeams();
  const games: Record<string, NhlLogEntry> = JSON.parse(fs.readFileSync(nhlLogFile, "utf8")).games;
  for (const [k, entry] of Object.entries(games)) {
    const m = /^(\d{4}-\d{2}-\d{2}) ([A-Z]{3})@([A-Z]{3})$/.exec(k);
    if (m) {
      // announced specials (no confirmed flag yet) feed the "expected" label
      const [, d, aw, hm] = m;
      if (entry.home?.call) expectedCalls.set(`${hm}|${d}`, entry.home.call);
      if (entry.away?.call) expectedCalls.set(`${aw}|${d}`, entry.away.call);
    }
    if (!m || !entry.confirmed) continue;
    const [, date, away, home] = m;
    for (const [tri, isHome] of [[away, false], [home, true]] as const) {
      const t = teams[tri];
      if (!t) continue;
      const s = (isHome ? entry.home : entry.away) ?? {};
      const uniform = s.call ?? (isHome ? t.homeLabel : "Road White");
      const image = s.image ?? `${NHL_TILES}/${t.key}-${isHome ? "home" : "road"}.jpg`;
      const swatch =
        s.swatch ?? (s.color && !/^Road White/.test(uniform) ? s.color : undefined) ?? (isHome ? t.homeSwatch : "#ffffff");
      out.set(`${tri}|${date}`, {
        uniform,
        image: nhlTileExists(image) ? image : "",
        swatch,
      });
    }
  }
  return out;
}

export interface WinterGame {
  /** ISO date in US Eastern, e.g. "2026-10-21". */
  date: string;
  opponent: string;
  opponentAbbr: string;
  home: boolean;
  /** The jersey worn, once it has been logged. */
  uniform?: string;
  /** NHL only: true once both sweaters were seen in game photos. */
  confirmed?: boolean;
  /** Product shot of the jersey/sweater worn (confirmed games). */
  image?: string;
  /** NHL only: swatch hex for the sweater worn. */
  swatch?: string;
  /** NHL only: the expected sweater for a game not yet confirmed (league
   *  default, or an announced special from the game log). */
  expected?: string;
  /** Tile for a future game's expected look. NHL: the standard home/road
   *  sweater (announced specials get none). NBA: the announced edition. */
  expectedImage?: string;
  /** NBA only: final result from the club's side, e.g. "W 121-113". */
  result?: string;
  /** NBA only: the announced call, set on a confirmed game only when the club
   *  wore something else (a schedule miss). */
  scheduled?: string;
}

export interface WinterTeamEntry {
  key: string;
  name: string;
  slug: string;
  nickname: string;
  league: "nba" | "nhl";
  color: string;
  logo: string;
  scheduleSlug: string;
  /** NHL only: division name, for the /nhl-tracker hub. */
  division?: string;
  games: WinterGame[];
}

interface RawFile {
  season: string;
  fetched: string;
  teams: Record<string, { name: string; league: "nba" | "nhl"; games: { d: string; o: string; a: string; h: number }[] }>;
}

const TWO_WORD = ["Trail Blazers", "Red Wings", "Blue Jackets", "Maple Leafs", "Golden Knights"];
const nickname = (name: string) =>
  TWO_WORD.find((n) => name.endsWith(n)) ?? name.split(" ").slice(-1)[0];

let cache: WinterTeamEntry[] | null = null;

export function buildWinterIndex(): WinterTeamEntry[] {
  if (cache) return cache;
  if (!fs.existsSync(dataFile)) return (cache = []);

  const raw: RawFile = JSON.parse(fs.readFileSync(dataFile, "utf8"));

  // Schedule posts, indexed by the club they are tagged with, for the accent
  // colour and the outbound link. Same trick as the NFL index: the gradient's
  // first hex is the club's primary, so there is no colour table to maintain.
  const posts = new Map<string, { slug: string; color: string }>();
  for (const file of fs.readdirSync(postsDirectory)) {
    if (!file.endsWith("-uniform-schedule-2026-27.md")) continue;
    const { data } = matter(fs.readFileSync(path.join(postsDirectory, file), "utf8"));
    const hex = /#([0-9a-fA-F]{6})/.exec(String(data.gradient ?? ""));
    for (const t of (data.teams as string[]) ?? []) {
      posts.set(t, { slug: file.replace(/\.md$/, ""), color: hex ? `#${hex[1]}` : "#14284b" });
    }
  }

  const nhlBySlug = new Map(Object.entries(nhlTeams()).map(([tri, t]) => [t.slug, { tri, ...t }]));
  const nhlWorn = nhlConfirmedByTeamDate();
  const nbaState = nbaByTeamDate();

  const out: WinterTeamEntry[] = [];
  for (const [slug, t] of Object.entries(raw.teams)) {
    const logo = (TEAM_LOGOS as Record<string, string>)[t.name];
    const post = posts.get(slug);
    // A club with no schedule post has nowhere to send readers, so it is skipped
    // rather than shipped as a dead end.
    if (!logo || !post) continue;

    const nhl = t.league === "nhl" ? nhlBySlug.get(slug) : undefined;
    out.push({
      key: nhl?.key ?? teamSlug(nickname(t.name)),
      name: t.name,
      slug,
      nickname: nickname(t.name),
      league: t.league,
      color: post.color,
      logo,
      scheduleSlug: post.slug,
      division: nhl?.division,
      games: t.games.map((g) => {
        const game: WinterGame = { date: g.d, opponent: g.o, opponentAbbr: g.a, home: g.h === 1 };
        const worn = nhl ? nhlWorn.get(`${nhl.tri}|${g.d}`) : undefined;
        if (nhl) {
          const special = expectedCalls.get(`${nhl.tri}|${g.d}`);
          game.expected = special ?? (game.home ? nhl.homeLabel : "Road White");
          const tile = `${NHL_TILES}/${nhl.key}-${game.home ? "home" : "road"}.jpg`;
          if (!special && nhlTileExists(tile)) game.expectedImage = tile;
        }
        const nbaTri = t.league === "nba" ? NBA_TRI[slug] : undefined;
        const nba = nbaTri ? nbaState.get(`${nbaTri}|${g.d}`) : undefined;
        if (nba) {
          if (nba.scheduled) {
            game.expected = nba.scheduled;
            const tile = nbaTile(nbaTri!, nba.scheduled);
            if (tile) game.expectedImage = tile;
          }
          if (nba.result) game.result = nba.result;
          if (nba.uniform) {
            game.uniform = nba.uniform;
            game.confirmed = true;
            if (nba.scheduled && nba.scheduled !== nba.uniform) game.scheduled = nba.scheduled;
            const tile = nbaTile(nbaTri!, nba.uniform);
            if (tile) game.image = tile;
          }
        }
        if (worn) {
          game.uniform = worn.uniform;
          game.confirmed = true;
          game.swatch = worn.swatch;
          if (worn.image) game.image = worn.image;
        }
        return game;
      }),
    });
  }

  out.sort((a, b) => a.name.localeCompare(b.name));
  cache = out;
  return out;
}

export function winterTeamKeys(league: "nba" | "nhl"): string[] {
  return buildWinterIndex().filter((t) => t.league === league).map((t) => t.key);
}

export function winterTeamByKey(league: "nba" | "nhl", key: string): WinterTeamEntry | undefined {
  return buildWinterIndex().find((t) => t.league === league && t.key === key);
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/** "Wed, Oct 21" — parsed as a plain date so it never shifts by a timezone. */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${DAYS[dt.getUTCDay()]}, ${MONTHS[m - 1].slice(0, 3)} ${d}`;
}

export function winterGamesByMonth(entry: WinterTeamEntry) {
  const buckets = new Map<string, WinterGame[]>();
  for (const g of entry.games) {
    const [y, m] = g.date.split("-").map(Number);
    const label = `${MONTHS[m - 1]} ${y}`;
    buckets.set(label, [...(buckets.get(label) ?? []), g]);
  }
  return [...buckets.entries()].map(([month, games]) => ({ month, games }));
}

/** Jerseys logged so far, most-worn first, with the home/road split and a
 *  product shot when one exists. Empty until the season is under way. */
export function winterUniformUsage(entry: WinterTeamEntry) {
  const counts = new Map<
    string,
    { uniform: string; total: number; home: number; road: number; image?: string; swatch?: string }
  >();
  for (const g of entry.games) {
    if (!g.uniform) continue;
    const c = counts.get(g.uniform) ?? { uniform: g.uniform, total: 0, home: 0, road: 0, image: g.image, swatch: g.swatch };
    c.total += 1;
    if (g.home) c.home += 1;
    else c.road += 1;
    c.image ??= g.image;
    counts.set(g.uniform, c);
  }
  return [...counts.values()].sort((a, b) => b.total - a.total);
}

export interface NhlLastNightSide { short: string; uniform: string; image: string; swatch: string }
export interface NhlLastNight {
  /** ISO date of the most recent night with a confirmed game. */
  date: string;
  /** "Thu, Oct 1" */
  label: string;
  /** Heading id of that day on the daily tracker post ("thursday-october-1"). */
  anchor: string;
  games: { away: NhlLastNightSide; home: NhlLastNightSide }[];
}

/** The most recent logged night, confirmed games only, for the homepage NHL
 *  zone. Same game-log rules as the team calendars; nothing is invented. */
export function nhlLastNight(): NhlLastNight | null {
  if (!fs.existsSync(nhlLogFile)) return null;
  const worn = nhlConfirmedByTeamDate();
  const teams = nhlTeams();
  const games: Record<string, NhlLogEntry> = JSON.parse(fs.readFileSync(nhlLogFile, "utf8")).games;
  const keys = Object.entries(games)
    .filter(([, e]) => e.confirmed)
    .map(([k]) => /^(\d{4}-\d{2}-\d{2}) ([A-Z]{3})@([A-Z]{3})$/.exec(k))
    .filter((m): m is RegExpExecArray => Boolean(m));
  if (keys.length === 0) return null;
  // Cap at the latest night BEFORE today in Pacific time. Today's games get
  // confirmed at puck drop, so taking the newest date labelled tonight's
  // in-progress slate "Last Night" (2026-10-12). Falls back to the newest date
  // only if nothing earlier exists.
  const todayPt = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  const dates = keys.map((m) => m[1]).sort();
  const date = dates.filter((d) => d < todayPt).at(-1) ?? dates.at(-1)!;
  const side = (tri: string): NhlLastNightSide | null => {
    const t = teams[tri];
    const w = worn.get(`${tri}|${date}`);
    return t && w ? { short: t.short, uniform: w.uniform, image: w.image, swatch: w.swatch } : null;
  };
  const out: NhlLastNight["games"] = [];
  for (const m of keys) {
    if (m[1] !== date) continue;
    const away = side(m[2]);
    const home = side(m[3]);
    if (away && home) out.push({ away, home });
  }
  if (out.length === 0) return null;
  const [y, mo, d] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  return {
    date,
    label: shortDate(date),
    anchor: `${weekday}-${MONTHS[mo - 1]}-${d}`.toLowerCase(),
    games: out,
  };
}
