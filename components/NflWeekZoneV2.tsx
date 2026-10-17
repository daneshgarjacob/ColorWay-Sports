/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { buildNflWeekSlate, type SlateGame, type SlateSide } from "@/lib/nflWeekSlate";
import { getNflWeekChips, getNflWeekStats } from "@/lib/nflWeek";

// NFL band, v2 (Jake 10/16: "as polished as the ALCS band"). Built from the
// same week slate as the schedule hub: a dark game-of-the-week hero, every game
// grouped by day with jersey-over-pants swatches, then doors to what people
// search for (GSC 9/17-10/14: schedule, week N uniforms, Salute to Service,
// Crucial Catch, rankings, sideline hats). On the homepage since 10/17
// (Jake: "if you think it's better, just do it"); replaced NflWeekZone.

const NAVY = "#0d1a33";
const GOLD = "#e8b931";

const isPrime = (g: SlateGame) => /night|tnf|snf|mnf/i.test(g.label);
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
              <span className="truncate">{s.uniform}</span>
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
  const chips = getNflWeekChips(slate.week);
  const stats = getNflWeekStats(chips);

  const open = slate.games.filter((g) => !g.score);
  const hero = open.find((g) => isPrime(g) && g.away) ?? open.find((g) => g.away) ?? slate.games[0];
  const days: { when: string; games: SlateGame[] }[] = [];
  for (const g of slate.games) {
    const d = days.find((x) => x.when === g.when);
    if (d) d.games.push(g);
    else days.push({ when: g.when, games: [g] });
  }

  const doors = [
    {
      kicker: "Coming up · November",
      title: "Salute to Service 2026",
      text: "When it starts, the gear release date and every team's game.",
      href: "/stories/nfl-salute-to-service-2026-schedule",
      cls: "text-white",
      style: { background: NAVY },
      k: GOLD,
      t: "#aab6cc",
    },
    {
      kicker: "Right now",
      title: "Game-by-Game Tracker",
      text: "Both uniforms from every game, logged the day it's played.",
      href: "/stories/nfl-uniform-tracker-2026",
      cls: "bg-white border border-border text-[#0B1F4A]",
      style: {},
      k: "#2f6bed",
      t: "#5f7085",
    },
    {
      kicker: "All October",
      title: "Crucial Catch 2026",
      text: "Which teams wear the Crucial Catch look, week by week.",
      href: "/stories/nfl-crucial-catch-2026-schedule",
      cls: "text-white",
      style: { background: "#b3261e" },
      k: "#ffd9d4",
      t: "#ffe9e6",
    },
  ];
  const shelf = [
    { t: "Best NFL Uniforms 2026", s: "All 32, ranked", href: "/stories/best-nfl-uniforms-2026-ranked" },
    { t: "Worst NFL Uniforms 2026", s: "The bottom of the league", href: "/stories/worst-nfl-uniforms-2026-ranked" },
    { t: "NFL Sideline Hats 2026", s: "Every team's cap, graded", href: "/stories/nfl-sideline-hats-2026-ranked" },
    { t: "Best-Selling NFL Jerseys", s: "The league's latest list", href: "/stories/nfl-best-selling-jerseys-2026" },
  ];

  const heroSide = (s: SlateSide | null, name: string, right = false) => (
    <div className={`flex items-center gap-3 min-w-0 ${right ? "flex-row-reverse text-right" : ""}`}>
      {s && <img src={s.team.logo} alt="" className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl bg-white p-1.5 object-contain flex-none" />}
      <div className="min-w-0">
        <div className="text-[18px] sm:text-[26px] font-extrabold leading-tight truncate">{s?.team.nickname ?? name}</div>
        <div className="text-[12px] text-[#aab6cc]">
          {s?.uniform}
          {s && sideConfirmed(s) ? " ★" : ""}
        </div>
      </div>
      {s && (
        <span className="hidden sm:inline-flex">
          <Swatch s={s} size="lg" />
        </span>
      )}
    </div>
  );

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
        <p className="-mt-2 text-[13px] text-[#5f7085] max-w-[70ch]">
          What every team is wearing this week, game by game. ★ means the team announced it; the rest follow the
          standard home and road rotation until the team confirms.
        </p>

        {/* Game of the week */}
        <div className="relative overflow-hidden rounded-[14px] px-4 sm:px-7 py-5 text-white flex flex-col gap-4" style={{ background: `radial-gradient(120% 140% at 50% 0%, #16284a, ${NAVY})` }}>
          <div className="text-center text-[10px] tracking-[0.18em] uppercase" style={{ color: GOLD, fontFamily: "'JetBrains Mono', monospace" }}>
            Game of the week · {hero.label || hero.when}
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            {heroSide(hero.away, hero.awayName)}
            <div className="text-center">
              <div className="text-[22px] sm:text-[28px] font-extrabold">at</div>
              <div className="text-[11px] text-[#aab6cc]">{hero.when}</div>
            </div>
            {heroSide(hero.home, hero.home.team.nickname, true)}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { v: `${stats.homeColor} of ${stats.homeTotal}`, k: "Color at home" },
              { v: `${stats.alternates}`, k: "Alternates & specials" },
              { v: `${stats.colorVsColor}`, k: "Color vs color" },
              { v: `${slate.confirmedSides} of ${slate.totalSides}`, k: "Looks confirmed" },
              { v: `${slate.byes.length}`, k: "Teams on bye" },
            ].map((s) => (
              <div key={s.k} className="rounded-[10px] border border-white/10 bg-white/[.03] px-3 py-2.5">
                <div className="text-[20px] font-black tabular-nums">{s.v}</div>
                <div className="text-[10px] uppercase tracking-[0.12em] text-[#aab6cc]">{s.k}</div>
              </div>
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: `linear-gradient(90deg, ${GOLD}, #f5d76e, ${GOLD})` }} />
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
            Blue edge = both looks announced. ★ = announced by the team. Swatches show jersey over pants.
            {slate.byes.length > 0 && <> On bye: {slate.byes.map((b) => b.nickname).join(", ")}.</>}
          </p>
        </div>

        {/* Doors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {doors.map((d) => (
            <Link prefetch={false} key={d.href} href={d.href} className={`rounded-[12px] p-4 sm:p-[18px] flex flex-col gap-1.5 hover:opacity-95 ${d.cls}`} style={d.style}>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color: d.k }}>
                {d.kicker}
              </span>
              <span className="text-[18px] font-extrabold leading-tight">{d.title}</span>
              <span className="text-[13px] leading-snug" style={{ color: d.t }}>
                {d.text}
              </span>
            </Link>
          ))}
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

        <Link
          prefetch={false}
          href="/stories/nfl-uniform-schedule-2026"
          className="self-start rounded-full border border-[#c9d8fb] bg-white px-4 py-2 text-[13px] font-bold text-[#2f6bed] hover:underline"
        >
          All 32 team uniform schedules →
        </Link>
      </div>
    </section>
  );
}
