import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";
import { getPostBySlug } from "@/lib/posts";
import { buildMlbTeamIndex } from "@/lib/mlbTrackerTeamIndex";

const TRACKER_SLUG = "mlb-uniform-tracker-2026";
const DIVISIONS = ["AL East", "AL Central", "AL West", "NL East", "NL Central", "NL West"];

export const metadata: Metadata = {
  title: "MLB Uniform Calendars 2026: Every Jersey Every Team Wore, Day by Day",
  description:
    "A visual uniform calendar for all 30 MLB teams. See the jersey each club wore every single day of the 2026 season, plus how many times each uniform has been worn at home and on the road.",
  alternates: { canonical: "/mlb-tracker" },
  openGraph: {
    title: "MLB Uniform Calendars 2026: Every Jersey Every Team Wore, Day by Day",
    description:
      "A visual uniform calendar for all 30 MLB teams — the jersey worn each day, plus home and road usage counts.",
    url: "/mlb-tracker",
    type: "website",
  },
};

export default async function MlbTrackerHub() {
  const post = await getPostBySlug(TRACKER_SLUG);
  const teams = post ? buildMlbTeamIndex(post.contentHtml) : [];
  const totalGames = teams.reduce((n, t) => n + t.games.length, 0);
  const logged = teams.filter((t) => t.games.length > 0).length;

  return (
    <>
      <Header />
      <main className="pb-20">
        <section className="px-5 pt-12 pb-10 bg-blue-dark">
          <div className="max-w-[980px] mx-auto">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/60 m-0">
              MLB &middot; All 30 Teams &middot; 2026
            </p>
            <h1 className="text-white text-[34px] sm:text-[46px] font-extrabold leading-[1.06] mt-3 mb-3">
              MLB Uniform Calendars
            </h1>
            <p className="text-white/80 text-[16px] max-w-[620px] m-0 leading-relaxed">
              Pick a team to see every jersey they have worn in 2026 laid out on a calendar, one
              tile per game, plus how many times each uniform has come out at home and on the road.
            </p>
            <div className="flex flex-wrap gap-x-9 gap-y-3 mt-8">
              <Stat label="Teams tracked" value={logged} />
              <Stat label="Games logged" value={totalGames} />
              <Stat label="Updated" value="Daily" />
            </div>
          </div>
        </section>

        <section className="max-w-[980px] mx-auto px-5 pt-11">
          {DIVISIONS.map((div) => (
            <div key={div} className="mb-9">
              <h2 className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-black/40 m-0 mb-3">
                {div}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {teams
                  .filter((t) => t.division === div)
                  .map((t) => (
                    <Link
                      key={t.key}
                      href={`/mlb-tracker/${t.key}`}
                      className="group flex items-center gap-3 border border-black/[0.08] rounded-xl px-4 py-3.5 bg-white hover:border-black/25 hover:shadow-[0_2px_12px_rgba(10,23,51,0.08)] transition-all"
                    >
                      {t.logo ? (
                        <img
                          src={t.logo}
                          alt=""
                          aria-hidden
                          className="w-9 h-9 object-contain shrink-0"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="w-2.5 h-9 rounded-full shrink-0"
                          style={{ background: t.color }}
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-bold text-blue-dark leading-tight">
                          {t.name}
                        </span>
                        <span className="block text-[12px] text-black/45 leading-tight mt-0.5">
                          {t.games.length
                            ? `${t.games.length} game${t.games.length === 1 ? "" : "s"} logged`
                            : "No games logged yet"}
                        </span>
                      </span>
                      <span className="text-[#2f6bed] text-[15px] font-bold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        &rarr;
                      </span>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </section>

        <section className="max-w-[980px] mx-auto px-5">
          <div className="border border-black/[0.08] rounded-2xl p-5 bg-[#fafbfc] flex flex-wrap items-center gap-x-7 gap-y-2">
            <Link
              href={`/stories/${TRACKER_SLUG}`}
              className="text-[13px] font-bold text-[#2f6bed] hover:underline"
            >
              The full daily uniform tracker &rarr;
            </Link>
            <Link
              href="/stories/mlb-uniform-schedule-2026"
              className="text-[13px] font-bold text-[#2f6bed] hover:underline"
            >
              2026 MLB uniform schedule guide &rarr;
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
