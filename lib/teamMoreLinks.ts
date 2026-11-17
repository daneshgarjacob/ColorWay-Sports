import fs from "fs";
import path from "path";
import { getAllPosts } from "@/lib/posts";
import { TEAM_LOGOS, teamSlug } from "@/lib/teamLogos";
import { buildTeamQuickLinks, nickname, type TeamQuickLinksEntry } from "@/lib/teamQuickLinks";
import { buildNflTeamIndex } from "@/lib/nflTrackerTeamIndex";
import { buildWinterIndex } from "@/lib/winterTrackerIndex";
import { parseCollegeGrid } from "@/lib/teamWearAnswers";
import { explainedForTeam } from "@/lib/explained";
import { hasUniformRecords } from "@/lib/uniformRecords";
import rivalsFile from "@/content/data/rivals.json";
import kickoffsFile from "@/content/data/nfl-kickoffs-2026.json";

// "More For Your Team": the block near the end of every team schedule post and
// tracker team page. 89% of readers are new and read 1.45 pages, almost all of
// them on one team's schedule post. This hands them the next three things a fan
// of that team wants: the next opponent's page, the rival's page, the team's
// "why" story, the holiday hub they are in, their calendar and the league
// tracker.
//
// Every link is built from pages that exist at build time (posts on disk, the
// tracker indexes), so a link here cannot 404. scripts/check-team-more-links.mjs
// also fails the build if rivals.json names a team with no schedule post.

export type MoreLinkKind = "next" | "rival" | "explained" | "hub" | "calendar" | "tracker" | "records";

export interface TeamMoreLink {
  kind: MoreLinkKind;
  /** Small label above the link, e.g. "Next Game · Wed, Nov 25". */
  eyebrow: string;
  label: string;
  detail?: string;
  href: string;
  logo?: string;
}

export interface TeamMoreData {
  slug: string;
  name: string;
  short: string;
  league: string;
  logo?: string;
  links: TeamMoreLink[];
}

type RivalsFile = Record<string, Record<string, string[]> | string>;
const RIVALS = rivalsFile as unknown as RivalsFile;

function rivalsOf(league: string, team: string): string[] {
  const table = RIVALS[league];
  if (!table || typeof table === "string") return [];
  return table[team] ?? [];
}

// Holiday-week hubs. A team in the hub's `teams:` gets a link to it until the
// day after its last game, then the link drops on the next render.
const SEASONAL_HUBS: { slug: string; until: string; eyebrow: string }[] = [
  { slug: "nfl-thanksgiving-uniforms-2026", until: "2026-11-27", eyebrow: "Thanksgiving Week" },
  { slug: "college-football-rivalry-week-uniforms-2026", until: "2026-11-28", eyebrow: "Rivalry Week" },
];

const LEAGUE_TRACKER: Record<string, { slug: string; label: string }> = {
  nfl: { slug: "nfl-uniform-tracker-2026", label: "NFL Uniform Tracker: What Every Team Wore" },
  nba: { slug: "nba-uniform-tracker-2026-27", label: "NBA Uniform Tracker: Every Jersey, Every Night" },
  nhl: { slug: "nhl-uniform-tracker-2026-27", label: "NHL Uniform Tracker: Every Sweater, Every Night" },
};

const DAY = 86_400_000;
// 2026 Week 1 opens Thursday, September 10 (same anchor as nflTrackerTeamIndex).
const NFL_WEEK_ONE_THURSDAY = Date.UTC(2026, 8, 10);

/** Today's date in US Eastern, as UTC midnight ms. */
function todayEt(now: Date): number {
  const [y, m, d] = now.toLocaleDateString("en-CA", { timeZone: "America/New_York" }).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}
const isoEt = (now: Date) => new Date(todayEt(now)).toISOString().slice(0, 10);

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const fmtDay = (ms: number) => {
  const d = new Date(ms);
  return `${DOW[d.getUTCDay()]}, ${MON[d.getUTCMonth()]} ${d.getUTCDate()}`;
};

let indexMemo: Record<string, TeamQuickLinksEntry> | null = null;
function quickIndex(): Record<string, TeamQuickLinksEntry> {
  if (!indexMemo || process.env.NODE_ENV !== "production") indexMemo = buildTeamQuickLinks();
  return indexMemo;
}

const scheduleHref = (entry?: TeamQuickLinksEntry) => entry?.links.find((l) => l.kind === "schedule")?.href;
const calendarHref = (entry?: TeamQuickLinksEntry) => entry?.links.find((l) => l.kind === "calendar")?.href;

// College opponents are written by school ("Auburn", "Texas A&M", "Miami").
let schoolMemo: Map<string, string> | null = null;
function collegeSlugBySchool(): Map<string, string> {
  if (schoolMemo) return schoolMemo;
  schoolMemo = new Map();
  for (const name of Object.keys(TEAM_LOGOS)) {
    if (!TEAM_LOGOS[name].includes("/ncaa-")) continue;
    const school = name.slice(0, name.length - nickname(name).length).trim().toLowerCase();
    if (school && !schoolMemo.has(school)) schoolMemo.set(school, teamSlug(name));
  }
  return schoolMemo;
}

interface NextGame {
  when: string;
  matchup: string;
  /** This team's look for the game, with its status. */
  look?: string;
  opponentSlug?: string;
}

/** This club's kickoff per week, from ESPN's schedule (content/data/nfl-kickoffs-2026.json). */
function nflKickoffs(nick: string): Map<number, number> {
  const out = new Map<number, number>();
  for (const g of (kickoffsFile as { games: { week: number; away: string; home: string; kickoff: string }[] }).games) {
    if (g.away === nick || g.home === nick) out.set(g.week, Date.parse(g.kickoff));
  }
  return out;
}

function nextNfl(team: string, now: Date): NextGame | null {
  const entry = buildNflTeamIndex().find((t) => t.slug === team);
  if (!entry) return null;
  const kick = nflKickoffs(entry.nickname);
  // A game stays "next" until about four hours after kickoff. Weeks with no
  // kickoff on file fall back to the end of that week's window (Monday).
  const nowMs = now.getTime();
  const g = entry.games.find((x) => {
    if (x.bye) return false;
    const k = kick.get(x.week);
    return k ? k + 4 * 3600_000 > nowMs : NFL_WEEK_ONE_THURSDAY + (x.week - 1) * 7 * DAY + 5 * DAY > nowMs;
  });
  if (!g) return null;
  const k = kick.get(g.week);
  const opp = buildNflTeamIndex().find((t) => t.nickname === g.opponent || t.name.endsWith(` ${g.opponent}`));
  return {
    when: `Week ${g.week}${k ? ` · ${fmtDay(todayEt(new Date(k)))}` : ""}`,
    matchup: g.matchup,
    look: g.uniform ? `${g.uniform}${g.confirmed ? " (confirmed)" : ""}` : undefined,
    opponentSlug: opp?.slug,
  };
}

function nextWinter(team: string, now: Date): NextGame | null {
  const entry = buildWinterIndex().find((t) => t.slug === team);
  if (!entry) return null;
  const today = isoEt(now);
  const g = entry.games.find((x) => x.date >= today);
  if (!g) return null;
  const [y, m, d] = g.date.split("-").map(Number);
  const look = g.uniform ?? g.expected;
  return {
    when: fmtDay(Date.UTC(y, m - 1, d)),
    matchup: `${g.home ? "vs" : "at"} ${g.opponent}`,
    look: look ? `${look}${g.uniform ? "" : " (expected)"}` : undefined,
    opponentSlug: teamSlug(g.opponent),
  };
}

function nextCollege(scheduleSlug: string | undefined, now: Date): NextGame | null {
  if (!scheduleSlug) return null;
  const file = path.join(process.cwd(), "content/posts", `${scheduleSlug}.md`);
  if (!fs.existsSync(file)) return null;
  const games = parseCollegeGrid(fs.readFileSync(file, "utf8"));
  const today = todayEt(now);
  const g = games.find((x) => x.ts >= today);
  if (!g) return null;
  const opponent = g.matchup.replace(/^(vs\.?|at)\s+/i, "").trim().toLowerCase();
  return {
    when: fmtDay(g.ts),
    matchup: g.matchup,
    look: `${g.uniform}${g.confirmed ? " (confirmed)" : " (expected)"}`,
    opponentSlug: collegeSlugBySchool().get(opponent),
  };
}

const STORY = (slug: string) => `/stories/${slug}`;

/**
 * The links for one team, or null when the team has no schedule post. `exclude`
 * drops hrefs already on the page (the page's own URL, its calendar twin).
 */
export function buildTeamMoreLinks(
  team: string,
  {
    now = new Date(),
    exclude = [] as string[],
    /** Schedule posts already carry the team's calendar on the page. */
    skipCalendar = false,
  } = {}
): TeamMoreData | null {
  const index = quickIndex();
  const me = index[team];
  if (!me) return null;

  const posts = getAllPosts();
  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  const links: TeamMoreLink[] = [];
  const used = new Set(exclude);
  const push = (l: TeamMoreLink) => {
    if (used.has(l.href)) return;
    used.add(l.href);
    links.push(l);
  };

  // 1. Next game, linking to the opponent's own schedule post.
  const mySchedule = scheduleHref(me)?.replace(/^\/stories\//, "");
  const next =
    me.league === "nfl"
      ? nextNfl(team, now)
      : me.league === "nba" || me.league === "nhl"
        ? nextWinter(team, now)
        : me.league === "ncaa"
          ? nextCollege(mySchedule, now)
          : null;
  const opp = next?.opponentSlug ? index[next.opponentSlug] : undefined;
  const oppHref = scheduleHref(opp);
  if (next && opp && oppHref) {
    const oppName = opp.league === "ncaa" ? opp.name : opp.short;
    push({
      kind: "next",
      eyebrow: `Next Game · ${next.when}`,
      label: `${me.short} ${next.matchup}`,
      detail: `${next.look ? `${me.short}: ${next.look}. ` : ""}See every ${oppName} uniform this season.`,
      href: oppHref,
      logo: opp.logo,
    });
  }

  // 2. Rivals, biggest first, skipping the one already shown as next opponent.
  const leagueKey = me.league === "ncaa" ? "college" : me.league;
  for (const r of rivalsOf(leagueKey, team)) {
    const rival = index[r];
    const href = scheduleHref(rival);
    if (!rival || !href || used.has(href)) continue;
    push({
      kind: "rival",
      eyebrow: "The Rival",
      label: `${rival.league === "ncaa" ? rival.name : rival.short} Uniform Schedule`,
      detail: "Every jersey they wear this season, and when.",
      href,
      logo: rival.logo,
    });
    break;
  }

  // 3. The team's "why" story.
  const why = explainedForTeam(team);
  if (why) {
    push({ kind: "explained", eyebrow: "Explained", label: why.title, href: STORY(why.slug) });
  }

  // 3b. Record in each uniform (site plan 11/16 item 6). A link only: the
  // win-loss numbers stay on /uniform-records, never on cards.
  if ((me.league === "nfl" || me.league === "nba" || me.league === "nhl") && hasUniformRecords(team)) {
    push({
      kind: "records",
      eyebrow: "Uniform Records",
      label: me.league === "nfl" ? `${me.short} Record In Each Uniform` : `${me.short} Record In Each Jersey`,
      detail:
        me.league === "nhl"
          ? "Win-loss-OTL in every sweater they have worn this season, from our game logs."
          : me.league === "nba"
            ? "Win-loss in every jersey they have worn this season, from our game logs."
            : "Win-loss in every helmet, jersey and pants combination, from our game logs.",
      href: `/uniform-records/${team}`,
    });
  }

  // 4. Holiday-week hub the team plays in.
  const todayIso = isoEt(now);
  for (const hub of SEASONAL_HUBS) {
    const p = bySlug.get(hub.slug);
    if (!p || todayIso > hub.until || !(p.teams ?? []).includes(team)) continue;
    push({ kind: "hub", eyebrow: hub.eyebrow, label: p.title, href: STORY(p.slug) });
  }

  // 5. The team's day-by-day calendar.
  const cal = calendarHref(me);
  if (cal && !skipCalendar) {
    push({
      kind: "calendar",
      eyebrow: "Calendar",
      label: `${me.short} Uniform Calendar`,
      detail: "Every game this season, with the jersey for each one.",
      href: cal,
    });
  }

  // 6. The league tracker (college: this week's uniform guide).
  const tracker = LEAGUE_TRACKER[me.league];
  if (tracker && bySlug.has(tracker.slug)) {
    push({ kind: "tracker", eyebrow: "Every Team", label: tracker.label, href: STORY(tracker.slug) });
  } else if (me.league === "ncaa") {
    const week = posts
      .filter((p) => /^college-football-week-\d+-uniforms-2026$/.test(p.slug) && p.date <= todayIso)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (week) push({ kind: "tracker", eyebrow: "Every Game", label: week.title, href: STORY(week.slug) });
  }

  // 7. Fallback so every team gets at least three: all of this team's stories
  // (the /stories team view, which exists for every club).
  if (links.length < 3) {
    push({
      kind: "tracker",
      eyebrow: "Every Story",
      label: `All ${me.short} Uniform Stories`,
      detail: "Reveals, grades and history, newest first.",
      href: `/stories?team=${me.slug}`,
    });
  }

  return {
    slug: me.slug,
    name: me.name,
    short: me.short,
    league: me.league,
    logo: me.logo,
    links,
  };
}
