import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HomepageTrackers from "@/components/HomepageTrackers";
import TraditionalJerseyIndex from "@/components/TraditionalJerseyIndex";
import StoryCard from "@/components/StoryCard";
import Footer from "@/components/Footer";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

const TRACKER_SLUGS = new Set([
  "nba-playoffs-2026-conference-finals-jersey-tracker",
  "nhl-conference-finals-2026-jersey-tracker",
  "nba-playoffs-crowd-giveaway-tracker-2026",
]);

export default function Home() {
  const posts = getAllPosts();
  const filtered = posts.filter((p) => !TRACKER_SLUGS.has(p.slug));
  const lead = filtered.slice(0, 3);
  const compact = filtered.slice(3, 9);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <HomepageTrackers />
        <TraditionalJerseyIndex />

        {/* Latest stories — 3 equal cards */}
        {lead.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-5 pt-10 pb-4">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-[#8A8F98]">
                Latest Stories
              </h2>
              <Link
                href="/stories"
                className="text-[11px] font-semibold text-orange hover:underline uppercase tracking-widest"
              >
                All stories →
              </Link>
            </div>
            <hr className="border-border mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {lead.map((post) => (
                <StoryCard key={post.slug} {...post} />
              ))}
            </div>
          </section>
        )}

        {/* More stories — compact bordered grid */}
        {compact.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-5 pt-8 pb-10">
            <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-[#8A8F98] mb-3">
              More Stories
            </h2>
            <hr className="border-border" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {compact.map((post, i) => (
                <Link
                  key={post.slug}
                  href={`/stories/${post.slug}`}
                  className={[
                    "group flex flex-col gap-2 py-6 border-b border-border transition-colors duration-150 hover:bg-[#f8f8fa]",
                    "px-6 first:pl-0",
                    i % 3 === 0 ? "lg:pl-0 lg:pr-6" : "",
                    i % 3 === 1 ? "lg:px-6 lg:border-x lg:border-border" : "",
                    i % 3 === 2 ? "lg:pr-0 lg:pl-6" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange">
                    {post.category}
                  </span>
                  <h3 className="text-[15px] font-bold text-[#0B1F4A] leading-snug group-hover:text-orange transition-colors duration-150">
                    {post.title}
                  </h3>
                  <p className="text-[13px] text-[#6B7280] leading-relaxed line-clamp-2">
                    {post.excerpt}
                  </p>
                </Link>
              ))}
            </div>

            <div className="flex justify-center mt-10">
              <Link
                href="/stories"
                className="inline-block px-8 py-3 text-[13px] font-bold uppercase tracking-[0.15em] text-white bg-[#0021A5] hover:bg-[#001a84] rounded-lg transition-all duration-200"
                style={{ boxShadow: "0 2px 8px rgba(0,33,165,0.25)" }}
              >
                View All Stories
              </Link>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
