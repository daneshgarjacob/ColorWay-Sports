import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";

const postsDirectory = path.join(process.cwd(), "content/posts");

export interface PostMeta {
  slug: string;
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

export interface Post extends PostMeta {
  contentHtml: string;
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
      excerpt: data.excerpt || "",
      gradient: data.gradient || "linear-gradient(135deg, #003087 0%, #FF5910 100%)",
      logoSrc: data.logoSrc,
      logoSrc2: data.logoSrc2,
      coverImage: data.coverImage,
      coverImagePosition: data.coverImagePosition,
      league: data.league,
      teams: data.teams || [],
    };
  });

  // Sort by date, newest first
  return posts.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);

  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const processed = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(content);
  const contentHtml = processed.toString();

  return {
    slug,
    title: data.title || "Untitled",
    category: data.category || "General",
    date: data.date || "2026-01-01",
    excerpt: data.excerpt || "",
    gradient: data.gradient || "linear-gradient(135deg, #003087 0%, #FF5910 100%)",
    logoSrc: data.logoSrc,
    logoSrc2: data.logoSrc2,
    coverImage: data.coverImage,
    coverImagePosition: data.coverImagePosition,
    contentHtml,
  };
}
