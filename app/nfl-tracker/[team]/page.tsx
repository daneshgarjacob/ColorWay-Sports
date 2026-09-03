import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import InlineNewsletter from "@/components/InlineNewsletter";
import {
  allNflTeamKeys,
  nflTeamByKey,
  nflUniformUsage,
  nflGamesByMonth,
  type NflGame,
} from "@/lib/nflTrackerTeamIndex";

// The visual counterpart to a team's uniform schedule post: eighteen weeks laid
// out as a calendar you can read at a glance, colored by the jersey. Same data,
// different job — the post argues, this page answers "which week is which look".

export const dynamic = "force-static";

export function generateStaticParams() {
  return allNflTeamKeys().map((team) => ({ team }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ team: string }>;
}): Promise<Metadata> {
  const { team } = await params;
  const entry = nflTeamByKey(team);
  if (!entry) return {};
  const confirmed = entry.games.filter((g) => g.confirmed).length;
  const title = `${entry.name} 2026 Uniform Calendar: Every Week, Every Jersey`;
  const description = `A week-by-week ${entry.name} uniform calendar for 2026. All 18 weeks, which jersey they wear in each one, ${confirmed} officially confirmed, plus home and road splits.`;
  return {
    title,
    description,
    alternates: { canonical: `/nfl-tracker/${team}` },
    openGraph: { title, description, url: `/nfl-tracker/${team}`, type: "article" },
  };
}

function WeekCard({ game }: { game: NflGame }) {
  const isPale = game.background.toLowerCase().startsWith("#f") || game.background.toLowerCase().startsWith("#e");
  return (
    <div
      className="rounded-xl px-3 py-3 text-center min-h-[104px] flex flex-col justify-center"
      style={{
        background: game.background,
        color: game.textColor,
        border: isPale ? "1px solid #dfe3ea" : "none",
        opacity: game.bye ? 0.55 : 1,
      }}
    >
      <div className="text-[10px] font-bold tracking-[0.1em] opacity-80">WEEK {game.week}</div>
      <div className="text-[14px] font-extrabold my-1 leading-tight">{game.matchup}</div>
      <div className="text-[11px] font-bold uppercase tracking-[0.04em] leading-tight">
        {game.confirmed && <span aria-label="Confirmed">★ </span>}
        {game.uniform}
      </div>
      <div className="text-[10px] font-semibold opacity-70 mt-1.5 leading-tight">
        {game.date ?? game.window}
      </div>
    </div>
  );
}

export default async function NflTeamCalendarPage({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team } = await params;
  const entry = nflTeamByKey(team);
  if (!entry) notFound();

  const usage = nflUniformUsage(entry);
  const months = nflGamesByMonth(entry);
  const played = entry.games.filter((g) => !g.bye);
  const homeGames = played.filter((g) => g.home).length;
  const roadGames = played.length - homeGames;
  const confirmed = played.filter((g) => g.confirmed).length;

  const faq = [
    {
      q: `What uniform are the ${entry.name} wearing this week?`,
      a: `The calendar on this page lists all 18 weeks of the ${entry.name} 2026 season with the jersey for each one. ${confirmed} of ${played.length} games are officially confirmed by the team; the rest follow the standard home and road sets.`,
    },
    {
      q: `How many different uniforms do the ${entry.name} wear in 2026?`,
      a: `${usage.length} across the season: ${usage.map((u) => `${u.uniform} (${u.total} game${u.total === 1 ? "" : "s"})`).join(", ")}.`,
    },
    {
      q: `Which ${entry.name} games have a confirmed uniform?`,
      a: played.filter((g) => g.confirmed).length
        ? played
            .filter((g) => g.confirmed)
            .map((g) => `Week ${g.week} ${g.matchup} in the ${g.uniform}`)
            .join("; ") + "."
        : `The ${entry.name} have not announced any special uniform dates for 2026 yet. This page updates as they do.`,
    },
    {
      q: `Do the ${entry.name} wear the same uniform at home and on the road?`,
      a: `No. Across 2026 the ${entry.name} have ${homeGames} home game${homeGames === 1 ? "" : "s"} and ${roadGames} road game${roadGames === 1 ? "" : "s"}, and the calendar shows which jersey goes with each.`,
    },
  ];

  return (
    <>
      <Header />
      <main className="pb-20">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />

        <section
          className="px-5 pt-12 pb-10"
          style={{ background: `linear-gradient(135deg, ${entry.color} 0%, ${entry.color}dd 100%)` }}
        >
          <div className="max-w-[980px] mx-auto">
            <Link prefetch={false}
              href="/stories/nfl-uniform-schedule-2026"
              className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 hover:text-white transition-colors"
            >
              &larr; NFL Uniform Schedules
            </Link>
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm mt-5 mb-1">
              <img src={entry.logo} alt="" className="w-11 h-11 object-contain" />
            </div>
            <h1 className="text-white text-[34px] sm:text-[44px] font-extrabold leading-[1.08] mt-3 mb-2">
              {entry.name} 2026 Uniform Calendar
            </h1>
            <p className="text-white/80 text-[15px] max-w-[620px] m-0">
              All 18 weeks laid out, colored by the jersey they wear. A star means the{" "}
              {entry.nickname} have confirmed it.
            </p>

            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-7">
              {[
                ["Uniforms", usage.length],
                ["Confirmed games", confirmed],
                ["At home", homeGames],
                ["On the road", roadGames],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <div className="text-white text-[26px] font-extrabold leading-none">{value}</div>
                  <div className="text-white/60 text-[11px] font-bold uppercase tracking-[0.12em] mt-1">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <nav className="max-w-[980px] mx-auto px-5 pt-6 flex gap-3 flex-wrap">
          <a
            href={`/stories/${entry.scheduleSlug}`}
            className="flex-1 min-w-[220px] text-center bg-[#2f6bed] text-white text-[15px] font-bold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            {entry.nickname}{" "}Uniform Schedule &rarr;
          </a>
          <a
            href="#calendar"
            className="flex-1 min-w-[220px] text-center border-2 border-[#2f6bed] text-[#2f6bed] text-[15px] font-bold px-5 py-3 rounded-xl hover:bg-[#2f6bed]/5 transition-colors"
          >
            Jump to the Calendar &darr;
          </a>
        </nav>

        <section id="calendar" className="max-w-[980px] mx-auto px-5 pt-12 scroll-mt-28">
          <h2 className="text-[26px] font-extrabold text-blue-dark mb-1">
            The {entry.nickname} Uniform Calendar, Month by Month
          </h2>
          <p className="text-[14px] text-gray-medium mb-7">
            Weeks without a confirmed announcement show the standard set for that venue. Dates are
            the league week window unless the club has named a kickoff.
          </p>

          {months.map(({ month, games }) => (
            <div key={month} className="mb-8">
              <h3 className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#5b6474] mb-3">
                {month}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {games.map((g) => (
                  <WeekCard key={g.week} game={g} />
                ))}
              </div>
            </div>
          ))}
        </section>

        <section id="usage" className="max-w-[980px] mx-auto px-5 pt-6 scroll-mt-28">
          <h2 className="text-[26px] font-extrabold text-blue-dark mb-5">
            Every {entry.nickname} Uniform in 2026
          </h2>
          <div className="flex flex-col gap-2.5">
            {usage.map((u) => (
              <div
                key={u.uniform}
                className="flex items-center gap-4 rounded-xl border border-black/[0.08] bg-white px-4 py-3"
              >
                <span
                  aria-hidden
                  className="w-10 h-10 rounded-lg flex-shrink-0 border border-black/10"
                  style={{ background: u.background }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-blue-dark leading-tight">
                    {u.uniform}
                  </span>
                  <span className="block text-[12px] text-gray-medium mt-0.5">
                    {u.confirmed} of {u.total} officially confirmed
                  </span>
                </span>
                <span className="text-[22px] font-extrabold text-blue-dark leading-none">
                  {u.total}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="max-w-[980px] mx-auto px-5 pt-10">
          <InlineNewsletter />
        </div>

        <section className="max-w-[980px] mx-auto px-5 pt-10">
          <h2 className="text-[26px] font-extrabold text-blue-dark mb-5">
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col gap-4">
            {faq.map((f) => (
              <div key={f.q}>
                <h3 className="text-[16px] font-bold text-blue-dark mb-1.5">{f.q}</h3>
                <p className="text-[15px] text-black/70 leading-relaxed m-0">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-[980px] mx-auto px-5 pt-10">
          <p className="text-[14px] text-black/60 m-0">
            For the full breakdown of why each jersey lands where it does, read the{" "}
            <Link prefetch={false}
              href={`/stories/${entry.scheduleSlug}`}
              className="text-[#2f6bed] font-semibold hover:underline"
            >
              {entry.name} 2026 uniform schedule
            </Link>
            . Every other club is in the{" "}
            <Link prefetch={false}
              href="/stories/nfl-uniform-schedule-2026"
              className="text-[#2f6bed] font-semibold hover:underline"
            >
              league-wide NFL uniform schedule
            </Link>
            .
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
