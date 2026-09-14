import Link from "next/link";
import type { NflLatest } from "@/lib/nflTeamLatest";
import { nflComboSentence, nflWearQuestions } from "@/lib/nflTeamLatest";

/**
 * Live "what were they wearing" block for an NFL team's schedule post.
 *
 * The football twin of TeamWoreLastNight: sits under the hero so the page that
 * already ranks for "what are the <team> wearing" opens with the helmet, jersey
 * and pants from their last played game, straight from the uniform tracker.
 */
export default function NflTeamLastGame({
  data,
  accent = "#013369",
}: {
  data: NflLatest;
  accent?: string;
}) {
  const q = nflWearQuestions(data.nickname);
  const versus = data.home ? `against the ${data.opponent}` : `at the ${data.opponent}`;
  const where = data.home ? "at home" : "on the road";

  return (
    <section aria-label={q.were} className="max-w-[720px] mx-auto px-5 pt-8">
      <div className="rounded-2xl border border-black/10 overflow-hidden">
        <div className="px-5 py-2.5 flex items-center gap-2" style={{ background: accent }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white">
            Updated Every Game · {data.logged} {data.logged === 1 ? "game" : "games"} logged
          </span>
        </div>

        <div className="px-5 sm:px-7 py-6 bg-white">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F4A] leading-tight mb-4">{q.were}</h2>

          <div className="flex items-center gap-5">
            {data.img && (
              <img
                src={data.img}
                alt={`${data.team} ${data.jersey.toLowerCase()} jersey worn ${data.day} ${versus}, from the ColorWay Sports NFL uniform tracker`}
                className="h-[104px] w-auto object-contain flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A8F98]">
                {data.week ? `${data.week} · ` : ""}
                {data.day} · {data.home ? "vs" : "at"} {data.opponent.split(" ").slice(-1)[0]}
              </p>
              <p className="mt-1 text-lg sm:text-xl font-extrabold text-[#0B1F4A] leading-snug">
                The {data.nickname} wore <span style={{ color: accent }}>{nflComboSentence(data)}</span>
              </p>
              <p className="mt-1 text-[14px] text-black/60 leading-relaxed">
                {where[0].toUpperCase() + where.slice(1)}, {versus}. Final: {data.final}.
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-black/10">
            <p className="text-[13px] text-black/70 leading-relaxed">
              <strong className="text-[#0B1F4A]">{q.lastGame}</strong> The {data.nickname} wore{" "}
              {nflComboSentence(data)} on {data.day}. The week-by-week grid below shows what they
              are scheduled to wear next.
            </p>
            <Link
              prefetch={false}
              href={data.trackerHref}
              className="mt-3 inline-block text-[11px] font-extrabold uppercase tracking-[0.14em]"
              style={{ color: accent }}
            >
              See the game in the NFL uniform tracker →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
