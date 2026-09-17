import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";

// The Wire: short, fast uniform news, separate from /stories on purpose.
//
// A story is written once and ranks for months. A wire item is written in ten
// minutes, is worth reading for a day, and exists so people have a reason to type
// the site's name into the bar instead of waiting for Google to send them. Same
// repo, same markdown, different shape: no cover image requirement, no FAQ, no
// SEO scaffolding, a timestamp that matters, and Jake's take when he has one.
//
// One file per item: content/news/<YYYY-MM-DD>-<slug>.md

const newsDirectory = path.join(process.cwd(), "content/news");

export type NewsTag = "Breaking" | "NFL" | "MLB" | "College" | "NBA" | "NHL" | "Soccer";

export interface NewsMeta {
  slug: string;
  title: string;
  /** Full ISO timestamp. The feed sorts and stamps off this, so it is required. */
  at: string;
  tag: NewsTag;
  league?: string;
  /** Who told us. A wire item always names where it came from. */
  source?: string;
  sourceUrl?: string;
  image?: string;
  imageAlt?: string;
  /** Related schedule post or tracker: the path readers should land on next. */
  link?: string;
  linkLabel?: string;
  /** Jake's opinion, in his words. Presence of a take is what earns a byline. */
  take?: string;
  /** Defaults to Jake when there is a take; never shown when there is not. */
  takeBy?: string;
}

export interface NewsItem extends NewsMeta {
  contentHtml: string;
  /** Plain text, for meta descriptions and the homepage strip. */
  plain: string;
}

function readFiles(): { slug: string; data: Record<string, unknown>; content: string }[] {
  if (!fs.existsSync(newsDirectory)) return [];
  return fs
    .readdirSync(newsDirectory)
    .filter((f) => f.endsWith(".md"))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const { data, content } = matter(fs.readFileSync(path.join(newsDirectory, fileName), "utf8"));
      return { slug, data: data as Record<string, unknown>, content };
    });
}

function toMeta(slug: string, data: Record<string, unknown>): NewsMeta {
  const take = typeof data.take === "string" ? data.take.trim() : "";
  return {
    slug,
    title: (data.title as string) || "Untitled",
    // Fall back to the date in the filename so a missing timestamp cannot throw.
    at: (data.at as string) || `${slug.slice(0, 10)}T12:00:00-07:00`,
    tag: ((data.tag as NewsTag) || "NFL") as NewsTag,
    league: data.league as string | undefined,
    source: data.source as string | undefined,
    sourceUrl: data.sourceUrl as string | undefined,
    image: data.image as string | undefined,
    imageAlt: data.imageAlt as string | undefined,
    link: data.link as string | undefined,
    linkLabel: data.linkLabel as string | undefined,
    take: take || undefined,
    takeBy: take ? ((data.takeBy as string) || "Jake Daneshgar") : undefined,
  };
}

async function toHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);
  return String(file);
}

function plainText(markdown: string): string {
  return markdown
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b && !b.startsWith("#") && !b.startsWith("<"))
    .join(" ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Newest first. */
export function getAllNewsMeta(): NewsMeta[] {
  return readFiles()
    .map(({ slug, data }) => toMeta(slug, data))
    .sort((a, b) => (a.at > b.at ? -1 : 1));
}

export async function getAllNews(): Promise<NewsItem[]> {
  const items = await Promise.all(
    readFiles().map(async ({ slug, data, content }) => ({
      ...toMeta(slug, data),
      contentHtml: await toHtml(content),
      plain: plainText(content),
    })),
  );
  return items.sort((a, b) => (a.at > b.at ? -1 : 1));
}

export async function getNewsBySlug(slug: string): Promise<NewsItem | null> {
  const fullPath = path.join(newsDirectory, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const { data, content } = matter(fs.readFileSync(fullPath, "utf8"));
  return {
    ...toMeta(slug, data as Record<string, unknown>),
    contentHtml: await toHtml(content),
    plain: plainText(content),
  };
}

/** "Thursday, September 17" — the day divider in the feed. */
export function dayLabel(at: string): string {
  return new Date(at).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
}

/** Group consecutive items under their day, preserving newest-first order. */
export function groupByDay<T extends { at: string }>(items: T[]): { day: string; items: T[] }[] {
  const out: { day: string; items: T[] }[] = [];
  for (const item of items) {
    const day = dayLabel(item.at);
    const last = out[out.length - 1];
    if (last && last.day === day) last.items.push(item);
    else out.push({ day, items: [item] });
  }
  return out;
}

/** "1:02 PM PT", split so the feed can stack the clock over the zone. */
export function stamp(at: string): { time: string; zone: string } {
  const time = new Date(at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
  const [clock, meridiem] = time.split(" ");
  return { time: clock, zone: `${meridiem} PT` };
}
