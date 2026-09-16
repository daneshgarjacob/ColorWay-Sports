import Link from "next/link";
import type { TeamLatest } from "@/lib/mlbTeamLatest";
import { teamWearQuestions } from "@/lib/mlbTeamLatest";
import type { WearAnswer } from "@/lib/teamWearAnswers";
import WearQuickAnswers from "@/components/WearQuickAnswers";

/**
 * Live "what did they wear last night" block for a team's schedule post.
 *
 * Sits directly under the hero, above the static schedule, so the page that
 * already ranks for "what are the <team> wearing" opens with an answer that is
 * current rather than a projection. Copy leads with the exact question
 * phrasings we are targeting.
 *
 * Tense follows the data: we log a slate as each uniform is confirmed, so the
 * newest game is frequently in progress. When it is today's game the block asks
 * and answers in the present, and only drops to "wore ... last night" once the
 * game is actually behind us.
 */
export default function TeamWoreLastNight({
  data,
  accent = "#2f6bed",
  answers = [],
}: {
  data: TeamLatest;
  accent?: string;
  answers?: WearAnswer[];
}) {
  const { team, latest, latestIsToday, logged, trackerHref } = data;
  if (!latest) return null;

  const q = teamWearQuestions(team, latestIsToday);
  const where = latest.home ? "at home" : "on the road";
  const versus = latest.home ? `against the ${latest.oppName}` : `at the ${latest.oppName}`;
  const when = latestIsToday ? "tonight" : `on ${latest.month} ${latest.date}`;

  return (
    <section
      aria-label={q.lastNight}
      className="max-w-[720px] mx-auto px-5 pt-8"
    >
      <div className="rounded-2xl border border-black/10 overflow-hidden">
        <div
          className="px-5 py-2.5 flex items-center gap-2"
          style={{ background: accent }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white">
            Updated Daily · {logged} games logged
          </span>
        </div>

        <div className="px-5 sm:px-7 py-6 bg-white">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F4A] leading-tight mb-4">
            {q.lastNight}
          </h2>

          <div className="flex items-center gap-5">
            {latest.img && (
              <img
                src={latest.img}
                alt={`${team} ${latest.uniform ?? "uniform"} worn ${latest.day}, from the MLB daily uniform tracker`}
                className="h-[104px] w-auto object-contain flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A8F98]">
                {latestIsToday ? "Tonight · " : ""}{latest.month} {latest.date} · {latest.opp}
              </p>
              <p className="mt-1 text-lg sm:text-xl font-extrabold text-[#0B1F4A] leading-snug">
                {latest.uniform ? (
                  <>
                    The {team} {latestIsToday ? "are wearing" : "wore"} the{" "}
                    <span style={{ color: accent }}>{latest.uniform}</span>
                  </>
                ) : (
                  <>The {team} {latestIsToday ? "are playing" : "played"} {versus}</>
                )}
              </p>
              <p className="mt-1 text-[14px] text-black/60 leading-relaxed">
                {latest.uniform ? `${where}, ${versus}.` : `${where}.`} We log every uniform in
                every game, every morning.
              </p>
              <p className="mt-2 text-[13px] text-black/70 leading-relaxed">
                <strong className="text-[#0B1F4A]">{q.were}</strong>{" "}
                {latest.uniform
                  ? `The ${latest.uniform}, ${where} ${versus} ${when}.`
                  : `They ${latestIsToday ? "are playing" : "played"} ${versus} ${when}.`}
              </p>
            </div>
          </div>

          <WearQuickAnswers answers={answers} />

          <div className="mt-5 pt-4 border-t border-black/10">
            <p className="text-[13px] text-black/70 leading-relaxed">
              <strong className="text-[#0B1F4A]">{q.tonight}</strong> The rotation below maps
              every jersey the {team} run and when, so you can call{" "}
              {latestIsToday ? "tomorrow" : "tonight"}&rsquo;s look before first pitch.
            </p>
            <Link prefetch={false}
              href={trackerHref}
              className="mt-3 inline-block text-[11px] font-extrabold uppercase tracking-[0.14em]"
              style={{ color: accent }}
            >
              See the full daily log →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
