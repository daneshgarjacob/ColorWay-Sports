import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { allTeamKeys } from "@/lib/mlbTrackerTeamIndex";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  const postUrls = posts.map((post) => ({
    url: `https://www.colorwaysports.com/stories/${post.slug}`,
    lastModified: new Date(post.updatedDate || post.date),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Per-team MLB uniform calendars. Like the tool pages below, these are not
  // auto-collected — they're listed here so all 30 get crawled.
  const teamUrls = allTeamKeys().map((team) => ({
    url: `https://www.colorwaysports.com/mlb-tracker/${team}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
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
    ...teamUrls,
    ...postUrls,
  ];
}
