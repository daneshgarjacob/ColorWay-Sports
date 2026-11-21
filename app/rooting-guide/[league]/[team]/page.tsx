import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/browse/Breadcrumbs";
import { FollowButton } from "@/components/home/MyTeams";
import { hubByKey } from "@/lib/teamGroups";
import { teamPagePath } from "@/lib/myTeams";
import { GameRow, DoneRow, NoBreak, LABEL, type RootGame, type DoneGame } from "@/components/rooting/RootingParts";
import data from "@/content/data/rooting-guide-mock.json";

// Rooting Guide MOCKUP (11/20): which other games a fan should cheer for this
// week to help their team's playoff chances. Content is hand-written in
// content/data/rooting-guide-mock.json; this page only renders it.

type Section = { title: string; sub: string; games: RootGame[]; done?: DoneGame[]; footnote?: string };
type Guide = {
  team: string;
  nickname: string;
  league: string;
  logo: string;
  weekLabel: string;
  h1: string;
  status: { tag: string; line: string; need: string; facts: { label: string; value: string }[] };
  own: { label: string; matchup: string; when: string; reason: string };
  sections: Section[];
};

const GUIDES = data.guides as unknown as Record<string, Guide>;

// URL league -> site hub key and My Teams id prefix.
const LEAGUE_KEY: Record<string, string> = { nfl: "nfl", "college-football": "cfb" };

const HOW_WE_PICK: Record<string, string> = {
  nfl: "We start from the live standings: who holds the seven playoff spots, who is chasing them and who has already beaten whom. Then for every game we ask which result leaves the Chargers closer to a spot.",
  "college-football": "The playoff field is picked by a committee, so nobody can calculate it exactly. We start from the committee's latest rankings, look at the teams between USC and the last spot, and pick the result that clears the most room.",
};

export function generateStaticParams() {
  return Object.keys(GUIDES).map((k) => {
    const [league, team] = k.split("/");
    return { league, team };
  });
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ league: string; team: string }> }): Promise<Metadata> {
  const { league, team } = await params;
  const g = GUIDES[`${league}/${team}`];
  if (!g) return {};
  return { title: g.h1, robots: { index: false, follow: false } };
}

export default async function RootingGuidePage({ params }: { params: Promise<{ league: string; team: string }> }) {
  const { league, team } = await params;
  const g = GUIDES[`${league}/${team}`];
  if (!g) notFound();
  const key = LEAGUE_KEY[league];
  const hub = key ? hubByKey(key) : undefined;
  const teamId = `${key}:${team}`;

  return (
    <>
      <Header />
      <main className="bg-white">
        <article className="max-w-[880px] mx-auto px-4 sm:px-6 pt-5 pb-14">
          <Breadcrumbs
            className="text-[12px] font-black tracking-[0.16em] uppercase"
            crumbs={[
              ...(hub ? [{ label: hub.name, short: hub.navLabel, href: hub.path }] : []),
              { label: g.team, short: g.nickname, href: teamPagePath(teamId) },
              { label: "Rooting Guide" },
            ]}
          />

          {/* Masthead */}
          <header className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-start gap-3 sm:gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.logo} alt={`${g.team} logo`} width={88} height={88} className="w-[64px] h-[64px] sm:w-[88px] sm:h-[88px] object-contain shrink-0 sm:mt-1" />
            <div className="min-w-0">
              <div className={`${LABEL} text-[#0025CC]`}>
                {g.league} · {g.weekLabel} · Updated {data.updated}
              </div>
              <h1 className="font-display font-black text-[#0b0b0f] text-[30px] sm:text-[46px] leading-[1.04] tracking-[-0.015em] mt-2">{g.h1}</h1>
            </div>
          </header>

          {/* The answer first, so nobody has to scroll for it */}
          <p className="mt-6 sm:mt-8 border-l-4 border-[#0025CC] pl-4 font-display font-bold text-[22px] sm:text-[28px] leading-[1.25] text-[#0b0b0f]">
            <span className={`block ${LABEL} text-[#0025CC] mb-1.5`}>The Short Version</span>
            Root for {g.nickname === "USC" ? "USC" : `the ${g.nickname}`}, then {g.sections[0].games.slice(0, 3).map((x) => x.root).join(", ").replace(/, ([^,]*)$/, " and $1")}.
          </p>

          {/* Where things stand */}
          <section aria-label="Where things stand" className="mt-8 sm:mt-10 border-t-2 border-[#0b0b0f] pt-6">
            <span className={`inline-block rounded-full bg-[#0b0b0f] text-white px-3.5 py-[7px] ${LABEL} leading-none`}>{g.status.tag}</span>
            <p className="mt-4 font-display font-bold text-[21px] sm:text-[25px] leading-[1.3] text-[#0b0b0f]">{g.status.line}</p>
            <p className="mt-3 text-[17px] sm:text-[18px] leading-[1.6] text-[#2a2a2a]">{g.status.need}</p>
            <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 border-y border-border">
              {g.status.facts.map((f, i) => (
                <div
                  key={f.label}
                  className={`py-4 pr-3 border-border ${i % 2 === 1 ? "pl-4 border-l" : "pl-0"} ${i >= 2 ? "border-t sm:border-t-0" : ""} ${i === 2 ? "sm:pl-4 sm:border-l" : ""}`}
                >
                  <dt className={`${LABEL} text-[11px] text-steel`}>{f.label}</dt>
                  <dd className="mt-1.5 font-display font-black text-[22px] sm:text-[26px] leading-tight text-[#0b0b0f]">{f.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* The team's own game */}
          <section aria-label={g.own.label} className="mt-10 bg-[#003087] text-white px-5 py-6 sm:px-8 sm:py-7">
            <div className={`${LABEL} text-sky`}>{g.own.label}</div>
            <div className="mt-2 font-display font-black text-[26px] sm:text-[34px] leading-[1.1]"><NoBreak text={g.own.matchup} /></div>
            <div className="mt-1.5 text-[16px] sm:text-[17px] text-white/80">{g.own.when}</div>
            <p className="mt-3 text-[17px] sm:text-[18px] leading-[1.55] max-w-[62ch]">{g.own.reason}</p>
          </section>

          {g.sections.map((s, si) => {
            const quiet = si > 0;
            return (
              <section key={s.title} className={quiet ? "mt-16" : "mt-12"} aria-labelledby={`sec-${si}`}>
                <div className={quiet ? "border-b border-[#0b0b0f] pb-3" : "border-b-2 border-[#0b0b0f] pb-3"}>
                  <h2 id={`sec-${si}`} className={`font-display font-black leading-tight ${quiet ? "text-[26px] sm:text-[30px] text-[#3d424a]" : "text-[30px] sm:text-[38px] text-[#0b0b0f]"}`}>
                    {s.title}
                  </h2>
                  <p className="mt-1 text-[16px] sm:text-[17px] text-[#5a5f67]">{s.sub}</p>
                </div>
                <ol className="list-none m-0 p-0 [&>li:first-child]:border-t-0">
                  {s.games.map((game) => (
                    <GameRow key={`${game.root}-${game.matchup}`} g={game} quiet={quiet} />
                  ))}
                </ol>
                {s.done && s.done.length > 0 && (
                  <div className="mt-6 space-y-6">
                    {s.done.map((d) => <DoneRow key={d.result} d={d} />)}
                  </div>
                )}
                {s.footnote && <p className="mt-6 text-[15px] leading-[1.55] text-[#6b717b]">{s.footnote}</p>}
              </section>
            );
          })}

          <section className="mt-16 border-t-2 border-[#0b0b0f] pt-5" aria-labelledby="how-we-pick">
            <h2 id="how-we-pick" className={`${LABEL} text-[#0b0b0f]`}>How We Pick</h2>
            <p className="mt-3 text-[17px] sm:text-[18px] leading-[1.6] text-[#2a2a2a] max-w-[66ch]">{HOW_WE_PICK[league]}</p>
          </section>

          <section className="mt-10 bg-[#003087] text-white px-5 py-5 sm:px-8 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.logo} alt="" width={32} height={32} className="w-[70%] h-[70%] object-contain" />
              </div>
              <div className="font-display font-black text-[20px] sm:text-[22px] leading-tight">{league === "nfl" ? `Follow The ${g.nickname}` : `Follow ${g.nickname}`}</div>
            </div>
            <FollowButton id={teamId} name={g.nickname} />
          </section>

          <Link prefetch={false} href={teamPagePath(teamId)} className="inline-flex items-center min-h-[44px] mt-6 font-display text-[16px] font-extrabold text-orange">
            {`${g.team} Team Page →`}
          </Link>
        </article>
      </main>
      <Footer />
    </>
  );
}
