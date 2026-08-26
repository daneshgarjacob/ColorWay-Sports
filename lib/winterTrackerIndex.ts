import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { TEAM_LOGOS, teamSlug } from "@/lib/teamLogos";

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

export interface WinterGame {
  /** ISO date in US Eastern, e.g. "2026-10-21". */
  date: string;
  opponent: string;
  opponentAbbr: string;
  home: boolean;
  /** The jersey worn, once it has been logged. */
  uniform?: string;
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

  const out: WinterTeamEntry[] = [];
  for (const [slug, t] of Object.entries(raw.teams)) {
    const logo = (TEAM_LOGOS as Record<string, string>)[t.name];
    const post = posts.get(slug);
    // A club with no schedule post has nowhere to send readers, so it is skipped
    // rather than shipped as a dead end.
    if (!logo || !post) continue;

    out.push({
      key: teamSlug(nickname(t.name)),
      name: t.name,
      slug,
      nickname: nickname(t.name),
      league: t.league,
      color: post.color,
      logo,
      scheduleSlug: post.slug,
      games: t.games.map((g) => ({
        date: g.d,
        opponent: g.o,
        opponentAbbr: g.a,
        home: g.h === 1,
      })),
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

/** Jerseys logged so far, most-worn first. Empty until the season is under way. */
export function winterUniformUsage(entry: WinterTeamEntry) {
  const counts = new Map<string, number>();
  for (const g of entry.games) {
    if (!g.uniform) continue;
    counts.set(g.uniform, (counts.get(g.uniform) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([uniform, total]) => ({ uniform, total }))
    .sort((a, b) => b.total - a.total);
}
