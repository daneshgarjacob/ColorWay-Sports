import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";
import { buildWinterIndex } from "@/lib/winterTrackerIndex";

// The /nhl-tracker hub: all 32 clubs by division with how many games each has
// confirmed, the hockey counterpart to /mlb-tracker. Counts come from
// scripts/data/nhl-game-log-2026-27.json via lib/winterTrackerIndex.ts.

const TRACKER_SLUG = "nhl-uniform-tracker-2026-27";
const DIVISIONS = ["Atlantic", "Metropolitan", "Central", "Pacific"];

export const dynamic = "force-static";

const TITLE = "NHL Uniform Calendars 2026-27: Every Sweater Every Team Wore, Game by Game";
const DESCRIPTION =
  "A uniform calendar for all 32 NHL teams. See the sweater each club wore in every 2026-27 game we have confirmed, plus home and road counts for every look.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/nhl-tracker" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/nhl-tracker", type: "website" },
};

export default function NhlTrackerHub() {
  const teams = buildWinterIndex().filter((t) => t.league === "nhl");
  const confirmed = (t: (typeof teams)[number]) => t.games.filter((g) => g.confirmed).length;
  // every game has two clubs, so the team-games total halves to games
  const totalGames = Math.round(teams.reduce((n, t) => n + confirmed(t), 0) / 2);
  const played = teams.filter((t) => confirmed(t) > 0).length;

  return (
    <>
      <Header />
      <main className="pb-20">
        <section className="px-5 pt-12 pb-10 bg-blue-dark">
          <div className="max-w-[980px] mx-auto">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/60 m-0">
              NHL &middot; All 32 Teams &middot; 2026-27
            </p>
            <h1 className="text-white text-[34px] sm:text-[46px] font-extrabold leading-[1.06] mt-3 mb-3">
              NHL Uniform Calendars
            </h1>
            <p className="text-white/80 text-[16px] max-w-[620px] m-0 leading-relaxed">
              Pick a team to see every game of its 2026-27 season on a calendar, the sweater it wore in
              each one we have confirmed, and how many times each look has come out at home and on the
              road.
            </p>
            <div className="flex flex-wrap gap-x-9 gap-y-3 mt-8">
              <Stat label="Teams with games" value={played} />
              <Stat label="Games confirmed" value={totalGames} />
              <Stat label="Updated" value="Daily" />
            </div>
          </div>
        </section>

        <section className="max-w-[980px] mx-auto px-5 pt-8">
          <Link
            prefetch={false}
            href={`/stories/${TRACKER_SLUG}`}
            className="flex items-center justify-between gap-4 rounded-2xl bg-[#2f6bed] text-white px-5 py-4 hover:opacity-90 transition-opacity"
          >
            <span>
              <span className="block text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/70">
                The daily tracker
              </span>
              <span className="block text-[17px] font-extrabold leading-tight mt-0.5">
                What every NHL team wore last night
              </span>
            </span>
            <span className="text-[20px] font-bold">&rarr;</span>
          </Link>
        </section>

        <section className="max-w-[980px] mx-auto px-5 pt-10">
          {DIVISIONS.map((div) => (
            <div key={div} className="mb-9">
              <h2 className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-black/40 m-0 mb-3">
                {div} Division
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {teams
                  .filter((t) => t.division === div)
                  .map((t) => {
                    const n = confirmed(t);
                    return (
                      <Link
                        prefetch={false}
                        key={t.key}
                        href={`/nhl-tracker/${t.key}`}
                        className="group flex items-center gap-3 border border-black/[0.08] rounded-xl px-4 py-3.5 bg-white hover:border-black/25 hover:shadow-[0_2px_12px_rgba(10,23,51,0.08)] transition-all"
                      >
                        <img src={t.logo} alt="" aria-hidden className="w-9 h-9 object-contain shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-bold text-blue-dark leading-tight">
                            {t.name}
                          </span>
                          <span className="block text-[12px] text-black/45 leading-tight mt-0.5">
                            {n ? `${n} game${n === 1 ? "" : "s"} confirmed` : "No games confirmed yet"}
                          </span>
                        </span>
                        <span className="text-[#2f6bed] text-[15px] font-bold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          &rarr;
                        </span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </section>

        <section className="max-w-[980px] mx-auto px-5">
          <div className="border border-black/[0.08] rounded-2xl p-5 bg-[#fafbfc] flex flex-wrap items-center gap-x-7 gap-y-2">
            <Link
              prefetch={false}
              href={`/stories/${TRACKER_SLUG}`}
              className="text-[13px] font-bold text-[#2f6bed] hover:underline"
            >
              The full daily uniform tracker &rarr;
            </Link>
            <Link
              prefetch={false}
              href="/stories/nhl-uniform-schedule-2026-27"
              className="text-[13px] font-bold text-[#2f6bed] hover:underline"
            >
              2026-27 NHL uniform schedule guide &rarr;
            </Link>
            <Link
              prefetch={false}
              href="/stories/new-nhl-jerseys-2026-27"
              className="text-[13px] font-bold text-[#2f6bed] hover:underline"
            >
              New NHL jerseys for 2026-27 &rarr;
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value }: { label: string | number; value: string | number }) {
  return (
    <div>
      <p className="text-white text-[30px] font-extrabold leading-none m-0">{value}</p>
      <p className="text-white/60 text-[11px] font-bold uppercase tracking-[0.14em] m-0 mt-1.5">
        {label}
      </p>
    </div>
  );
}
