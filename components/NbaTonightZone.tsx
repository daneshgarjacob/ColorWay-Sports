import Link from "next/link";
import { getNbaSlate, type NbaSide } from "@/lib/nbaTonight";

// The NBA band: tonight's games (or the next night with games), both jerseys
// from the official uniform schedule (jersey tiles where we have them), and our
// matchup grade. No tile: edition pill, white for the Association, navy for the rest.
const HUB = "/stories/nba-uniform-schedule-2026-27";

// One side of a game: the jersey tile on white (NHL band look), team name and
// edition under it. No tile yet (most City / Specter): team logo + edition pill.
function Side({ s }: { s: NbaSide }) {
  return (
    <Link prefetch={false} href={s.href} className="group flex min-w-0 flex-1 flex-col items-center">
      <div className="flex h-[88px] w-full items-center justify-center rounded-md bg-white p-1">
        {s.image ? (
          <img src={s.image} alt={`${s.name} ${s.jersey} jersey`} loading="lazy" className="max-h-full max-w-full object-contain" />
        ) : (
          <img src={s.logo} alt={`${s.name} logo`} loading="lazy" className="h-10 w-10 object-contain" />
        )}
      </div>
      <span className="mt-1.5 w-full truncate text-center text-[11px] font-extrabold text-[#0B1F4A] group-hover:underline">
        {s.name}
      </span>
      {s.image ? (
        <span className="w-full truncate text-center text-[9.5px] font-semibold uppercase tracking-[0.06em] text-[#5f6468]">
          {s.jersey}
        </span>
      ) : (
        <span
          className={`mt-0.5 inline-block rounded-full px-2 py-[1px] text-[9.5px] font-bold uppercase tracking-[0.08em] ${
            s.white ? "border border-[#d5dae3] bg-white text-[#0B1F4A]" : "bg-[#0B1F4A] text-white"
          }`}
        >
          {s.jersey}
        </span>
      )}
    </Link>
  );
}

export default function NbaTonightZone() {
  const slate = getNbaSlate();
  if (!slate || slate.games.length === 0) return null;
  const heading = slate.isToday ? `Tonight · ${slate.label}` : `Next Up · ${slate.label}`;

  return (
    <section className="w-full border-y border-border bg-[#F6F1EA]">
      <div className="max-w-[1200px] mx-auto px-5 py-9 sm:py-11">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-2">
          <div className="flex items-center gap-3">
            <span
              style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange"
            >
              ● Graded
            </span>
            <span className="flex items-center gap-1.5">
              <img src="/logos/leagues/nba.png" alt="NBA" className="h-[20px] w-auto object-contain" />
              <h2 className="text-[13px] font-bold text-[#0B1F4A] uppercase tracking-widest">NBA Uniforms</h2>
            </span>
          </div>
          <Link prefetch={false} href={HUB} className="text-[11px] font-semibold text-orange hover:underline uppercase tracking-widest">
            All 30 Schedules →
          </Link>
        </div>
        <p className="text-[12px] text-[#5f7085] mb-5">
          Both jerseys for every game, from the NBA&apos;s official uniform schedule, and our grade for every matchup. Tap a team
          for its full season.
        </p>

        <div className="rounded-xl border border-border bg-white p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-[12px] font-bold text-[#0B1F4A] uppercase tracking-[0.12em]">{heading}</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A8F98]">
              {slate.games.length} {slate.games.length === 1 ? "Game" : "Games"} · Away at Home
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
            {slate.games.map((g) => (
              <div key={`${g.away.tri}-${g.home.tri}`} className="flex items-start gap-1.5 rounded-lg bg-[#F7F5F1] p-2">
                <Side s={g.away} />
                <span className="mt-[30px] flex flex-none flex-col items-center">
                  {g.grade ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange text-[12px] font-black text-white">
                      {g.grade}
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold tracking-[0.12em] text-[#8A8F98]">AT</span>
                  )}
                </span>
                <Side s={g.home} />
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10.5px] text-[#8A8F98]">
            Grades are ours, made before tip-off, on how the two uniforms look together. Every row flips to what was actually worn the
            morning after.
          </p>
        </div>
      </div>
    </section>
  );
}
