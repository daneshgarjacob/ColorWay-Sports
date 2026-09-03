import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { allTeamKeys } from "@/lib/mlbTrackerTeamIndex";
import { allNflTeamKeys } from "@/lib/nflTrackerTeamIndex";
import { winterTeamKeys } from "@/lib/winterTrackerIndex";
import { indexableLeagues, indexableTeams } from "@/lib/storyFilters";
import { AUTHORS } from "@/lib/authors";

// Built once per deploy and served from the CDN. Without this the sitemap was
// rendered on demand for every crawler hit, re-parsing all posts each time.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  // League and team filter views of /stories. Only the ones with enough posts
  // behind them get listed — see MIN_POSTS_TO_INDEX in lib/storyFilters. These
  // are linked from the nav on every page but were canonicalised away until
  // 2026-07-23, so none of them had ever been indexable.
  const filterUrls = [
    ...indexableLeagues().map(({ slug }) => ({
      url: `https://www.colorwaysports.com/stories?league=${slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...indexableTeams().map(({ slug }) => ({
      url: `https://www.colorwaysports.com/stories?team=${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];

  const postUrls = posts.map((post) => ({
    url: `https://www.colorwaysports.com/stories/${post.slug}`,
    lastModified: new Date(post.updatedDate || post.date),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Per-team MLB uniform calendars plus their hub page. Like the tool pages
  // below, these are not auto-collected — they're listed here so they get crawled.
  const teamUrls = [
    {
      url: "https://www.colorwaysports.com/mlb-tracker",
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    ...allTeamKeys().map((team) => ({
      url: `https://www.colorwaysports.com/mlb-tracker/${team}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...allNflTeamKeys().map((team) => ({
      url: `https://www.colorwaysports.com/nfl-tracker/${team}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...winterTeamKeys("nba").map((team) => ({
      url: `https://www.colorwaysports.com/nba-tracker/${team}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...winterTeamKeys("nhl").map((team) => ({
      url: `https://www.colorwaysports.com/nhl-tracker/${team}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];

  // Author pages. Google's guidance is to make bylines crawlable and linked;
  // these are only reachable from post footers otherwise.
  const authorUrls = AUTHORS.map((a) => ({
    url: `https://www.colorwaysports.com/authors/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: "https://www.colorwaysports.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://www.colorwaysports.com/stories",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://www.colorwaysports.com/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://www.colorwaysports.com/contact",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://www.colorwaysports.com/privacy-policy",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://www.colorwaysports.com/terms",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://www.colorwaysports.com/world-cup-rooting-guide",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    // Interactive tools are NOT auto-collected the way posts are, so every new tool
    // page has to be listed here by hand or it never gets crawled.
    {
      url: "https://www.colorwaysports.com/world-cup-fantasy-draft",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: "https://www.colorwaysports.com/world-series-logo-grader",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...authorUrls,
    ...filterUrls,
    ...teamUrls,
    ...postUrls,
  ];
}
