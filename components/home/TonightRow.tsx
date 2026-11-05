import Link from "next/link";
import { teamPagePath, type MyTeamCard } from "@/lib/myTeams";
import { LEAGUE_LOGO, LEAGUE_NAME, ORDER, type Matchup } from "@/lib/tonight";

// The homepage's one Tonight row (Jake 11/4): which leagues play today, the
// first few matchups with both jerseys, and a door to /tonight. Replaces the
// three full NFL, NBA and NHL bands that made the homepage crowded.

function Mini({ c }: { c: MyTeamCard }) {
  return (
    <Link prefetch={false} href={teamPagePath(c.id)} className="flex flex-col items-center gap-1 min-w-0 flex-1">
      <div className="w-[64px] h-[72px] rounded-lg bg-white border border-border flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.next?.img ?? c.logo} alt="" className={c.next?.img ? "w-[92%] h-[92%] object-contain" : "w-[60%] h-[60%] object-contain"} loading="lazy" />
      </div>
      <span className="font-display text-[12px] font-extrabold leading-tight truncate max-w-full">{c.nickname}</span>
    </Link>
  );
}

export default function TonightRow({ games, label }: { games: Matchup[]; label: string }) {
  if (!games.length) return null;
  const leagues = ORDER.filter((l) => games.some((g) => g.league === l));
  const shown = games.filter((g) => g.away && g.away !== g.home).slice(0, 4);
  return (
    <section className="max-w-[1200px] mx-auto px-5 pt-8">
      <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
        <span className="font-display text-[11px] font-black tracking-[0.18em] uppercase text-black">Tonight · {label}</span>
        <Link prefetch={false} href="/tonight" className="font-display text-[12px] font-extrabold text-orange">
          Every game &rarr;
        </Link>
      </div>
      <div className="flex gap-2 mb-3 overflow-x-auto">
        {leagues.map((l) => (
          <Link prefetch={false} key={l} href={`/tonight#${l.toLowerCase()}`} className="shrink-0 rounded-full border border-border pl-2 pr-3 py-1 font-display text-[12px] font-extrabold flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LEAGUE_LOGO[l]} alt="" className="w-4 h-4 object-contain" />
            {LEAGUE_NAME[l] ?? l} · {games.filter((g) => g.league === l).length}
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {shown.map((g) => (
          <div key={g.home.id} className="rounded-xl border border-border p-2.5 flex items-center gap-1">
            <Mini c={g.away!} />
            <span className="font-display font-black text-[11px] text-steel">at</span>
            <Mini c={g.home} />
          </div>
        ))}
      </div>
    </section>
  );
}
