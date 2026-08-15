import Link from "next/link";
import { getPostBySlug } from "@/lib/posts";
import { buildAlternatesWatch } from "@/lib/mlbAlternatesWatch";
import { getJotd, getMotd, getWeekdayStandard } from "@/lib/mlbHomepage";
const TRACKER_SLUG = "mlb-uniform-tracker-2026";
// Friday belongs with the weekend, not the work week. Across every day logged in
// 2026 the standard-jersey share runs Mon 66%, Tue 70%, Wed 67%, Thu 62%, then
// Fri 41%, Sat 52%, Sun 57% against a 59% average — Friday is the single biggest
// colour night of the week, lower than either weekend day. Grouping it as a
// weekday put the chart's own break in the wrong place.
const COLOR_DAYS = new Set(["Friday", "Saturday", "Sunday"]);

// The three MLB tools as static side-by-side tiles (Jake picked the static
// 3-across over a rotating strip), color-blocked blue / white / red:
// tracker | calendars | schedule. Deks in Title Case (Jake's call).
type TileTheme = "blue" | "white" | "red";
const TOOLS: { href: string; title: string; dek: string; theme: TileTheme }[] = [
  {
    href: "/stories/mlb-uniform-tracker-2026",
    title: "Daily Uniform Tracker",
    dek: "What Every Team Wore Last Night, Logged Every Morning.",
    theme: "blue",
  },
  {
    href: "/mlb-tracker",
    title: "Team Uniform Calendars",
    dek: "Every Jersey, Team By Team, Laid Out All Season.",
    theme: "white",
  },
  {
    href: "/stories/mlb-uniform-schedule-2026",
    title: "Uniform Schedule",
    dek: "What Each Team Wears And When, For All 30 Teams.",
    theme: "red",
  },
];

const THEMES: Record<
  TileTheme,
  { bg: string; border?: string; title: string; dek: string; cta: string; stamp: string; mlbChip: boolean }
> = {
  blue: { bg: "#003087", title: "#ffffff", dek: "#9FB6D6", cta: "#ffffff", stamp: "#ffffff", mlbChip: true },
  white: { bg: "#ffffff", border: "1px solid #e5e5e5", title: "#003087", dek: "#6B7280", cta: "#003087", stamp: "#003087", mlbChip: false },
  red: { bg: "#C8102E", title: "#ffffff", dek: "rgba(255,255,255,0.82)", cta: "#ffffff", stamp: "#ffffff", mlbChip: true },
};

// ColorWay "Outline Stamp" mark (matches the header logo); color adapts per tile.
function CwStamp({ color = "#fff" }: { color?: string }) {
  return (
    <svg viewBox="0 0 100 100" width="17" height="17" aria-hidden="true">
      <circle cx="50" cy="50" r="37" fill="none" stroke={color} strokeWidth="3.2" />
      <g transform="translate(0,3)">
        <circle cx="40.8" cy="32" r="2.7" fill={color} />
        <rect x="39.6" y="33" width="2.9" height="33" rx="1.4" fill={color} />
        <path d="M42.2,36 L65,40.5 L55,46 L65,51.5 L42.2,54 Z" fill={color} />
      </g>
    </svg>
  );
}

// One grouped MLB zone on a soft-tinted band: the tracker carousel up top,
// then a single "Jersey Stats of the Day" card (Jersey of the Day + ColorWay Clash
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {TOOLS.map((t) => {
            const th = THEMES[t.theme];
            return (
              <Link
                key={t.href}
                href={t.href}
                className="group relative flex flex-col overflow-hidden rounded-xl p-5 transition-transform hover:-translate-y-0.5"
                style={{ background: th.bg, border: th.border }}
              >
                <div className="mb-6 flex items-center gap-2.5">
                  {th.mlbChip ? (
                    <span className="inline-flex items-center rounded-md bg-white px-1.5 py-1">
                      <img src="/logos/mlb.png" alt="MLB" className="h-[15px] w-auto object-contain" />
                    </span>
                  ) : (
                    <img src="/logos/mlb.png" alt="MLB" className="h-[17px] w-auto object-contain" />
                  )}
                  <CwStamp color={th.stamp} />
                </div>
                <p className="text-lg font-bold leading-tight" style={{ color: th.title }}>
                  {t.title}
                </p>
                <p className="mt-1 text-[12px] leading-snug" style={{ color: th.dek }}>
                  {t.dek}
                </p>
                <span
                  className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: th.cta }}
                >
                  Open{" "}
                  <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
                </span>
              </Link>
            );
          })}
        </div>

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

              {/* ColorWay Clash of the Day */}
              {motd && (
                <Link
                  href={href}
                  className="group md:border-l md:border-border md:pl-6 pt-4 md:pt-0 border-t md:border-t-0 border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange">
                      ★ ColorWay Clash of the Day
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
              Teams go traditional Monday through Thursday and break out the color Friday through
              Sunday. Average share of standard white &amp; gray jerseys, across every day logged this
              season.
            </p>

            {/* Gridlines sit behind the bars so a value can be read off the chart
                without relying on the number above each bar. */}
            <div className="relative pl-7">
              <div
                className="pointer-events-none absolute left-7 right-0 top-0"
                style={{ height: 150 }}
                aria-hidden="true"
              >
                {[0, 25, 50, 75, 100].map((v) => (
                  <div key={v} className="absolute left-0 right-0" style={{ bottom: `${v}%` }}>
                    <div
                      className={v === 0 ? "border-t border-[#c9cfd8]" : "border-t border-dashed border-[#e8ebf0]"}
                    />
                    <span
                      style={{ fontFamily: "var(--font-mono, monospace)" }}
                      className="absolute right-full -translate-y-1/2 pr-2 text-[9px] font-semibold text-[#b9bfc9] tabular-nums"
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>

              <div
                className="relative grid grid-cols-7 gap-2 sm:gap-4 items-end"
                style={{ height: 150 }}
              >
                {weekday.map((s) => {
                  const colorDay = COLOR_DAYS.has(s.weekday);
                  return (
                    <div key={s.weekday} className="relative flex h-full items-end">
                      <div
                        className="w-full rounded-t-md transition-all duration-500"
                        style={{ height: `${s.pct}%`, background: colorDay ? "#f59e0b" : "#2f6bed" }}
                        title={`${s.short}: ${s.pct}% standard jerseys`}
                      />
                      <span
                        className="absolute inset-x-0 text-center text-[11px] font-bold text-[#0B1F4A] tabular-nums"
                        style={{ bottom: `calc(${s.pct}% + 5px)` }}
                      >
                        {s.pct}%
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-7 gap-2 sm:gap-4 mt-2">
                {weekday.map((s) => {
                  const colorDay = COLOR_DAYS.has(s.weekday);
                  return (
                    <span
                      key={s.weekday}
                      className={`text-[11px] text-center ${
                        colorDay ? "font-bold text-[#b06a00]" : "font-semibold text-[#8A8F98]"
                      }`}
                    >
                      {s.short}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-5 mt-5 text-[10px] font-semibold uppercase tracking-wider text-[#8A8F98]">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#2f6bed" }} />
                Mon&ndash;Thu
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#f59e0b" }} />
                Fri&ndash;Sun
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
