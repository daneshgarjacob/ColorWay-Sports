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
            <div className="p-4 sm:p-5 flex items-center gap-4">
              {jotd.image && (
                <img
                  src={jotd.image}
                  alt=""
                  className="h-[84px] w-auto object-contain flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange">
                  ⚾ Jersey of the Day
                </span>
                <p className="mt-1 text-xl font-extrabold text-[#0B1F4A] leading-tight group-hover:text-orange transition-colors">
                  {jotd.title}
                </p>
                <span className="mt-2 inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A8F98] group-hover:text-orange transition-colors">
                  See it on the tracker →
                </span>
              </div>
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
              <div className="flex items-center justify-center gap-6">
                {motd.images.map((src, i) => (
                  <img key={i} src={src} alt="" className="h-[84px] w-auto object-contain" />
                ))}
              </div>
              <p className="mt-2 text-center text-[15px] font-bold text-[#0B1F4A] leading-tight group-hover:text-orange transition-colors">
                {motd.matchup}
              </p>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}
