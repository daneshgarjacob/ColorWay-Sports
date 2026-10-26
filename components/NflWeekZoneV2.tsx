/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { buildNflWeekSlate, type SlateGame, type SlateSide } from "@/lib/nflWeekSlate";

// NFL band, v2. Built from the same week slate as the schedule hub: every game
// grouped by day with jersey-over-pants swatches, the rankings shelf, then one
// row of links (tracker, schedules, Crucial Catch, Salute to Service).
// Trimmed 10/25 (Jake: too long): Game of the Week hero, intro line and the
// three big door tiles removed.

const sideConfirmed = (s: SlateSide) => s.game.confirmed || s.look.state === "confirmed" || s.look.state === "worn";

function Swatch({ s, size = "sm" }: { s: SlateSide; size?: "sm" | "lg" }) {
  const j = s.look.jersey;
  const p = s.look.pants;
  const big = size === "lg";
  const box = (c: string | undefined, w: number, h: number) => (
    <span
      className="block rounded-[2px] border"
      style={{
        width: w,
        height: h,
        background: c ?? "transparent",
        borderColor: big ? "rgba(255,255,255,.35)" : "#c7c4ba",
        borderStyle: c ? "solid" : "dashed",
      }}
    />
  );
  return (
    <span className="inline-flex flex-col items-center gap-[2px] flex-none" aria-hidden>
      {box(j, big ? 30 : 13, big ? 24 : 7)}
      {box(p, big ? 22 : 13, big ? 13 : 7)}
    </span>
  );
}

function GameCard({ g }: { g: SlateGame }) {
  const both = g.away && sideConfirmed(g.away) && sideConfirmed(g.home);
  const rows = [g.away, g.home].filter(Boolean) as SlateSide[];
  return (
    <div
      className="rounded-[10px] border bg-white px-2.5 py-2 flex flex-col gap-1"
      style={{ borderColor: both ? "#c9d8fb" : "var(--color-border, #e3e1da)", boxShadow: both ? "inset 3px 0 0 #2f6bed" : undefined }}
    >
      {rows.map((s) => (
        <Link prefetch={false} key={s.team.key} href={`/stories/${s.team.scheduleSlug}`} className="group flex items-center gap-2 min-w-0">
          <img src={s.team.logo} alt="" className="h-[26px] w-[26px] object-contain flex-none" />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold text-[#0B1F4A] group-hover:text-orange truncate">
              {s.team.nickname}
            </span>
            <span className="flex items-center gap-1.5 text-[11.5px] text-[#5f7085] min-w-0">
              <Swatch s={s} />
              {/* Jake 10/17: tease, don't answer. The look itself lives on the
                  team's schedule post (an article with ads), one tap away. */}
              <span className="truncate group-hover:text-orange">See the full look →</span>
              {sideConfirmed(s) && <span className="text-[#2f6bed]">★</span>}
            </span>
          </span>
        </Link>
      ))}
      {g.score && <div className="text-[11px] font-bold text-[#0B1F4A] pl-[34px]">Final: {g.score}</div>}
    </div>
  );
}

export default function NflWeekZoneV2() {
  const slate = buildNflWeekSlate(new Date());
  if (!slate || slate.games.length < 5) return null;

  const days: { when: string; games: SlateGame[] }[] = [];
  for (const g of slate.games) {
    const d = days.find((x) => x.when === g.when);
    if (d) d.games.push(g);
    else days.push({ when: g.when, games: [g] });
  }

  const shelf = [
    { t: "Best NFL Uniforms 2026", s: "All 32, ranked", href: "/stories/best-nfl-uniforms-2026-ranked" },
    { t: "Worst NFL Uniforms 2026", s: "The bottom of the league", href: "/stories/worst-nfl-uniforms-2026-ranked" },
    { t: "NFL Sideline Hats 2026", s: "Every team's cap, graded", href: "/stories/nfl-sideline-hats-2026-ranked" },
    { t: "Best-Selling NFL Jerseys", s: "The league's latest list", href: "/stories/nfl-best-selling-jerseys-2026" },
  ];

  return (
    <section className="w-full border-y border-border bg-[#F6F4EF]">
      <div className="max-w-[1200px] mx-auto px-5 py-9 sm:py-11 flex flex-col gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div className="flex items-center gap-3">
            <span
              style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange"
            >
              ● This Week
            </span>
            <span className="flex items-center gap-1.5">
              <img src="/logos/leagues/nfl.png" alt="NFL" className="h-[18px] w-auto object-contain" />
              <h2 className="text-[13px] font-bold text-[#0B1F4A] uppercase tracking-widest">NFL Uniforms · Week {slate.week}</h2>
            </span>
          </div>
          <Link prefetch={false} href={`/stories/nfl-week-${slate.week}-uniforms-2026`} className="text-[11px] font-semibold text-orange hover:underline uppercase tracking-widest">
            Week {slate.week} Guide →
          </Link>
        </div>
        {/* The slate */}
        <div className="flex flex-col gap-4">
          {days.map((d) => (
            <div key={d.when} className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-2 sm:gap-3 items-start">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#5f7085] sm:pt-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {d.when}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {d.games.map((g) => (
                  <GameCard key={`${g.awayName}-${g.home.team.key}`} g={g} />
                ))}
              </div>
            </div>
          ))}
          <p className="text-[11.5px] text-[#5f7085]">
            Blue edge = both looks announced. ★ = announced by the team. Swatches show jersey over pants once a look is known.
            {slate.byes.length > 0 && <> On bye: {slate.byes.map((b) => b.nickname).join(", ")}.</>}
          </p>
        </div>

        {/* Rankings shelf */}
        <div className="rounded-[12px] border border-border bg-white px-4 sm:px-5 py-4">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A8F98]">Ranked</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            {shelf.map((s) => (
              <Link prefetch={false} key={s.href} href={s.href} className="group">
                <span className="block text-[14px] font-bold text-[#0B1F4A] group-hover:text-orange leading-snug">{s.t}</span>
                <span className="text-[12px] text-[#5f7085]">{s.s}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { t: "Game-by-Game Tracker →", href: "/stories/nfl-uniform-tracker-2026", primary: true },
            { t: "All 32 Team Schedules →", href: "/stories/nfl-uniform-schedule-2026" },
            { t: "Crucial Catch 2026", href: "/stories/nfl-crucial-catch-2026-schedule" },
            { t: "Salute to Service 2026", href: "/stories/nfl-salute-to-service-2026-schedule" },
          ].map((l) => (
            <Link
              prefetch={false}
              key={l.href}
              href={l.href}
              className={`rounded-full px-4 py-2 text-[13px] font-bold hover:underline ${
                l.primary ? "bg-[#2f6bed] text-white" : "border border-[#c9d8fb] bg-white text-[#2f6bed]"
              }`}
            >
              {l.t}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
