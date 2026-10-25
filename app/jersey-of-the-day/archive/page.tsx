import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PhotoCredit } from "@/components/JerseyOfTheDay";
import { revalidatePageWithin } from "@/lib/gameDayTitle";
import { leagueColor } from "@/lib/leagueColors";
import { imgFitClass, longDay, etToday, publishedEntries, secsToEtMidnight } from "@/lib/jerseyOfTheDay";

// Jersey of the Day archive. Every published pick, newest first; a
// future day in the data file never shows here. Same daily turnover as the
// main page.

const SITE = "https://www.colorwaysports.com";
const PATH = "/jersey-of-the-day/archive";

export const metadata: Metadata = {
  title: "Jersey of the Day Archive: Every Pick So Far",
  description: "Every ColorWay Sports Jersey of the Day so far, newest first, with the story behind each jersey and when it was worn.",
  alternates: { canonical: PATH },
};

export default async function JerseyOfTheDayArchive() {
  await revalidatePageWithin(secsToEtMidnight());
  const entries = [...publishedEntries(etToday())].reverse();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Jersey of the Day Archive",
    url: `${SITE}${PATH}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: entries.map((e, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `${e.team} ${e.jerseyName}`,
        url: `${SITE}${PATH}#${e.date}`,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="pb-20">
        <div className="max-w-[860px] mx-auto px-4 sm:px-5">
          <header className="pt-9 pb-5 border-b-2 border-black">
            <Link prefetch={false} href="/jersey-of-the-day" className="text-sm text-black/60 hover:text-black no-underline">
              &larr; Today&rsquo;s jersey
            </Link>
            <h1 className="mt-3 font-display text-[30px] sm:text-[36px] font-black tracking-[-0.025em] leading-[1.05] text-black m-0">
              Jersey of the Day Archive
            </h1>
          </header>

          {entries.length === 0 && <p className="text-gray-medium text-[15px] py-10">No picks yet.</p>}

          <ol className="list-none m-0 p-0">
            {entries.map((e) => (
              <li key={e.date} id={e.date} className="scroll-mt-24 py-6 border-b border-border">
                <div className="grid grid-cols-[96px_minmax(0,1fr)] sm:grid-cols-[150px_minmax(0,1fr)] gap-4 sm:gap-5">
                  <figure className="m-0">
                    <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-[#f1f3f8]">
                      <img
                        src={e.image}
                        alt={e.imageAlt}
                        loading="lazy"
                        decoding="async"
                        className={`absolute inset-0 w-full h-full ${imgFitClass(e)}`}
                        style={e.imagePosition ? { objectPosition: e.imagePosition } : undefined}
                      />
                    </div>
                  </figure>
                  <div className="min-w-0">
                    <p className="m-0 font-display text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-steel">
                      {longDay(e.date)}
                    </p>
                    <h2 className="mt-1 mb-0 text-[19px] sm:text-[21px] font-extrabold text-blue-dark leading-tight">
                      {e.jerseyName}
                    </h2>
                    <p className="mt-0.5 mb-0 text-[13px] font-semibold" style={{ color: leagueColor(e.league) }}>
                      {e.team} · {e.league}
                    </p>
                    <p className="mt-2 mb-0 text-[14.5px] text-[#2a2a2a] leading-relaxed">{e.story}</p>
                    <Link
                      prefetch={false}
                      href={`/stories/${e.scheduleSlug}`}
                      className="inline-block mt-2 text-[12px] font-bold uppercase tracking-[0.15em] text-orange no-underline hover:text-blue-dark"
                    >
                      {e.scheduleLabel} →
                    </Link>
                  </div>
                </div>
                <PhotoCredit credit={e.credit} />
              </li>
            ))}
          </ol>
        </div>
      </main>
      <Footer />
    </>
  );
}
