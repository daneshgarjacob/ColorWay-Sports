import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StoryCard from "@/components/StoryCard";
import MvSlot from "@/components/MvSlot";
import { getExplainedPosts, groupExplained } from "@/lib/explained";

// /explained (site plan 11/16, item 4): every "why" and origin story in one
// place, grouped by league. Server-rendered so Mediavine and Google see every
// link; the league chips are plain jump links, not a client-side filter.

export const metadata: Metadata = {
  title: "Sports Uniforms Explained: Why Every Team Wears What It Wears",
  description:
    "Why the Cowboys wear white at home, why the Lions wear Honolulu blue, how every NFL, NBA, NHL, MLB and college team got its colors and name, and who decides which jersey a team wears.",
  alternates: { canonical: "/explained" },
  openGraph: {
    title: "Sports Uniforms Explained",
    description: "The real stories behind the colors, logos and uniform rules of every league.",
    url: "/explained",
    type: "website",
  },
};

export default function ExplainedPage() {
  const all = getExplainedPosts();
  const groups = groupExplained(all);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Sports Uniforms Explained",
    url: "https://www.colorwaysports.com/explained",
    hasPart: all.slice(0, 50).map((p) => ({
      "@type": "Article",
      headline: p.title,
      url: `https://www.colorwaysports.com/stories/${p.slug}`,
    })),
  };

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="max-w-[1100px] mx-auto px-4 sm:px-5 pt-8 pb-14">
        <p className="text-[13px] font-black tracking-[0.18em] uppercase text-[#0025CC]">The Why Behind The Look</p>
        <h1 className="font-display font-black text-[38px] sm:text-[52px] leading-[1.02] mt-1 tracking-tight">Explained</h1>
        <div className="mt-4 max-w-[720px] space-y-4 text-[18px] sm:text-[19px] leading-relaxed text-[#2b303b]">
          <p>
            Why do the Cowboys wear white at home when almost nobody else in the NFL does? Why are the Lions in Honolulu blue, the Padres
            in brown, and the Yankees without names on their backs? Who actually decides which jersey a team wears on a given night?
          </p>
          <p>
            These are the stories behind the colors, logos and uniform rules of every league, {all.length} of them so far. Each one
            goes back to the source: the founders who picked the colors, the rules that decide home and road, and the traditions that
            stuck. Pick a league below, or start with the newest.
          </p>
        </div>

        <nav aria-label="Leagues" className="mt-6 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto pb-1">
          {groups.map((g) => (
            <a
              key={g.key}
              href={`#${g.key}`}
              className="shrink-0 rounded-full border border-black/15 bg-white px-4 py-2 text-[16px] font-bold text-black hover:border-[#0025CC] hover:text-[#0025CC] transition-colors"
            >
              {g.label} <span className="text-[#5b6474] font-semibold">{g.posts.length}</span>
            </a>
          ))}
        </nav>

        {groups.map((g, gi) => (
          <div key={g.key}>
            <section id={g.key} aria-labelledby={`h-${g.key}`} className="mt-10 scroll-mt-28">
              <h2 id={`h-${g.key}`} className="text-[28px] sm:text-[32px] font-extrabold text-black tracking-tight border-b-4 border-[#0025CC] pb-2 mb-6">
                {g.label} Explained
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {g.posts.map((p) => (
                  <StoryCard
                    key={p.slug}
                    slug={p.slug}
                    href={p.href}
                    title={p.title}
                    category={p.category}
                    excerpt={p.excerpt}
                    gradient={p.gradient}
                    overlayText={p.overlayText}
                    logoSrc={p.logoSrc}
                    logoSrc2={p.logoSrc2}
                    coverImage={p.coverImage}
                    coverImagePosition={p.coverImagePosition}
                    coverImageFit={p.coverImageFit}
                    cardStyle={p.cardStyle}
                    bodyPreview={p.bodyPreview}
                  />
                ))}
              </div>
            </section>
            {/* Two in-content ad spots, between sections (plan: hub has 2 MvSlots). */}
            {(gi === 0 || gi === 2) && gi < groups.length - 1 && <MvSlot className="my-10" />}
          </div>
        ))}
      </main>
      <Footer />
    </>
  );
}
