import Link from "next/link";
import { nhlLastNight, type NhlLastNightSide } from "@/lib/winterTrackerIndex";

// The NHL band, built to sit under the MLB zone: the same three static tiles
// (tracker | calendars | schedule), color-blocked in the NHL's own black /
// white / silver, then a light "Last Night" strip of the most recent logged
// night, both sweaters per game. Deks in Title Case (Jake's call).
const TRACKER = "/stories/nhl-uniform-tracker-2026-27";

type TileTheme = "black" | "white" | "silver";
const TOOLS: { href: string; title: string; dek: string; theme: TileTheme }[] = [
  {
    href: TRACKER,
    title: "Daily Uniform Tracker",
    dek: "What Every Team Wore Last Night, Logged Every Morning.",
    theme: "black",
  },
  {
    href: "/nhl-tracker",
    title: "Team Uniform Calendars",
    dek: "Every Sweater, Team By Team, All Season.",
    theme: "white",
  },
  {
    href: "/stories/nhl-uniform-schedule-2026-27",
    title: "Uniform Schedule",
    dek: "What Each Team Wears And When, For All 32 Teams.",
    theme: "silver",
  },
];

const THEMES: Record<
  TileTheme,
  { bg: string; border?: string; title: string; dek: string; cta: string; stamp: string; chip: boolean }
> = {
  black: { bg: "#000000", title: "#ffffff", dek: "#A2AAAD", cta: "#ffffff", stamp: "#ffffff", chip: true },
  white: { bg: "#ffffff", border: "1px solid #e5e5e5", title: "#000000", dek: "#6B7280", cta: "#000000", stamp: "#000000", chip: false },
  silver: { bg: "#A2AAAD", title: "#000000", dek: "#1F2326", cta: "#000000", stamp: "#000000", chip: true },
};

// ColorWay "Outline Stamp" mark (matches the header logo); color adapts per tile.
function CwStamp({ color = "#fff" }: { color?: string }) {
  return (
    <svg viewBox="0 0 100 100" width="17" height="17" aria-hidden="true">
      <circle cx="50" cy="50" r="37" fill="none" stroke={color} strokeWidth="3.2" />
      <g transform="translate(0,3)">
        <circle cx="40.8" cy="32" r="2.7" fill={color} />
        <rect x="39.6" y="33" width="2.9" height="33" rx="1.4" fill={color} />
        <path d="M42.2,36 L65,40.5 L55,46 L65,51.5 L42.2,54 Z" fill={color} />
      </g>
    </svg>
  );
}

// One sweater: the full product shot on white (object-contain, never cropped),
// or a plain swatch when we have no tile for it yet.
function Sweater({ s }: { s: NhlLastNightSide }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      <div className="flex h-[76px] w-full items-center justify-center rounded-md bg-white p-1">
        {s.image ? (
          <img src={s.image} alt={`${s.short} ${s.uniform} sweater`} loading="lazy" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="h-8 w-8 rounded-full border border-[#d4d7da]" style={{ background: s.swatch }} />
        )}
      </div>
      <span className="mt-1.5 w-full truncate text-center text-[11px] font-extrabold text-black">{s.short}</span>
      <span className="w-full truncate text-center text-[9.5px] font-semibold uppercase tracking-[0.06em] text-[#5f6468]">
        {s.uniform}
      </span>
    </div>
  );
}

export default function NhlUniformsZone() {
  const night = nhlLastNight();
  const dayHref = night ? `${TRACKER}#${night.anchor}` : TRACKER;

  return (
    <section className="w-full border-y border-border bg-[#F2F3F4]">
      <div className="max-w-[1200px] mx-auto px-5 py-9 sm:py-11">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-4">
          <div className="flex items-center gap-3">
            <span
              style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange"
            >
              ● Live Trackers
            </span>
            <span className="flex items-center gap-1.5">
              <img src="/logos/leagues/nhl.png" alt="NHL" className="h-[20px] w-auto object-contain" />
              <h2 className="text-[13px] font-bold text-[#0B1F4A] uppercase tracking-widest">NHL Uniforms</h2>
            </span>
          </div>
          <Link
            prefetch={false}
            href="/nhl-tracker"
            className="text-[11px] font-semibold text-orange hover:underline uppercase tracking-widest"
          >
            All 32 Teams →
          </Link>
        </div>

        <p className="text-[12px] text-[#5f7085] mb-5">
          {night ? (
            <>
              Every sweater from our last logged night, {night.label}, plus the season plan for all 32 teams.
              Tap the{" "}
            </>
          ) : (
            <>Every sweater, every game, logged the morning after. Tap the </>
          )}
          <Link prefetch={false} href={TRACKER} className="font-semibold text-orange hover:underline">
            daily tracker
          </Link>{" "}
          for the full log.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {TOOLS.map((t) => {
            const th = THEMES[t.theme];
            return (
              <Link
                prefetch={false}
                key={t.href}
                href={t.href}
                className="group relative flex flex-col overflow-hidden rounded-xl p-5 transition-transform hover:-translate-y-0.5"
                style={{ background: th.bg, border: th.border }}
              >
                <div className="mb-6 flex items-center gap-2.5">
                  {th.chip ? (
                    <span className="inline-flex items-center rounded-md bg-white px-1 py-0.5">
                      <img src="/logos/leagues/nhl.png" alt="NHL" className="h-[19px] w-auto object-contain" />
                    </span>
                  ) : (
                    <img src="/logos/leagues/nhl.png" alt="NHL" className="h-[21px] w-auto object-contain" />
                  )}
                  <CwStamp color={th.stamp} />
                </div>
                <p className="text-lg font-bold leading-tight" style={{ color: th.title }}>
                  {t.title}
                </p>
                <p className="mt-1 text-[12px] leading-snug" style={{ color: th.dek }}>
                  {t.dek}
                </p>
                <span className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: th.cta }}>
                  Open <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
                </span>
              </Link>
            );
          })}
        </div>

        {/* Last Night: confirmed games only, from the same game log as the
            tracker post and the team calendars. Never a live status. */}
        {night && (
          <div className="mt-6 rounded-xl border border-border bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between mb-3 gap-2">
              <span className="flex items-center gap-1.5">
                <img src="/logos/leagues/nhl.png" alt="" className="h-[16px] w-auto object-contain" />
                <span className="text-[12px] font-bold text-[#0B1F4A] uppercase tracking-[0.12em]">
                  Last Night · {night.label}
                </span>
              </span>
              <Link
                prefetch={false}
                href={dayHref}
                className="text-[10px] font-semibold uppercase tracking-[0.14em] text-orange hover:underline"
              >
                {night.games.length} {night.games.length === 1 ? "Game" : "Games"} · Full Night →
              </Link>
            </div>
            <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
              {night.games.map((g) => (
                <Link
                  prefetch={false}
                  key={`${g.away.short}-${g.home.short}`}
                  href={dayHref}
                  className="group flex w-[78%] flex-none snap-start items-start gap-1.5 rounded-lg sm:w-auto bg-[#F2F3F4] p-2 transition-transform hover:-translate-y-0.5"
                >
                  <Sweater s={g.away} />
                  <span className="mt-[30px] text-[9px] font-extrabold tracking-[0.12em] text-[#8A8F98]">AT</span>
                  <Sweater s={g.home} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
