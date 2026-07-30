import { getPostBySlug } from "@/lib/posts";
import { getWeekdayStandard } from "@/lib/mlbHomepage";

const TRACKER_SLUG = "mlb-uniform-tracker-2026";
const WEEKEND = new Set(["Saturday", "Sunday"]);

export default async function WeekdayStandardIndex() {
  const post = await getPostBySlug(TRACKER_SLUG);
  if (!post) return null;
  const stats = getWeekdayStandard(post.contentHtml);
  if (stats.length < 3) return null;

  return (
    <section className="max-w-[1200px] mx-auto px-5 py-6">
      <div className="border border-border rounded-xl p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-1">
          <div className="flex items-center gap-3">
            <span
              style={{ fontFamily: "var(--font-mono, monospace)" }}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange"
            >
              The Pattern
            </span>
            <h2 className="text-[13px] font-bold text-[#0B1F4A] uppercase tracking-widest">
              Standard Jerseys By Day Of Week
            </h2>
          </div>
        </div>
        <p className="text-[11px] text-[#8A8F98] mb-6">
          Teams go traditional on weekdays and break out the color on weekends. Average share of
          standard white &amp; gray jerseys, across every day logged this season.
        </p>

        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end" style={{ height: 168 }}>
          {stats.map((s) => {
            const weekend = WEEKEND.has(s.weekday);
            return (
              <div key={s.weekday} className="flex h-full flex-col items-center justify-end">
                <span className="text-[11px] font-bold text-[#0B1F4A] mb-1">{s.pct}%</span>
                <div className="w-full flex items-end" style={{ height: "100%" }}>
                  <div
                    className="w-full rounded-t-md transition-all duration-500"
                    style={{
                      height: `${s.pct}%`,
                      background: weekend ? "#f59e0b" : "#2f6bed",
                    }}
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
    </section>
  );
}
