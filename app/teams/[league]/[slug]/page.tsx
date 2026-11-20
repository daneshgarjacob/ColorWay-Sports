import Header from "@/components/Header";
import FromTheTeams from "@/components/FromTheTeams";
import { newsForTeam, newsThumb } from "@/lib/news";
import Footer from "@/components/Footer";
import { Fragment } from "react";
import StoryCard from "@/components/StoryCard";
import MvSlot, { slotAfterCard } from "@/components/MvSlot";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FollowButton } from "@/components/home/MyTeams";
import { getMyTeamCards, getTeamCard, teamPagePath, type NextGame } from "@/lib/myTeams";
import { getAllPostsByDate } from "@/lib/posts";
import Breadcrumbs from "@/components/browse/Breadcrumbs";
import TeamLookTile from "@/components/browse/TeamLookTile";
import TeamMoreBlock from "@/components/TeamMoreBlock";
import { buildTeamMoreLinks } from "@/lib/teamMoreLinks";
import { coversOf, groupCards } from "@/lib/browse";
import { groupOfTeam, groupPath, hubByKey, storyTeamSlug } from "@/lib/teamGroups";

// One page per team, the way ESPN's app works (Jake 11/4): this week's
// uniform up top, the next few games, one link to the full uniform schedule
// (Jake 11/5: no separate Calendar tab, the schedule post has every game),
// then every story we have on the club. Built from the same data as
// the homepage My Teams cards, so the two never disagree.

export const revalidate = 3600;

const LEAGUE_NAME: Record<string, string> = { nfl: "NFL", nba: "NBA", nhl: "NHL", mlb: "MLB", cfb: "College Football" };

export function generateStaticParams() {
  return getMyTeamCards().map((c) => {
    const [league, slug] = c.id.split(":");
    return { league, slug };
  });
}

export async function generateMetadata({ params }: { params: Promise<{ league: string; slug: string }> }): Promise<Metadata> {
  const { league, slug } = await params;
  const card = getTeamCard(`${league}:${slug}`, new Date(), 1);
  if (!card) return {};
  // 11/19: positioned as the team's news hub; "what are they wearing" belongs
  // to the schedule post, which this page links to first.
  const title = `${card.name} Uniform News, Jerseys And Stories`;
  const description = card.next
    ? `${card.name} this week: ${card.next.look}, ${card.next.when} ${card.next.opp}. Every upcoming uniform, the full ${card.name} uniform schedule and all our ${card.nickname} stories.`
    : `The ${card.name} uniform schedule and every ColorWay Sports story on the ${card.nickname}.`;
  return {
    title,
    description,
    alternates: { canonical: `/teams/${league}/${slug}` },
    // Navigation hub only (Jake 11/4): the schedule post is the page that ranks
    // and earns for "<team> uniforms", so this one stays out of search.
    robots: { index: false, follow: true },
    openGraph: { title, description, url: `/teams/${league}/${slug}`, type: "website" },
  };
}

function Jersey({ src, logo, big }: { src?: string; logo: string; big?: boolean }) {
  const box = big ? "w-[150px] h-[170px] sm:w-[200px] sm:h-[220px]" : "w-[84px] h-[96px]";
  return (
    <div className={`${box} shrink-0 rounded-2xl bg-white border border-border flex items-center justify-center overflow-hidden`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src ?? logo} alt="" className={src ? "w-[92%] h-[92%] object-contain" : "w-[60%] h-[60%] object-contain"} loading="lazy" />
    </div>
  );
}

function GameRow({ g, logo }: { g: NextGame; logo: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border p-3">
      <Jersey src={g.img} logo={logo} />
      <div className="min-w-0">
        <div className="text-[11px] font-black tracking-[0.14em] uppercase text-steel">{g.when}</div>
        <div className="font-display font-black text-[17px] leading-tight mt-0.5">{g.opp}</div>
        <div className="text-[14px] mt-0.5">{g.look}</div>
      </div>
    </div>
  );
}

export default async function TeamPage({ params }: { params: Promise<{ league: string; slug: string }> }) {
  const { league, slug } = await params;
  const card = getTeamCard(`${league}:${slug}`);
  if (!card) notFound();
  // Posts tag the A's as "athletics"; every other club's tag is its slug.
  const tag = storyTeamSlug(slug);
  const stories = getAllPostsByDate().filter((p) => p.teams?.includes(tag)).slice(0, 12);
  const hub = hubByKey(league);
  const group = groupOfTeam(league, slug);
  // The rest of the division (or a conference of eight or fewer) with this week's looks.
  const neighbors = group ? groupCards(group, getMyTeamCards()).filter((c) => c.id !== card.id) : [];
  // Up to eight clubs get this week's look tiles; a big conference gets a row of school chips.
  const neighborTiles = neighbors.length <= 7;
  // Next opponent, rival, record in each uniform, calendar, league tracker.
  const more = buildTeamMoreLinks(tag, { exclude: [card.href] });
  // Never the same photo twice on a page (Jake 11/14): a Wire item whose
  // photo is a story cover below shows the team logo instead.
  const covers = coversOf(stories);
  const wire = newsForTeam(tag, card.name).map((n) =>
    n.thumb.kind === "cover" && n.thumb.src && covers.has(n.thumb.src) ? { ...n, thumb: newsThumb(n, true) } : n,
  );
  const [first, ...rest] = card.upcoming ?? [];
  const LABEL = "font-display text-[11px] font-black tracking-[0.18em] uppercase";

  return (
    <>
      <Header />
      <main>
        <section className="text-white" style={{ background: `linear-gradient(120deg, #0A1733 0%, ${card.color} 160%)` }}>
          <div className="max-w-[1200px] mx-auto px-5 py-6 sm:py-8 flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full bg-white flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.logo} alt={`${card.name} logo`} className="w-[70%] h-[70%] object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              {/* League › Division › Team (11/19), in place of the league label. */}
              {hub ? (
                <Breadcrumbs
                  tone="light"
                  className="text-[11px] font-black tracking-[0.18em] uppercase"
                  crumbs={[
                    { label: hub.name, short: hub.navLabel, href: hub.path },
                    // The club itself is the h1 right under this line.
                    ...(group ? [{ label: group.name, href: groupPath(group) }] : []),
                  ]}
                />
              ) : (
                <div className="text-[11px] font-black tracking-[0.18em] uppercase text-sky">{LEAGUE_NAME[league] ?? card.league}</div>
              )}
              <h1 className="font-display font-black text-[24px] sm:text-[36px] leading-tight">{card.name}</h1>
            </div>
            <FollowButton id={card.id} name={card.nickname} />
          </div>
          <nav className="max-w-[1200px] mx-auto px-5 flex gap-5 text-[13px] font-extrabold overflow-x-auto">
            <a href="#this-week" className="pb-3 border-b-2 border-white whitespace-nowrap">This Week</a>
            {rest.length > 0 && <a href="#coming-up" className="pb-3 text-white/75 whitespace-nowrap">Coming Up</a>}
            <Link prefetch={false} href={card.href} className="pb-3 text-white/75 whitespace-nowrap">Uniform Schedule</Link>
            {stories.length > 0 && <a href="#stories" className="pb-3 text-white/75">Stories</a>}
            {group && <Link prefetch={false} href={groupPath(group)} className="pb-3 text-white/75 whitespace-nowrap">{group.name}</Link>}
          </nav>
        </section>

        <section id="this-week" className="max-w-[1200px] mx-auto px-5 pt-6">
          <div className={`${LABEL} border-b-2 border-black pb-2 mb-4`}>This Week</div>
          {first ? (
            <div className="flex gap-4 sm:gap-6 items-center">
              <Jersey src={first.img} logo={card.logo} big />
              <div className="min-w-0">
                <div className="text-[12px] font-black tracking-[0.14em] uppercase text-steel">{first.when}</div>
                <div className="font-display font-black text-[22px] sm:text-[30px] leading-tight mt-1">{first.look}</div>
                <div className="text-[16px] mt-1">{first.opp}</div>
                {first.confirmed === false && <div className="text-[13px] text-steel mt-1">Expected Look</div>}
                {first.confirmed === true && <div className="text-[13px] font-bold text-[#0f7a43] mt-1">Confirmed</div>}
                {/* The schedule post is the answer page for "what are they wearing" (11/19). */}
                <Link prefetch={false} href={card.href} className="inline-flex items-center min-h-[44px] mt-3 rounded-full bg-orange px-5 py-2 leading-tight font-display text-[15px] font-extrabold text-white hover:bg-[#001ea6] transition-colors">
                  Full Uniform Schedule &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="font-display font-black text-[22px]">
              {card.note}{" "}
              <Link prefetch={false} href={card.href} className="text-orange text-[15px]">{`See The ${card.nickname} Uniform Schedule →`}</Link>
            </div>
          )}
        </section>

        {rest.length > 0 && (
          <section id="coming-up" className="max-w-[1200px] mx-auto px-5 pt-8">
            <div className={`${LABEL} border-b-2 border-black pb-2 mb-4`}>Coming Up</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rest.map((g) => <GameRow key={g.at} g={g} logo={card.logo} />)}
            </div>
          </section>
        )}

        {/* Jake 11/13: this team's own uniform posts, from The Wire. */}
        <FromTheTeams
          items={wire}
          title={`From The ${card.nickname}`}
          className="max-w-[1200px] mx-auto px-5 pt-8"
        />

        {/* Mediavine in-feed spot (11/6), before the stories. */}
        <div className="max-w-[1200px] mx-auto px-5 pt-6"><MvSlot /></div>

        {stories.length > 0 && (
          <section id="stories" className="max-w-[1200px] mx-auto px-5 pt-8 pb-10">
            <div className={`${LABEL} border-b-2 border-black pb-2 mb-4`}>{card.nickname} Stories</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {stories.map((post, i) => (
                <Fragment key={post.slug}>
                <StoryCard
                  slug={post.slug}
                  title={post.title}
                  category={post.category}
                  date={post.date}
                  updatedDate={post.updatedDate}
                  excerpt={post.excerpt}
                  gradient={post.gradient}
                  overlayText={post.overlayText}
                  logoSrc={post.logoSrc}
                  logoSrc2={post.logoSrc2}
                  coverImage={post.coverImage}
                  coverImagePosition={post.coverImagePosition}
                  coverImageFit={post.coverImageFit}
                  showDate={true}
                />
                {slotAfterCard(i, stories.length)}
                </Fragment>
              ))}
            </div>
            <Link prefetch={false} href={`/stories?team=${encodeURIComponent(tag)}`} className="inline-block mt-6 font-display text-[14px] font-extrabold text-orange">
              {`All ${card.nickname} Stories →`}
            </Link>
          </section>
        )}

        {/* Next opponent, rival, record in each uniform, calendar (11/19). */}
        {more && (
          <div className="max-w-[1200px] mx-auto px-5">
            <TeamMoreBlock data={more} />
          </div>
        )}

        {/* The rest of the division with this week's looks (11/19). */}
        {group && (
          <section className="max-w-[1200px] mx-auto px-5 pb-12" aria-labelledby="around-group">
            <div className="flex items-baseline justify-between gap-3 border-b-2 border-black pb-2 mb-4">
              <h2 id="around-group" className={`${LABEL} m-0`}>Around The {group.name}</h2>
              <Link prefetch={false} href={groupPath(group)} className="shrink-0 inline-flex min-h-[44px] items-center font-display text-[14px] font-extrabold text-orange">
                {`All ${group.name} Looks →`}
              </Link>
            </div>
            {neighborTiles ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {neighbors.map((c, i) => <TeamLookTile key={c.id} card={c} index={i} />)}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {neighbors.map((c) => (
                  <Link prefetch={false} key={c.id} href={teamPagePath(c.id)} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-white px-4 font-display text-[14px] font-extrabold text-black hover:border-black/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.logo} alt="" width={20} height={20} loading="lazy" className="w-5 h-5 object-contain" />
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
