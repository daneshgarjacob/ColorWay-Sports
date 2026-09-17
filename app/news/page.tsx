import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllNews, groupByDay, stamp } from "@/lib/news";
import { getAllPosts } from "@/lib/posts";
import WireItem from "@/components/WireItem";
import InlineNewsletter from "@/components/InlineNewsletter";
import TwitterEmbed from "@/components/TwitterEmbed";

export const metadata: Metadata = {
  title: "The Wire: Uniform News as It Happens",
  description:
    "Uniform news the day it breaks. Reveals, weekly combinations, throwbacks and the things that go wrong on the field, across the NFL, MLB, college football, the NBA and the NHL.",
  alternates: { canonical: "/news" },
  openGraph: {
    title: "The Wire: Uniform News as It Happens",
    description:
      "Uniform news the day it breaks, from the teams themselves. Reveals, weekly combinations, throwbacks and on-field mishaps.",
    url: "/news",
    type: "website",
  },
};

// The feed is rebuilt on deploy like everything else, but an hour of staleness on
// a page whose whole promise is "what just happened" is worth avoiding.
export const revalidate = 900;

export default async function NewsFeed() {
  const items = await getAllNews();
  const days = groupByDay(items);
  const newest = items[0];
  const updated = newest ? stamp(newest.at) : null;

  // The rail exists to push wire readers into the pages that actually earn.
  const mostRead = getAllPosts()
    .filter((p) => p.topViewsRank)
    .sort((a, b) => (a.topViewsRank ?? 99) - (b.topViewsRank ?? 99))
    .slice(0, 5);

  return (
    <>
      <Header />
      <main className="pb-20">
        {/* widgets.js is loaded globally; this re-runs it so wire embeds render */}
        <TwitterEmbed />
        <div className="max-w-[1080px] mx-auto px-5">
          <header className="pt-9 pb-5 border-b-2 border-black">
            <p className="font-display text-[11px] font-extrabold tracking-[0.24em] uppercase text-orange m-0 mb-2">
              ColorWay Sports
            </p>
            <h1 className="font-display text-[34px] sm:text-[40px] font-black tracking-[-0.025em] leading-[1.05] text-black m-0 mb-3">
              The Wire
            </h1>
            <p className="text-[15.5px] text-gray-medium max-w-[640px] leading-relaxed m-0 mb-2">
              Uniform news as it happens. Reveals, weekly combinations, throwbacks, and the stuff
              that goes wrong on the field. Short, fast, and checked before we post it.
            </p>
            {updated && (
              <span className="inline-flex items-center gap-[7px] font-display text-[11px] font-extrabold tracking-[0.16em] uppercase text-[#128a4a] mb-1">
                <span className="w-[7px] h-[7px] rounded-full bg-[#16a55a] shadow-[0_0_0_3px_rgba(22,165,90,0.18)]" />
                Updated {updated.time} {updated.zone}
              </span>
            )}
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_312px] gap-6 lg:gap-11 pt-6 pb-10">
            <div>
              {days.length === 0 && (
                <p className="text-gray-medium text-[15px] py-10">Nothing on the wire yet today.</p>
              )}
              {days.map(({ day, items: dayItems }, i) => (
                <section key={day}>
                  <h2
                    className={`font-display text-[12px] font-extrabold tracking-[0.18em] uppercase text-steel ${
                      i === 0 ? "pt-1" : "pt-6"
                    } pb-3 m-0`}
                  >
                    {day}
                  </h2>
                  {dayItems.map((item) => (
                    <WireItem key={item.slug} item={item} />
                  ))}
                </section>
              ))}
            </div>

            <aside>
              <h3 className="font-display text-[11px] font-extrabold tracking-[0.18em] uppercase text-steel m-0 mb-3 pb-[9px] border-b border-border">
                Most read
              </h3>
              <div className="bg-white border border-border rounded-xl px-4 py-2 mb-6">
                <ul className="list-none m-0 p-0">
                  {mostRead.map((p) => (
                    <li key={p.slug} className="py-[9px] border-b border-[#f0f1f4] last:border-b-0 text-[14px] leading-snug">
                      <Link
                        prefetch={false}
                        href={`/stories/${p.slug}`}
                        className="text-black no-underline font-semibold hover:text-orange"
                      >
                        {p.title.split(":")[0]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <InlineNewsletter
                eyebrow="The Wire, once a week"
                heading="Get the week's uniform news on Fridays."
                body="Every reveal, combination and mess-up from the week, in one email."
                stacked
              />
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
