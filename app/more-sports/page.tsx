import { Fragment } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StoryCard from "@/components/StoryCard";
import WireItem from "@/components/WireItem";
import MvSlot, { slotAfterCard } from "@/components/MvSlot";
import TwitterEmbed from "@/components/TwitterEmbed";
import Link from "next/link";
import type { Metadata } from "next";
import { moreSportsSections } from "@/lib/moreSports";

// 11/19: we started covering minor league baseball, the G League, the PWHL,
// lacrosse, junior hockey and volleyball. This hub lists those stories and
// Wire items, newest first, by section. Stories opt in with frontmatter
// (hub: "more-sports" + hubGroup); Wire items by league (see lib/moreSports).

const TITLE = "Minor League, Women's And More Sports Uniform News";
const DESCRIPTION =
  "Uniform news beyond the big five leagues: minor league baseball names, logos and City Connects, PWHL and women's sports jerseys, G League uniforms, lacrosse, junior hockey and more, newest first.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/more-sports" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/more-sports", type: "website" },
};

// Wire items land between deploys' worth of stories; same window as /news.
export const revalidate = 900;

export default async function MoreSportsPage() {
  const sections = await moreSportsSections();
  return (
    <>
      <Header />
      <TwitterEmbed />
      <main>
        <section className="max-w-[1200px] mx-auto px-5 pt-8 pb-2">
          <div className="text-[11px] font-black tracking-[0.18em] uppercase text-steel">Beyond The Big Leagues</div>
          <h1 className="font-display font-black text-[30px] sm:text-[42px] leading-[1.05] mt-1">More Sports</h1>
          <p className="text-[16px] text-[#3c4250] max-w-[680px] mt-3">
            Minor league baseball, women&apos;s sports, the G League, lacrosse, junior hockey and more. Every new name,
            logo and jersey we have covered beyond the big five leagues, newest first.
          </p>
          <nav aria-label="Sections" className="flex flex-wrap gap-2 mt-5">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 font-display text-[13px] font-extrabold text-black hover:border-black/30"
              >
                {s.title} <span className="text-steel font-bold">{s.stories.length + s.wire.length}</span>
              </a>
            ))}
          </nav>
        </section>

        {sections.length === 0 && (
          <section className="max-w-[1200px] mx-auto px-5 py-16">
            <p className="text-gray-medium text-lg">Nothing here yet. Check back soon.</p>
          </section>
        )}

        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="max-w-[1200px] mx-auto px-5 pt-10 scroll-mt-28">
            <div className="flex items-baseline justify-between gap-4 border-b-2 border-black pb-2 mb-2">
              <h2 className="font-display text-[20px] sm:text-[24px] font-black">{s.title}</h2>
            </div>
            <p className="text-[14px] text-steel mb-5">{s.blurb}</p>

            {s.stories.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {s.stories.map((post, j) => (
                  <Fragment key={post.slug}>
                    <StoryCard {...post} showDate compact />
                    {slotAfterCard(j, s.stories.length)}
                  </Fragment>
                ))}
              </div>
            )}

            {s.wire.length > 0 && (
              <div className={`news-feed max-w-[760px] ${s.stories.length > 0 ? "pt-8" : ""}`}>
                <h3 className="font-display text-[12px] font-extrabold tracking-[0.18em] uppercase text-steel pb-3 m-0">
                  From The Wire
                </h3>
                {s.wire.map((item) => (
                  <WireItem key={item.slug} item={item} thumb={item.thumb} />
                ))}
              </div>
            )}

            {/* One in-feed spot between sections, as on /courts-and-fields. */}
            {i === 0 && sections.length > 1 && (
              <div className="pt-8">
                <MvSlot />
              </div>
            )}
          </section>
        ))}

        <section className="max-w-[1200px] mx-auto px-5 pt-12 pb-14">
          <p className="text-[14px] text-steel">
            Looking for the big leagues? See{" "}
            <Link prefetch={false} href="/news" className="text-orange font-bold">
              The Wire
            </Link>{" "}
            or{" "}
            <Link prefetch={false} href="/stories" className="text-orange font-bold">
              All Stories
            </Link>
            .
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
