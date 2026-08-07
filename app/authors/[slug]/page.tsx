import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StoryCard from "@/components/StoryCard";
import { AUTHORS, DEFAULT_AUTHOR_SLUG, authorSchema, authorUrl, getAuthor } from "@/lib/authors";
import { getAllPostsByDate } from "@/lib/posts";

export function generateStaticParams() {
  return AUTHORS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = AUTHORS.find((a) => a.slug === slug);

  if (!author) return { title: "Author Not Found | ColorWay Sports" };

  return {
    title: `${author.name} | ColorWay Sports`,
    description: author.shortBio,
    alternates: { canonical: authorUrl(author) },
    openGraph: {
      title: `${author.name} — ${author.role}`,
      description: author.shortBio,
      siteName: "ColorWay Sports",
      type: "profile",
    },
  };
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = AUTHORS.find((a) => a.slug === slug);

  if (!author) notFound();

  // Posts carrying no explicit author belong to the default author, so match on
  // the resolved author rather than the raw frontmatter string.
  const posts = getAllPostsByDate().filter((p) => getAuthor(p.author).slug === author.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...authorSchema(author),
        mainEntityOfPage: { "@type": "WebPage", "@id": authorUrl(author) },
      },
      {
        "@type": "ProfilePage",
        mainEntity: { "@id": authorUrl(author) },
        url: authorUrl(author),
      },
    ],
  };

  const initials = author.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="max-w-[800px] mx-auto px-5 py-16 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row gap-6 sm:items-center mb-10">
          <div
            className="shrink-0 w-20 h-20 rounded-full bg-orange text-white flex items-center justify-center font-extrabold text-2xl tracking-wide"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-light font-semibold mb-2">
              Author
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-[-0.02em]">
              {author.name}
            </h1>
            <p className="text-base text-gray-medium mt-1">{author.role}</p>
          </div>
        </div>

        <div className="w-12 h-[3px] bg-orange mb-8 rounded-full" />

        <div className="space-y-5 text-[0.95rem] leading-[1.8] text-foreground">
          {author.bio.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {author.email && (
          <p className="mt-8 text-sm text-gray-medium">
            Reach {author.name.split(" ")[0]} at{" "}
            <a href={`mailto:${author.email}`} className="text-orange hover:underline">
              {author.email}
            </a>
            .
          </p>
        )}

        <section className="mt-14">
          <h2 className="text-xl font-extrabold text-black mb-2 tracking-[-0.01em]">
            Latest From {author.name.split(" ")[0]}
          </h2>
          <p className="text-sm text-gray-medium mb-6">
            {posts.length.toLocaleString()} stories published.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {posts.slice(0, 24).map((post) => (
              <StoryCard key={post.slug} {...post} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export const dynamicParams = false;

// Guard against the registry losing its default author in a future edit —
// every post falls back to that slug, so it must always resolve.
if (!AUTHORS.some((a) => a.slug === DEFAULT_AUTHOR_SLUG)) {
  throw new Error(`lib/authors: DEFAULT_AUTHOR_SLUG "${DEFAULT_AUTHOR_SLUG}" is not in AUTHORS`);
}
