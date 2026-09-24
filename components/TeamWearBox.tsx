import { ARTICLE_ROW, ARTICLE_COL } from "@/lib/articleColumn";
import Link from "next/link";
import type { WearAnswer, WearHeadline } from "@/lib/teamWearAnswers";
import WearQuickAnswers from "@/components/WearQuickAnswers";

/**
 * Live "what are they wearing" box for NFL and college football schedule posts.
 *
 * Sits under the hero so the page that ranks for "what are the <team> wearing"
 * opens with this week's jersey, the last game's look, and short answers to the
 * other ways people phrase the search. MLB uses TeamWoreLastNight instead.
 */
export default function TeamWearBox({
  accent = "#013369",
  badge,
  headline,
  lastGame,
  answers,
  link,
}: {
  accent?: string;
  badge: string;
  headline: WearHeadline | null;
  lastGame?: {
    eyebrow: string;
    sentence: string;
    detail?: string;
    img?: string | null;
    alt?: string;
  } | null;
  answers: WearAnswer[];
  link?: { href: string; label: string } | null;
}) {
  if (!headline && !lastGame) return null;
  const title = headline?.question ?? answers[answers.length - 1]?.q ?? "";

  return (
    <section aria-label={title} className={`${ARTICLE_ROW} pt-8`}>
      <div className={ARTICLE_COL}>
      <div className="rounded-2xl border border-black/10 overflow-hidden">
        <div className="px-5 py-2.5 flex items-center gap-2" style={{ background: accent }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white">{badge}</span>
        </div>

        <div className="px-5 sm:px-7 py-6 bg-white">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F4A] leading-tight mb-4">{title}</h2>

          {headline && (
            <div className="mb-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A8F98]">{headline.detail}</p>
              <p className="mt-1 text-2xl sm:text-[28px] font-extrabold leading-tight" style={{ color: accent }}>
                {headline.uniform}
              </p>
              <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-black/50">
                {headline.confirmed ? "Confirmed by the team" : "Expected · not yet confirmed"}
              </p>
            </div>
          )}

          {lastGame && (
            <div className={`flex items-center gap-5 ${headline ? "pt-4 border-t border-black/10" : ""}`}>
              {lastGame.img && (
                <img
                  src={lastGame.img}
                  alt={lastGame.alt ?? ""}
                  className="h-[96px] w-auto object-contain flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A8F98]">{lastGame.eyebrow}</p>
                <p className="mt-1 text-base sm:text-lg font-extrabold text-[#0B1F4A] leading-snug">
                  {lastGame.sentence}
                </p>
                {lastGame.detail && (
                  <p className="mt-1 text-[13px] text-black/60 leading-relaxed">{lastGame.detail}</p>
                )}
              </div>
            </div>
          )}

          <WearQuickAnswers answers={answers} />

          {link && (
            <Link
              prefetch={false}
              href={link.href}
              className="mt-4 inline-block text-[11px] font-extrabold uppercase tracking-[0.14em]"
              style={{ color: accent }}
            >
              {link.label} →
            </Link>
          )}
        </div>
      </div>
      </div>
    </section>
  );
}
