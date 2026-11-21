import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MvSlot from "@/components/MvSlot";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Fragment } from "react";
import Breadcrumbs from "@/components/browse/Breadcrumbs";
import { FollowButton } from "@/components/home/MyTeams";
import { hubByKey } from "@/lib/teamGroups";
import { teamPagePath } from "@/lib/myTeams";
import { TEAM_LOGO_BY_SLUG } from "@/lib/teamLogos";
import { GameRow, DoneRow, NoBreak, LABEL } from "@/components/rooting/RootingParts";
import { getRootingGuide, logoFor } from "@/lib/rootingGuide/feeds";
import { andList } from "@/lib/rootingGuide/text";
import type { Guide } from "@/lib/rootingGuide/types";
import teamIds from "@/content/data/team-page-ids.json";

// Rooting Guide (approved mockup 11/20, live data since): which other games a
// fan should cheer for this week to help their team's playoff chances. The
// picks come from lib/rootingGuide (ESPN standings, scoreboards and playoff
// rankings, cached about an hour and shared by every page). Static pages,
// re-rendered at most once an hour; nothing here runs per request.

export const revalidate = 3600;
export const dynamicParams = false;

// URL league -> site hub key and My Teams id prefix.
const LEAGUE_KEY: Record<string, string> = { nfl: "nfl", "college-football": "cfb" };

const HOW_WE_PICK: Record<string, (t: string) => string> = {
  nfl: (t) =>
    `We start from the live standings: who holds the seven playoff spots, who is chasing them and who has already beaten whom. Then for every game we ask which result leaves ${t} closer to a spot.`,
  "college-football": (t) =>
    `The playoff field is picked by a committee, so nobody can calculate it exactly. We start from the committee's latest rankings, look at the teams between ${t} and the last spot, and pick the result that clears the most room.`,
};

export function generateStaticParams() {
  return (teamIds as string[])
    .filter((id) => id.startsWith("nfl:") || id.startsWith("cfb:"))
    .map((id) => {
      const [k, team] = id.split(":");
      return { league: k === "cfb" ? "college-football" : "nfl", team };
    });
}

const known = (league: string, team: string) => (teamIds as string[]).includes(`${LEAGUE_KEY[league]}:${team}`);

export async function generateMetadata({ params }: { params: Promise<{ league: string; team: string }> }): Promise<Metadata> {
  const { league, team } = await params;
  if (!known(league, team)) return {};
  const res = await getRootingGuide(league, team);
  const path = `/rooting-guide/${league}/${team}`;
  if (res.kind !== "guide") {
    return {
      title: res.kind === "outside" ? `${res.nickname} Rooting Guide: Not In The Playoff Picture This Week` : "Rooting Guide",
      alternates: { canonical: path },
      robots: { index: false, follow: true },
    };
  }
  const g = res.guide;
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: path },
    openGraph: { title: g.title, description: g.description, url: path, type: "article" },
  };
}

/** "Root for the Chargers, then the Eagles, the Broncos and the Panthers." */
function shortVersion(g: Guide): string | undefined {
  const nfl = g.league === "NFL";
  const picks = g.sections[0]?.games.slice(0, 3).map((x) => (nfl ? `the ${x.root}` : x.root)) ?? [];
  const self = nfl ? `the ${g.nickname}` : g.nickname;
  const Self = self[0].toUpperCase() + self.slice(1);
  const ownOpen = !/^Bye/.test(g.own.matchup) && /Have To Win|Has To Win/.test(g.own.label);
  if (!picks.length) return ownOpen ? `Root for ${self}. Nothing else this week moves the needle much.` : undefined;
  if (/^Bye/.test(g.own.matchup)) return `${Self} ${nfl ? "are" : "is"} off, so root for ${andList(picks)}.`;
  return ownOpen ? `Root for ${self}, then ${andList(picks)}.` : `Root for ${andList(picks)}.`;
}

function Updating({ league, team, line, name }: { league: string; team: string; line?: string; name?: string }) {
  const key = LEAGUE_KEY[league];
  return (
    <>
      <Header />
      <main className="bg-white">
        <article className="max-w-[880px] mx-auto px-4 sm:px-6 pt-10 pb-16">
          <div className={`${LABEL} text-[#0025CC]`}>Rooting Guide</div>
          <h1 className="font-display font-black text-[#0b0b0f] text-[30px] sm:text-[42px] leading-[1.06] mt-2">
            {line ? `${name}: Not In The Playoff Picture This Week` : "The Guide Is Updating"}
          </h1>
          <p className="mt-5 text-[18px] leading-[1.6] text-[#2a2a2a] max-w-[62ch]">
            {line ?? "The guide is updating, check back shortly."}
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6">
            <Link prefetch={false} href={teamPagePath(`${key}:${team}`)} className="inline-flex items-center min-h-[44px] font-display text-[16px] font-extrabold text-orange">
              Team Page →
            </Link>
            <Link prefetch={false} href="/rooting-guide" className="inline-flex items-center min-h-[44px] font-display text-[16px] font-extrabold text-orange">
              Every Rooting Guide →
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

export default async function RootingGuidePage({ params }: { params: Promise<{ league: string; team: string }> }) {
  const { league, team } = await params;
  if (!known(league, team)) notFound();
  const res = await getRootingGuide(league, team);
  if (res.kind === "updating") return <Updating league={league} team={team} />;
  if (res.kind === "outside") return <Updating league={league} team={team} line={res.line} name={res.nickname} />;
  const g = res.guide;
  const key = LEAGUE_KEY[league];
  const hub = hubByKey(key);
  const teamId = `${key}:${team}`;
  const logo = logoFor(g.logoName) ?? TEAM_LOGO_BY_SLUG[team] ?? "";
  const short = shortVersion(g);
  const updated = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });
  const how = HOW_WE_PICK[league](g.theName);

  return (
    <>
      <Header />
      <main className="bg-white">
        {g.faq.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: g.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
              }),
            }}
          />
        )}
        <article className="max-w-[880px] mx-auto px-4 sm:px-6 pt-5 pb-14">
          <Breadcrumbs
            className="text-[12px] font-black tracking-[0.16em] uppercase"
            crumbs={[
              ...(hub ? [{ label: hub.name, short: hub.navLabel, href: hub.path }] : []),
              { label: g.team, short: g.nickname, href: teamPagePath(teamId) },
              { label: "Rooting Guide", href: "/rooting-guide" },
            ]}
          />

          {/* Masthead */}
          <header className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-start gap-3 sm:gap-6">
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={`${g.team} logo`} width={88} height={88} className="w-[64px] h-[64px] sm:w-[88px] sm:h-[88px] object-contain shrink-0 sm:mt-1" />
            )}
            <div className="min-w-0">
              <div className={`${LABEL} text-[#0025CC]`}>
                {g.league} · {g.weekLabel} · Updated {updated}
              </div>
              <h1 className="font-display font-black text-[#0b0b0f] text-[30px] sm:text-[46px] leading-[1.04] tracking-[-0.015em] mt-2">{g.h1}</h1>
            </div>
          </header>

          {/* The answer first, so nobody has to scroll for it */}
          {short && (
            <p className="mt-6 sm:mt-8 border-l-4 border-[#0025CC] pl-4 font-display font-bold text-[22px] sm:text-[28px] leading-[1.25] text-[#0b0b0f]">
              <span className={`block ${LABEL} text-[#0025CC] mb-1.5`}>The Short Version</span>
              {short}
            </p>
          )}

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
          {g.status.tag !== "Eliminated" && (
            <section aria-label={g.own.label} className="mt-10 bg-[#003087] text-white px-5 py-6 sm:px-8 sm:py-7">
              <div className={`${LABEL} text-sky`}>{g.own.label}</div>
              <div className="mt-2 font-display font-black text-[26px] sm:text-[34px] leading-[1.1]"><NoBreak text={g.own.matchup} /></div>
              {g.own.when && <div className="mt-1.5 text-[16px] sm:text-[17px] text-white/80">{g.own.when}</div>}
              <p className="mt-3 text-[17px] sm:text-[18px] leading-[1.55] max-w-[62ch]">{g.own.reason}</p>
            </section>
          )}

          {g.sections.map((s, si) => {
            const quiet = si > 0;
            return (
              <Fragment key={s.title}>
                {/* Mediavine in-content spot between the two weeks, like the team pages. */}
                {si > 0 && <MvSlot className="mt-12" />}
                <section className="mt-12" aria-labelledby={`sec-${si}`}>
                  <div className={quiet ? "border-b border-[#0b0b0f] pb-3" : "border-b-2 border-[#0b0b0f] pb-3"}>
                    <h2 id={`sec-${si}`} className={`font-display font-black leading-tight ${quiet ? "text-[26px] sm:text-[30px] text-[#3d424a]" : "text-[30px] sm:text-[38px] text-[#0b0b0f]"}`}>
                      {s.title}
                    </h2>
                    <p className="mt-1 text-[16px] sm:text-[17px] text-[#5a5f67]">{s.sub}</p>
                  </div>
                  {s.games.length > 0 ? (
                    <ol className="list-none m-0 p-0 [&>li:first-child]:border-t-0">
                      {s.games.map((game) => (
                        <GameRow key={game.id} g={game} quiet={quiet} />
                      ))}
                    </ol>
                  ) : (
                    <p className="mt-5 text-[17px] sm:text-[18px] leading-[1.6] text-[#2a2a2a]">
                      No other game {si === 0 ? "this week" : "next week"} moves the needle much for {g.theName}.
                    </p>
                  )}
                  {s.done && s.done.length > 0 && (
                    <div className="mt-6 space-y-6">
                      {s.done.map((d) => <DoneRow key={d.id} d={d} />)}
                    </div>
                  )}
                  {s.footnote && <p className="mt-6 text-[15px] leading-[1.55] text-[#6b717b]">{s.footnote}</p>}
                </section>
              </Fragment>
            );
          })}

          <section className="mt-16 border-t-2 border-[#0b0b0f] pt-5" aria-labelledby="how-we-pick">
            <h2 id="how-we-pick" className={`${LABEL} text-[#0b0b0f]`}>How We Pick</h2>
            <p className="mt-3 text-[17px] sm:text-[18px] leading-[1.6] text-[#2a2a2a] max-w-[66ch]">{how}</p>
          </section>

          {g.faq.length > 0 && (
            <section className="mt-12 border-t-2 border-[#0b0b0f] pt-5" aria-labelledby="faq">
              <h2 id="faq" className={`${LABEL} text-[#0b0b0f]`}>Questions</h2>
              <div className="mt-4 space-y-6">
                {g.faq.map((f) => (
                  <div key={f.q}>
                    <h3 className="font-display font-black text-[20px] sm:text-[22px] leading-tight text-[#0b0b0f]">{f.q}</h3>
                    <p className="mt-1.5 text-[17px] sm:text-[18px] leading-[1.6] text-[#2a2a2a] max-w-[66ch]">{f.a}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10 bg-[#003087] text-white px-5 py-5 sm:px-8 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {logo && <img src={logo} alt="" width={32} height={32} className="w-[70%] h-[70%] object-contain" />}
              </div>
              <div className="font-display font-black text-[20px] sm:text-[22px] leading-tight">{league === "nfl" ? `Follow The ${g.nickname}` : `Follow ${g.nickname}`}</div>
            </div>
            <FollowButton id={teamId} name={g.nickname} />
          </section>

          <div className="mt-6 flex flex-wrap gap-x-6">
            <Link prefetch={false} href={teamPagePath(teamId)} className="inline-flex items-center min-h-[44px] font-display text-[16px] font-extrabold text-orange">
              {`${g.team} Team Page →`}
            </Link>
            <Link prefetch={false} href="/rooting-guide" className="inline-flex items-center min-h-[44px] font-display text-[16px] font-extrabold text-orange">
              Every Rooting Guide →
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
