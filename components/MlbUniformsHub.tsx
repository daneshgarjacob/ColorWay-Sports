import Link from "next/link";
import { getPostBySlug } from "@/lib/posts";
import { buildAlternatesWatch } from "@/lib/mlbAlternatesWatch";

const TRACKER_SLUG = "mlb-uniform-tracker-2026";

const rows = [
  {
    href: "/stories/mlb-uniform-tracker-2026",
    image: "/images/posts/mlb-daily-tracker/cover-branded.jpg",
    title: "Daily Uniform Tracker",
    dek: "What Every Team Wore Last Night, Logged Every Morning.",
  },
  {
    href: "/mlb-tracker",
    image: "/images/posts/mlb-daily-tracker/calendars-cover.jpg",
    title: "Team Uniform Calendars",
    dek: "Every Jersey, Team By Team, Laid Out All Season.",
  },
  {
    href: "/stories/mlb-uniform-schedule-2026",
    image: "/images/posts/mlb-uniform-schedule-2026-cover.jpg",
    title: "Uniform Schedule",
    dek: "What Each Team Wears And When, For All 30 Teams.",
  },
];

export default async function MlbUniformsHub() {
  const post = await getPostBySlug(TRACKER_SLUG);
  const data = post ? buildAlternatesWatch(post.contentHtml) : null;

  return (
    <section className="max-w-[1200px] mx-auto px-5 py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
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

      <div className="border border-border rounded-xl overflow-hidden bg-white grid grid-cols-1 md:grid-cols-2">
        {/* Left — the three tools */}
        <div className="md:border-r border-border">
          {rows.map((r, i) => (
            <Link
              key={r.href}
              href={r.href}
              className={`group flex items-center gap-4 p-3 sm:p-4 transition-colors hover:bg-[#f8f8fa] ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <img
                src={r.image}
                alt=""
                className="h-[50px] w-[80px] rounded-lg object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-[#0B1F4A] leading-tight transition-colors group-hover:text-orange">
                  {r.title}
                </p>
                <p className="text-[12px] text-[#6B7280] leading-snug truncate">{r.dek}</p>
              </div>
              <span className="shrink-0 pr-1 text-lg font-bold text-orange transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          ))}
        </div>

        {/* Right — last night's breakdown */}
        <div className="border-t md:border-t-0 border-border p-4 sm:p-5 flex flex-col justify-center">
          {data ? (
            <>
              <div className="flex items-center gap-1.5 mb-3 pb-3 border-b border-border">
                <img src="/logos/mlb.png" alt="MLB" className="h-[16px] w-auto object-contain" />
                <span className="text-[12px] font-bold text-[#0B1F4A] uppercase tracking-widest">
                  MLB Jersey Tracker
                </span>
              </div>
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8A8F98]">
                  Last Night
                </span>
                <span className="text-[10px] font-semibold text-[#8A8F98]">{data.day}</span>
              </div>
              <div className="flex flex-col gap-3">
                {data.categories.map((c) => {
                  const pct = Math.round((c.count / data.totalUniforms) * 100);
                  return (
                    <div key={c.label}>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-[11px] font-bold text-[#0B1F4A]">{c.label}</span>
                        <span className="text-[11px] font-bold text-[#0B1F4A]">
                          {c.count}/{data.totalUniforms}
                          <span className="ml-1 text-[10px] text-[#8A8F98] font-normal">({pct}%)</span>
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
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
