import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import InlineNewsletter from "@/components/InlineNewsletter";
import {
  winterTeamByKey,
  winterGamesByMonth,
  winterUniformUsage,
  shortDate,
  type WinterGame,
} from "@/lib/winterTrackerIndex";

// Shared body for /nba-tracker/<team> and /nhl-tracker/<team>. The two routes are
// separate so the URLs read properly; everything below is one implementation.

function GameCard({ game, accent }: { game: WinterGame; accent: string }) {
  const logged = Boolean(game.uniform);
  return (
    <div
      className="rounded-xl px-3 py-3 text-center min-h-[96px] flex flex-col justify-center border"
      style={{
        background: logged ? accent : "#f7f9fc",
        color: logged ? "#ffffff" : "#333",
        borderColor: logged ? accent : "#e3e7ec",
      }}
    >
      <div className="text-[10px] font-bold tracking-[0.08em] opacity-75">
        {shortDate(game.date)}
      </div>
      <div className="text-[13px] font-extrabold my-1 leading-tight">
        <span className="opacity-70">{game.home ? "vs" : "at"} </span>
        {game.opponentAbbr || game.opponent}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-[0.04em] leading-tight opacity-80">
        {game.uniform ?? "Not yet logged"}
      </div>
    </div>
  );
}

export default function WinterCalendarPage({
  league,
  teamKey,
}: {
  league: "nba" | "nhl";
  teamKey: string;
}) {
  const entry = winterTeamByKey(league, teamKey)!;
  const months = winterGamesByMonth(entry);
  const usage = winterUniformUsage(entry);
  const home = entry.games.filter((g) => g.home).length;
  const road = entry.games.length - home;
  const logged = entry.games.filter((g) => g.uniform).length;
  const isNba = league === "nba";
  const garment = isNba ? "jersey" : "sweater";
  const first = entry.games[0];
  const last = entry.games[entry.games.length - 1];

  // The NBA publishes 80 of 82; the last two are set by NBA Cup group results.
  const nbaCupNote = isNba
    ? " The NBA publishes dated opponents for 80 of each club's 82 games. The remaining two are scheduled between December 4 and 10 once Emirates NBA Cup group play decides them, and they are added here when the league sets them."
    : "";

  const faq = [
    {
      q: `What ${garment} are the ${entry.name} wearing tonight?`,
      a: `Every ${entry.name} game this season is on the calendar above, and we log the ${garment} against each date the morning after it is played. ${logged} of ${entry.games.length} are logged so far.`,
    },
    {
      q: `How many games do the ${entry.name} play in 2026-27?`,
      a: `${entry.games.length} on the published schedule: ${home} at home and ${road} on the road, opening ${shortDate(first.date)} and closing ${shortDate(last.date)}.${nbaCupNote}`,
    },
    {
      q: `Where can I see every ${garment} the ${entry.name} have worn this season?`,
      a: `Right here. This page is the ${entry.name} uniform record for 2026-27, game by game. For which ${garment} is meant for which occasion, the ${entry.nickname} uniform schedule breaks the closet down.`,
    },
    {
      q: `When do the ${entry.name} open the 2026-27 season?`,
      a: `${shortDate(first.date)}, ${first.home ? "at home against" : "on the road against"} the ${first.opponent}.`,
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
              href={`/stories/${league}-uniform-schedule-2026-27`}
              className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 hover:text-white transition-colors"
            >
              &larr; {league.toUpperCase()} Uniform Schedules
            </Link>
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm mt-5 mb-1">
              <img src={entry.logo} alt="" className="w-11 h-11 object-contain" />
            </div>
            <h1 className="text-white text-[34px] sm:text-[44px] font-extrabold leading-[1.08] mt-3 mb-2">
              {entry.name} 2026-27 Uniform Calendar
            </h1>
            <p className="text-white/80 text-[15px] max-w-[620px] m-0">
              Every game on the schedule, and the {garment} they wore in it. We log each one the
              morning after it is played.
            </p>

            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-7">
              {[
                ["Games", entry.games.length],
                ["Logged", logged],
                ["At home", home],
                ["On the road", road],
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

        {logged === 0 && (
          <section className="max-w-[980px] mx-auto px-5 pt-8">
            <div className="rounded-xl border border-black/[0.08] bg-[#f7f9fc] px-5 py-4">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#5b6474] m-0 mb-1.5">
                Filling in from {shortDate(first.date)}
              </p>
              <p className="text-[14px] text-black/70 leading-relaxed m-0">
                The season has not started, so no {garment} is logged yet. The full fixture list is
                below and every date gets its jersey the morning after the game.{nbaCupNote}
              </p>
            </div>
          </section>
        )}

        <section id="calendar" className="max-w-[980px] mx-auto px-5 pt-10 scroll-mt-28">
          <h2 className="text-[26px] font-extrabold text-blue-dark mb-1">
            The {entry.nickname} Calendar, Month by Month
          </h2>
          <p className="text-[14px] text-gray-medium mb-7">
            {entry.games.length} games, {home} at home and {road} on the road.
          </p>

          {months.map(({ month, games }) => (
            <div key={month} className="mb-8">
              <h3 className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#5b6474] mb-3">
                {month}
                <span className="ml-2 font-bold text-[#9aa0ac] tracking-normal normal-case">
                  {games.length} game{games.length === 1 ? "" : "s"}
                </span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {games.map((g) => (
                  <GameCard key={g.date + g.opponentAbbr} game={g} accent={entry.color} />
                ))}
              </div>
            </div>
          ))}
        </section>

        {usage.length > 0 && (
          <section className="max-w-[980px] mx-auto px-5 pt-6">
            <h2 className="text-[26px] font-extrabold text-blue-dark mb-5">
              Every {entry.nickname} Uniform So Far
            </h2>
            <div className="flex flex-col gap-2.5">
              {usage.map((u) => (
                <div
                  key={u.uniform}
                  className="flex items-center gap-4 rounded-xl border border-black/[0.08] bg-white px-4 py-3"
                >
                  <span className="text-[15px] font-bold text-blue-dark flex-1">{u.uniform}</span>
                  <span className="text-[22px] font-extrabold text-blue-dark leading-none">
                    {u.total}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

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
            For what each {garment} is for, read the{" "}
            <Link prefetch={false}
              href={`/stories/${entry.scheduleSlug}`}
              className="text-[#2f6bed] font-semibold hover:underline"
            >
              {entry.name} 2026-27 uniform schedule
            </Link>
            . Every other club is in the{" "}
            <Link prefetch={false}
              href={`/stories/${league}-uniform-schedule-2026-27`}
              className="text-[#2f6bed] font-semibold hover:underline"
            >
              league-wide {league.toUpperCase()} uniform schedule
            </Link>
            .
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
