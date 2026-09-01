import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug } from "@/lib/posts";
import TeamUniformBreakdown from "@/components/TeamUniformBreakdown";
import MlbTonightBlock from "@/components/MlbTonightBlock";
import InlineNewsletter from "@/components/InlineNewsletter";
import {
  buildMlbTeamIndex,
  uniformUsage,
  gamesByMonth,
  monthCalendar,
  fanaticsJerseyHref,
  allTeamKeys,
  teamMetaByKey,
} from "@/lib/mlbTrackerTeamIndex";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const TRACKER_SLUG = "mlb-uniform-tracker-2026";

// Today's date in US Eastern, for the visible "Updated" freshness stamp + schema.
// Recomputed on every ISR revalidation (below), so the page always reads current —
// a real freshness signal for "what are they wearing tonight" searches.
function etDate(): { long: string; iso: string } {
  const now = new Date();
  return {
    long: now.toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    iso: now.toLocaleDateString("en-CA", { timeZone: "America/New_York" }),
  };
}

// ISR: regenerate hourly so the "wearing today" block stays current.
export const revalidate = 1800;

export function generateStaticParams() {
  return allTeamKeys().map((team) => ({ team }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ team: string }>;
}): Promise<Metadata> {
  const { team } = await params;
  const meta = teamMetaByKey(team);
  if (!meta) return {};
  // Title + description carry BOTH tenses on purpose: the highest-volume queries
  // split between "what are they wearing today/tonight" and "what did they wear
  // last night/yesterday", and we rank for neither if the page only says "today".
  const title = `What Are the ${meta.name} Wearing Today? Last Night's Jersey & 2026 Uniform Tracker`;
  const description = `What are the ${meta.name} wearing today, and what jersey did they wear last night? Tonight's expected uniform, yesterday's game, and a day-by-day calendar of every uniform the ${meta.name} have worn in 2026. Updated every morning.`;
  return {
    title,
    description,
    alternates: { canonical: `/mlb-tracker/${team}` },
    openGraph: { title, description, url: `/mlb-tracker/${team}`, type: "article" },
  };
}

export default async function TeamTrackerPage({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team } = await params;
  const meta = teamMetaByKey(team);
  if (!meta) notFound();

  const post = await getPostBySlug(TRACKER_SLUG);
  if (!post) notFound();

  const entry = buildMlbTeamIndex(post.contentHtml).find((t) => t.key === team);
  if (!entry) notFound();

  const usage = uniformUsage(entry);
  const months = gamesByMonth(entry);
  const homeGames = entry.games.filter((g) => g.home).length;
  const roadGames = entry.games.length - homeGames;
  const { long: updatedLong, iso: updatedIso } = etDate();

  // games are newest-first, so [0] is the most recently logged game.
  const lastGame = entry.games[0];
  const topUniform = usage[0];

  // Question-shaped FAQ, rendered visibly below AND as FAQPage schema, because
  // schema-only answers get ignored. Every answer is pinned to the real logged
  // date rather than asserting "last night" — the tracker is updated the morning
  // after, so a hard "last night" claim would be wrong until Jake logs the slate.
  const lastWorn = lastGame?.uniform
    ? `the ${lastGame.uniform}`
    : "a uniform we're still confirming";
  const faq: Array<{ q: string; a: string }> = [];
  if (lastGame) {
    faq.push({
      q: `What jersey did the ${entry.name} wear last night?`,
      a: `In the most recent ${entry.name} game we have logged (${lastGame.day}, ${lastGame.opp}), they wore ${lastWorn}. We log every game the morning after it is played, so this updates daily.`,
    });
    faq.push({
      q: `What uniform did the ${entry.name} wear yesterday?`,
      a: `Our latest logged ${entry.name} game is ${lastGame.day} (${lastGame.opp}), when they wore ${lastWorn}. The day-by-day calendar on this page shows every jersey they have worn in 2026.`,
    });
  }
  faq.push({
    q: `What are the ${entry.name} wearing today?`,
    a: `The ${entry.name}${entry.name.endsWith("s") ? "'" : "'s"} next game and expected uniform are at the top of this page, refreshed every morning based on their 2026 rotation, the opponent, and whether they are at home or on the road.`,
  });
  faq.push({
    q: `What are the ${entry.name} wearing tonight?`,
    a: `Tonight's expected ${entry.name} uniform is shown at the top of this page. If they are not playing tonight, we show their next scheduled game instead.`,
  });
  faq.push({
    q: `What are the ${entry.name} wearing tomorrow?`,
    a: `Uniform assignments are usually confirmed the day of the game. For what to expect, the ${entry.name} 2026 uniform schedule breaks down which jersey they wear on which day, at home and on the road.`,
  });
  if (entry.games.length > 0) {
    faq.push({
      q: `How many different uniforms have the ${entry.name} worn in 2026?`,
      a: `The ${entry.name} have worn ${usage.length} different uniform${usage.length === 1 ? "" : "s"} across the ${entry.games.length} game${entry.games.length === 1 ? "" : "s"} we have logged this season${topUniform ? `. Their most-worn look is the ${topUniform.uniform}, in ${topUniform.total} game${topUniform.total === 1 ? "" : "s"}` : ""}.`,
    });
  }

  return (
    <>
      <Header />
      <main className="pb-20">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: `What Are the ${entry.name} Wearing Today?`,
              url: `https://www.colorwaysports.com/mlb-tracker/${team}`,
              dateModified: updatedIso,
              description: `The ${entry.name}${entry.name.endsWith("s") ? "'" : "'s"} uniform for today's game plus a day-by-day calendar of every jersey they have worn in 2026, updated every game.`,
            }),
          }}
        />
        {/* FAQPage schema — the play for "what did the <team> wear last night"
            style searches, which is where People Also Ask and featured snippets
            get served. Mirrors the visible FAQ section further down the page. */}
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
        {/* Team hero */}
        <section
          className="px-5 pt-12 pb-10"
          style={{
            background: `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}dd 100%)`,
          }}
        >
          <div className="max-w-[860px] mx-auto">
            <Link
              href={`/stories/${TRACKER_SLUG}`}
              className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 hover:text-white transition-colors"
            >
              &larr; MLB Daily Uniform Tracker
            </Link>
            {entry.logo && (
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm mt-5 mb-1">
                <img src={entry.logo} alt="" className="w-11 h-11 object-contain" />
              </div>
            )}
            <h1 className="text-white text-[34px] sm:text-[44px] font-extrabold leading-[1.08] mt-3 mb-2">
              What Are the {entry.name} Wearing Today?
            </h1>
            <p className="text-white/80 text-[15px] max-w-[560px] m-0">
              Tonight&rsquo;s expected uniform, what they wore last night, and every jersey the{" "}
              {entry.name} have worn in 2026, day by day.
            </p>
            {/* The direct answer to "what did they wear last night", above the
                fold and labelled with the real date so it stays true. */}
            {lastGame && (
              <p className="text-white text-[14px] mt-3 mb-0">
                <span className="font-bold">Last game</span>
                <span className="text-white/70"> · {lastGame.day} {lastGame.opp} · </span>
                <span className="font-bold">{lastGame.uniform || "uniform to be confirmed"}</span>
              </p>
            )}
            <p className="text-white/70 text-[12px] font-semibold mt-2 mb-0">
              Updated {updatedLong} · refreshed every game
            </p>

            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-7">
              <Stat label="Games logged" value={entry.games.length} href="#usage" />
              <Stat label="At home" value={homeGames} href="#usage-home" />
              <Stat label="On the road" value={roadGames} href="#usage-road" />
              <Stat label="Uniforms worn" value={usage.length} href="#usage" />
            </div>
            <p className="text-white/45 text-[12px] mt-4 mb-0">
              Tap a number to see which jerseys, and on which days.
            </p>
          </div>
        </section>

        <MlbTonightBlock
          teamKey={team}
          teamName={entry.name}
          color={meta.color}
          trackerSlug={TRACKER_SLUG}
          scheduleHref={meta.scheduleHref}
        />

        {/* Quick nav: the two things every team-searcher wants, one tap away */}
        <nav className="max-w-[860px] mx-auto px-5 pt-6 flex gap-3 flex-wrap">
          <a
            href={meta.scheduleHref}
            className="flex-1 min-w-[220px] text-center bg-[#2f6bed] text-white text-[15px] font-bold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            {entry.name}{" "}Uniform Schedule &rarr;
          </a>
          <a
            href="#calendar"
            className="flex-1 min-w-[220px] text-center border-2 border-[#2f6bed] text-[#2f6bed] text-[15px] font-bold px-5 py-3 rounded-xl hover:bg-[#2f6bed]/5 transition-colors"
          >
            Uniform Calendar &darr;
          </a>
        </nav>

        {entry.games.length === 0 ? (
          <section className="max-w-[860px] mx-auto px-5 pt-12">
            <p className="text-[15px] text-black/60">
              We haven&rsquo;t logged a {entry.name} game yet this season. Check the{" "}
              <Link href={`/stories/${TRACKER_SLUG}`} className="text-[#2f6bed] font-semibold hover:underline">
                daily tracker
              </Link>{" "}
              — it updates every morning.
            </p>
          </section>
        ) : (
          <>
            <TeamUniformBreakdown teamName={entry.name} games={entry.games} />

            {/* Affiliate — high buyer intent: they're browsing this club's jerseys */}
            <section className="max-w-[860px] mx-auto px-5 pt-8">
              <div className="border border-black/[0.08] rounded-xl bg-[#f5f7fa] p-4 flex items-center gap-3.5 flex-wrap">
                <span
                  aria-hidden
                  className="w-11 h-11 rounded-[10px] bg-[#e8eefb] flex items-center justify-center shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2f6bed"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </span>
                <span className="flex-1 min-w-[160px]">
                  <span className="block text-[15px] font-bold text-blue-dark leading-tight">
                    Shop {entry.name} jerseys
                  </span>
                  <span className="block text-[13px] text-black/45 leading-tight mt-0.5">
                    Authentic and replica, from Fanatics
                  </span>
                </span>
                <a
                  href={fanaticsJerseyHref(entry.name)}
                  target="_blank"
                  rel="sponsored noopener"
                  data-fanatics-jersey-cta
                  className="ml-auto bg-[#2f6bed] text-white text-[14px] font-bold px-[18px] py-2.5 rounded-lg whitespace-nowrap hover:opacity-90 transition-opacity"
                >
                  Shop now &rarr;
                </a>
              </div>
              <p className="text-[12px] text-black/35 mt-2 mb-0 px-0.5">
                ColorWay Sports may earn a commission on purchases, at no extra cost to you.
              </p>
            </section>

            {/* Visual calendar */}
            <section id="calendar" className="max-w-[860px] mx-auto px-5 pt-12 scroll-mt-24">
              <h2 className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-blue-dark mb-1">
                The Calendar
              </h2>
              <p className="text-[13px] text-black/45 mt-0 mb-5">
                One tile per game. The jersey shown is what they wore that day.
              </p>

              {months.map(({ month, games }) => {
                const { weeks } = monthCalendar(month, games);
                return (
                  <div key={month} className="mb-10">
                    <h3 className="text-[15px] font-extrabold text-blue-dark m-0 mb-3">
                      {month}
                      <span className="ml-2 text-[11px] font-semibold text-black/35">
                        {games.length} {games.length === 1 ? "game" : "games"}
                      </span>
                    </h3>

                    <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1.5">
                      {WEEKDAYS.map((d, i) => (
                        <div
                          key={i}
                          className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-black/30 text-center"
                        >
                          {d}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                      {weeks.flat().map((cell, i) => {
                        if (cell.kind === "blank") {
                          return <div key={i} className="aspect-[3/4]" />;
                        }
                        if (cell.kind === "off") {
                          return (
                            <div
                              key={i}
                              className="aspect-[3/4] rounded-lg bg-black/[0.025] border border-black/[0.04] flex items-start justify-center pt-1"
                            >
                              <span className="text-[9px] sm:text-[10px] font-semibold text-black/20">
                                {cell.date}
                              </span>
                            </div>
                          );
                        }
                        const g = cell.games[0];
                        const extra = cell.games.length - 1;
                        return (
                          <Link
                            key={i}
                            href={`/stories/${TRACKER_SLUG}#${g.id}`}
                            title={`${g.day} — ${g.home ? "vs" : "at"} ${g.oppName}${g.uniform ? ` · ${g.uniform}` : ""}`}
                            className="group aspect-[3/4] rounded-lg border border-black/[0.09] bg-white hover:border-black/30 hover:shadow-[0_2px_10px_rgba(10,23,51,0.10)] transition-all flex flex-col overflow-hidden"
                          >
                            <div className="flex items-center justify-between px-1 pt-0.5 shrink-0">
                              <span className="text-[9px] sm:text-[10px] font-extrabold text-blue-dark leading-none">
                                {cell.date}
                              </span>
                              <span
                                className={`text-[7px] sm:text-[8px] font-extrabold leading-none px-1 py-0.5 rounded ${
                                  g.home ? "bg-blue-dark text-white" : "bg-black/[0.08] text-black/45"
                                }`}
                              >
                                {g.home ? "H" : "A"}
                              </span>
                            </div>
                            <div className="flex-1 flex items-center justify-center px-0.5 min-h-0">
                              {g.img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={g.img}
                                  alt={`${entry.name} ${g.uniform || "uniform"} worn ${g.day} ${g.opp}`}
                                  className="max-h-full max-w-full object-contain"
                                  loading="lazy"
                                />
                              ) : (
                                <span
                                  aria-hidden
                                  className="w-5 h-5 rounded-full border border-black/15"
                                  style={{ background: g.uniformColor || "#e6e6ec" }}
                                />
                              )}
                            </div>
                            <p className="text-[7.5px] sm:text-[8.5px] font-bold text-black/45 m-0 px-1 pb-1 truncate leading-tight shrink-0 text-center">
                              {g.home ? "vs" : "at"} {g.oppName}
                              {extra > 0 ? ` +${extra}` : ""}
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}

        {/* Visible twin of the FAQPage schema above. Google discounts answers
            that exist only in markup, so these have to render for real. */}
        <section className="max-w-[860px] mx-auto px-5 pt-12">
          <h2 className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-blue-dark mb-1">
            {entry.name} Uniform Questions
          </h2>
          <p className="text-[13px] text-black/45 mt-0 mb-4">
            What they wore last night, what they&rsquo;re wearing today, and what to expect next.
          </p>
          <div className="border-t border-black/[0.08]">
            {faq.map((f) => (
              <div key={f.q} className="border-b border-black/[0.08] py-4">
                <h3 className="text-[15px] font-extrabold text-blue-dark m-0 mb-1.5">{f.q}</h3>
                <p className="text-[14px] leading-relaxed text-black/60 m-0">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-[860px] mx-auto px-5">
          <InlineNewsletter />
        </section>

        <section className="max-w-[860px] mx-auto px-5 pt-4">
          <div className="border border-black/[0.08] rounded-2xl p-5 bg-[#fafbfc] flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href={meta.scheduleHref}
              className="text-[13px] font-bold text-[#2f6bed] hover:underline"
            >
              {entry.name} full 2026 uniform schedule &rarr;
            </Link>
            <Link
              href="/mlb-tracker"
              className="text-[13px] font-bold text-[#2f6bed] hover:underline"
            >
              All 30 team calendars &rarr;
            </Link>
            <Link
              href={`/stories/${TRACKER_SLUG}`}
              className="text-[13px] font-bold text-[#2f6bed] hover:underline"
            >
              Back to the daily tracker &rarr;
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const body = (
    <>
      <p className="text-white text-[30px] font-extrabold leading-none m-0">{value}</p>
      <p className="text-white/65 text-[11px] font-bold uppercase tracking-[0.14em] m-0 mt-1.5">
        {label}
      </p>
    </>
  );
  if (!href) return <div>{body}</div>;
  return (
    <a
      href={href}
      className="block rounded-lg -m-1 p-1 hover:bg-white/10 transition-colors"
    >
      {body}
    </a>
  );
}
