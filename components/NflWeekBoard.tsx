import Link from "next/link";
import type { NflWeekSlate, SlateGame, SlateSide } from "@/lib/nflWeekSlate";
import type { WearAnswer } from "@/lib/teamWearAnswers";
import WearQuickAnswers from "@/components/WearQuickAnswers";
import UniformFigure from "@/components/UniformFigure";
import { uniformTrim } from "@/lib/nflTeamColors";

/**
 * "What every NFL team is wearing this week" board for the league hub page.
 * One card per game, each club drawn as a full uniform figure (helmet, jersey,
 * pants, socks) in the colours logged on the NFL uniform tracker once the look
 * is official, and as a blank TBA outline until then.
 */

const STATUS: Record<SlateSide["look"]["state"], { text: string; cls: string }> = {
  worn: { text: "Worn", cls: "bg-[#0B1F4A] text-white" },
  confirmed: { text: "Confirmed", cls: "bg-[#2f6bed] text-white" },
  jersey: { text: "Jersey confirmed", cls: "bg-[#E6EEFD] text-[#2f6bed]" },
  tba: { text: "TBA", cls: "bg-[#EEF0F4] text-[#7C8696]" },
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

const FIGURE = "h-[230px] w-auto sm:h-[262px]";

function Figure({ side, facing }: { side: SlateSide; facing: "left" | "right" }) {
  const { team, look } = side;
  const full = look.state === "confirmed" || look.state === "worn";
  const colors = full ? look : look.state === "jersey" ? { jersey: look.jersey } : {};
  return (
    <Link prefetch={false} href={`/stories/${team.scheduleSlug}`} className="block" tabIndex={-1} aria-hidden>
      <UniformFigure
        uid={`${team.key}-${side.game.week}`}
        colors={colors}
        trim={uniformTrim(team.key, colors)}
        facing={facing}
        label={describe(side)}
        className={FIGURE}
      />
    </Link>
  );
}

function Caption({ side, align }: { side: SlateSide; align: "left" | "right" }) {
  const { team, look, uniform } = side;
  const known = look.state !== "tba";
  const full = look.state === "confirmed" || look.state === "worn";
  const combo = look.combo?.split(" · ");
  return (
    <div className={`min-w-0 flex-1 ${align === "right" ? "text-right" : "text-left"}`}>
      <Link
        prefetch={false}
        href={`/stories/${team.scheduleSlug}`}
        className="text-[15px] font-extrabold leading-tight text-[#2f6bed] hover:underline sm:text-[16px]"
      >
        {team.nickname}
      </Link>
      <p className="mt-0.5 text-[12.5px] font-semibold leading-snug text-[#0B1F4A]">
        {known ? uniform : <>Expected: {uniform}</>}
      </p>
      {full && combo && (
        <p className="mt-0.5 text-[10px] font-bold uppercase leading-snug tracking-[0.08em] text-[#7C8696]">
          {new Set(combo).size === 1 ? `All ${combo[0]}` : combo.join(" · ")}
        </p>
      )}
      <span
        className={`mt-1.5 inline-block whitespace-nowrap rounded-full px-2 py-[3px] text-[9.5px] font-extrabold uppercase leading-none tracking-[0.12em] ${STATUS[look.state].cls}`}
      >
        {STATUS[look.state].text}
      </span>
    </div>
  );
}

function GameCard({ g }: { g: SlateGame }) {
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
    <li className="flex flex-col overflow-hidden rounded-xl border border-[#E3E6EC] bg-white">
      <div className="flex items-center justify-center gap-1 bg-[#F6F8FB] px-2 pb-3 pt-4 sm:gap-4">
        {g.away ? (
          <Figure side={g.away} facing="right" />
        ) : (
          <UniformFigure uid={`${g.awayName}-away`} colors={{}} label={`${g.awayName}: uniform not announced yet`} className={FIGURE} />
        )}
        <span className="shrink-0 text-[11px] font-extrabold tracking-[0.16em] text-[#0B1F4A]/40">AT</span>
        <Figure side={g.home} facing="left" />
      </div>
      <div className="flex items-start gap-3 px-4 pt-3">
        {g.away ? (
          <Caption side={g.away} align="left" />
        ) : (
          <div className="min-w-0 flex-1 text-[15px] font-extrabold text-[#0B1F4A]">{g.awayName}</div>
        )}
        <Caption side={g.home} align="right" />
      </div>
      <p className="mx-4 mb-3 mt-3 border-t border-[#E3E6EC] pt-2.5 text-center text-[11.5px] font-semibold leading-snug text-black/60">
        {g.score ? <>Final: {g.score}</> : meta.join(" · ")}
      </p>
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

        <div className="bg-white px-3 py-6 sm:px-6">
          <h2 className="font-display text-xl font-extrabold leading-tight text-[#0B1F4A] sm:text-2xl">
            NFL Week {slate.week} Uniforms: What Every Team Is Wearing
          </h2>
          <p className="mb-5 mt-1 max-w-[720px] text-[13px] leading-relaxed text-black/60">
            Away team on the left, home team on the right. Once a club makes its uniform official, we draw the
            whole look in its real colours, helmet to socks. Anything still unannounced stays a white outline under
            a grey TBA panel, with the jersey we expect from the team&rsquo;s schedule underneath. When only the
            jersey is official, only the jersey gets its colour. Tap a team for its full season.
          </p>

          <ol className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
