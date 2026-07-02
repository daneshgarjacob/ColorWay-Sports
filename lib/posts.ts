import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";

const postsDirectory = path.join(process.cwd(), "content/posts");

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
  excerpt: string;
  gradient: string;
  logoSrc?: string;
  logoSrc2?: string;
  overlayText?: string;
  coverImage?: string;
  coverImagePosition?: string;
  coverImageFit?: string;
  league?: string;
  teams?: string[];
  featuredOrder?: number;
  homepageOrder?: number;
  topViewsRank?: number;
  reviews?: ReviewItem[];
  bestRating?: number;
  worstRating?: number;
}

export interface HeadingItem {
  id: string;
  text: string;
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

// Rehype plugin: give every h2 a stable id (for anchor links / jump navigation)
// and collect them so pages can build a table of contents.
function rehypeHeadingIds(collected: HeadingItem[]) {
  return () => (tree: HastNode) => {
    const seen = new Map<string, number>();
    const visit = (node: HastNode) => {
      if (node.type === "element" && node.tagName === "h2") {
        const text = nodeText(node).trim();
        if (text) {
          let id = slugifyHeading(text) || "section";
          const count = seen.get(id) || 0;
          seen.set(id, count + 1);
          if (count > 0) id = `${id}-${count + 1}`;
          node.properties = { ...node.properties, id };
          collected.push({ id, text });
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

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(postsDirectory)) return [];

  const fileNames = fs.readdirSync(postsDirectory).filter((f) => f.endsWith(".md"));

  const posts = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, "");
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(fileContents);

    return {
      slug,
      title: data.title || "Untitled",
      category: data.category || "General",
      date: data.date || "2026-01-01",
      updatedDate: data.updatedDate,
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
      featuredOrder: data.featuredOrder,
      homepageOrder: data.homepageOrder,
      topViewsRank: data.topViewsRank,
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
    const aEffective = a.updatedDate || a.date;
    const bEffective = b.updatedDate || b.date;
    return aEffective > bEffective ? -1 : 1;
  });
}

export function getAllPostsByDate(): PostMeta[] {
  const posts = getAllPosts();
  return [...posts].sort((a, b) => {
    const aEffective = a.updatedDate || a.date;
    const bEffective = b.updatedDate || b.date;
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
    .use(rehypeStringify)
    .process(content);
  const contentHtml = processed.toString();

  return {
    slug,
    title: data.title || "Untitled",
    category: data.category || "General",
    date: data.date || "2026-01-01",
    updatedDate: data.updatedDate,
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
