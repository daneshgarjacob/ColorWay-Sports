import nfl from "@/content/data/quizzes/nfl-logo-quiz-hard.json";
import nba from "@/content/data/quizzes/nba-logo-quiz-hard.json";
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

export interface QuizData {
  slug: string;
  league: string;
  leagueName: string;
  title: string;
  headline: string;
  description: string;
  intro: string[];
  /** Folder under ~/Desktop/ColorWay Sports/social the pieces were cut from. */
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

export interface Quiz extends Omit<QuizData, "items"> {
  items: QuizItem[];
  leagueLogo?: string;
}

// Order here is the order on the /quiz hub and the "next quiz" chain.
// NHL and MLB hidden: re-enable after TikTok posts -> [nfl, nba, nhl, mlb]
const RAW: QuizData[] = [nfl, nba];

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

export function getQuiz(slug: string): Quiz | undefined {
  const raw = RAW.find((q) => q.slug === slug);
  return raw ? hydrate(raw) : undefined;
}

/** The quiz after this one, wrapping around, so every page ends on another quiz. */
export function nextQuiz(slug: string): Quiz {
  const i = RAW.findIndex((q) => q.slug === slug);
  return hydrate(RAW[(i + 1) % RAW.length]);
}
