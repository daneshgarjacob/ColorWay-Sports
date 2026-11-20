import { Fragment } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StoryCard from "@/components/StoryCard";
import FromTheTeams from "@/components/FromTheTeams";
import MvSlot, { slotAfterCard } from "@/components/MvSlot";
import GroupChips from "@/components/browse/GroupChips";
import { getMyTeamCards, teamPagePath, type MyTeamCard } from "@/lib/myTeams";
import { groupCards, leagueStories, ungroupedCards, wireForLeague, coversOf } from "@/lib/browse";
import { groupPath, groupProblems, groupsOf, hubByKey, type HubLeague } from "@/lib/teamGroups";

// League pages (11/19): /nfl, /college-football, /nba, /nhl, /mlb. Divisions
// (or conferences) as chips up top, then Pick Your Team with every club under
// its division, then the league's Wire items and newest stories. Static, like
// the rest of the site: one render an hour.

const LABEL = "font-display text-[12px] font-black tracking-[0.18em] uppercase";

export function leagueMetadata(league: HubLeague): Metadata {
  const hub = hubByKey(league)!;
  const word = hub.groupWord === "Division" ? "Division" : "Conference";
  const title = `${hub.name} Uniforms: Every Team, ${word} And Story`;
  const description = `Pick your ${hub.name} team or ${word.toLowerCase()}: what every club is wearing this week, its full uniform schedule, and every ${hub.name} uniform story and team post, newest first.`;
  return {
    title,
    description,
    alternates: { canonical: hub.path },
    openGraph: { title, description, url: hub.path, type: "website" },
  };
}

function TeamPick({ card }: { card: MyTeamCard }) {
  return (
    <Link
      prefetch={false}
      href={teamPagePath(card.id)}
      className="flex items-center gap-3 min-h-[60px] rounded-xl border border-border bg-white px-3 py-2.5 hover:border-black/30 transition-colors"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={card.logo} alt="" width={34} height={34} loading="lazy" className="w-[34px] h-[34px] object-contain shrink-0" />
      <span className="min-w-0">
        <span className="block text-[15px] font-bold leading-tight text-black">{card.name}</span>
        {card.next && <span className="block text-[13px] text-steel leading-snug mt-0.5 truncate">This week: {card.next.look}</span>}
      </span>
    </Link>
  );
}

export default function LeaguePage({ league }: { league: HubLeague }) {
  const hub = hubByKey(league)!;
  const cards = getMyTeamCards();
  const problems = groupProblems(cards.map((c) => c.id)).filter((p) => p.startsWith(`${league}:`));
  if (problems.length) console.warn(`[browse] ${problems.join("; ")}`);
  const extra = ungroupedCards(league, cards);
  const stories = leagueStories(hub, 12);
  const wire = wireForLeague(hub, coversOf(stories), 8);
  const groupWordPlural = hub.groupWord === "Division" ? "Divisions" : "Conferences";
  const links = [hub.tracker, hub.calendars, hub.records, { label: `All ${hub.name} Stories`, href: `/stories?league=${hub.storiesLeague}` }].filter(
    (l): l is { label: string; href: string } => Boolean(l),
  );

  return (
    <>
      <Header />
      <main className="pb-12">
        <section className="max-w-[1200px] mx-auto px-5 pt-8">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hub.logo} alt="" width={44} height={44} className="w-11 h-11 object-contain shrink-0" />
            <div className="min-w-0">
              <div className="text-[12px] font-black tracking-[0.18em] uppercase text-steel">Teams, {groupWordPlural} And Stories</div>
              <h1 className="font-display font-black text-[30px] sm:text-[42px] leading-[1.05]">{hub.name} Uniforms</h1>
            </div>
          </div>
          <p className="text-[16px] text-[#3c4250] max-w-[680px] mt-3">
            Pick a {hub.groupWord.toLowerCase()} to see what every team in it wears this week, or pick your team for its
            uniform news, jerseys and stories.
          </p>

          <div className="mt-5">
            <GroupChips league={league} />
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-4">
            {links.map((l) => (
              <Link
                prefetch={false}
                key={l.href}
                href={l.href}
                className="inline-flex min-h-[44px] items-center gap-2 font-display text-[14px] font-extrabold text-orange hover:underline"
              >
                {l === hub.tracker && <span aria-hidden="true" className="w-2 h-2 rounded-full bg-[#E11D2E] shadow-[0_0_0_3px_rgba(225,29,46,0.18)]" />}
                {`${l.label} →`}
              </Link>
            ))}
          </div>
        </section>

        <section id="pick-your-team" className="max-w-[1200px] mx-auto px-5 pt-8 scroll-mt-28">
          <h2 className={`${LABEL} text-black border-b-2 border-black pb-2 mb-1`}>Pick Your Team</h2>
          {groupsOf(league).map((grp) => (
            <div key={grp.slug} className="pt-5">
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h3 className="font-display font-black text-[20px] sm:text-[22px] leading-tight m-0 flex items-center gap-2">
                  {grp.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={grp.logo} alt="" width={24} height={24} loading="lazy" className="w-6 h-6 object-contain" />
                  )}
                  {grp.name}
                </h3>
                <Link prefetch={false} href={groupPath(grp)} className="shrink-0 inline-flex min-h-[44px] items-center font-display text-[14px] font-extrabold text-orange hover:underline">
                  This Week&apos;s Looks &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {groupCards(grp, cards).map((c) => (
                  <TeamPick key={c.id} card={c} />
                ))}
              </div>
            </div>
          ))}
          {extra.length > 0 && (
            <div className="pt-5">
              <h3 className="font-display font-black text-[20px] sm:text-[22px] leading-tight m-0 mb-3">More Teams</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {extra.map((c) => (
                  <TeamPick key={c.id} card={c} />
                ))}
              </div>
            </div>
          )}
        </section>

        <FromTheTeams items={wire} title="From The Teams" className="max-w-[1200px] mx-auto px-5 pt-10" />

        <div className="max-w-[1200px] mx-auto px-5 pt-6">
          <MvSlot />
        </div>

        {stories.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-5 pt-8">
            <div className="flex items-baseline justify-between border-b-2 border-black pb-2 mb-5">
              <h2 className={`${LABEL} text-black m-0`}>Newest {hub.name} Stories</h2>
              <Link prefetch={false} href={`/stories?league=${hub.storiesLeague}`} className="font-display text-[13px] font-extrabold text-orange">
                {`All ${hub.name} Stories →`}
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
      </main>
      <Footer />
    </>
  );
}
