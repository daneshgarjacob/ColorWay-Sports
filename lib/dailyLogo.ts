import schedule from "@/content/data/daily-logo/schedule.json";
import { TEAM_LOGOS, teamSlug } from "@/lib/teamLogos";
import { getQuiz, getQuizData, type QuizLink } from "@/lib/quiz";
import { answerHash, dayNumber, slotFor } from "@/lib/dailyLogoHash";

// Daily Logo (/quiz/daily): one tiny logo piece a day, the same for everyone.
//
// The order is content/data/daily-logo/schedule.json, written by
// scripts/build-daily-logo.mjs from the pieces in the PUBLISHED logo quizzes
// (append only, so no day ever changes). Day 1 is the epoch date in US Eastern
// time. The page is static: the browser works out today's number and gets only
// a file key, the league and a hash to check guesses against. The team, the
// piece line and the fact are in /quiz/daily/answer/<key>, which the page
// fetches only after the reader finishes.

export const DAILY_EPOCH = schedule.epoch;
export const DAILY_POOL = schedule.days.length;

// The pick list for each quiz league. College quizzes are by conference, so the
// list is that conference's schools (2026 membership).
const SEC = [
  "Alabama Crimson Tide", "Arkansas Razorbacks", "Auburn Tigers", "Florida Gators", "Georgia Bulldogs",
  "Kentucky Wildcats", "LSU Tigers", "Mississippi State Bulldogs", "Missouri Tigers", "Oklahoma Sooners",
  "Ole Miss Rebels", "South Carolina Gamecocks", "Tennessee Volunteers", "Texas Longhorns", "Texas A&M Aggies",
  "Vanderbilt Commodores",
];
const BIG_TEN = [
  "Illinois Fighting Illini", "Indiana Hoosiers", "Iowa Hawkeyes", "Maryland Terrapins", "Michigan Wolverines",
  "Michigan State Spartans", "Minnesota Golden Gophers", "Nebraska Cornhuskers", "Northwestern Wildcats",
  "Ohio State Buckeyes", "Oregon Ducks", "Penn State Nittany Lions", "Purdue Boilermakers", "Rutgers Scarlet Knights",
  "UCLA Bruins", "USC Trojans", "Washington Huskies", "Wisconsin Badgers",
];
const byPrefix = (p: string) =>
  Object.entries(TEAM_LOGOS)
    .filter(([, src]) => src.startsWith(`/logos/teams/${p}-`))
    .map(([name]) => name)
    .sort();

export const DAILY_LISTS: Record<string, string[]> = {
  NFL: byPrefix("nfl"),
  NBA: byPrefix("nba"),
  NHL: byPrefix("nhl"),
  MLB: byPrefix("mlb"),
  SEC: [...SEC].sort(),
  "Big Ten": [...BIG_TEN].sort(),
};

/** What the browser gets for one day: no team name. */
export interface DailyDay {
  /** File key: /quiz/daily/<k>-1.webp ... -3.webp and /quiz/daily/answer/<k>. */
  k: string;
  /** League / conference name; also the key into DAILY_LISTS. */
  l: string;
  /** answerHash(salt, k, team). */
  h: string;
}

interface Resolved {
  key: string;
  quizSlug: string;
  n: number;
  team: string;
  league: string;
}

let resolved: Resolved[] | undefined;

// Checked at build: every scheduled piece must come from a published quiz and
// its team must be in that day's pick list, or the build fails.
function days(): Resolved[] {
  if (resolved) return resolved;
  resolved = schedule.days.map((d) => {
    const q = getQuizData(d.quiz);
    if (!q) throw new Error(`Daily Logo: ${d.quiz} is in the schedule but not a published quiz`);
    const item = q.items[d.n - 1];
    if (!item) throw new Error(`Daily Logo: ${d.quiz} has no item ${d.n}`);
    const list = DAILY_LISTS[q.leagueName];
    if (!list?.includes(item.team)) throw new Error(`Daily Logo: ${item.team} is not in the ${q.leagueName} pick list`);
    return { key: d.key, quizSlug: q.slug, n: d.n, team: item.team, league: q.leagueName };
  });
  return resolved;
}

export function dailyClientData(): { epoch: string; salt: string; days: DailyDay[] } {
  return {
    epoch: schedule.epoch,
    salt: schedule.salt,
    days: days().map((d) => ({ k: d.key, l: d.league, h: answerHash(schedule.salt, d.key, d.team) })),
  };
}

export function dailyKeys(): string[] {
  return schedule.days.map((d) => d.key);
}

export interface DailyAnswer {
  team: string;
  piece: string;
  fact: string;
  logo: string;
  quiz: { slug: string; title: string };
  links: QuizLink[];
}

/** Full answer for one key (built into a static JSON file per day). */
export function dailyAnswer(key: string): DailyAnswer | undefined {
  const d = days().find((x) => x.key === key);
  if (!d) return undefined;
  const quiz = getQuiz(d.quizSlug);
  const item = quiz?.items[d.n - 1];
  if (!quiz || !item) return undefined;
  return {
    team: item.team,
    piece: item.piece,
    fact: item.fact,
    logo: item.logoSrc,
    quiz: { slug: quiz.slug, title: quiz.title },
    links: item.links,
  };
}

/** Today's day, resolved on the server, for the no-JavaScript fallback only. */
export function dailyForDate(now: Date) {
  const n = dayNumber(schedule.epoch, now);
  const d = days()[slotFor(n, DAILY_POOL)];
  const item = getQuizData(d.quizSlug)!.items[d.n - 1];
  return {
    n,
    key: d.key,
    league: d.league,
    team: d.team,
    piece: item.piece,
    fact: item.fact,
    logo: `/quiz/${d.quizSlug}/a${d.n}.webp`,
    teamHref: `/stories?team=${teamSlug(d.team)}`,
  };
}
