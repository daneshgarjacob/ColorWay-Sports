import nfl from "@/content/data/quizzes/nfl-logo-quiz-hard.json";
import nfl2 from "@/content/data/quizzes/nfl-logo-quiz-hard-2.json";
import nfl3 from "@/content/data/quizzes/nfl-logo-quiz-hard-3.json";
import nfl4 from "@/content/data/quizzes/nfl-logo-quiz-hard-4.json";
import nba from "@/content/data/quizzes/nba-logo-quiz-hard.json";
import nba2 from "@/content/data/quizzes/nba-logo-quiz-hard-2.json";
import nba3 from "@/content/data/quizzes/nba-logo-quiz-hard-3.json";
import nba4 from "@/content/data/quizzes/nba-logo-quiz-hard-4.json";
// NHL parts 2-4 use only the 24 teams NOT in the hidden part-1 (TikTok) set.
import nhl2 from "@/content/data/quizzes/nhl-logo-quiz-hard-2.json";
import nhl3 from "@/content/data/quizzes/nhl-logo-quiz-hard-3.json";
import nhl4 from "@/content/data/quizzes/nhl-logo-quiz-hard-4.json";
// MLB parts 2-4 use only the 22 teams NOT in the hidden part-1 set.
import mlb2 from "@/content/data/quizzes/mlb-logo-quiz-hard-2.json";
import mlb3 from "@/content/data/quizzes/mlb-logo-quiz-hard-3.json";
import mlb4 from "@/content/data/quizzes/mlb-logo-quiz-hard-4.json";
import sec from "@/content/data/quizzes/sec-logo-quiz-hard.json";
import bigTen from "@/content/data/quizzes/big-ten-logo-quiz-hard.json";
// Jersey quizzes (11/16): pieces cut from the tracker jersey images in public/.
import nflJersey from "@/content/data/quizzes/nfl-jersey-quiz-hard.json";
import nflJersey2 from "@/content/data/quizzes/nfl-jersey-quiz-hard-2.json";
import nflJersey3 from "@/content/data/quizzes/nfl-jersey-quiz-hard-3.json";
import nbaJersey from "@/content/data/quizzes/nba-jersey-quiz-hard.json";
import nbaJersey2 from "@/content/data/quizzes/nba-jersey-quiz-hard-2.json";
// NHL jersey quizzes leave out the hidden NHL TikTok quiz teams
// (TOR, DET, PIT, CHI, VAN, SEA, WPG, MIN).
import nhlJersey from "@/content/data/quizzes/nhl-jersey-quiz-hard.json";
import nhlJersey2 from "@/content/data/quizzes/nhl-jersey-quiz-hard-2.json";
// NHL and MLB quizzes are hidden for now: re-enable after TikTok posts.
// Their JSON and images stay in the repo; uncomment these two imports and add
// nhl, mlb back to RAW below to publish them (pages, hub cards, next-quiz
// chain and sitemap all follow RAW).
// import nhl from "@/content/data/quizzes/nhl-logo-quiz-hard.json";
// import mlb from "@/content/data/quizzes/mlb-logo-quiz-hard.json";
import { teamSlug, LEAGUE_LOGOS } from "@/lib/teamLogos";
import { buildTeamQuickLinks } from "@/lib/teamQuickLinks";

// Logo quizzes (site plan 11/16, item #3): the TikTok logo-piece quizzes as
// real, server-rendered pages. Each quiz is a JSON file in content/data/quizzes/;
// its images are cut by scripts/build-quiz-assets.mjs into public/quiz/<slug>/
// (q<n>.webp = the piece, a<n>.webp = the full logo). To add a quiz: write the
// JSON, import it below, run the script, commit the images.

export interface QuizItemData {
  /** Short code of the logo file in the social source folder, e.g. "atl". */
  abbr: string;
  /** Source image file name, for quizzes whose source is a folder in public/
   *  (jersey quizzes): the piece is cut from <source>/<file>. */
  file?: string;
  /** Full club name, exactly as on the site (lib/teamLogos), e.g. "Atlanta Falcons". */
  team: string;
  /** Crop box as fractions of the source logo: [x0, y0, x1, y1]. */
  box: number[];
  /** Optional nudge shown under the piece. */
  hint?: string;
  /** What the piece actually shows, said after the reveal. */
  piece: string;
  /** One-line fact about the logo, shown with the answer. */
  fact: string;
  /** Optional team story to send the reader to (logo or uniform history). */
  story?: string;
}

/** What a quiz is made of. Old JSON files have no type: they are logo quizzes. */
export type QuizType = "logo" | "jersey" | "oldlogo";

export interface QuizData {
  slug: string;
  type?: QuizType;
  league: string;
  leagueName: string;
  title: string;
  headline: string;
  description: string;
  intro: string[];
  /** Folder under ~/Desktop/ColorWay Sports/social the pieces were cut from,
   *  or a repo folder starting with "public/" (jersey quizzes). */
  source: string;
  published: string;
  readMore: { label: string; href: string }[];
  items: QuizItemData[];
}

export interface QuizLink {
  label: string;
  href: string;
}

export interface QuizItem extends QuizItemData {
  n: number;
  pieceSrc: string;
  logoSrc: string;
  /** Uniform schedule post, all team stories, plus the item's own story if set. */
  links: QuizLink[];
}

export interface Quiz extends Omit<QuizData, "items" | "type"> {
  type: QuizType;
  items: QuizItem[];
  leagueLogo?: string;
}

/** Wording that changes with the quiz type (page titles, question, score line). */
export const QUIZ_TYPE_COPY: Record<QuizType, { noun: string; question: string; hubTitle: string; titleTail: string }> = {
  logo: {
    noun: "Logo",
    question: "Whose Logo Is This?",
    hubTitle: "Logo Quizzes",
    titleTail: "Name The Team From A Tiny Piece Of Its Logo",
  },
  jersey: {
    noun: "Jersey",
    question: "Whose Jersey Is This?",
    hubTitle: "Jersey Quizzes",
    titleTail: "Name The Team From A Tiny Piece Of Its Jersey",
  },
  oldlogo: {
    noun: "Old Logo",
    question: "Whose Old Logo Is This?",
    hubTitle: "Old Logo Quizzes",
    titleTail: "Name The Team From A Tiny Piece Of Its Old Logo",
  },
};

// Order here is the order inside each league group on the /quiz hub and the
// "next quiz" chain (it runs league by league, then wraps).
// NHL and MLB part 1 hidden: re-enable after TikTok posts by putting nhl before
// nhl2 and mlb before mlb2.
const RAW: QuizData[] = [
  nfl, nfl2, nfl3, nfl4,
  nba, nba2, nba3, nba4,
  nhl2, nhl3, nhl4,
  mlb2, mlb3, mlb4,
  sec, bigTen,
  nflJersey, nflJersey2, nflJersey3,
  nbaJersey, nbaJersey2,
  nhlJersey, nhlJersey2,
] as QuizData[];

/** Hub sections by type, in order. Inside "logo", quizzes are grouped by league (QUIZ_GROUPS). */
export const QUIZ_TYPE_ORDER: QuizType[] = ["logo", "jersey", "oldlogo"];

/** Hub sections, in order. A quiz goes in the group whose leagueName matches. */
export const QUIZ_GROUPS: { title: string; leagueNames: string[] }[] = [
  { title: "NFL", leagueNames: ["NFL"] },
  { title: "NBA", leagueNames: ["NBA"] },
  { title: "NHL", leagueNames: ["NHL"] },
  { title: "MLB", leagueNames: ["MLB"] },
  { title: "College Football", leagueNames: ["SEC", "Big Ten", "ACC", "Big 12"] },
];

export const QUIZ_SIZE = 8;

// Built once per process: it walks every post to find the schedule posts.
let quickLinks: ReturnType<typeof buildTeamQuickLinks> | undefined;

function teamLinks(item: QuizItemData): QuizLink[] {
  const slug = teamSlug(item.team);
  quickLinks ??= buildTeamQuickLinks();
  const quick = quickLinks[slug];
  const links: QuizLink[] = [];
  if (item.story) links.push({ label: `${item.team} Logo And Jersey History`, href: item.story });
  const schedule = quick?.links.find((l) => l.kind === "schedule");
  if (schedule) links.push({ label: schedule.label, href: schedule.href });
  links.push({ label: `All ${item.team} Stories`, href: `/stories?team=${slug}` });
  return links;
}

function hydrate(q: QuizData): Quiz {
  return {
    ...q,
    type: q.type ?? "logo",
    leagueLogo: LEAGUE_LOGOS[q.league],
    items: q.items.map((item, i) => ({
      ...item,
      n: i + 1,
      pieceSrc: `/quiz/${q.slug}/q${i + 1}.webp`,
      logoSrc: `/quiz/${q.slug}/a${i + 1}.webp`,
      links: teamLinks(item),
    })),
  };
}

export function getAllQuizzes(): Quiz[] {
  return RAW.map(hydrate);
}

/** The published quizzes without links (no post walk): cheap enough for ISR renders. */
export function getQuizData(slug: string): QuizData | undefined {
  return RAW.find((q) => q.slug === slug);
}

export function getQuiz(slug: string): Quiz | undefined {
  const raw = RAW.find((q) => q.slug === slug);
  return raw ? hydrate(raw) : undefined;
}

/** The quiz after this one, wrapping around, so every page ends on another quiz. */
export function nextQuiz(slug: string): Quiz {
  const i = RAW.findIndex((q) => q.slug === slug);
  return hydrate(RAW[(i + 1) % RAW.length]);
}
