import Link from "next/link";
import { getPostBySlug } from "@/lib/posts";
import { getJotd, getMotd } from "@/lib/mlbHomepage";

const TRACKER_SLUG = "mlb-uniform-tracker-2026";

export default async function MlbFeatureStrip() {
  const post = await getPostBySlug(TRACKER_SLUG);
  if (!post) return null;
  const jotd = getJotd(post.contentHtml);
  const motd = getMotd(post.contentHtml);
  if (!jotd && !motd) return null;

  const href = `/stories/${TRACKER_SLUG}`;

  return (
    <section className="max-w-[1200px] mx-auto px-5 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Jersey of the Day */}
        {jotd && (
          <Link
            href={href}
            className="group border border-border rounded-xl overflow-hidden bg-white hover:-translate-y-0.5 transition-transform"
          >
            <div
              className="p-5 sm:p-6 flex flex-col justify-center min-h-[132px]"
              style={{ background: "linear-gradient(135deg, #002D72 0%, #0a1730 55%, #FF5910 130%)" }}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">
                ⚾ Jersey of the Day
              </span>
              <span className="mt-1.5 text-2xl font-extrabold text-white leading-tight">
                {jotd.title}
              </span>
              <span className="mt-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#FF5910] group-hover:text-white transition-colors">
                See it on the tracker →
              </span>
            </div>
          </Link>
        )}

        {/* Matchup of the Day */}
        {motd && (
          <Link
            href={href}
            className="group border border-border rounded-xl overflow-hidden bg-white hover:-translate-y-0.5 transition-transform"
          >
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange">
                  ★ Matchup of the Day
                </span>
                {motd.grade && (
                  <span className="text-[11px] font-extrabold text-[#1F6B4E]">
                    {motd.grade} / 10
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {motd.images.map((src, i) => (
                  <div
                    key={i}
                    className="flex-1 h-[80px] rounded-lg bg-[#ececf0] flex items-center justify-center p-1.5"
                  >
                    <img src={src} alt="" className="max-h-[70px] max-w-full object-contain" />
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[15px] font-bold text-[#0B1F4A] leading-tight group-hover:text-orange transition-colors">
                {motd.matchup}
              </p>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}
