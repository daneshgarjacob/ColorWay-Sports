"use client";

import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import StoryCard from "@/components/StoryCard";
import { TEAM_LOGO_BY_SLUG, LEAGUE_LOGOS, LEAGUE_NAMES, displayNameForSlug } from "@/lib/teamLogos";

interface PostMeta {
  slug: string;
  href?: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  gradient: string;
  logoSrc?: string;
  logoSrc2?: string;
  coverImage?: string;
  coverImagePosition?: string;
  league?: string;
  teams?: string[];
}

export default function StoriesFilter({
  posts,
  quickLinks,
}: {
  posts: PostMeta[];
  /** Server-rendered uniform schedule / calendar bar for the team in view. */
  quickLinks?: ReactNode;
}) {
  const searchParams = useSearchParams();
  const league = searchParams.get("league");
  const team = searchParams.get("team");
  const query = searchParams.get("q");

  let filtered = posts;
  let heading = "Stories";
  let description = "All the latest on uniforms, scorebugs, stadiums, and the visual side of sports.";
  let headingLogo: string | undefined;

  if (query) {
    const q = query.toLowerCase();
    filtered = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.teams?.some((t) => t.toLowerCase().includes(q))
    );
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

  return (
    <main className="max-w-[1200px] mx-auto px-5 py-12">
      <h1 className="flex items-center gap-3 text-3xl font-bold text-black mb-2">
        {headingLogo && (
          <img src={headingLogo} alt="" className="w-9 h-9 object-contain flex-shrink-0" />
        )}
        {heading}
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
      {quickLinks}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => (
            <StoryCard key={post.slug} {...post} showDate />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-medium text-lg mb-2">No stories yet.</p>
          <p className="text-gray-light text-sm">Check back soon for coverage.</p>
        </div>
      )}
    </main>
  );
}
