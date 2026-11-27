import { ARTICLE_ROW, ARTICLE_COL } from "@/lib/articleColumn";
import Link from "next/link";
import type { ReactNode } from "react";
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
  extraLinks,
  confirmedLabel = "Confirmed by the team",
  signup,
  nextOpponent,
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
  /** Bigger "read this next" links under the answers (Jake 11/27: quick-lookup readers left after 12 seconds). */
  extraLinks?: { href: string; label: string }[];
  confirmedLabel?: string;
  /** Team email signup, shown right under the headline answer (before the FAQ list) so it sits high on phones. */
  signup?: ReactNode;
  /** The next opponent's own schedule post. Only passed when that post exists. */
  nextOpponent?: { href: string; label: string } | null;
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
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b0b0f] leading-tight mb-4 capitalize">{title}</h2>

          {headline && (
            <div className={`mb-5 ${headline.img ? "flex items-center gap-5" : ""}`}>
              {headline.img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={headline.img}
                  alt={headline.imgAlt ?? ""}
                  className="h-[120px] sm:h-[140px] w-auto object-contain flex-shrink-0"
                />
              )}
              <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A8F98]">{headline.detail}</p>
              {headline.swatch ? (
                <p className="mt-2">
                  <span
                    className="inline-block rounded-xl px-4 py-1.5 text-2xl sm:text-[28px] font-extrabold leading-tight"
                    style={{
                      background: headline.swatch.bg,
                      color: headline.swatch.fg,
                      border: /^#f{3,6}$/i.test(headline.swatch.bg) ? "1px solid #d5dae3" : undefined,
                    }}
                  >
                    {headline.uniform}
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-2xl sm:text-[28px] font-extrabold leading-tight" style={{ color: accent }}>
                  {headline.uniform}
                </p>
              )}
              <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-black/50">
                {headline.confirmed ? confirmedLabel : "Expected · not yet confirmed"}
              </p>
              </div>
            </div>
          )}

          {nextOpponent && (
            <Link
              prefetch={false}
              href={nextOpponent.href}
              className="group mb-5 flex min-h-[52px] items-center justify-between gap-3 rounded-xl border border-black/10 px-4 py-2.5 transition-colors hover:bg-black/[0.03]"
            >
              <span className="min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A8F98]">Next Opponent</span>
                <span className="mt-0.5 block text-base sm:text-lg font-extrabold leading-snug" style={{ color: accent }}>
                  {nextOpponent.label}
                </span>
              </span>
              <span
                aria-hidden
                className="flex-shrink-0 text-xl font-extrabold motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
                style={{ color: accent }}
              >
                →
              </span>
            </Link>
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
                <p className="mt-1 text-base sm:text-lg font-extrabold text-[#0b0b0f] leading-snug">
                  {lastGame.sentence}
                </p>
                {lastGame.detail && (
                  <p className="mt-1 text-[13px] text-black/60 leading-relaxed">{lastGame.detail}</p>
                )}
              </div>
            </div>
          )}

          {signup}

          <WearQuickAnswers answers={answers} />

          {extraLinks && extraLinks.length > 0 && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {extraLinks.map((l) => (
                <Link
                  key={l.href}
                  prefetch={false}
                  href={l.href}
                  className="flex-1 rounded-xl border-2 bg-white px-4 py-3 text-center text-[15px] font-bold leading-snug transition-colors hover:bg-black/[0.03]"
                  style={{ borderColor: accent, color: accent }}
                >
                  {l.label} →
                </Link>
              ))}
            </div>
          )}

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
