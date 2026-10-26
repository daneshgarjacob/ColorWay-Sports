import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";
import { buildWinterIndex } from "@/lib/winterTrackerIndex";

// The /nba-tracker hub: all 30 teams by division with how many games each has
// confirmed, the basketball counterpart to /nhl-tracker. Counts come from
// scripts/data/nba-worn-2026-27.json via lib/winterTrackerIndex.ts (read at
// build; no public/ reads, so it is safe on Vercel).

const SITE = "https://www.colorwaysports.com";
const PATH = "/nba-tracker";
const TRACKER_SLUG = "nba-uniform-tracker-2026-27";

// Team key (as used by /nba-tracker/<team>) -> division. The winter index has
// no NBA divisions, so they live here.
const DIVISIONS: { name: string; conference: string; teams: string[] }[] = [
  { name: "Atlantic", conference: "East", teams: ["celtics", "nets", "knicks", "76ers", "raptors"] },
  { name: "Central", conference: "East", teams: ["bulls", "cavaliers", "pistons", "pacers", "bucks"] },
  { name: "Southeast", conference: "East", teams: ["hawks", "hornets", "heat", "magic", "wizards"] },
  { name: "Northwest", conference: "West", teams: ["nuggets", "timberwolves", "thunder", "trail-blazers", "jazz"] },
  { name: "Pacific", conference: "West", teams: ["warriors", "clippers", "lakers", "suns", "kings"] },
  { name: "Southwest", conference: "West", teams: ["mavericks", "rockets", "grizzlies", "pelicans", "spurs"] },
];

export const dynamic = "force-static";

const TITLE = "NBA Uniform Calendars 2026-27: Every Jersey Every Team Wore, Game by Game";
const DESCRIPTION =
  "A uniform calendar for all 30 NBA teams. See the jersey each team wore in every 2026-27 game we have confirmed, plus home and road counts for every edition.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PATH, type: "website" },
};

export default function NbaTrackerHub() {
  const teams = buildWinterIndex().filter((t) => t.league === "nba");
  const byKey = new Map(teams.map((t) => [t.key, t]));
  const confirmed = (t: (typeof teams)[number]) => t.games.filter((g) => g.confirmed).length;
  // every game has two teams, so the team-games total halves to games
  const totalGames = Math.round(teams.reduce((n, t) => n + confirmed(t), 0) / 2);
  const played = teams.filter((t) => confirmed(t) > 0).length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE}${PATH}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: teams.map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `${t.name} 2026-27 uniform calendar`,
        url: `${SITE}${PATH}/${t.key}`,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="pb-20">
        <section className="px-5 pt-12 pb-10 bg-blue-dark">
          <div className="max-w-[980px] mx-auto">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/60 m-0">
              NBA &middot; All 30 Teams &middot; 2026-27
            </p>
            <h1 className="text-white text-[34px] sm:text-[46px] font-extrabold leading-[1.06] mt-3 mb-3">
              NBA Uniform Calendars
            </h1>
            <p className="text-white/80 text-[16px] max-w-[620px] m-0 leading-relaxed">
              Pick a team to see every game of its 2026-27 season on a calendar, the jersey it wore in
              each one we have confirmed, and how many times each edition has come out at home and on the
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
                What every NBA team wore last night
              </span>
            </span>
            <span className="text-[20px] font-bold">&rarr;</span>
          </Link>
        </section>

        <section className="max-w-[980px] mx-auto px-5 pt-10">
          {DIVISIONS.map((div) => (
            <div key={div.name} className="mb-9">
              <h2 className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-black/40 m-0 mb-3">
                {div.name} Division &middot; {div.conference}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {div.teams
                  .map((k) => byKey.get(k))
                  .filter((t): t is (typeof teams)[number] => Boolean(t))
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((t) => {
                    const n = confirmed(t);
                    return (
                      <Link
                        prefetch={false}
                        key={t.key}
                        href={`/nba-tracker/${t.key}`}
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
              href="/stories/nba-uniform-schedule-2026-27"
              className="text-[13px] font-bold text-[#2f6bed] hover:underline"
            >
              2026-27 NBA uniform schedule guide &rarr;
            </Link>
            <Link
              prefetch={false}
              href="/stories/nba-uniforms-2026-27"
              className="text-[13px] font-bold text-[#2f6bed] hover:underline"
            >
              Every NBA uniform for 2026-27 &rarr;
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
