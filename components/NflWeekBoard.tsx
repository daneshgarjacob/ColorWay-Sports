import Link from "next/link";
import type { NflWeekSlate, SlateGame, SlateSide } from "@/lib/nflWeekSlate";
import type { WearAnswer } from "@/lib/teamWearAnswers";
import WearQuickAnswers from "@/components/WearQuickAnswers";
import UniformFigure from "@/components/UniformFigure";

/**
 * "What every NFL team is wearing this week" board for the league hub page.
 * One card per game, each club drawn as a full uniform figure (helmet, jersey,
 * pants, socks) in the colours logged on the NFL uniform tracker once the look
 * is official, and as a blank TBA outline until then.
 */

const STATUS: Record<SlateSide["look"]["state"], string> = {
  worn: "Worn",
  confirmed: "Confirmed",
  jersey: "Jersey confirmed",
  tba: "TBA",
};

function describe(side: SlateSide) {
  const { look, team, uniform } = side;
  const words = look.combo?.toLowerCase().split(" · ");
  if (words && (look.state === "confirmed" || look.state === "worn")) {
    return `${team.nickname}: ${words[0]} helmet, ${words[1]} jersey, ${words[2]} pants`;
  }
  if (look.state === "jersey") return `${team.nickname}: ${uniform} jersey confirmed, helmet and pants not announced`;
  return `${team.nickname}: uniform not announced yet`;
}

function Side({ side, facing }: { side: SlateSide; facing: "left" | "right" }) {
  const { team, look, uniform } = side;
  const known = look.state !== "tba";
  const full = look.state === "confirmed" || look.state === "worn";
  return (
    <Link
      prefetch={false}
      href={`/stories/${team.scheduleSlug}`}
      className="group flex min-w-0 flex-1 flex-col items-center text-center"
    >
      <span className="flex h-[132px] w-full items-center justify-center rounded-lg bg-[#F4F6F9] py-3">
        <UniformFigure
          colors={full ? look : { jersey: look.jersey }}
          facing={facing}
          tba={!known}
          label={describe(side)}
          className="h-full w-auto"
        />
      </span>
      <span className="mt-2.5 text-[14px] font-extrabold leading-tight text-[#0B1F4A] group-hover:text-[#2f6bed]">
        {team.nickname}
      </span>
      <span className="mt-0.5 text-[12px] font-semibold leading-snug text-black/70">
        {known ? uniform : <>Expected: {uniform}</>}
      </span>
      {full && look.combo && (
        <span className="mt-0.5 text-[10px] font-bold uppercase leading-snug tracking-[0.08em] text-[#7C8696]">
          {new Set(look.combo.split(" · ")).size === 1 ? `All ${look.combo.split(" · ")[0]}` : look.combo}
        </span>
      )}
      <span
        className={`mt-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.14em] ${
          known ? "text-[#2f6bed]" : "text-[#9AA0AC]"
        }`}
      >
        {STATUS[look.state]}
      </span>
    </Link>
  );
}

function GameCard({ g }: { g: SlateGame }) {
  const awayNick = g.away?.team.nickname ?? g.awayName;
  const tags = [...new Set([...(g.away?.tags ?? []), ...g.home.tags])];
  // "TNF" next to "Thursday Night Football" says it twice.
  const LONG: Record<string, string> = {
    TNF: "Thursday Night Football",
    SNF: "Sunday Night Football",
    MNF: "Monday Night Football",
  };
  const meta = [
    g.when,
    g.label || null,
    ...tags.filter((t) => !g.label.includes(t) && !g.label.includes(LONG[t.toUpperCase()] ?? "\u0000")),
  ].filter(Boolean);
  return (
    <li className="flex flex-col rounded-xl border border-[#E3E6EC] bg-white p-3 sm:p-4">
      <div className="flex items-start gap-1.5">
        {g.away ? (
          <Side side={g.away} facing="right" />
        ) : (
          <span className="flex min-w-0 flex-1 flex-col items-center text-center">
            <span className="flex h-[132px] w-full items-center justify-center rounded-lg bg-[#F4F6F9] py-3">
              <UniformFigure colors={{}} tba label={`${g.awayName}: uniform not announced yet`} className="h-full w-auto" />
            </span>
            <span className="mt-2.5 text-[14px] font-extrabold leading-tight text-[#0B1F4A]">{g.awayName}</span>
          </span>
        )}
        <span className="mt-[58px] shrink-0 text-[10px] font-extrabold tracking-[0.14em] text-black/35">AT</span>
        <Side side={g.home} facing="left" />
      </div>
      <div className="mt-3 border-t border-[#E3E6EC] pt-2.5 text-center">
        <p className="text-[13px] font-extrabold leading-tight text-[#0B1F4A]">
          {awayNick} at {g.home.team.nickname}
        </p>
        <p className="mt-0.5 text-[11px] font-semibold leading-snug text-black/55">
          {g.score ? <>Final: {g.score}</> : meta.join(" · ")}
        </p>
      </div>
    </li>
  );
}

export default function NflWeekBoard({ slate, answers }: { slate: NflWeekSlate; answers: WearAnswer[] }) {
  return (
    <section aria-label={`NFL Week ${slate.week} uniforms`} className="mx-auto max-w-[1120px] px-5 pt-8">
      <div className="overflow-hidden rounded-2xl border border-black/10">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0B1F4A] px-5 py-2.5">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white">
            Updated every week · {slate.confirmedSides} of {slate.totalSides} uniforms confirmed
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/80">{slate.window}</span>
        </div>

        <div className="bg-white px-4 py-6 sm:px-6">
          <h2 className="font-display text-xl font-extrabold leading-tight text-[#0B1F4A] sm:text-2xl">
            NFL Week {slate.week} Uniforms: What Every Team Is Wearing
          </h2>
          <p className="mb-5 mt-1 max-w-[720px] text-[13px] leading-relaxed text-black/60">
            Away team on the left, home team on the right. Once a club makes its uniform official, we draw the
            whole look in its real colours, helmet to socks. A blank outline marked TBA means it has not been
            announced yet, with the jersey we expect from the team&rsquo;s schedule underneath. When only the
            jersey is official, only the jersey gets its colour. Tap a team for its full season.
          </p>

          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slate.games.map((g) => (
              <GameCard key={g.home.team.key} g={g} />
            ))}
          </ol>

          {slate.byes.length > 0 && (
            <p className="mt-4 text-[12px] text-black/60">
              <strong className="text-[#0B1F4A]">On a bye:</strong> {slate.byes.map((t) => t.nickname).join(", ")}
            </p>
          )}

          <div className="max-w-[720px]">
            <WearQuickAnswers answers={answers} />
          </div>

          <Link
            prefetch={false}
            href="/stories/nfl-uniform-tracker-2026"
            className="mt-4 inline-block text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#2f6bed]"
          >
            What they actually wore: the NFL uniform tracker →
          </Link>
        </div>
      </div>
    </section>
  );
}
