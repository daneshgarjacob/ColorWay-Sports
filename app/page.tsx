import Header from "@/components/Header";
import StoryCard from "@/components/StoryCard";
import { LeadStory, LatestRail } from "@/components/home/HomeRefresh";
import { latestStandsDate, standsPhotoFor, standsPool } from "@/lib/homeToday";
import { MyTeamsRow, TeamPicker } from "@/components/home/MyTeams";
import { getMyTeamCards, withOpponents } from "@/lib/myTeams";
import { tonightMatchups } from "@/lib/tonight";
import TonightRow from "@/components/home/TonightRow";
import PopularSchedules from "@/components/home/PopularSchedules";
import MvSlot from "@/components/MvSlot";
import { popularScheduleCards } from "@/lib/popularSchedules";
import { MOST_READ } from "@/lib/mostRead";
import FromTheStandsRandom from "@/components/home/FromTheStandsRandom";
import FromTheTeams from "@/components/FromTheTeams";
import { recentNewsWithThumbs } from "@/lib/news";
import Footer from "@/components/Footer";
import Link from "next/link";
import { pickFor } from "@/lib/jerseyOfTheDay";
import type { Metadata } from "next";
import { getAllPosts, type PostMeta as Post } from "@/lib/posts";
import { revalidatePageWithin } from "@/lib/gameDayTitle";
import { currentNflWeek, getNflWeekChips } from "@/lib/nflWeek";
import { isEliminatedMlbTeamPost } from "@/lib/mlbPostseason";

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
// Jake 10/21: a different lead story every day, never the same one two days
// running ("people think it's stagnant"). A post can claim one day with
// `homepageHero: "YYYY-MM-DD"` (Eastern); on any other day the lead comes from
// this list, one per day. Only HD professional team/league photos belong here
// (10/5 rule), so check the cover before adding a slug, and drop stories once
// they go stale.
const HERO_ROTATION = [
  "nhl-hometown-remix-jerseys-ranked",
  "nfl-week-10-uniforms-2026",
  "college-football-week-11-uniforms-2026",
];

export default async function Home() {
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
  // Re-render just after midnight Eastern, so the lead story, the pins and the
  // More Stories rotation turn over every day even with no deploy.
  const etNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const secsToEtMidnight = 86_400 - (etNow.getHours() * 3600 + etNow.getMinutes() * 60 + etNow.getSeconds());
  await revalidatePageWithin(Math.max(300, secsToEtMidnight + 120));
  const jotd = pickFor(todayEt);

  // Up to TWO posts can claim today's lead as a pair (Jake 10/13). The one
  // published first keeps the left slot; the newer one joins beside it.
  const pinnedHeroes = filtered
    .filter((p) => p.homepageHero === todayEt)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 2);
  const rotation = HERO_ROTATION.map((slug) => filtered.find((p) => p.slug === slug)).filter(
    (p): p is Post => Boolean(p)
  );
  // The lead for any day: that day's pin, else the rotation's pick, moved on
  // by one when it would repeat the day before's lead.
  const isoOfDay = (n: number) => new Date(n * 86_400_000).toISOString().slice(0, 10);
  const leadFor = (n: number, lookback: number): Post | undefined => {
    const pinned = filtered.filter((p) => p.homepageHero === isoOfDay(n)).sort((a, b) => a.date.localeCompare(b.date))[0];
    if (pinned) return pinned;
    if (!rotation.length) return undefined;
    const pick = rotation[n % rotation.length];
    if (lookback > 0 && rotation.length > 1 && leadFor(n - 1, lookback - 1)?.slug === pick.slug) {
      return rotation[(n + 1) % rotation.length];
    }
    return pick;
  };
  const dailyLead = leadFor(dayNumber(todayEt), 14);
  const heroPost = pinnedHeroes[0] || dailyLead || byDateDesc.find(hasCover) || byDateDesc[0];
  const heroPost2 = pinnedHeroes[1] ?? null;
  const heroSlugs = [heroPost.slug, ...(heroPost2 ? [heroPost2.slug] : [])];

  // The 3 Latest cards are curated to nice visual covers: Chargers + Rams stay
  // pinned (Jake wants them kept), and any remaining slot fills with the newest
  // GENUINELY-NEW cover post by PUBLISH date. Evergreen "living" trackers (NBA
  // free agency, the MLB daily tracker/schedule) are excluded so they don't hog
  // a slot via updatedDate churn. Words-only cards never land here.
  // Rams is restored here on GSC data (8/13): "rams uniform schedule 2026" is the
  // single biggest query on the site at 87 clicks, plus 73 more on "rams jersey
  // schedule 2026". It earns a slot even though it is older than the rest.
  const FEATURED_SLUGS: { slug: string; pinned: string; standing?: boolean }[] = [
    // ⭐ STANDING RULE (Jake, 10/5): of the TOP FOUR IMAGES (the hero + these
    // three cards), AT MOST ONE may be a ColorWay-generated / composite graphic
    // (today that one is the NFL tracker). The rest must be real, professional
    // team or league photography. Jake's own fan photos are OK in a Latest card
    // but NEVER the hero; the hero is an HD professional team photo "like Oregon".
    // Every slug here MUST have a real coverImage, and words-only cards are
    // never allowed here. Check the post's frontmatter before adding one.
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
    // 10/5 (Jake): hero back to Oregon (HD team photo). Left = Braves navy NLDS
    // G2 (Jake's own Acuna photo: fine in a card, never the hero). Middle = NFL
    // tracker (the one allowed ColorWay graphic). Right = Air Force B-21 (official
    // team photo; it debuted and beat Navy 10/3).
    // 10/6 (Jake): Todd Radom interview takes the LEFT card (replaces Braves
    // navy G2, a past game now that G3 is on). Its cover is built around a real
    // photo (Todd's Topps card) plus his actual logos, not a generated graphic.
    // 10/9 (Jake): Oregon held the hero too long. Heritage Classic (real team
    // photography, 3:2) takes the hero; Dieter goes in the lead card because Jake
    // said its cover is good enough for the homepage (his call, so the top four
    // carry two generated graphics today: Dieter + the tracker). Oregon drops to
    // the third card so it does not vanish from the page.
    // 11/4 (Jake): lead = Remix debut week (Penguins photo). Cards = Chargers
    // Jake's Fix (team photo), the NFL tracker (the one ColorWay graphic), and
    // Kentucky's Ice Whites (team photo, at Tennessee Saturday). Week 9's cover
    // is our graphic too, so it sits in the Latest column, not up here.
    { slug: "chargers-should-make-super-chargers-full-time", pinned: "2026-11-04" },
    { slug: "nfl-uniform-tracker-2026", pinned: "2026-09-16", standing: true },
    { slug: "kentucky-ice-white-chrome-helmet-tennessee-2026", pinned: "2026-11-04" },
  ];
  // Jake 10/5: "I don't want that on the home screen." These never take an image
  // slot on the homepage (no Latest auto-fill, no More Stories thumbnail). A
  // text link in the Jake's Takes rail is fine. Canucks may come back only with
  // an in-game shot we are allowed to host.
  const HOMEPAGE_HIDE = new Set([
    "dodgers-fans-leaving-early-la-sports-fans-spoiled",
    "canucks-black-skate-jersey-back-to-back-2026",
    // Jake 11/2: MLB season is over, keep the MLB hubs off the homepage until spring.
    "mlb-uniform-tracker-2026",
    "mlb-uniform-schedule-2026",
    "mlb-postseason-uniforms-2026",
    "world-series-uniforms-2026",
  ]);
  // A slot is either a live pin or null (auto-fill), so the tracker stays in
  // the middle even when the pins on either side of it have expired.
  const pinSlots = FEATURED_SLUGS.map((pin) => {
    if (!pin.standing && daysSince(pin.pinned) > PIN_DAYS) return null;
    const p = filtered.find((x) => x.slug === pin.slug);
    return p && !heroSlugs.includes(p.slug) ? p : null;
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
        !heroSlugs.includes(p.slug) &&
        !featuredSlugs.has(p.slug) &&
        !GRID_EXCLUDE.has(p.slug) &&
        !HOMEPAGE_HIDE.has(p.slug)
    );
  const coverFirst = [
    ...gridPool.filter(hasCover),
    ...gridPool.filter((p) => !hasCover(p)),
  ];
  // Fill the empty (unpinned or expired) slots, in place, newest first.
  let fillAt = 0;
  // Jake 10/13: one big lead, then three right under it. A second pinned hero
  // takes the first of the three slots.
  const gridPosts = [
    ...(heroPost2 ? [heroPost2] : []),
    ...pinSlots.map((p) => p ?? coverFirst[fillAt++]),
  ]
    .filter((p): p is Post => Boolean(p))
    .slice(0, 3);
  const gridSlugs = new Set(gridPosts.map((p) => p.slug));

  // Every story the bands below already link to. More Stories used to be the
  // top six by topViewsRank, and in NFL season those are all NFL schedule
  // posts (Bears, Bengals, Lions, Bucs, the NFL hub, Ravens on 9/28), which
  // the NFL week band ALREADY shows as chips a scroll above. So the page
  // repeated six stories and never showed anything new. Mirrors the band's
  // own render rule (it hides itself under 20 chips).
  const nflChips = getNflWeekChips(currentNflWeek());
  const bandSlugs = new Set([
    ...(nflChips.length >= 20
      ? ["nfl-uniform-schedule-2026", "nfl-uniform-tracker-2026", ...nflChips.map((c) => c.slug)]
      : []),
  ]);

  // MOST-SEARCHED SCHEDULES THIS WEEK (11/5): the clubs that play in the next
  // four days, ranked by how often their schedule post is clicked from Google
  // (lib/popularSchedules.ts). Every homepage reader gets these, not only
  // readers who follow a team, and each opens a long, ad-earning schedule post.
  const myTeamCards = getMyTeamCards();
  const popularSchedules = popularScheduleCards(myTeamCards);
  const popularSlugs = new Set(popularSchedules.map((c) => c.href.replace(/^\/stories\//, "")));

  // MOST READ THIS WEEK (11/5: always on, and higher up the page; it used to
  // show only when From the Stands was stale, at the very bottom). The hand-set
  // Monday list first, then the next most-viewed cover posts, skipping
  // anything already on the page above it.
  const aboveMostRead = new Set([...heroSlugs, ...gridSlugs, ...popularSlugs]);
  const mostRead = [
    ...MOST_READ.map((slug) => posts.find((p) => p.slug === slug)).filter((p): p is Post => !!p),
    ...filtered
      .filter((p) => typeof p.topViewsRank === "number" && hasCover(p) && !HOMEPAGE_HIDE.has(p.slug) && !isEliminatedMlbTeamPost(p.slug, p.league, todayEt))
      .sort((a, b) => (a.topViewsRank ?? 999) - (b.topViewsRank ?? 999)),
  ]
    .filter((p, i, all) => !aboveMostRead.has(p.slug) && all.findIndex((x) => x.slug === p.slug) === i)
    .slice(0, 6);

  const shownSlugs = new Set([...heroSlugs, ...gridSlugs, ...bandSlugs, ...popularSlugs, ...mostRead.map((p) => p.slug)]);
  // MORE STORIES — a story appears at most once on the page. Order:
  //  1. FRESH: anything published in the last FRESH_DAYS, newest first. This is
  //     the only slot words-only posts (no cover) can reach, so without it the
  //     day's new posts never showed on the homepage at all.
  //  2. POPULAR: topViewsRank, as before, but the window slides by one each
  //     day when there are more ranked posts than slots, so the same six do not
  //     sit here all week between Monday re-ranks.
  //  3. NEWEST: backfill by publish date if the first two run short.
  const notShown = filtered.filter(
    (p) =>
      !shownSlugs.has(p.slug) &&
      !HOMEPAGE_HIDE.has(p.slug) &&
      !isEliminatedMlbTeamPost(p.slug, p.league, todayEt)
  );
  // 11/5: more real stories at the bottom (was 6), so the page has more links
  // to a second page and more content height for Mediavine's in-content ads.
  const standsFresh = daysSince(latestStandsDate()) <= 7;
  const MORE_COUNT = standsFresh ? 10 : 12;
  const fresh = notShown
    // >= 0 so a post dated ahead for tomorrow does not jump the queue today.
    .filter((p) => daysSince(p.date) >= 0 && daysSince(p.date) <= FRESH_DAYS)
    .sort(byNewest)
    .slice(0, MORE_COUNT);
  const ranked = notShown
    // Popular + backfill slots need a cover (10/12: a coverless, long-past
    // "College Football Week 3" post sat here as a bare text card). Only the
    // FRESH slot above may show a words-only post.
    .filter((p) => typeof p.topViewsRank === "number" && !fresh.includes(p) && hasCover(p))
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
    ...notShown.filter((p) => !picked.has(p) && hasCover(p)).sort(byNewest),
  ].slice(0, MORE_COUNT);

  // The self-updating pieces (homepage refresh, 10/5).
  const standsPhoto = standsPhotoFor(todayEt, new Set([...heroSlugs, ...gridSlugs]));
  const standsPhotos = standsPool(new Set([...heroSlugs, ...gridSlugs]));
  const myTeamMatchups = withOpponents(myTeamCards);
  const tonightGames = tonightMatchups(new Date());
  const todayLong = new Date(`${todayEt}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <>
      <Header />
      <main>
        <h1 className="sr-only">
          ColorWay Sports — Every Jersey. Every Logo. Every Detail. Covering sports jerseys, uniforms, logos, scorebugs, and stadium design.
        </h1>
        {/* Jake 11/4: simpler, ESPN-style top to bottom: your teams, the lead,
            tonight, latest, most read. The daily brief and the three league
            bands are gone; /tonight holds every game. */}
        {/* Jake 11/2: the reader's followed teams, next uniform first. Shows only
            after they follow a team in the Find Your Team row below. */}
        <MyTeamsRow teams={myTeamMatchups} teamPages />

        {/* 10/5: lead story (2/3) + Jake's Takes rail (1/3) */}
        {heroPost && (
          <section className="max-w-[1200px] mx-auto px-5 pt-6 pb-2">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-8">
              <LeadStory post={heroPost} />
              {/* Jake 11/4: the right column is "Latest", text only, every author. */}
              <LatestRail jotd={jotd.entry} posts={byDateDesc.filter((p) => !heroSlugs.includes(p.slug) && !gridSlugs.has(p.slug)).slice(0, 4)} />
            </div>
          </section>
        )}

        {/* Latest stories grid */}
        {gridPosts.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-5 pt-8 pb-2">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-[#8A8F98]">
                Top Stories
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

        {/* Jake 11/13: the newest uniform posts from team and league accounts
            (The Wire, fed by the X sweep every two hours). */}
        <FromTheTeams items={recentNewsWithThumbs(4, 8)} />

        {/* Mediavine in-feed spots (11/6): desktop after Top Stories, all devices
            after the schedules and after Find Your Team. */}
        <div className="max-w-[1200px] mx-auto px-5 pt-6"><MvSlot device="desktop" /></div>

        {/* Jake 11/4: a rule between Latest Stories and Tonight's Uniforms. */}
        <div className="max-w-[1200px] mx-auto px-5 pt-8"><hr className="border-black/15" /></div>
        <TonightRow games={tonightGames} label={todayLong.split(",")[0]} />

        <PopularSchedules teams={popularSchedules} title="Most-Searched Uniform Schedules This Week" />
        <div className="max-w-[1200px] mx-auto px-5 pt-6"><MvSlot /></div>

        {/* Most Read This Week (11/5): always shown, right under the schedules. */}
        {mostRead.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-5 pt-10">
            <div className="flex items-baseline justify-between border-b-2 border-black pb-2">
              <h2 className="m-0 font-display text-[11px] font-black tracking-[0.18em] uppercase text-black">Most Read This Week</h2>
              <Link prefetch={false} href="/stories" className="font-display text-[12px] font-extrabold text-orange">
                All stories &rarr;
              </Link>
            </div>
            <ol className="m-0 p-0 list-none grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-8">
              {mostRead.map((post, i) => (
                <li key={post.slug} className="border-b border-border">
                  <Link prefetch={false} href={`/stories/${post.slug}`} className="group flex items-center gap-3 py-3.5">
                    <span className="font-serif text-[26px] font-extrabold text-orange leading-none w-6 shrink-0">{i + 1}</span>
                    <span className="min-w-0 flex-1 text-[15px] font-bold text-black leading-snug group-hover:text-orange line-clamp-3">{post.title}</span>
                    {post.coverImage && (
                      <span className="relative h-[56px] w-[84px] shrink-0 overflow-hidden rounded-md bg-[#eef0f3]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.coverImage}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                          style={post.coverImagePosition ? { objectPosition: post.coverImagePosition } : undefined}
                        />
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        <TeamPicker teams={myTeamCards} />
        <div className="max-w-[1200px] mx-auto px-5 pt-6"><MvSlot /></div>
        <div className="pt-10" />

        {/* From the Stands (Jake's own photos, random each visit since 10/13) beside More Stories;
            without a photo from the last week, More Stories takes the full width. */}
        <section className="max-w-[1200px] mx-auto px-5 pb-12">
          <div className={standsFresh ? "grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-10" : ""}>
            {standsFresh && <FromTheStandsRandom photos={standsPhotos} initial={standsPhoto} />}
            {compact.length > 0 && (
              <div>
                <div className="flex items-center justify-between border-b-2 border-black pb-2">
                  <h2 className="m-0 font-display text-[11px] font-black tracking-[0.18em] uppercase text-black">
                    More Stories
                  </h2>
                  <Link prefetch={false} href="/stories" className="font-display text-[12px] font-extrabold text-orange">
                    All stories &rarr;
                  </Link>
                </div>
                <div className={`grid grid-cols-1 sm:grid-cols-2 sm:gap-x-8 ${standsFresh ? "" : "lg:grid-cols-3"}`}>
                  {compact.map((post) => (
                    <Link
                      prefetch={false}
                      key={post.slug}
                      href={`/stories/${post.slug}`}
                      className="group flex gap-4 py-4 border-b border-border"
                    >
                      {post.coverImage && (
                        <div className="relative h-[72px] w-[108px] shrink-0 overflow-hidden rounded-md bg-[#eef0f3]">
                          <img
                            src={post.coverImage}
                            alt=""
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover"
                            style={post.coverImagePosition ? { objectPosition: post.coverImagePosition } : undefined}
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-orange">{post.category}</span>
                        <h3 className="m-0 mt-1 text-[14.5px] font-bold text-black leading-snug group-hover:text-orange line-clamp-3">
                          {post.title}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="pt-5 text-center">
                  <Link prefetch={false} href="/stories" className="inline-block rounded-full border border-border bg-white px-5 py-2.5 font-display text-[13px] font-extrabold text-black hover:border-black/30">
                    More stories &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
