import { Fragment, type ReactNode } from "react";
import StoryCard from "@/components/StoryCard";
import { slotAfterCard } from "@/components/MvSlot";
import { searchPosts } from "@/lib/search";
import { TEAM_LOGO_BY_SLUG, LEAGUE_LOGOS, LEAGUE_NAMES, displayNameForSlug } from "@/lib/teamLogos";

// The /stories grid. Server-rendered (11/11 performance pass): it used to be a
// client component that received all ~800 posts and rendered every card,
// which made /stories a 2.7 MB page with ~16,000 elements and ~265 ad spots.
// Phones spent seconds building and hydrating it, and every tap on the page
// had to wait for that (INP). Now the page filters on the server and shows
// PER_PAGE cards per page, with plain links to older pages. The links are
// plain <a> on purpose: a full page load lets Mediavine fill the next page's
// in-feed spots (it only fills spots present at load; see MvSlot.tsx).

/** Cards per page. A multiple of 6 so every page ends on a full ad group. */
export const STORIES_PER_PAGE = 90;

export interface StoryListItem {
  slug: string;
  href?: string;
  title: string;
  category: string;
  date: string;
  updatedDate?: string;
  excerpt: string;
  gradient: string;
  overlayText?: string;
  logoSrc?: string;
  logoSrc2?: string;
  coverImage?: string;
  coverImagePosition?: string;
  coverImageFit?: string;
  cardStyle?: string;
  kicker?: string;
  bodyPreview?: string;
  league?: string;
  teams?: string[];
}

export interface StoriesView {
  league?: string;
  team?: string;
  query?: string;
  page?: number;
}

/** The posts a view shows, in order, and its heading. Same rules the old
 *  client filter used: a search ranks posts; a league or team filter (which
 *  wins over a search, as before) keeps newest-first order. */
export function filterStories<T extends StoryListItem>(posts: T[], view: StoriesView, prioritySlugs: string[] = []) {
  const { league, team, query } = view;
  let filtered = posts;
  let heading = "Stories";
  let description = "All the latest on uniforms, scorebugs, stadiums, and the visual side of sports.";
  let headingLogo: string | undefined;

  if (query) {
    // Word-based match with filler words dropped, ranked, with the named
    // team's uniform schedule post first. See lib/search.ts.
    filtered = searchPosts(posts, query, prioritySlugs);
    heading = `Search: "${query}"`;
    description = `${filtered.length} result${filtered.length !== 1 ? "s" : ""} found.`;
  }

  if (league) {
    filtered = posts.filter((p) => p.league === league);
    heading = `${LEAGUE_NAMES[league] || league.toUpperCase()} Stories`;
    description = `All ${LEAGUE_NAMES[league] || league.toUpperCase()} coverage from ColorWay Sports.`;
    headingLogo = LEAGUE_LOGOS[league];
  }

  if (team) {
    filtered = posts.filter((p) => p.teams?.includes(team));
    const teamName = displayNameForSlug(team);
    heading = teamName;
    description = `All ${teamName} coverage from ColorWay Sports.`;
    headingLogo = TEAM_LOGO_BY_SLUG[team];
  }

  return { filtered, heading, description, headingLogo };
}

function pageHref(view: StoriesView, page: number) {
  const sp = new URLSearchParams();
  if (view.query) sp.set("q", view.query);
  if (view.league) sp.set("league", view.league);
  if (view.team) sp.set("team", view.team);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/stories?${qs}` : "/stories";
}

export default function StoriesFilter({
  posts,
  view,
  quickLinks,
  prioritySlugs = [],
}: {
  posts: StoryListItem[];
  view: StoriesView;
  /** Schedule posts for a team named in the search, ranked first. */
  prioritySlugs?: string[];
  /** Server-rendered uniform schedule / calendar bar for the team in view. */
  quickLinks?: ReactNode;
}) {
  const { query, league, team } = view;
  const { filtered, heading, description, headingLogo } = filterStories(posts, view, prioritySlugs);

  const pages = Math.max(1, Math.ceil(filtered.length / STORIES_PER_PAGE));
  const page = Math.min(Math.max(1, view.page ?? 1), pages);
  const shown = filtered.slice((page - 1) * STORIES_PER_PAGE, page * STORIES_PER_PAGE);

  return (
    <main className="max-w-[1200px] mx-auto px-5 py-12">
      <h1 className="flex items-center gap-3 text-3xl font-bold text-black mb-2">
        {headingLogo && (
          <img src={headingLogo} alt="" className="w-9 h-9 object-contain flex-shrink-0" />
        )}
        {heading}
        {page > 1 && <span className="text-gray-light font-semibold text-xl">Page {page}</span>}
      </h1>
      <p className="text-gray-medium mb-2">{description}</p>
      {/* Any filtered view needs an obvious way back to everything — without this
          a search leaves you stuck on "Search: ..." with no exit. */}
      {(query || league || team) && (
        <a
          href="/stories"
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#2f6bed] hover:underline mb-8"
        >
          &larr; Back to all stories
        </a>
      )}
      {!(query || league || team) && <div className="mb-8" />}

      {/* Uniform schedule + calendar first. A team search is a tracking query,
          not a browsing one — the grid is the fallback, not the answer. */}
      {page === 1 && quickLinks}

      {shown.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shown.map((post, i) => (
            <Fragment key={post.slug}>
              <StoryCard {...post} showDate />
              {slotAfterCard(i, shown.length)}
            </Fragment>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-medium text-lg mb-2">No stories yet.</p>
          <p className="text-gray-light text-sm">Check back soon for coverage.</p>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="More stories" className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
          {page > 1 ? (
            <a href={pageHref(view, page - 1)} className="text-[14px] font-bold text-[#2f6bed] hover:underline">
              &larr; Newer stories
            </a>
          ) : (
            <span />
          )}
          <span className="text-[13px] text-gray-medium">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <a href={pageHref(view, page + 1)} className="text-[14px] font-bold text-[#2f6bed] hover:underline">
              Older stories &rarr;
            </a>
          ) : (
            <span />
          )}
        </nav>
      )}
    </main>
  );
}
