"use client";

import { useSearchParams } from "next/navigation";
import StoryCard from "@/components/StoryCard";

interface PostMeta {
  slug: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  gradient: string;
  logoSrc?: string;
  logoSrc2?: string;
  coverImage?: string;
  league?: string;
  teams?: string[];
}

const leagueNames: Record<string, string> = {
  nfl: "NFL",
  nba: "NBA",
  mlb: "MLB",
  f1: "F1",
  soccer: "Soccer",
};

export default function StoriesFilter({ posts }: { posts: PostMeta[] }) {
  const searchParams = useSearchParams();
  const league = searchParams.get("league");
  const team = searchParams.get("team");

  let filtered = posts;
  let heading = "Stories";
  let description = "All the latest on uniforms, scorebugs, stadiums, and the visual side of sports.";

  if (league) {
    filtered = posts.filter((p) => p.league === league);
    heading = `${leagueNames[league] || league.toUpperCase()} Stories`;
    description = `All ${leagueNames[league] || league.toUpperCase()} coverage from ColorWay Sports.`;
  }

  if (team) {
    filtered = posts.filter((p) => p.teams?.includes(team));
    const teamName = team
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    heading = teamName;
    description = `All ${teamName} coverage from ColorWay Sports.`;
  }

  return (
    <main className="max-w-[1200px] mx-auto px-5 py-12">
      <h1 className="text-3xl font-bold text-black mb-2">{heading}</h1>
      <p className="text-gray-medium mb-8">{description}</p>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => (
            <StoryCard key={post.slug} {...post} />
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
