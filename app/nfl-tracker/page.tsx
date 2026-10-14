import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";
import { getPostBySlug } from "@/lib/posts";
import { buildNflTeamIndex } from "@/lib/nflTrackerTeamIndex";
import { getNflLatestFromTracker } from "@/lib/nflTeamLatest";

// The /nfl-tracker hub: all 32 clubs by division, each linking to its week-by-week
// uniform calendar, the football counterpart to /mlb-tracker and /nhl-tracker.
// Teams come from lib/nflTrackerTeamIndex.ts (the schedule posts' week grids);
// "games logged" is the same count each team page shows, read off the tracker's
// Final cards via lib/nflTeamLatest.ts.

const TRACKER_SLUG = "nfl-uniform-tracker-2026";

const DIVISIONS: Record<string, string[]> = {
  "AFC East": ["Bills", "Dolphins", "Patriots", "Jets"],
  "AFC North": ["Ravens", "Bengals", "Browns", "Steelers"],
  "AFC South": ["Texans", "Colts", "Jaguars", "Titans"],
  "AFC West": ["Broncos", "Chiefs", "Raiders", "Chargers"],
  "NFC East": ["Cowboys", "Giants", "Eagles", "Commanders"],
  "NFC North": ["Bears", "Lions", "Packers", "Vikings"],
  "NFC South": ["Falcons", "Panthers", "Saints", "Buccaneers"],
  "NFC West": ["Cardinals", "Rams", "49ers", "Seahawks"],
};

export const dynamic = "force-static";

const TITLE = "NFL Uniform Calendars 2026: Every Jersey Every Team Wears, Week by Week";
const DESCRIPTION =
  "A uniform calendar for all 32 NFL teams. See the jersey each club wears in every week of the 2026 season, which looks are officially confirmed, and every game we have logged so far.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/nfl-tracker" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/nfl-tracker", type: "website" },
};

export default async function NflTrackerHub() {
  const all = buildNflTeamIndex();
  const tracker = await getPostBySlug(TRACKER_SLUG);
  const logged = new Map(
    all.map((t) => [t.key, tracker ? (getNflLatestFromTracker(tracker.contentHtml, t.name)?.logged ?? 0) : 0])
  );
  // every game has two clubs, so the team-games total halves to games
  const totalGames = Math.round([...logged.values()].reduce((a, b) => a + b, 0) / 2);
  const confirmed = all.reduce((n, t) => n + t.games.filter((g) => !g.bye && g.confirmed).length, 0);

  return (
    <>
      <Header />
      <main className="pb-20">
        <section className="px-5 pt-12 pb-10 bg-blue-dark">
          <div className="max-w-[980px] mx-auto">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/60 m-0">
              NFL &middot; All 32 Teams &middot; 2026
            </p>
            <h1 className="text-white text-[34px] sm:text-[46px] font-extrabold leading-[1.06] mt-3 mb-3">
              NFL Uniform Calendars
            </h1>
            <p className="text-white/80 text-[16px] max-w-[620px] m-0 leading-relaxed">
              Pick a team to see all 18 weeks of its 2026 season on one calendar, one tile per week, colored by the
              jersey. Confirmed looks are starred, and every game we log on the tracker lands on the calendar.
            </p>
            <div className="flex flex-wrap gap-x-9 gap-y-3 mt-8">
              <Stat label="Teams" value={all.length} />
              <Stat label="Games logged" value={totalGames} />
              <Stat label="Looks confirmed" value={confirmed} />
            </div>
          </div>
        </section>

        <section className="max-w-[980px] mx-auto px-5 pt-11">
          {Object.entries(DIVISIONS).map(([div, nicknames]) => {
            const teams = nicknames
              .map((n) => all.find((t) => t.nickname === n))
              .filter((t): t is NonNullable<typeof t> => Boolean(t));
            if (!teams.length) return null;
            return (
              <div key={div} className="mb-9">
                <h2 className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-black/40 m-0 mb-3">
                  {div}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {teams.map((t) => {
                    const n = logged.get(t.key) ?? 0;
                    return (
                      <Link
                        prefetch={false}
                        key={t.key}
                        href={`/nfl-tracker/${t.key}`}
                        className="group flex items-center gap-3 border border-black/[0.08] rounded-xl px-4 py-3.5 bg-white hover:border-black/25 hover:shadow-[0_2px_12px_rgba(10,23,51,0.08)] transition-all"
                      >
                        <img src={t.logo} alt="" aria-hidden className="w-9 h-9 object-contain shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-bold text-blue-dark leading-tight">{t.name}</span>
                          <span className="block text-[12px] text-black/45 leading-tight mt-0.5">
                            {n ? `${n} game${n === 1 ? "" : "s"} logged` : "No games logged yet"}
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
            );
          })}
        </section>

        <section className="max-w-[980px] mx-auto px-5">
          <div className="border border-black/[0.08] rounded-2xl p-5 bg-[#fafbfc] flex flex-wrap items-center gap-x-7 gap-y-2">
            <Link
              prefetch={false}
              href={`/stories/${TRACKER_SLUG}`}
              className="text-[13px] font-bold text-[#2f6bed] hover:underline"
            >
              The full weekly uniform tracker &rarr;
            </Link>
            <Link
              prefetch={false}
              href="/stories/nfl-uniform-schedule-2026"
              className="text-[13px] font-bold text-[#2f6bed] hover:underline"
            >
              2026 NFL uniform schedule guide &rarr;
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
      <p className="text-white/60 text-[11px] font-bold uppercase tracking-[0.14em] m-0 mt-1.5">{label}</p>
    </div>
  );
}
