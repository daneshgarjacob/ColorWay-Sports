import Link from "next/link";
import { getPostBySlug } from "@/lib/posts";
import { buildAlternatesWatch } from "@/lib/mlbAlternatesWatch";

const TRACKER_SLUG = "mlb-uniform-tracker-2026";

// Homepage index for the MLB jersey tracker, styled after the NBA Traditional
// Jersey Index: a bordered card with a category breakdown of what the league
// wore last night (standard vs. alternates vs. City Connect/throwback), each a
// progress bar. Parsed from the tracker post, so it refreshes every morning.
export default async function MlbAlternatesWatch() {
  const post = await getPostBySlug(TRACKER_SLUG);
  if (!post) return null;
  const data = buildAlternatesWatch(post.contentHtml);
  if (!data || !data.totalUniforms) return null;

  return (
    <section className="max-w-[1200px] mx-auto px-5 py-6">
      <div className="border border-border rounded-xl p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-1">
          <div className="flex items-center gap-3">
            <span
              style={{ fontFamily: "var(--font-mono, monospace)" }}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange"
            >
              Updated Daily
            </span>
            <span className="flex items-center gap-1.5">
              <img src="/logos/mlb.png" alt="MLB" className="h-[18px] w-auto object-contain" />
              <h2 className="text-[13px] font-bold text-[#0B1F4A] uppercase tracking-widest">
                MLB Jersey Tracker
              </h2>
            </span>
          </div>
          <Link
            href={`/stories/${TRACKER_SLUG}`}
            className="text-[11px] font-semibold text-orange hover:underline uppercase tracking-widest"
          >
            See Every Jersey →
          </Link>
        </div>
        <p className="text-[11px] text-[#8A8F98] mb-5">
          What all 30 teams wore last night · {data.day}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.categories.map((c) => {
            const pct = Math.round((c.count / data.totalUniforms) * 100);
            return (
              <div key={c.label}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-[#0B1F4A]">{c.label}</span>
                  <span className="text-[11px] font-bold text-[#0B1F4A]">
                    {c.count} / {data.totalUniforms}
                    <span className="ml-1.5 text-[10px] text-[#8A8F98] font-normal">({pct}%)</span>
                  </span>
                </div>
                <div className="w-full bg-[#F0F0F4] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: c.color }}
                  />
                </div>
                <p className="text-[10px] text-[#8A8F98] mt-1">
                  {c.count} of {data.totalUniforms} jerseys worn
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
