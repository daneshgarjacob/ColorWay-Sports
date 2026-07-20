import Link from "next/link";
import { getPostBySlug } from "@/lib/posts";
import { buildAlternatesWatch } from "@/lib/mlbAlternatesWatch";

const TRACKER_SLUG = "mlb-uniform-tracker-2026";

// Homepage strip for the MLB jersey tracker: the latest logged day's numbers
// with a route straight into the tracker. Parsed from the tracker post itself,
// so it refreshes every morning with no extra work.
export default async function MlbAlternatesWatch() {
  const post = await getPostBySlug(TRACKER_SLUG);
  if (!post) return null;
  const data = buildAlternatesWatch(post.contentHtml);
  if (!data || !data.totalUniforms) return null;

  const pct = Math.round((data.alternates / data.totalUniforms) * 100);

  return (
    <section style={{ borderBottom: "1px solid #e5e5e5" }} className="bg-white">
      <div className="max-w-[1200px] mx-auto px-5 py-8">
        <div className="flex items-baseline justify-between gap-4 flex-wrap mb-5">
          <div className="flex items-baseline gap-4 flex-wrap">
            <span
              style={{
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#2f6bed",
              }}
            >
              ● Updated Daily
            </span>
            <h2 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>
              MLB Jersey Tracker
            </h2>
          </div>
          <Link
            href={`/stories/${TRACKER_SLUG}`}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#003087",
              textDecoration: "none",
              borderBottom: "1.5px solid #2f6bed",
              paddingBottom: 2,
              whiteSpace: "nowrap",
            }}
            className="hover:text-orange transition-colors shrink-0"
          >
            See Every Jersey →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
          <div className="flex items-center gap-7">
            <div>
              <p className="text-[38px] font-extrabold leading-none m-0 text-blue-dark">
                {data.alternates}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/45 m-0 mt-1.5">
                Alternates
              </p>
            </div>
            <div>
              <p className="text-[38px] font-extrabold leading-none m-0 text-blue-dark">{pct}%</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/45 m-0 mt-1.5">
                Of jerseys worn
              </p>
            </div>
            <div>
              <p className="text-[38px] font-extrabold leading-none m-0 text-blue-dark">
                {data.games}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/45 m-0 mt-1.5">
                Games
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/35 m-0 mb-2">
              {data.day}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.topLooks.map((l) => (
                <span
                  key={l.label}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-black/[0.09] bg-[#fafbfc]"
                >
                  <span
                    aria-hidden
                    className="inline-block w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                    style={{ background: l.color || "#e6e6ec" }}
                  />
                  <span className="text-[12px] font-semibold text-blue-dark">{l.label}</span>
                  {l.count > 1 && (
                    <span className="text-[11px] font-bold text-black/35">×{l.count}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
