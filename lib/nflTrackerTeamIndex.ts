import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { TEAM_LOGOS, teamSlug } from "@/lib/teamLogos";

// Per-team NFL uniform calendars, built from the week-by-week grid that already
// lives inside each "<team>-uniform-schedule-2026" post.
//
// The schedule posts are the highest-earning format on the site and they already
// carry the data — week, opponent, home or away, which jersey, and whether the
// team has confirmed it. This turns that grid into a real page you can look at,
// the way /mlb-tracker/<team> does for baseball, instead of leaving it buried
// two-thirds of the way down an article.
//
// Nothing is duplicated: edit the grid in the post and the calendar follows.

const postsDirectory = path.join(process.cwd(), "content/posts");

// 2026 Week 1 opens Thursday, September 10. Cross-checked against six confirmed
// dates in the Bills post (Wk2 Thu Sep 17, Wk3 Sun Sep 27, Wk4 Sun Oct 4,
// Wk8 Sun Nov 1, Wk12 Thanksgiving Thu Nov 26, Wk15 Sat Dec 19) — all consistent.
const WEEK_ONE_THURSDAY = Date.UTC(2026, 8, 10);

export interface NflGame {
  week: number;
  /** "vs Lions" / "at Texans" / "Bye". */
  matchup: string;
  opponent: string;
  home: boolean;
  bye: boolean;
  /** Jersey label with the confirmation star stripped, e.g. "Blue Primary". */
  uniform: string;
  /** True when the club has officially announced this game's uniform. */
  confirmed: boolean;
  background: string;
  textColor: string;
  /** "Thu, Sep 10 – Mon, Sep 14" — the week's window, not a specific kickoff. */
  window: string;
  /** Exact date when the post states one for this week, else undefined. */
  date?: string;
}

export interface NflTeamEntry {
  key: string;
  name: string;
  slug: string;
  nickname: string;
  color: string;
  logo: string;
  scheduleSlug: string;
  games: NflGame[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmt(ms: number): string {
  const d = new Date(ms);
  return `${DAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function weekWindow(week: number): string {
  const thu = WEEK_ONE_THURSDAY + (week - 1) * 7 * 86400000;
  return `${fmt(thu)} – ${fmt(thu + 4 * 86400000)}`;
}

const stripTags = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&middot;/g, "·")
    // The confirmation star is written as a numeric entity in some posts and as a
    // literal ★ in others; both have to survive to here or the game reads as
    // unconfirmed on the calendar.
    .replace(/&#9733;|&starf;|&#x2605;/gi, "★")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .trim();

// One cell of the week grid: an outer styled div wrapping WEEK n / matchup / jersey.
const CELL = new RegExp(
  '<div style="([^"]*)">\\s*<div style="[^"]*">WEEK\\s*(\\d+)</div>' +
    '\\s*<div style="[^"]*">(.*?)</div>' +
    '\\s*<div style="[^"]*">(.*?)</div>',
  "gs"
);

// "Week 11 vs. Dolphins &middot; Sunday, November 22" in the confirmed-dates block.
const CONFIRMED_DATE = /Week\s+(\d+)[^·<]*·\s*([A-Z][a-z]+day,\s+[A-Z][a-z]+\s+\d{1,2})/g;

function parseGames(markdown: string): NflGame[] {
  const dates = new Map<number, string>();
  for (const m of stripTags(markdown).matchAll(CONFIRMED_DATE)) {
    dates.set(Number(m[1]), m[2]);
  }

  const games: NflGame[] = [];
  for (const m of markdown.matchAll(CELL)) {
    const [, style, weekStr, matchupRaw, uniformRaw] = m;
    const week = Number(weekStr);
    const matchup = stripTags(matchupRaw);
    const uniformText = stripTags(uniformRaw);
    const confirmed = uniformText.startsWith("★");
    const bye = /^bye$/i.test(matchup);

    const bg = /background:\s*([^;"]+)/.exec(style);
    const fg = /(?:^|[;\s])color:\s*([^;"]+)/.exec(style);

    games.push({
      week,
      matchup,
      opponent: matchup.replace(/^(vs\.?|at)\s+/i, "").trim(),
      home: /^vs/i.test(matchup),
      bye,
      uniform: uniformText.replace(/^★\s*/, "").trim(),
      confirmed,
      background: bg ? bg[1].trim() : "#f1f3f8",
      textColor: fg ? fg[1].trim() : "#333",
      window: weekWindow(week),
      date: dates.get(week),
    });
  }

  games.sort((a, b) => a.week - b.week);
  return games;
}

let cache: NflTeamEntry[] | null = null;

/** Every NFL club whose schedule post carries a parseable week-by-week grid. */
export function buildNflTeamIndex(): NflTeamEntry[] {
  if (cache) return cache;
  if (!fs.existsSync(postsDirectory)) return (cache = []);

  // NFL clubs, straight off the shared logo map so this can never drift.
  const nflTeams = Object.entries(TEAM_LOGOS)
    .filter(([, logo]) => logo.includes("/nfl-"))
    .map(([name, logo]) => ({ name, logo, slug: teamSlug(name) }));

  const files = fs.readdirSync(postsDirectory).filter((f) => f.endsWith("-uniform-schedule-2026.md"));

  const out: NflTeamEntry[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(postsDirectory, file), "utf8");
    const { data, content } = matter(raw);
    if (String(data.league) !== "nfl") continue;

    const tagged: string[] = data.teams || [];
    const team = nflTeams.find((t) => tagged.includes(t.slug));
    if (!team) continue; // league-wide hub post, or an untagged one

    const games = parseGames(content);
    if (games.length < 17) continue; // no grid yet — see the gap list in the README of this build

    const nickname = team.name.split(" ").slice(-1)[0];
    const firstHex = /#([0-9a-fA-F]{6})/.exec(String(data.gradient ?? ""));

    out.push({
      key: teamSlug(nickname),
      name: team.name,
      slug: team.slug,
      nickname,
      color: firstHex ? `#${firstHex[1]}` : "#14284b",
      logo: team.logo,
      scheduleSlug: file.replace(/\.md$/, ""),
      games,
    });
  }

  out.sort((a, b) => a.name.localeCompare(b.name));
  cache = out;
  return out;
}

export function allNflTeamKeys(): string[] {
  return buildNflTeamIndex().map((t) => t.key);
}

export function nflTeamByKey(key: string): NflTeamEntry | undefined {
  return buildNflTeamIndex().find((t) => t.key === key);
}

/** Games per jersey, most-worn first, byes excluded. */
export function nflUniformUsage(entry: NflTeamEntry) {
  const counts = new Map<string, { uniform: string; total: number; confirmed: number; background: string; textColor: string }>();
  for (const g of entry.games) {
    if (g.bye) continue;
    const hit = counts.get(g.uniform) ?? {
      uniform: g.uniform,
      total: 0,
      confirmed: 0,
      background: g.background,
      textColor: g.textColor,
    };
    hit.total += 1;
    if (g.confirmed) hit.confirmed += 1;
    counts.set(g.uniform, hit);
  }
  return [...counts.values()].sort((a, b) => b.total - a.total);
}

/** Week cells grouped into the calendar months they fall in. */
export function nflGamesByMonth(entry: NflTeamEntry) {
  const buckets = new Map<string, NflGame[]>();
  for (const g of entry.games) {
    const thu = new Date(WEEK_ONE_THURSDAY + (g.week - 1) * 7 * 86400000);
    const label = `${["January","February","March","April","May","June","July","August","September","October","November","December"][thu.getUTCMonth()]} ${thu.getUTCFullYear()}`;
    buckets.set(label, [...(buckets.get(label) ?? []), g]);
  }
  return [...buckets.entries()].map(([month, games]) => ({ month, games }));
}
