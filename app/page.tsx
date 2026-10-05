import Header from "@/components/Header";
import NflWeekZone from "@/components/NflWeekZone";
import MlbUniformsZone from "@/components/MlbUniformsZone";
import NhlUniformsZone from "@/components/NhlUniformsZone";
import StoryCard from "@/components/StoryCard";
import StoryHero from "@/components/StoryHero";
import WireStrip from "@/components/WireStrip";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts, type PostMeta as Post } from "@/lib/posts";
import { currentNflWeek, getNflWeekChips } from "@/lib/nflWeek";
import { mlbBandSlugs } from "@/lib/mlbPostseason";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://www.colorwaysports.com",
  },
};

// Slugs surfaced elsewhere on the homepage (Featured Trackers band) or held out of
// regular rotation by design — kept out of Latest/More to avoid duplication.
const TRACKER_SLUGS = new Set([
  "world-cup-2026-jersey-tracker",
  "nba-finals-2026-jersey-tracker-knicks-spurs",
  "nhl-stanley-cup-final-2026-jersey-tracker-hurricanes-knights",
  "nba-playoffs-crowd-giveaway-tracker-2026",
  "remembering-kyle-busch-tribute-2026",
  "rugby-club-kits-ranked",
]);

// Manual pins in the Latest grid expire after this many days (see FEATURED_SLUGS).
const PIN_DAYS = 3;
// Posts published within this many days lead More Stories.
const FRESH_DAYS = 2;

export default function Home() {
  const posts = getAllPosts();
  const filtered = posts.filter((p) => !TRACKER_SLUGS.has(p.slug));

  // LATEST STORIES — the hero + 3-card grid are the visual identity of the
  // site, so they lead with the strongest real covers and never words-only
  // cards. Pinned features take the front slots; the rest fill with the newest
  // cover posts by date.
  const effectiveDate = (p: { date: string; updatedDate?: string }) =>
    p.updatedDate || p.date;
  const byDateDesc = [...filtered].sort((a, b) =>
    effectiveDate(b).localeCompare(effectiveDate(a))
  );
  const hasCover = (p: { coverImage?: string }) => Boolean(p.coverImage);
  // Newest by publish date, then by updatedDate, then slug so ties are stable.
  const byNewest = (a: Post, b: Post) =>
    b.date.localeCompare(a.date) ||
    (b.updatedDate || b.date).localeCompare(a.updatedDate || a.date) ||
    a.slug.localeCompare(b.slug);

  // Dates are Eastern, like the rest of the site. The page is rendered at
  // build time, so "today" is the day of the last deploy (several a day).
  const todayEt = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });
  const dayNumber = (d: string) => Math.floor(Date.parse(d.slice(0, 10) + "T00:00:00Z") / 86_400_000);
  const daysSince = (d: string) => dayNumber(todayEt) - dayNumber(d);

  // A post can pin itself to the hero slot with `homepageHero: true`; otherwise
  // lead with the newest post that carries a real cover image.
  const pinnedHero = filtered.find((p) => p.homepageHero);
  const heroPost = pinnedHero || byDateDesc.find(hasCover) || byDateDesc[0];

  // The 3 Latest cards are curated to nice visual covers: Chargers + Rams stay
  // pinned (Jake wants them kept), and any remaining slot fills with the newest
  // GENUINELY-NEW cover post by PUBLISH date. Evergreen "living" trackers (NBA
  // free agency, the MLB daily tracker/schedule) are excluded so they don't hog
  // a slot via updatedDate churn. Words-only cards never land here.
  // Rams is restored here on GSC data (8/13): "rams uniform schedule 2026" is the
  // single biggest query on the site at 87 clicks, plus 73 more on "rams jersey
  // schedule 2026". It earns a slot even though it is older than the rest.
  const FEATURED_SLUGS: { slug: string; pinned: string; standing?: boolean }[] = [
    // Every slug here MUST have a real coverImage. The hero plus these three are
    // the top of the page, and a words-only or ColorWay-generated card is never
    // allowed in that group. Check the post's frontmatter before adding one.
    // Refreshed 9/16 on GSC 7d (9/8-9/14): Bears #1 page, Texans #4 (team's
    // Wear White art), Buccaneers #6 (team closet art). Hero = Bengals (#2).
    // 9/16 (Jake): lead the grid with a tracker and a ranking story so the top of
    // the page is not all schedule posts. NFL tracker is the in-season hub; the
    // Rivalries ranking fills the third slot with a ranking story and team art.
    // Order matters: the tracker ("what every team is wearing this week") sits in
    // the middle card (Jake 9/16). City Edition was pulled from the homepage.
    // Texans replaced Bears (Jake 9/16): the Bears cover is the same Monsters
    // Rivalries shoot that leads the Rivalries ranking card next to it.
    // 9/21 (Jake): the Rays road gray takes the lead slot on the day it broke.
    // It is the only news story on this page rather than a schedule or a hub, it
    // carries the reveal art, and the uniform is on the field the next night in
    // game 2 at the Yankees, so the slot is worth more today than it will be on
    // Wednesday. The tracker stays in the MIDDLE card per the 9/16 rule. The
    // Rivalries ranking gives up the third slot rather than Texans, because
    // Texans is here on GSC data (7d #4 page) and Rivalries was here to vary the
    // format. Put Rivalries back when this story cools.
    // 9/22 (Jake): Miami moved UP to the hero and Texans came back here, because
    // Jake asked for one of the week's two uniform stories on top and said the
    // Bengals schedule post had been the hero too long. Miami won the hero over
    // the Rays on the picture: its cover is a real 1600x1066 photograph of both
    // sets in the Hall of Honor, which is exactly the hero's 3:2 crop, while the
    // Rays cover is a 1080x1350 portrait graphic whose own headline type gets cut
    // off in a wide block. A post in the hero is filtered OUT of this list, so
    // Miami must NOT be re-added here while it holds the pin. Tracker stays in
    // the MIDDLE card per the 9/16 rule. Rivalries ranking is still the post to
    // restore once the Rays story cools.
    // 9/22 later (Jake): Texans is OUT of this grid. Its cover is the club's
    // "WEAR WHITE vs BILLS, SUNDAY SEPTEMBER 13" ticket poster, and that game was
    // played on the 13th, so the card advertised a past game. The Rivalries
    // ranking takes the slot: real photography, its cover-v5 is exactly 1500x1000
    // for the card's 3:2 crop, and every uniform on it is worn in Oct/Nov, so
    // nothing about it can go stale this season. Air Force and Navy were the other
    // real-photo candidates and both lost on shape: their art is 0.80 portrait and
    // the Air Force file is a "THE DETAILS" slide whose body copy is all a 3:2 crop
    // would show. ▶ Texans belongs back here once it has a cover that is not a
    // dated ticket promo.
    // 9/28 (Jake: "a lot of the same stories on repeat"): pins now carry the
    // date they were pinned and EXPIRE after PIN_DAYS, because the Rays and
    // Rivalries pins sat for a week and blocked every new cover post (Messi,
    // the NBA closets ranking) from reaching the grid at all. An expired pin
    // frees its slot IN PLACE, and that slot auto-fills with the newest cover
    // post. `standing: true` never expires: the NFL tracker keeps the MIDDLE
    // card per Jake's 9/16 rule. To pin a story, add it with today's date.
    // 10/5: Jake's three bylined stories from NLDS Game 2 weekend. Braves navy
    // (his own Acuna photo) holds the hero; his LA fans column (his own pregame
    // Dodger Stadium photo) and the Canucks Black Skate story flank the tracker.
    { slug: "dodgers-fans-leaving-early-la-sports-fans-spoiled", pinned: "2026-10-05" },
    { slug: "nfl-uniform-tracker-2026", pinned: "2026-09-16", standing: true },
    { slug: "canucks-black-skate-jersey-back-to-back-2026", pinned: "2026-10-05" },
  ];
  // A slot is either a live pin or null (auto-fill), so the tracker stays in
  // the middle even when the pins on either side of it have expired.
  const pinSlots = FEATURED_SLUGS.map((pin) => {
    if (!pin.standing && daysSince(pin.pinned) > PIN_DAYS) return null;
    const p = filtered.find((x) => x.slug === pin.slug);
    return p && p.slug !== heroPost.slug ? p : null;
  });
  const featuredSlugs = new Set(
    pinSlots.filter((p): p is Post => Boolean(p)).map((p) => p.slug)
  );
  const GRID_EXCLUDE = new Set([
    "mlb-uniform-tracker-2026",
    "mlb-uniform-schedule-2026",
    "nba-free-agency-tracker-2026",
  ]);
  const gridPool = [...filtered]
    .sort(byNewest)
    .filter(
      (p) =>
        p.slug !== heroPost.slug &&
        !featuredSlugs.has(p.slug) &&
        !GRID_EXCLUDE.has(p.slug)
    );
  const coverFirst = [
    ...gridPool.filter(hasCover),
    ...gridPool.filter((p) => !hasCover(p)),
  ];
  // Fill the empty (unpinned or expired) slots, in place, newest first.
  let fillAt = 0;
  const gridPosts = pinSlots
    .map((p) => p ?? coverFirst[fillAt++])
    .filter((p): p is Post => Boolean(p));
  const gridSlugs = new Set(gridPosts.map((p) => p.slug));

  // Every story the bands below already link to. More Stories used to be the
  // top six by topViewsRank, and in NFL season those are all NFL schedule
  // posts (Bears, Bengals, Lions, Bucs, the NFL hub, Ravens on 9/28), which
  // the NFL week band ALREADY shows as chips a scroll above. So the page
  // repeated six stories and never showed anything new. Mirrors the band's
  // own render rule (it hides itself under 20 chips).
  const nflChips = getNflWeekChips(currentNflWeek());
  const bandSlugs = new Set([
    // MlbUniformsZone: tracker + schedule hub in the regular season; from
    // 9/29 the postseason post, tracker and each playoff team's schedule post.
    ...mlbBandSlugs(todayEt),
    ...(nflChips.length >= 20
      ? ["nfl-uniform-schedule-2026", "nfl-uniform-tracker-2026", ...nflChips.map((c) => c.slug)]
      : []),
  ]);

  // MORE STORIES — a story appears at most once on the page. Order:
  //  1. FRESH: anything published in the last FRESH_DAYS, newest first. This is
  //     the only slot words-only posts (no cover) can reach, so without it the
  //     day's new posts never showed on the homepage at all.
  //  2. POPULAR: topViewsRank, as before, but the window slides by one each
  //     day when there are more ranked posts than slots, so the same six do not
  //     sit here all week between Monday re-ranks.
  //  3. NEWEST: backfill by publish date if the first two run short.
  const shownSlugs = new Set([heroPost.slug, ...gridSlugs, ...bandSlugs]);
  const notShown = filtered.filter((p) => !shownSlugs.has(p.slug));
  const MORE_COUNT = 6;
  const fresh = notShown
    // >= 0 so a post dated ahead for tomorrow does not jump the queue today.
    .filter((p) => daysSince(p.date) >= 0 && daysSince(p.date) <= FRESH_DAYS)
    .sort(byNewest)
    .slice(0, MORE_COUNT);
  const ranked = notShown
    .filter((p) => typeof p.topViewsRank === "number" && !fresh.includes(p))
    .sort((a, b) => (a.topViewsRank ?? 999) - (b.topViewsRank ?? 999));
  const rankedSlots = MORE_COUNT - fresh.length;
  const offset =
    ranked.length > rankedSlots ? dayNumber(todayEt) % ranked.length : 0;
  const rotated = [...ranked.slice(offset), ...ranked.slice(0, offset)].slice(
    0,
    rankedSlots
  );
  const picked = new Set([...fresh, ...rotated]);
  const compact = [
    ...fresh,
    ...rotated,
    ...notShown.filter((p) => !picked.has(p)).sort(byNewest),
  ].slice(0, MORE_COUNT);

  return (
    <>
      <Header />
      <main>
        <h1 className="sr-only">
          ColorWay Sports — Every Jersey. Every Logo. Every Detail. Covering sports jerseys, uniforms, logos, scorebugs, and stadium design.
        </h1>
        {/* Hero story + Latest stories — the top story band, the visual identity of the site */}
        {heroPost && (
          <section className="max-w-[1200px] mx-auto px-5 pt-7 pb-2">
            <StoryHero post={heroPost} />
          </section>
        )}

        {/* Latest stories grid */}
        {gridPosts.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-5 pt-5 pb-8">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-[#8A8F98]">
                Latest Stories
              </h2>
              <Link prefetch={false}
                href="/stories"
                className="text-[11px] font-semibold text-orange hover:underline uppercase tracking-widest"
              >
                All stories →
              </Link>
            </div>
            <hr className="border-border mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridPosts.map((post) => (
                <StoryCard key={post.slug} {...post} compact />
              ))}
            </div>
          </section>
        )}

        {/* The Wire sits under the hero and the Latest grid: Jake's order, 9/17 */}
        {/* Six items (two rows) since 10/5: Jake's takes are the freshest
            thing on the site, and three left most of them off. */}
        <WireStrip limit={6} />

        {/* This week in the NFL: 32 chips, one per schedule post (the earners) */}
        <NflWeekZone />

        {/* All the MLB uniform tools, grouped in one tinted zone */}
        <MlbUniformsZone />

        {/* NHL uniform tools + last logged night (mock, pending Jake) */}
        <NhlUniformsZone />

        {/* More stories — compact bordered grid */}
        {compact.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-5 pt-8 pb-10">
            <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-[#8A8F98] mb-3">
              More Stories
            </h2>
            <hr className="border-border" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {compact.map((post, i) => (
                <Link prefetch={false}
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
                  <div className="flex items-center gap-1.5">
                    {post.logoSrc && <img src={post.logoSrc} alt="" className="h-[15px] w-auto object-contain" />}
                    {post.logoSrc2 && <img src={post.logoSrc2} alt="" className="h-[15px] w-auto object-contain" />}
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange">
                      {post.category}
                    </span>
                  </div>
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
              <Link prefetch={false}
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
