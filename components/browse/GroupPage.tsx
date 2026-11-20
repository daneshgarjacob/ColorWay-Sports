import { Fragment } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StoryCard from "@/components/StoryCard";
import FromTheTeams from "@/components/FromTheTeams";
import MvSlot, { slotAfterCard } from "@/components/MvSlot";
import GroupChips from "@/components/browse/GroupChips";
import Breadcrumbs from "@/components/browse/Breadcrumbs";
import TeamLookTile from "@/components/browse/TeamLookTile";
import { getMyTeamCards } from "@/lib/myTeams";
import { coversOf, groupCards, groupStories, wireForCards } from "@/lib/browse";
import { findGroup, groupPath, groupTitle, groupsOf, hubByKey, type HubLeague } from "@/lib/teamGroups";

// Division and conference pages (11/19): /nfl/afc-west, /college-football/big-ten,
// /nba/atlantic. Every club in the group side by side with this week's look
// (each tile opens that club's uniform schedule post), then the group's team
// posts from The Wire and its newest stories. Static, re-rendered hourly like
// the team pages, so looks confirmed during the day show up within the hour.

const LABEL = "font-display text-[12px] font-black tracking-[0.18em] uppercase";

export function groupStaticParams(league: HubLeague) {
  return groupsOf(league).map((x) => ({ group: x.slug }));
}

export function groupMetadata(league: HubLeague, slug: string): Metadata {
  const grp = findGroup(league, slug);
  if (!grp) return {};
  const name = groupTitle(grp);
  const title = `${name} Uniforms: This Week's Jerseys, News And Stories`;
  const description = `What every ${name} team is wearing this week, side by side, with each club's full uniform schedule, plus every ${name} uniform story and team post from ColorWay Sports, newest first.`;
  const url = groupPath(grp);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
  };
}

export default function GroupPage({ league, slug }: { league: HubLeague; slug: string }) {
  const grp = findGroup(league, slug)!;
  const hub = hubByKey(league)!;
  const cards = groupCards(grp, getMyTeamCards());
  const stories = groupStories(grp, 12);
  const wire = wireForCards(cards, coversOf(stories), 8);
  const name = groupTitle(grp);
  const inSeason = cards.some((c) => c.next);
  const count = cards.length;
  // Four or five clubs fit one row; big conferences use smaller tiles so the
  // whole league is a scroll or two, not five screens.
  const cols = count <= 4 ? "lg:grid-cols-4" : count === 5 ? "lg:grid-cols-5" : count <= 8 ? "lg:grid-cols-4" : "lg:grid-cols-5 xl:grid-cols-6";
  const allStoriesHref = grp.storyTag ? `/stories?team=${grp.storyTag}` : `/stories?league=${hub.storiesLeague}&group=${grp.slug}`;

  return (
    <>
      <Header />
      <main className="pb-12">
        <section className="max-w-[1200px] mx-auto px-5 pt-6">
          <Breadcrumbs
            className="text-[14px]"
            crumbs={[
              { label: hub.name, short: hub.navLabel, href: hub.path },
              { label: grp.name },
            ]}
          />
          <div className="flex items-center gap-3 mt-3">
            {grp.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={grp.logo} alt="" width={48} height={48} className="w-12 h-12 object-contain shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-[12px] font-black tracking-[0.18em] uppercase text-steel">
                {grp.parent ? `${hub.name} · ${grp.parent}` : hub.name} · {count} {league === "cfb" ? "Schools" : "Teams"}
              </div>
              <h1 className="font-display font-black text-[30px] sm:text-[42px] leading-[1.05]">{name} Uniforms</h1>
            </div>
          </div>
          <p className="text-[16px] text-[#3c4250] max-w-[680px] mt-3">
            {inSeason
              ? `What every ${name} team is wearing this week, side by side. Tap a team for its full uniform schedule.`
              : `Every ${name} team's 2026 uniform schedule, and every story we have on them. Back in spring with this week's looks.`}
          </p>
        </section>

        <section className="max-w-[1200px] mx-auto px-5 pt-7" aria-labelledby="this-week">
          <h2 id="this-week" className={`${LABEL} text-black border-b-2 border-black pb-2 mb-4`}>
            {inSeason ? "This Week's Looks" : "The Teams"}
          </h2>
          <div className={`grid grid-cols-2 sm:grid-cols-3 ${cols} gap-3 sm:gap-4`}>
            {cards.map((c, i) => (
              <TeamLookTile key={c.id} card={c} index={i} />
            ))}
          </div>
        </section>

        <FromTheTeams items={wire} title={`From The ${grp.name}`} className="max-w-[1200px] mx-auto px-5 pt-10" />

        <div className="max-w-[1200px] mx-auto px-5 pt-6">
          <MvSlot />
        </div>

        {stories.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-5 pt-8">
            <div className="flex items-baseline justify-between gap-3 border-b-2 border-black pb-2 mb-5">
              <h2 className={`${LABEL} text-black m-0`}>{grp.name} Stories</h2>
              <Link prefetch={false} href={allStoriesHref} className="shrink-0 font-display text-[13px] font-extrabold text-orange">
                All &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((post, i) => (
                <Fragment key={post.slug}>
                  <StoryCard {...post} showDate compact />
                  {slotAfterCard(i, stories.length)}
                </Fragment>
              ))}
            </div>
          </section>
        )}

        <section className="max-w-[1200px] mx-auto px-5 pt-12">
          <h2 className={`${LABEL} text-black border-b-2 border-black pb-2 mb-4`}>
            Every {hub.name} {hub.groupWord}
          </h2>
          <GroupChips league={league} current={grp.slug} />
        </section>
      </main>
      <Footer />
    </>
  );
}
