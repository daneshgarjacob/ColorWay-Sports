import Link from "next/link";
import type { NflWeekSlate, SlateSide } from "@/lib/nflWeekSlate";
import type { WearAnswer } from "@/lib/teamWearAnswers";
import WearQuickAnswers from "@/components/WearQuickAnswers";

/**
 * "What every NFL team is wearing this week" board for the league hub page.
 * One row per game: away jersey at home jersey, each chip in the grid's own
 * colours, with a star when the club has confirmed it.
 */
function Chip({ side }: { side: SlateSide }) {
  const { team, game, uniform, tags } = side;
  return (
    <Link
      prefetch={false}
      href={`/stories/${team.scheduleSlug}`}
      className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg border border-black/10 px-3 py-2 hover:border-black/30"
      style={{ background: game.background, color: game.textColor }}
    >
      <span className="text-[13px] font-extrabold leading-tight">{team.nickname}</span>
      <span className="text-[11px] font-bold uppercase tracking-[0.06em] leading-snug">
        {game.confirmed ? "★ " : ""}
        {uniform}
      </span>
      {tags.length > 0 && (
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] opacity-70">{tags.join(" · ")}</span>
      )}
    </Link>
  );
}

export default function NflWeekBoard({ slate, answers }: { slate: NflWeekSlate; answers: WearAnswer[] }) {
  return (
    <section aria-label={`NFL Week ${slate.week} uniforms`} className="max-w-[720px] mx-auto px-5 pt-8">
      <div className="rounded-2xl border border-black/10 overflow-hidden">
        <div className="px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 bg-[#013369]">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white">
            Updated every week · {slate.confirmedSides} of {slate.totalSides} uniforms confirmed
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/80">{slate.window}</span>
        </div>

        <div className="px-4 sm:px-6 py-6 bg-white">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F4A] leading-tight">
            NFL Week {slate.week} Uniforms: What Every Team Is Wearing
          </h2>
          <p className="mt-1 mb-4 text-[13px] text-black/60 leading-relaxed">
            Away jersey on the left, home jersey on the right. ★ means the team has confirmed it; the rest
            follow the club&rsquo;s published schedule. Tap a team for its full season.
          </p>

          <ol className="flex flex-col gap-2">
            {slate.games.map((g) => (
              <li key={g.home.team.key} className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A8F98]">{g.when}</span>
                <div className="flex items-stretch gap-2">
                  {g.away ? (
                    <Chip side={g.away} />
                  ) : (
                    <span className="flex flex-1 items-center rounded-lg border border-dashed border-black/15 px-3 py-2 text-[13px] font-extrabold text-black/60">
                      {g.awayName}
                    </span>
                  )}
                  <span className="self-center text-[10px] font-extrabold tracking-[0.14em] text-black/40">AT</span>
                  <Chip side={g.home} />
                </div>
              </li>
            ))}
          </ol>

          {slate.byes.length > 0 && (
            <p className="mt-4 text-[12px] text-black/60">
              <strong className="text-[#0B1F4A]">On a bye:</strong> {slate.byes.map((t) => t.nickname).join(", ")}
            </p>
          )}

          <WearQuickAnswers answers={answers} />

          <Link
            prefetch={false}
            href="/stories/nfl-uniform-tracker-2026"
            className="mt-4 inline-block text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#013369]"
          >
            What they actually wore: the NFL uniform tracker →
          </Link>
        </div>
      </div>
    </section>
  );
}
