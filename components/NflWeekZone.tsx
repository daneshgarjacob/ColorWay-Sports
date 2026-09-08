import Link from "next/link";
import { currentNflWeek, getNflWeekChips, nflWeekDates } from "@/lib/nflWeek";

// "This Week in the NFL": all 32 teams, this week's jersey, one click to the
// schedule post. Built 2026-09-07 for the season opener; the schedule posts are
// the highest-RPM pages on the site and had no homepage slot before this.
export default function NflWeekZone() {
  const week = currentNflWeek();
  const chips = getNflWeekChips(week);
  if (chips.length < 20) return null;
  const confirmedCount = chips.filter((c) => c.confirmed).length;

  return (
    <section className="w-full border-y border-border bg-[#F6F4EF]">
      <div className="max-w-[1200px] mx-auto px-5 py-9 sm:py-11">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-1">
          <div className="flex items-center gap-3">
            <span
              style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange"
            >
              ● This Week
            </span>
            <span className="flex items-center gap-1.5">
              <img src="/logos/leagues/nfl.png" alt="NFL" className="h-[18px] w-auto object-contain" />
              <h2 className="text-[13px] font-bold text-[#0B1F4A] uppercase tracking-widest">
                NFL Uniforms · Week {week}
              </h2>
            </span>
          </div>
          <Link
            prefetch={false}
            href="/stories/nfl-uniform-schedule-2026"
            className="text-[11px] font-semibold text-orange hover:underline uppercase tracking-widest"
          >
            All 32 Schedules →
          </Link>
        </div>
        <p className="text-[12px] text-[#5f7085] mb-5">
          What every team wears this week, {nflWeekDates(week)}. {confirmedCount} of {chips.length} are
          confirmed by the team; the rest follow the standard home-and-road rotation. Tap a team for its
          full jersey schedule.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {chips.map((c) => (
            <Link
              prefetch={false}
              key={c.slug}
              href={`/stories/${c.slug}`}
              className="group flex flex-col rounded-lg bg-white border border-border px-3 py-2.5 transition-transform hover:-translate-y-0.5"
              style={{ borderLeft: `3px solid ${c.accent}` }}
            >
              <span className="flex items-center gap-1.5 min-w-0">
                {c.logo && (
                  <img src={c.logo} alt="" className="h-[20px] w-[20px] object-contain flex-shrink-0" />
                )}
                <span className="text-[12px] font-extrabold text-[#0B1F4A] truncate group-hover:text-orange transition-colors">
                  {c.team}
                </span>
              </span>
              <span className="mt-1 text-[11px] text-[#5f7085] truncate">{c.opponent}</span>
              <span className="mt-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em] leading-snug text-[#0B1F4A]">
                {c.confirmed && <span className="text-orange">★ </span>}
                {c.label}
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-4 text-[11px] text-[#8A8F98]">
          ★ = announced by the team. Game-by-game results land on the{" "}
          <Link prefetch={false} href="/stories/nfl-uniform-tracker-2026" className="text-orange hover:underline font-semibold">
            NFL uniform tracker
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
