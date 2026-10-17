import Link from "next/link";
import { getWorldSeries, shortLabel } from "@/lib/worldSeries";

// The homepage World Series band (Jake approved the mock 10/16, placed above
// the NFL band). Renders nothing until the AL champion is known; see
// lib/worldSeries.ts for how it switches on.
const GOLD = "#c9a13b";
const GOLD_LIGHT = "#f5d77a";

export default function WorldSeriesZone() {
  const ws = getWorldSeries();
  if (!ws) return null;
  const { nl, al, games, wins, next, records } = ws;
  const leader =
    wins[nl.key] === wins[al.key]
      ? null
      : wins[nl.key] > wins[al.key]
        ? nl
        : al;
  const decided = wins[nl.key] >= 4 || wins[al.key] >= 4;
  const status = decided
    ? `${leader!.name} win the World Series`
    : next
      ? `Game ${next.n} · ${next.dayLabel} · ${next.site === nl.short ? "Milwaukee" : al.name === "Rays" ? "Tampa Bay" : "Cleveland"} · FOX`
      : "";

  const tools = [
    {
      href: "/stories/world-series-uniforms-2026",
      kicker: "Coming Up",
      title: "World Series Uniforms & Patch",
      dek: "Every Game, Both Teams, The 2026 Patch.",
      cls: "bg-[#0b1a2f] text-white",
      style: { border: `2px solid ${GOLD}` },
      kickerColor: GOLD_LIGHT,
    },
    {
      href: "/stories/mlb-uniform-tracker-2026",
      kicker: "Right Now",
      title: "Game-by-Game Tracker",
      dek: "Both Jerseys, Logged The Night Of.",
      cls: "bg-white text-[#003087] border border-[#e5e5e5]",
      style: {},
      kickerColor: "#003087",
    },
    {
      href: "/mlb-tracker",
      kicker: "All Season",
      title: "Team Calendars",
      dek: "Every Jersey Worn This Year.",
      cls: "bg-[#C8102E] text-white",
      style: {},
      kickerColor: "#ffffff",
    },
  ];

  return (
    <section className="w-full border-y border-border bg-[#EEF2FB]">
      <div className="max-w-[1200px] mx-auto px-5 py-9 sm:py-11">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mb-2">
          <div className="flex items-center gap-3">
            <span
              style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange"
            >
              ● Live Tracker
            </span>
            <img
              src="/images/posts/mlb-round-logos/world-series-2026.png"
              alt="2026 World Series logo"
              className="h-[30px] w-auto object-contain"
            />
            <h2 className="text-[13px] font-black text-[#0B1F4A] uppercase tracking-widest">
              2026 World Series
            </h2>
          </div>
          <Link
            prefetch={false}
            href="/stories/world-series-uniforms-2026"
            className="text-[11px] font-semibold text-orange hover:underline uppercase tracking-widest"
          >
            World Series Uniforms →
          </Link>
        </div>
        <p className="text-[12px] text-[#5f7085] mb-5">
          Every World Series game, both jerseys, logged the night it&apos;s played. Expected looks
          get a ★ once the clubs confirm them.
        </p>

        {/* Matchup hero */}
        <div
          className="relative overflow-hidden rounded-2xl bg-[#0b1a2f] px-5 py-6 sm:px-8 text-white"
          style={{ border: `2px solid ${GOLD}` }}
        >
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
            {[al, null, nl].map((t, i) =>
              t === null ? (
                <div key="score" className="text-center px-1">
                  <div className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.2em]" style={{ color: GOLD_LIGHT }}>
                    {decided ? "FINAL" : "SERIES"}
                  </div>
                  <div className="text-[28px] sm:text-[40px] font-black leading-tight tabular-nums whitespace-nowrap">
                    {wins[al.key]} - {wins[nl.key]}
                  </div>
                </div>
              ) : (
                <div
                  key={t.key}
                  className={`flex flex-col sm:flex-row items-center gap-2 sm:gap-4 min-w-0 ${i === 2 ? "sm:flex-row-reverse sm:text-right" : ""} text-center sm:text-left`}
                >
                  <img
                    src={t.logo}
                    alt={`${t.name} logo`}
                    className="h-14 w-14 sm:h-20 sm:w-20 shrink-0 rounded-2xl bg-white object-contain p-2"
                  />
                  <div className="min-w-0">
                    <div className="text-[18px] sm:text-[26px] lg:text-[28px] font-black leading-none">{t.name}</div>
                    <div className="mt-1 text-[9px] sm:text-[11px] font-bold tracking-[0.08em] text-[#c9d4ea] uppercase">
                      {t.record} · {t.league} Champions
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
          {status && <div className="mt-3 text-center text-[11px] sm:text-[12px] text-[#c9d4ea]">{status}</div>}

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {games.map((g) => (
              <div
                key={g.n}
                className="rounded-lg border border-[#234071] bg-[#13284a] p-2.5 text-[11px]"
                style={{ opacity: g.ifNecessary ? 0.55 : 1 }}
              >
                <div className="font-extrabold tracking-[0.06em]" style={{ color: GOLD_LIGHT }}>
                  GAME {g.n}
                  {g.ifNecessary ? "*" : ""}
                </div>
                <div className="mt-0.5 mb-1.5 text-[#c9d4ea]">
                  {g.dayLabel} · {g.site}
                </div>
                {g.ifNecessary ? (
                  <div className="font-extrabold">If necessary</div>
                ) : (
                  [g.away, g.home].map((s) => (
                    <div key={s.key} className="flex justify-between gap-1 font-extrabold leading-snug">
                      <span>
                        {s.short} {shortLabel(s.jersey)}
                        {s.confirmed ? " ★" : ""}
                      </span>
                      {g.played && s.score != null ? <span className="tabular-nums">{s.score}</span> : null}
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
          <div
            className="absolute inset-x-0 bottom-0 h-1"
            style={{ background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT}, ${GOLD})` }}
          />
        </div>

        {/* Tools */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {tools.map((t) => (
            <Link
              prefetch={false}
              key={t.href}
              href={t.href}
              className={`rounded-[14px] p-[18px] min-h-[110px] block hover:opacity-95 ${t.cls}`}
              style={t.style}
            >
              <div className="text-[10px] font-extrabold tracking-[0.16em] uppercase" style={{ color: t.kickerColor }}>
                {t.kicker}
              </div>
              <div className="mt-1.5 mb-1 text-[17px] font-black">{t.title}</div>
              <div className="text-[12px] opacity-80">{t.dek}</div>
            </Link>
          ))}
        </div>

        {/* October in uniforms */}
        <div className="mt-4 rounded-[14px] border border-[#e3e7ec] bg-white px-5 py-[18px]">
          <div className="mb-3 flex justify-between text-[11px] font-extrabold tracking-[0.14em] text-[#6b7280] uppercase">
            <span>October in Uniforms</span>
            <span className="hidden sm:inline">This postseason, by jersey</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {records.map((r) => (
              <div key={r.team.key}>
                <div className="mb-1 text-[12px] font-black text-[#0b1a2f]">
                  {r.team.name} · {r.overall}
                </div>
                {r.rows.map((row) => (
                  <div
                    key={row.jersey}
                    className="flex justify-between border-t border-[#f0f2f5] py-1.5 text-[13px] text-[#0b1a2f]"
                  >
                    <span>{shortLabel(row.jersey)}</span>
                    {row.w + row.l === 0 ? (
                      <b className="text-[#9aa0ac]">not worn</b>
                    ) : (
                      <b className="tabular-nums">
                        {row.w}-{row.l}
                      </b>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] text-[#6b7280]">
            Expected looks shown before first pitch. Records are game results while wearing each jersey.
          </p>
        </div>
      </div>
    </section>
  );
}
