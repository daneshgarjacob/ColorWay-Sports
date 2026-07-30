import Link from "next/link";
import { getPostBySlug } from "@/lib/posts";
import { buildAlternatesWatch } from "@/lib/mlbAlternatesWatch";

const TRACKER_SLUG = "mlb-uniform-tracker-2026";

// Homepage strip for the MLB jersey tracker: one clean stat — the share of the
// most recent day's jerseys that were alternates — with a route into the tracker.
// Parsed from the tracker post itself, so it refreshes every morning.
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
          <div className="flex items-center gap-4 flex-wrap">
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
            <span className="flex items-center gap-2">
              <img src="/logos/mlb.png" alt="MLB" className="h-6 w-auto object-contain" />
              <h2 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>
                MLB Jersey Tracker
              </h2>
            </span>
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

        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-[44px] font-extrabold leading-none text-blue-dark">{pct}%</span>
          <span className="text-[15px] sm:text-base font-semibold text-black/70 leading-snug">
            of the jerseys worn last night were alternates, City Connects, or throwbacks
          </span>
        </div>
        <p className="text-[12px] font-medium text-black/45 mt-2">
          {data.alternates} of {data.totalUniforms} jerseys worn across {data.games} games · {data.day}
        </p>
      </div>
    </section>
  );
}
