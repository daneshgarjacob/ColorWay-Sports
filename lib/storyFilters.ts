import { getAllPosts } from "@/lib/posts";
import { displayNameForSlug, LEAGUE_NAMES } from "@/lib/teamLogos";
import type { Metadata } from "next";

export const SITE_URL = "https://www.colorwaysports.com";

/**
 * A /stories filter view only earns its own canonical (and a sitemap entry) once
 * it has enough posts behind it to be a page worth landing on. Anything below the
 * floor keeps pointing at /stories, so we never push near-empty category pages
 * into the index — thin category pages are exactly the kind of thing an ad network
 * quality review counts against you.
 */
export const MIN_POSTS_TO_INDEX = 5;

function counts() {
  const posts = getAllPosts();
  const leagues = new Map<string, number>();
  const teams = new Map<string, number>();
  for (const p of posts) {
    if (p.league) leagues.set(p.league, (leagues.get(p.league) ?? 0) + 1);
    for (const t of p.teams ?? []) teams.set(t, (teams.get(t) ?? 0) + 1);
  }
  return { leagues, teams };
}

/** League slugs with enough coverage to index, most-covered first. */
export function indexableLeagues(): Array<{ slug: string; count: number }> {
  return [...counts().leagues.entries()]
    .filter(([, n]) => n >= MIN_POSTS_TO_INDEX)
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count);
}

/** Team slugs with enough coverage to index, most-covered first. */
export function indexableTeams(): Array<{ slug: string; count: number }> {
  return [...counts().teams.entries()]
    .filter(([, n]) => n >= MIN_POSTS_TO_INDEX)
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count);
}

const DEFAULT_TITLE = "All Stories – ColorWay Sports";
const DEFAULT_DESCRIPTION =
  "All the latest on uniforms, scorebugs, stadiums, and the visual side of sports.";

/**
 * Metadata for /stories and its filtered views.
 *
 * Before this existed the page exported a single static `metadata` object, which
 * meant every `?league=` and `?team=` variant inherited a canonical pointing at
 * /stories — an explicit instruction to Google not to index any of them, even
 * though every page on the site links to ~170 of those URLs from the nav.
 */
export function storiesMetadata({
  league,
  team,
  query,
}: {
  league?: string;
  team?: string;
  query?: string;
}): Metadata {
  const canonicalDefault = { canonical: `${SITE_URL}/stories` };

  // Search-result views are thin and infinite. Never index them.
  if (query) {
    return {
      title: `Search: “${query}” – ColorWay Sports`,
      description: DEFAULT_DESCRIPTION,
      alternates: canonicalDefault,
      robots: { index: false, follow: true },
    };
  }

  if (league) {
    const match = indexableLeagues().find((l) => l.slug === league);
    if (!match) return { title: DEFAULT_TITLE, alternates: canonicalDefault };
    const name = LEAGUE_NAMES[league] ?? league.toUpperCase();
    const title = `${name} Uniforms & Logos: Every Story – ColorWay Sports`;
    const description = `Every ${name} story from ColorWay Sports: uniform trackers, jersey rankings, logo breakdowns, and stadium design. ${match.count} stories and counting.`;
    const url = `${SITE_URL}/stories?league=${league}`;
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url, type: "website" },
    };
  }

  if (team) {
    const match = indexableTeams().find((t) => t.slug === team);
    if (!match) return { title: DEFAULT_TITLE, alternates: canonicalDefault };
    const name = displayNameForSlug(team);
    const title = `${name} Uniforms & Logos: Every Story – ColorWay Sports`;
    const description = `Every ${name} story from ColorWay Sports: uniform news, jersey rankings, logo and helmet breakdowns. ${match.count} stories and counting.`;
    const url = `${SITE_URL}/stories?team=${team}`;
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url, type: "website" },
    };
  }

  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    alternates: canonicalDefault,
  };
}
