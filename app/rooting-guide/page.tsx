import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MvSlot from "@/components/MvSlot";
import Link from "next/link";
import type { Metadata } from "next";
import { LABEL } from "@/components/rooting/RootingParts";
import { getRootingHub, logoFor } from "@/lib/rootingGuide/feeds";
import { TEAM_LOGO_BY_SLUG } from "@/lib/teamLogos";
import teamIds from "@/content/data/team-page-ids.json";

// The Rooting Guide hub (11/20): every NFL team by division, and the college
// teams in this week's playoff rankings, each with its first three picks.
// Same cached data as the team pages; static, re-rendered at most hourly.

export const revalidate = 3600;

const TITLE = "Rooting Guide: Who To Root For This Week In The NFL And College Football";
const DESCRIPTION =
  "Pick your team and see which other games to root for this week to help its playoff chances, sorted by how much each one matters. Every NFL team and every ranked college football team.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/rooting-guide" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/rooting-guide", type: "website" },
};

const DIVS = ["East", "North", "South", "West"];
const hasPage = (id: string) => (teamIds as string[]).includes(id);

function TeamLine({ href, logo, name, meta, picks }: { href?: string; logo?: string; name: string; meta: string; picks: string[] }) {
  const body = (
    <>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" width={40} height={40} loading="lazy" className="w-10 h-10 object-contain shrink-0" />
      ) : (
        <span className="w-10 h-10 shrink-0" aria-hidden />
      )}
      <span className="min-w-0">
        <span className="block font-display font-black text-[19px] leading-tight text-[#0b0b0f]">{name}</span>
        <span className="block text-[15px] leading-snug text-[#5a5f67]">{meta}</span>
        {picks.length > 0 && <span className="block mt-0.5 text-[15px] leading-snug text-[#2a2a2a]">Root For: {picks.join(", ")}</span>}
      </span>
    </>
  );
  const cls = "flex items-start gap-3 py-3.5 border-t border-border min-h-[44px]";
  return href ? (
    <Link prefetch={false} href={href} className={`${cls} hover:bg-[#f6f7f9]`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default async function RootingGuideHub() {
  const hub = await getRootingHub();
  return (
    <>
      <Header />
      <main className="bg-white">
        <article className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-8 pb-14">
          <div className={`${LABEL} text-[#0025CC]`}>Rooting Guide</div>
          <h1 className="font-display font-black text-[#0b0b0f] text-[32px] sm:text-[46px] leading-[1.04] tracking-[-0.015em] mt-2 max-w-[20ch]">
            Who To Root For This Week
          </h1>
          <p className="mt-4 text-[18px] leading-[1.6] text-[#2a2a2a] max-w-[62ch]">
            Pick your team. We go through every other game this week and tell you which result helps your team&apos;s playoff chances most, in plain English.
          </p>

          <section className="mt-12" aria-labelledby="nfl">
            <div className="border-b-2 border-[#0b0b0f] pb-3">
              <h2 id="nfl" className="font-display font-black text-[30px] sm:text-[38px] leading-tight text-[#0b0b0f]">NFL{hub.nfl ? `, Week ${hub.nfl.week}` : ""}</h2>
            </div>
            {hub.nfl ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                {(["AFC", "NFC"] as const).map((conf) => (
                  <div key={conf}>
                    {DIVS.map((d) => {
                      const div = `${conf} ${d}`;
                      const teams = hub.nfl!.teams.filter((t) => t.div === div);
                      if (!teams.length) return null;
                      return (
                        <div key={div} className="mt-8">
                          <h3 className={`${LABEL} text-[#0b0b0f] pb-2`}>{div}</h3>
                          {teams.map((t) => (
                            <TeamLine
                              key={t.slug}
                              href={`/rooting-guide/nfl/${t.slug}`}
                              logo={TEAM_LOGO_BY_SLUG[t.slug]}
                              name={t.name}
                              meta={`${t.record}${t.tag ? ` · ${t.tag}` : ""}`}
                              picks={t.picks}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-[18px] text-[#2a2a2a]">The guide is updating, check back shortly.</p>
            )}
          </section>

          <MvSlot className="mt-12" />

          <section className="mt-12" aria-labelledby="cfb">
            <div className="border-b-2 border-[#0b0b0f] pb-3">
              <h2 id="cfb" className="font-display font-black text-[30px] sm:text-[38px] leading-tight text-[#0b0b0f]">
                College Football{hub.cfb ? `, Week ${hub.cfb.week}` : ""}
              </h2>
              {hub.cfb && (
                <p className="mt-1 text-[16px] sm:text-[17px] text-[#5a5f67]">
                  {hub.cfb.poll === "cfp" ? "The teams in this week's College Football Playoff rankings." : "The teams in this week's AP Top 25, until the playoff rankings come out."}
                </p>
              )}
            </div>
            {hub.cfb ? (
              <ol className="list-none m-0 p-0 grid grid-cols-1 md:grid-cols-2 gap-x-10">
                {hub.cfb.teams.map((t) => (
                  <li key={t.slug}>
                    <TeamLine
                      href={hasPage(`cfb:${t.slug}`) ? `/rooting-guide/college-football/${t.slug}` : undefined}
                      logo={TEAM_LOGO_BY_SLUG[t.slug] ?? logoFor(t.displayName)}
                      name={`No. ${t.rank} ${t.name}`}
                      meta={`${t.record}${t.tag ? ` · ${t.tag}` : ""}`}
                      picks={t.picks}
                    />
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-5 text-[18px] text-[#2a2a2a]">The guide is updating, check back shortly.</p>
            )}
          </section>

          <section className="mt-14 border-t-2 border-[#0b0b0f] pt-5" aria-labelledby="how">
            <h2 id="how" className={`${LABEL} text-[#0b0b0f]`}>How It Works</h2>
            <p className="mt-3 text-[17px] sm:text-[18px] leading-[1.6] text-[#2a2a2a] max-w-[66ch]">
              NFL picks come from the live standings: who holds the seven playoff spots in each conference, who is chasing them and who has already beaten whom. College picks start from the committee&apos;s rankings and the teams between yours and the last open spot. A committee picks the college field, so those are our best reads, not math. Both update through the week.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
