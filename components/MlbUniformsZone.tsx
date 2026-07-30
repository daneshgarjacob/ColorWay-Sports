import Link from "next/link";
import { getPostBySlug } from "@/lib/posts";
import { buildAlternatesWatch } from "@/lib/mlbAlternatesWatch";
import { getJotd, getMotd, getWeekdayStandard } from "@/lib/mlbHomepage";
import TrackerCarousel from "./TrackerCarousel";

const TRACKER_SLUG = "mlb-uniform-tracker-2026";
const WEEKEND = new Set(["Saturday", "Sunday"]);

// One grouped MLB zone on a soft-tinted band: the tracker carousel up top,
// then a single "Jersey Stats of the Day" card (Jersey of the Day + Matchup
// of the Day + last night's category mix — all the same day's data), then the
// day-of-week pattern chart. Replaces MlbUniformsHub + MlbFeatureStrip +
// WeekdayStandardIndex so the homepage groups all the MLB tools in one place.
export default async function MlbUniformsZone() {
  const post = await getPostBySlug(TRACKER_SLUG);
  if (!post) return null;

  const data = buildAlternatesWatch(post.contentHtml);
  const jotd = getJotd(post.contentHtml);
  const motd = getMotd(post.contentHtml);
  const weekday = getWeekdayStandard(post.contentHtml);
  const href = `/stories/${TRACKER_SLUG}`;

  return (
    <section className="w-full border-y border-border bg-[#F1F5FD]">
      <div className="max-w-[1200px] mx-auto px-5 py-9 sm:py-11">
        {/* Zone header */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-4">
          <div className="flex items-center gap-3">
            <span
              style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange"
            >
              ● Live Trackers
            </span>
            <span className="flex items-center gap-1.5">
              <img src="/logos/mlb.png" alt="MLB" className="h-[18px] w-auto object-contain" />
              <h2 className="text-[13px] font-bold text-[#0B1F4A] uppercase tracking-widest">
                MLB Uniforms
              </h2>
            </span>
          </div>
          <Link
            href="/mlb-tracker"
            className="text-[11px] font-semibold text-orange hover:underline uppercase tracking-widest"
          >
            All 30 Teams →
          </Link>
        </div>

        <TrackerCarousel />

        {/* Jersey Stats of the Day — all of last night's data in one card */}
        {data && (
          <div className="mt-6 rounded-xl border border-border bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <span className="flex items-center gap-1.5">
                <img src="/logos/mlb.png" alt="MLB" className="h-[16px] w-auto object-contain" />
                <span className="text-[12px] font-bold text-[#0B1F4A] uppercase tracking-[0.12em]">
                  MLB Jersey Stats of the Day
                </span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A8F98]">
                Last Night · {data.day}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Jersey of the Day */}
              {jotd && (
                <Link href={href} className="group flex items-center gap-4">
                  {jotd.image && (
                    <img
                      src={jotd.image}
                      alt=""
                      className="h-[76px] w-auto object-contain flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange">
                      ⚾ Jersey of the Day
                    </span>
                    <p className="mt-1 text-lg font-extrabold text-[#0B1F4A] leading-tight group-hover:text-orange transition-colors">
                      {jotd.title}
                    </p>
                    <span className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8F98] group-hover:text-orange transition-colors">
                      See it on the tracker →
                    </span>
                  </div>
                </Link>
              )}

              {/* Matchup of the Day */}
              {motd && (
                <Link
                  href={href}
                  className="group md:border-l md:border-border md:pl-6 pt-4 md:pt-0 border-t md:border-t-0 border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange">
                      ★ Matchup of the Day
                    </span>
                    {motd.grade && (
                      <span className="text-[11px] font-extrabold text-[#1F6B4E]">
                        {motd.grade} / 10
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-5">
                    {motd.images.map((src, i) => (
                      <img key={i} src={src} alt="" className="h-[70px] w-auto object-contain" />
                    ))}
                  </div>
                  <p className="mt-2 text-center text-[14px] font-bold text-[#0B1F4A] leading-tight group-hover:text-orange transition-colors">
                    {motd.matchup}
                  </p>
                </Link>
              )}

              {/* Last night's category mix */}
              <div className="md:border-l md:border-border md:pl-6 pt-4 md:pt-0 border-t md:border-t-0 border-border">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A8F98]">
                  Last Night's Mix
                </span>
                <div className="mt-3 flex flex-col gap-3">
                  {data.categories.map((c) => {
                    const pct = Math.round((c.count / data.totalUniforms) * 100);
                    return (
                      <div key={c.label}>
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-[11px] font-bold text-[#0B1F4A]">{c.label}</span>
                          <span className="text-[11px] font-bold text-[#0B1F4A]">
                            {c.count}/{data.totalUniforms}
                            <span className="ml-1 text-[10px] text-[#8A8F98] font-normal">
                              ({pct}%)
                            </span>
                          </span>
                        </div>
                        <div className="w-full bg-[#F0F0F4] rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: c.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* The Pattern — standard jerseys by day of week */}
        {weekday.length >= 3 && (
          <div className="mt-6 rounded-xl border border-border bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-1">
              <span
                style={{ fontFamily: "var(--font-mono, monospace)" }}
                className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange"
              >
                The Pattern
              </span>
              <h3 className="text-[13px] font-bold text-[#0B1F4A] uppercase tracking-widest">
                Standard Jerseys By Day Of Week
              </h3>
            </div>
            <p className="text-[11px] text-[#8A8F98] mb-6">
              Teams go traditional on weekdays and break out the color on weekends. Average share of
              standard white &amp; gray jerseys, across every day logged this season.
            </p>

            <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end" style={{ height: 168 }}>
              {weekday.map((s) => {
                const weekend = WEEKEND.has(s.weekday);
                return (
                  <div key={s.weekday} className="flex h-full flex-col items-center justify-end">
                    <span className="text-[11px] font-bold text-[#0B1F4A] mb-1">{s.pct}%</span>
                    <div className="w-full flex items-end" style={{ height: "100%" }}>
                      <div
                        className="w-full rounded-t-md transition-all duration-500"
                        style={{ height: `${s.pct}%`, background: weekend ? "#f59e0b" : "#2f6bed" }}
                      />
                    </div>
                    <span
                      className={`text-[11px] mt-2 ${
                        weekend ? "font-bold text-[#b06a00]" : "font-semibold text-[#8A8F98]"
                      }`}
                    >
                      {s.short}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-5 mt-5 text-[10px] font-semibold uppercase tracking-wider text-[#8A8F98]">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#2f6bed" }} />
                Weekday
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#f59e0b" }} />
                Weekend
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
