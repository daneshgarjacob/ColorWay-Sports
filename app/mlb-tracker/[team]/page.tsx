import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug } from "@/lib/posts";
import TeamUniformBreakdown from "@/components/TeamUniformBreakdown";
import MlbTonightBlock from "@/components/MlbTonightBlock";
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
  const title = `What Are the ${meta.name} Wearing Today? 2026 Uniform Tracker & Calendar`;
  const description = `What are the ${meta.name} wearing today? Tonight's game and expected uniform, plus a day-by-day visual calendar of every jersey the ${meta.name} have worn in 2026, updated every morning.`;
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

  return (
    <>
      <Header />
      <main className="pb-20">
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
              {entry.name} Uniform Calendar
            </h1>
            <p className="text-white/80 text-[15px] max-w-[560px] m-0">
              Every jersey the {entry.name} have worn in 2026, day by day. Tap any game to jump
              straight to it in the tracker.
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
            <section className="max-w-[860px] mx-auto px-5 pt-12">
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
