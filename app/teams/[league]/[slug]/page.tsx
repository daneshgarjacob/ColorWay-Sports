import Header from "@/components/Header";
import FromTheTeams from "@/components/FromTheTeams";
import { newsForTeam } from "@/lib/news";
import Footer from "@/components/Footer";
import { Fragment } from "react";
import StoryCard from "@/components/StoryCard";
import MvSlot, { slotAfterCard } from "@/components/MvSlot";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FollowButton } from "@/components/home/MyTeams";
import { getMyTeamCards, getTeamCard, type NextGame } from "@/lib/myTeams";
import { getAllPostsByDate } from "@/lib/posts";

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
  const title = `${card.name} Uniforms: What They're Wearing This Week, Schedule and News`;
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
  const stories = getAllPostsByDate().filter((p) => p.teams?.includes(slug)).slice(0, 12);
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
              <div className="text-[11px] font-black tracking-[0.18em] uppercase text-sky">{LEAGUE_NAME[league] ?? card.league}</div>
              <h1 className="font-display font-black text-[24px] sm:text-[36px] leading-tight">{card.name}</h1>
            </div>
            <FollowButton id={card.id} name={card.nickname} />
          </div>
          <nav className="max-w-[1200px] mx-auto px-5 flex gap-5 text-[13px] font-extrabold overflow-x-auto">
            <a href="#this-week" className="pb-3 border-b-2 border-white whitespace-nowrap">This week</a>
            {rest.length > 0 && <a href="#coming-up" className="pb-3 text-white/75 whitespace-nowrap">Coming up</a>}
            <Link prefetch={false} href={card.href} className="pb-3 text-white/75 whitespace-nowrap">Uniform schedule</Link>
            {stories.length > 0 && <a href="#stories" className="pb-3 text-white/75">Stories</a>}
          </nav>
        </section>

        <section id="this-week" className="max-w-[1200px] mx-auto px-5 pt-6">
          <div className={`${LABEL} border-b-2 border-black pb-2 mb-4`}>This week</div>
          {first ? (
            <div className="flex gap-4 sm:gap-6 items-center">
              <Jersey src={first.img} logo={card.logo} big />
              <div className="min-w-0">
                <div className="text-[12px] font-black tracking-[0.14em] uppercase text-steel">{first.when}</div>
                <div className="font-display font-black text-[22px] sm:text-[30px] leading-tight mt-1">{first.look}</div>
                <div className="text-[16px] mt-1">{first.opp}</div>
                {league === "nfl" && !first.confirmed && <div className="text-[12px] text-steel mt-1">Expected look</div>}
                <Link prefetch={false} href={card.href} className="inline-block mt-3 font-display text-[14px] font-extrabold text-orange">
                  {`Every ${card.nickname} uniform this season →`}
                </Link>
              </div>
            </div>
          ) : (
            <div className="font-display font-black text-[22px]">
              {card.note}{" "}
              <Link prefetch={false} href={card.href} className="text-orange text-[15px]">See the {card.nickname} uniform schedule &rarr;</Link>
            </div>
          )}
        </section>

        {rest.length > 0 && (
          <section id="coming-up" className="max-w-[1200px] mx-auto px-5 pt-8">
            <div className={`${LABEL} border-b-2 border-black pb-2 mb-4`}>Coming up</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rest.map((g) => <GameRow key={g.at} g={g} logo={card.logo} />)}
            </div>
          </section>
        )}

        {/* Jake 11/13: this team's own uniform posts, from The Wire. */}
        <FromTheTeams
          items={newsForTeam(slug, card.name)}
          title={`From The ${card.nickname}`}
          className="max-w-[1200px] mx-auto px-5 pt-8"
        />

        {/* Mediavine in-feed spot (11/6), before the stories. */}
        <div className="max-w-[1200px] mx-auto px-5 pt-6"><MvSlot /></div>

        {stories.length > 0 && (
          <section id="stories" className="max-w-[1200px] mx-auto px-5 pt-8 pb-10">
            <div className={`${LABEL} border-b-2 border-black pb-2 mb-4`}>{card.nickname} stories</div>
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
            <Link prefetch={false} href={`/stories?team=${encodeURIComponent(slug)}`} className="inline-block mt-6 font-display text-[14px] font-extrabold text-orange">
              All {card.nickname} stories &rarr;
            </Link>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
