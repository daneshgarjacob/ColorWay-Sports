import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InlineNewsletter from "@/components/InlineNewsletter";
import { JotdTile, PhotoCredit, TodayFeature } from "@/components/JerseyOfTheDay";
import { revalidatePageWithin } from "@/lib/gameDayTitle";
import { longDay, pickFor, ptToday, secsToPtMidnight, shortDate, weekEnding } from "@/lib/jerseyOfTheDay";

// Jersey of the Day (MOCK on a branch for Jake, 2026-10-24). Not linked from
// the nav, homepage or sitemap yet; see the flagged suggestions in
// components/Header.tsx and app/page.tsx.
//
// Static page. "Today" is the Pacific date at render time, and the page asks
// to be re-rendered just after the next Pacific midnight (the same ISR hint
// the homepage uses for its daily lead story), so the pick turns over daily
// with no deploy. Data: content/data/jersey-of-the-day.json.

const SITE = "https://www.colorwaysports.com";
const PATH = "/jersey-of-the-day";

export async function generateMetadata(): Promise<Metadata> {
  const { entry } = pickFor();
  const title = entry
    ? `Jersey of the Day: ${entry.team} ${entry.jerseyName} (${shortDate(entry.date)})`
    : "Jersey of the Day";
  const description = entry
    ? `Today's Jersey of the Day is the ${entry.team} ${entry.jerseyName}, ${entry.edition.toLowerCase()}, worn ${shortDate(entry.worn.date)} ${entry.worn.matchup}. The story behind it, plus this week's picks.`
    : "One great jersey every day, picked from the uniforms on the field this week, with the story behind it.";
  return {
    title,
    description,
    alternates: { canonical: PATH },
    openGraph: { title, description, url: PATH, type: "website", ...(entry ? { images: [entry.image] } : {}) },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function JerseyOfTheDayPage() {
  const today = ptToday();
  await revalidatePageWithin(secsToPtMidnight());

  const { entry, isToday } = pickFor(today);
  const week = entry ? weekEnding(entry.date) : [];

  const jsonLd = entry && {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE}${PATH}`,
        url: `${SITE}${PATH}`,
        name: `Jersey of the Day: ${entry.team} ${entry.jerseyName}`,
        description: entry.story,
        dateModified: new Date(entry.date + "T07:00:00Z").toISOString(),
        isPartOf: { "@type": "WebSite", name: "ColorWay Sports", url: SITE },
        publisher: {
          "@type": "Organization",
          name: "ColorWay Sports",
          url: SITE,
          sameAs: ["https://x.com/ColorWaySports"],
          logo: { "@type": "ImageObject", url: `${SITE}/brand/colorway-logo.jpg` },
        },
        primaryImageOfPage: {
          "@type": "ImageObject",
          contentUrl: `${SITE}${entry.image}`,
          caption: entry.imageAlt,
          creditText: entry.credit.text,
          ...(entry.credit.licenseUrl ? { license: entry.credit.licenseUrl } : {}),
        },
        about: { "@type": "SportsTeam", name: entry.team },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Jersey of the Day", item: `${SITE}${PATH}` },
        ],
      },
    ],
  };

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <Header />
      <main className="pb-20">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-5">
          <header className="pt-9 pb-5 border-b-2 border-black">
            <p className="font-display text-[11px] font-extrabold tracking-[0.24em] uppercase text-orange m-0 mb-2">
              ColorWay Sports · {longDay(today)}
            </p>
            <h1 className="font-display text-[34px] sm:text-[40px] font-black tracking-[-0.025em] leading-[1.05] text-black m-0 mb-3">
              Jersey of the Day
            </h1>
            <p className="text-[15.5px] text-gray-medium max-w-[640px] leading-relaxed m-0">
              One great jersey every day, picked from what is on the field this week, with the story behind it.
            </p>
          </header>

          {!entry ? (
            <p className="text-gray-medium text-[15px] py-10">The first Jersey of the Day is coming soon.</p>
          ) : (
            <>
              <section className="pt-6" aria-label="Today's jersey">
                <TodayFeature entry={entry} isToday={isToday} />
                <PhotoCredit credit={entry.credit} caption={entry.imageCaption} />
              </section>

              <section className="pt-10" aria-labelledby="this-week">
                <div className="flex items-baseline justify-between gap-3 pb-3 mb-4 border-b border-border">
                  <h2 id="this-week" className="font-display text-[12px] font-extrabold tracking-[0.18em] uppercase text-steel m-0">
                    This week
                  </h2>
                  <Link
                    prefetch={false}
                    href={`${PATH}/archive`}
                    className="text-[12px] font-bold uppercase tracking-[0.15em] text-orange no-underline hover:text-blue-dark"
                  >
                    Archive →
                  </Link>
                </div>
                {/* Phones: a swipeable row that scrolls inside itself (the page
                    never scrolls sideways). Desktop: all seven in one row. */}
                <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto lg:overflow-visible snap-x snap-mandatory [scrollbar-width:none]">
                  <ol className="list-none m-0 p-0 pb-2 flex gap-3 lg:grid lg:grid-cols-7">
                    {[...week].reverse().map((e) => (
                      <li key={e.date} className="snap-start shrink-0 w-[42%] sm:w-[28%] lg:w-auto">
                        <JotdTile entry={e} active={e.date === entry.date} href={`${PATH}/archive#${e.date}`} />
                      </li>
                    ))}
                  </ol>
                </div>
              </section>

              <section className="pt-10 max-w-[720px]">
                <InlineNewsletter
                  eyebrow="Every Sunday"
                  heading="Get the week's best jerseys in one email."
                  body="The week's uniform news, the looks worth seeing and what is coming next."
                />
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
