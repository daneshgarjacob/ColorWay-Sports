import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug } from "@/lib/posts";
import {
  buildMlbTeamIndex,
  uniformUsage,
  gamesByMonth,
  allTeamKeys,
  teamMetaByKey,
} from "@/lib/mlbTrackerTeamIndex";

const TRACKER_SLUG = "mlb-uniform-tracker-2026";

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
  const title = `${meta.name} Uniform Calendar 2026: Every Jersey, Every Game`;
  const description = `A day-by-day visual calendar of every jersey the ${meta.name} have worn in 2026, plus how many times each uniform has been worn at home and on the road.`;
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
            <h1 className="text-white text-[34px] sm:text-[44px] font-extrabold leading-[1.08] mt-3 mb-2">
              {entry.name} Uniform Calendar
            </h1>
            <p className="text-white/80 text-[15px] max-w-[560px] m-0">
              Every jersey the {entry.name} have worn in 2026, day by day. Tap any game to jump
              straight to it in the tracker.
            </p>

            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-7">
              <Stat label="Games logged" value={entry.games.length} />
              <Stat label="At home" value={homeGames} />
              <Stat label="On the road" value={roadGames} />
              <Stat label="Uniforms worn" value={usage.length} />
            </div>
          </div>
        </section>

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
            {/* Uniform usage counts */}
            <section className="max-w-[860px] mx-auto px-5 pt-12">
              <h2 className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-blue-dark mb-1">
                Uniform Usage
              </h2>
              <p className="text-[13px] text-black/45 mt-0 mb-5">
                How often each jersey has come out, and where.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {usage.map((u) => (
                  <div
                    key={u.uniform}
                    className="flex items-center gap-4 border border-black/[0.08] rounded-xl p-3.5 bg-white"
                  >
                    <div className="w-14 h-14 rounded-lg bg-[#f2f3f6] flex items-center justify-center shrink-0 overflow-hidden">
                      {u.img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.img}
                          alt={`${entry.name} ${u.uniform}`}
                          className="max-h-[52px] max-w-full object-contain"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="w-5 h-5 rounded-full border border-black/15"
                          style={{ background: u.color || "#dcdce2" }}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-blue-dark m-0 truncate">{u.uniform}</p>
                      <p className="text-[12px] text-black/50 m-0 mt-0.5">
                        <strong className="text-black/70">{u.total}</strong>{" "}
                        {u.total === 1 ? "game" : "games"} &middot; {u.home} home &middot; {u.road} road
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Visual calendar */}
            <section className="max-w-[860px] mx-auto px-5 pt-12">
              <h2 className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-blue-dark mb-1">
                The Calendar
              </h2>
              <p className="text-[13px] text-black/45 mt-0 mb-5">
                One tile per game. The jersey shown is what they wore that day.
              </p>

              {months.map(({ month, games }) => (
                <div key={month} className="mb-9">
                  <h3 className="text-[15px] font-extrabold text-blue-dark m-0 mb-3">
                    {month}
                    <span className="ml-2 text-[11px] font-semibold text-black/35">
                      {games.length} {games.length === 1 ? "game" : "games"}
                    </span>
                  </h3>

                  <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2.5">
                    {games.map((g, i) => (
                      <Link
                        key={`${g.id}-${i}`}
                        href={`/stories/${TRACKER_SLUG}#${g.id}`}
                        className="group border border-black/[0.08] rounded-xl overflow-hidden bg-white hover:border-black/25 hover:shadow-[0_2px_12px_rgba(10,23,51,0.10)] transition-all"
                      >
                        <div className="flex items-center justify-between px-2 pt-1.5">
                          <span className="text-[10px] font-extrabold text-blue-dark">{g.date}</span>
                          <span
                            className={`text-[8px] font-extrabold uppercase tracking-wider px-1 py-px rounded ${
                              g.home ? "bg-blue-dark text-white" : "bg-black/[0.07] text-black/50"
                            }`}
                          >
                            {g.home ? "H" : "A"}
                          </span>
                        </div>
                        <div className="h-[74px] flex items-center justify-center px-1.5 py-1">
                          {g.img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={g.img}
                              alt={`${entry.name} ${g.uniform || "uniform"} worn ${g.day} ${g.opp}`}
                              className="max-h-[68px] max-w-full object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <span
                              aria-hidden
                              className="w-6 h-6 rounded-full border border-black/15"
                              style={{ background: g.uniformColor || "#e6e6ec" }}
                            />
                          )}
                        </div>
                        <div className="px-2 pb-2">
                          <p className="text-[9.5px] font-bold text-black/55 m-0 truncate leading-tight">
                            {g.home ? "vs" : "at"} {g.oppName}
                          </p>
                          {g.uniform && (
                            <p className="text-[9px] text-black/40 m-0 truncate leading-tight mt-0.5">
                              {g.uniform}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-white text-[30px] font-extrabold leading-none m-0">{value}</p>
      <p className="text-white/65 text-[11px] font-bold uppercase tracking-[0.14em] m-0 mt-1.5">
        {label}
      </p>
    </div>
  );
}
