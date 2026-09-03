import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";

const postsDirectory = path.join(process.cwd(), "content/posts");

// Pull the first couple of real body paragraphs (skipping headings and HTML
// blocks like tweet embeds) for the words-only card preview, so those cards
// fill with the article's actual opening instead of just a short excerpt.
function extractPreview(content: string): string {
  const blocks = content.split(/\n\s*\n/);
  const paras: string[] = [];
  for (const b of blocks) {
    const t = b.trim();
    if (!t || t.startsWith("#") || t.startsWith("<") || t.startsWith("|") || t.startsWith("---")) continue;
    const clean = t
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[*_`>#]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (clean.length > 40) paras.push(clean);
    if (paras.length >= 2) break;
  }
  return paras.join(" ").slice(0, 440);
}

export interface ReviewItem {
  name: string;
  rating: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface PostMeta {
  slug: string;
  href?: string; // optional: link to a standalone page instead of /stories/<slug>
  title: string;
  category: string;
  date: string;
  updatedDate?: string;
  /** Author slug or display name; resolved via lib/authors. Defaults to Jake. */
  author?: string;
  excerpt: string;
  gradient: string;
  logoSrc?: string;
  logoSrc2?: string;
  overlayText?: string;
  coverImage?: string;
  coverImagePosition?: string;
  coverImageFit?: string;
  cardStyle?: "words";
  kicker?: string;
  bodyPreview?: string;
  league?: string;
  teams?: string[];
  featuredOrder?: number;
  homepageOrder?: number;
  /** Opt-in: let updatedDate resurface this post in Latest. Trackers only —
   *  routine refreshes (e.g. uniform-schedule posts) should NOT jump the feed. */
  resurfaceOnUpdate?: boolean;
  homepageHero?: boolean;
  homepageFeature?: boolean;
  /** Render a newsletter signup above the article body too (daily-updated posts). */
  newsletterTop?: boolean;
  topViewsRank?: number;
  /** Log-style trackers: render only the N most recent day/game sections on the story page. */
  recentSections?: number;
  /** "newest-first" (default) or "oldest-first" — which end of the log is current. */
  recentOrder?: "newest-first" | "oldest-first";
  /** Where the full record lives (a team-calendar hub), linked from the trim note. */
  archiveHref?: string;
  archiveLabel?: string;
  reviews?: ReviewItem[];
  bestRating?: number;
  worstRating?: number;
}

export interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export interface Post extends PostMeta {
  contentHtml: string;
  faqs: FaqItem[];
  headings: HeadingItem[];
}

// Minimal hast node shape — enough to walk the tree and tag headings.
interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

function nodeText(node: HastNode): string {
  if (node.type === "text") return node.value || "";
  return (node.children || []).map(nodeText).join("");
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// Rehype plugin: give every h2 and h3 a stable id (for anchor links / jump
// navigation) and collect them, with level, so pages can build a table of contents.
function rehypeHeadingIds(collected: HeadingItem[]) {
  return () => (tree: HastNode) => {
    const seen = new Map<string, number>();
    const visit = (node: HastNode) => {
      if (node.type === "element" && (node.tagName === "h2" || node.tagName === "h3")) {
        const text = nodeText(node).trim();
        if (text) {
          let id = slugifyHeading(text) || "section";
          const count = seen.get(id) || 0;
          seen.set(id, count + 1);
          if (count > 0) id = `${id}-${count + 1}`;
          node.properties = { ...node.properties, id };
          collected.push({ id, text, level: node.tagName === "h2" ? 2 : 3 });
        }
      }
      (node.children || []).forEach(visit);
    };
    visit(tree);
  };
}

// Rehype plugin: lazy-load images. Every reader downloads images raw from
// public/ (no next/image), so an image-heavy page like the daily tracker (300+
// jersey tiles) ships its entire library on load whether or not the reader
// scrolls to it — a real Fast Data Transfer cost. loading="lazy" defers
// off-screen images until they scroll into view. The FIRST image stays eager so
// the largest-contentful-paint element is never delayed.
function rehypeLazyImages() {
  return () => (tree: HastNode) => {
    let first = true;
    const visit = (node: HastNode) => {
      if (node.type === "element" && node.tagName === "img") {
        if (first) {
          first = false; // keep the hero image eager for LCP
        } else if (node.properties?.loading === undefined) {
          node.properties = {
            ...node.properties,
            loading: "lazy",
            decoding: "async",
          };
        }
      }
      (node.children || []).forEach(visit);
    };
    visit(tree);
  };
}

function extractFaqs(content: string): FaqItem[] {
  const faqHeadingIdx = content.search(/^##\s+Frequently Asked Questions\b/m);
  if (faqHeadingIdx === -1) return [];

  let section = content.slice(faqHeadingIdx);
  const nextH2 = section.slice(4).search(/^##\s/m);
  if (nextH2 > 0) section = section.slice(0, nextH2 + 4);
  const divider = section.indexOf("\n---\n");
  if (divider > 0) section = section.slice(0, divider);

  const faqs: FaqItem[] = [];
  const pattern = /\*\*([^*\n]+\?)\*\*\s*\n+([^\n]+(?:\n(?!\*\*|##|---|\s*$)[^\n]+)*)/g;
  let match;
  while ((match = pattern.exec(section)) !== null) {
    faqs.push({
      question: match[1].trim(),
      answer: match[2].replace(/\s*\n\s*/g, " ").trim(),
    });
  }
  return faqs;
}

// Module-level memo. In production the markdown never changes between deploys,
// but getAllPosts() was re-reading and re-parsing every file in content/posts
// (400+ files, one of them 3 MB) on EVERY request that hit a dynamic route:
// /stories?team=… , the sitemap, and each nav-dropdown click. That was the bulk
// of the Fluid Active CPU line on the Vercel bill (81 hours in the Aug–Sep
// cycle). Dev keeps re-reading so new posts show up without a restart.
let postsMemo: PostMeta[] | null = null;

export function getAllPosts(): PostMeta[] {
  if (process.env.NODE_ENV === "production" && postsMemo) return postsMemo;
  const result = readAllPosts();
  if (process.env.NODE_ENV === "production") postsMemo = result;
  return result;
}

function readAllPosts(): PostMeta[] {
  if (!fs.existsSync(postsDirectory)) return [];

  const fileNames = fs.readdirSync(postsDirectory).filter((f) => f.endsWith(".md"));

  const posts = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, "");
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title || "Untitled",
      category: data.category || "General",
      date: data.date || "2026-01-01",
      updatedDate: data.updatedDate,
      author: data.author,
      excerpt: data.excerpt || "",
      gradient: data.gradient || "linear-gradient(135deg, #003087 0%, #FF5910 100%)",
      logoSrc: data.logoSrc,
      logoSrc2: data.logoSrc2,
      overlayText: data.overlayText,
      coverImage: data.coverImage,
      coverImagePosition: data.coverImagePosition,
      coverImageFit: data.coverImageFit,
      cardStyle: data.cardStyle,
      kicker: data.kicker,
      bodyPreview: data.cardStyle === "words" ? extractPreview(content) : undefined,
      league: data.league,
      teams: data.teams || [],
      featuredOrder: data.featuredOrder,
      homepageOrder: data.homepageOrder,
      resurfaceOnUpdate: data.resurfaceOnUpdate,
      homepageHero: data.homepageHero,
      homepageFeature: data.homepageFeature,
      newsletterTop: data.newsletterTop,
      topViewsRank: data.topViewsRank,
      recentSections: data.recentSections,
      recentOrder: data.recentOrder,
      archiveHref: data.archiveHref,
      archiveLabel: data.archiveLabel,
      reviews: data.reviews,
      bestRating: data.bestRating,
      worstRating: data.worstRating,
    };
  });

  // Sort: featuredOrder first (1, 2, 3), then homepageOrder (4-9), then by date newest first
  return posts.sort((a, b) => {
    if (a.featuredOrder && b.featuredOrder) return a.featuredOrder - b.featuredOrder;
    if (a.featuredOrder) return -1;
    if (b.featuredOrder) return 1;
    if (a.homepageOrder && b.homepageOrder) return a.homepageOrder - b.homepageOrder;
    if (a.homepageOrder) return -1;
    if (b.homepageOrder) return 1;
    // Only posts that opt in resurface on update — otherwise a routine refresh
    // to 30 uniform-schedule posts would flood Latest Stories.
    const aEffective = a.resurfaceOnUpdate ? a.updatedDate || a.date : a.date;
    const bEffective = b.resurfaceOnUpdate ? b.updatedDate || b.date : b.date;
    return aEffective > bEffective ? -1 : 1;
  });
}

export function getAllPostsByDate(): PostMeta[] {
  const posts = getAllPosts();
  return [...posts].sort((a, b) => {
    // Only posts that opt in resurface on update — otherwise a routine refresh
    // to 30 uniform-schedule posts would flood Latest Stories.
    const aEffective = a.resurfaceOnUpdate ? a.updatedDate || a.date : a.date;
    const bEffective = b.resurfaceOnUpdate ? b.updatedDate || b.date : b.date;
    return aEffective > bEffective ? -1 : 1;
  });
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);

  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const headings: HeadingItem[] = [];
  const processed = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeHeadingIds(headings))
    .use(rehypeLazyImages())
    .use(rehypeStringify)
    .process(content);
  const contentHtml = processed.toString();

  return {
    slug,
    title: data.title || "Untitled",
    category: data.category || "General",
    date: data.date || "2026-01-01",
    updatedDate: data.updatedDate,
    author: data.author,
    excerpt: data.excerpt || "",
    gradient: data.gradient || "linear-gradient(135deg, #003087 0%, #FF5910 100%)",
    logoSrc: data.logoSrc,
    logoSrc2: data.logoSrc2,
    overlayText: data.overlayText,
    coverImage: data.coverImage,
    coverImagePosition: data.coverImagePosition,
    coverImageFit: data.coverImageFit,
    league: data.league,
    teams: data.teams || [],
    recentSections: data.recentSections,
    recentOrder: data.recentOrder,
    archiveHref: data.archiveHref,
    archiveLabel: data.archiveLabel,
    reviews: data.reviews,
    bestRating: data.bestRating,
    worstRating: data.worstRating,
    contentHtml,
    faqs: extractFaqs(content),
    headings,
  };
}

export function getRelatedPosts(
  currentSlug: string,
  options: { league?: string; teams?: string[]; category?: string; limit?: number } = {}
): PostMeta[] {
  const { league, teams = [], category, limit = 3 } = options;
  const all = getAllPostsByDate().filter((p) => p.slug !== currentSlug);
  const teamSet = new Set(teams);

  const score = (p: PostMeta) => {
    let s = 0;
    if (p.teams && p.teams.some((t) => teamSet.has(t))) s += 100;
    if (league && p.league === league) s += 30;
    if (category && p.category === category) s += 10;
    return s;
  };

  const ranked = all
    .map((p) => ({ post: p, score: score(p) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const selected = ranked.slice(0, limit).map((x) => x.post);

  // Fill remaining slots with newest posts in same league if we don't have enough
  if (selected.length < limit) {
    const filler = all
      .filter((p) => !selected.some((s) => s.slug === p.slug))
      .filter((p) => (league ? p.league === league : true))
      .slice(0, limit - selected.length);
    selected.push(...filler);
  }

  // Final fallback: newest posts overall
  if (selected.length < limit) {
    const filler = all
      .filter((p) => !selected.some((s) => s.slug === p.slug))
      .slice(0, limit - selected.length);
    selected.push(...filler);
  }

  return selected;
}

// ---------------------------------------------------------------------------
// Log-style trackers: keep only the most recent sections on the story page.
//
// The MLB daily tracker had grown to 59 day blocks and 7.5 MB of HTML per view,
// and it was the single biggest line on the Vercel bill. The markdown keeps the
// whole season — /mlb-tracker/<team>, the "wore last night" blocks and the
// homepage all still read the full file — but the story page itself only needs
// the last few days. A "log section" is an h2 that reads like a date or a game
// ("Wednesday, September 2", "Game 5: …", "Match 101: …", "Round 1 Game 6",
// "Matchweek 3: …"). Everything else (intro, FAQ, bottom line) is kept.
const LOG_HEADING_RE =
  /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b|^(Game|Match|Matchweek)\s+\d+|^Round\s+\d+\s+Game|^The Final:/i;

export function isLogHeading(text: string): boolean {
  return LOG_HEADING_RE.test(text.trim());
}

export function trimLogSections(
  post: Pick<Post, "contentHtml" | "headings" | "recentSections" | "recentOrder" | "archiveHref" | "archiveLabel">
): { contentHtml: string; headings: HeadingItem[]; trimmed: number } {
  const keep = post.recentSections ?? 0;
  if (!keep || keep < 1) return { contentHtml: post.contentHtml, headings: post.headings, trimmed: 0 };

  const html = post.contentHtml;
  const h2Re = /<h2\b[^>]*\bid="([^"]+)"[^>]*>/g;
  const starts: Array<{ index: number; id: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = h2Re.exec(html)) !== null) starts.push({ index: m.index, id: m[1] });
  if (starts.length === 0) return { contentHtml: html, headings: post.headings, trimmed: 0 };

  const textById = new Map(post.headings.filter((h) => h.level === 2).map((h) => [h.id, h.text]));
  const sections = starts.map((s, i) => ({
    id: s.id,
    html: html.slice(s.index, i + 1 < starts.length ? starts[i + 1].index : html.length),
    isLog: isLogHeading(textById.get(s.id) ?? ""),
  }));
  const logIdx = sections.map((s, i) => (s.isLog ? i : -1)).filter((i) => i >= 0);
  if (logIdx.length <= keep) return { contentHtml: html, headings: post.headings, trimmed: 0 };

  const keepSet = new Set(post.recentOrder === "oldest-first" ? logIdx.slice(-keep) : logIdx.slice(0, keep));
  const lastKept = Math.max(...keepSet);
  const trimmed = logIdx.length - keep;

  const label = post.archiveLabel || "Open the team pages";
  const note =
    `<div data-log-trim style="margin: 2.5em 0; padding: 1.25em 1.4em; background: #f6f7f9; border: 1px solid #e3e7ec; border-radius: 12px; font-size: 0.95em; line-height: 1.55; color: #14284b;">` +
    `<p style="margin: 0;"><strong>This page keeps the ${keep} most recent ${keep === 1 ? "entry" : "entries"}.</strong> ` +
    `The earlier ${trimmed} ${trimmed === 1 ? "entry is" : "entries are"} still logged` +
    (post.archiveHref
      ? `, and every game is filed on the team pages, all season long. <a href="${post.archiveHref}" style="font-weight: 700; color: #2f6bed; text-decoration: none;">${label} &rarr;</a>`
      : `.`) +
    `</p></div>\n`;

  let out = html.slice(0, starts[0].index);
  sections.forEach((sec, i) => {
    if (!sec.isLog || keepSet.has(i)) out += sec.html;
    if (i === lastKept) out += note;
  });

  const headings = post.headings.filter((h) => out.includes(`id="${h.id}"`));
  return { contentHtml: out, headings, trimmed };
}
