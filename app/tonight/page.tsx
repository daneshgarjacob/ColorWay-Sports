import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";
import { getMyTeamCards, teamPagePath, type MyTeamCard } from "@/lib/myTeams";
import { revalidatePageWithin } from "@/lib/gameDayTitle";

// Tonight (Jake 11/4, ESPN's Scores tab for uniforms): every game on today's
// slate across leagues, both teams' jerseys side by side. Built from the My
// Teams cards: a home card ("vs Heat") pairs with the away card whose next
// game is "at <home>". Refreshes after midnight Eastern like the homepage.

export const metadata: Metadata = {
  title: "Uniforms Tonight: What Every Team Is Wearing Today",
  description: "Every NFL, NBA, NHL and college football game today, with the jersey each team is wearing. Updated daily.",
  alternates: { canonical: "/tonight" },
};

const ORDER = ["NFL", "CFB", "NBA", "NHL", "MLB"];
const LEAGUE_NAME: Record<string, string> = { CFB: "College Football" };
const LEAGUE_LOGO: Record<string, string> = {
  NFL: "/logos/leagues/nfl.png", CFB: "/logos/leagues/college-football.svg", NBA: "/logos/leagues/nba.png",
  NHL: "/logos/leagues/nhl.png", MLB: "/logos/leagues/mlb.png",
};

type Matchup = { league: string; away?: MyTeamCard; home: MyTeamCard };

function tonight(now: Date): Matchup[] {
  const today = getMyTeamCards(now).filter((c) => c.next && /^(Today|Tonight)/.test(c.next.when));
  const out: Matchup[] = [];
  for (const home of today.filter((c) => c.next!.opp.startsWith("vs "))) {
    const away = today.find((c) => c.league === home.league && c.next!.opp === `at ${home.nickname}`);
    out.push({ league: home.league, away, home });
  }
  // Road teams whose host we don't track (a college opponent outside our list).
  const paired = new Set(out.map((m) => m.away?.id));
  for (const c of today.filter((x) => x.next!.opp.startsWith("at ") && !paired.has(x.id))) {
    out.push({ league: c.league, away: c, home: c });
  }
  return out.sort((a, b) => ORDER.indexOf(a.league) - ORDER.indexOf(b.league));
}

function Side({ c, solo }: { c?: MyTeamCard; solo?: boolean }) {
  if (!c) return <div className="flex-1" />;
  return (
    <Link prefetch={false} href={teamPagePath(c.id)} className="flex-1 min-w-0 flex flex-col items-center text-center gap-1.5">
      <div className="w-[92px] h-[104px] rounded-xl bg-white border border-border flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.next?.img ?? c.logo} alt="" className={c.next?.img ? "w-[92%] h-[92%] object-contain" : "w-[60%] h-[60%] object-contain"} loading="lazy" />
      </div>
      <div className="font-display font-black text-[15px] leading-tight">{c.nickname}</div>
      <div className="text-[12px] leading-snug text-foreground/80">{c.next?.look}</div>
      {solo && <div className="text-[11px] text-steel">{c.next?.opp}</div>}
    </Link>
  );
}

export default async function TonightPage() {
  const now = new Date();
  const etNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const toMidnight = (24 * 3600) - (etNow.getHours() * 3600 + etNow.getMinutes() * 60);
  await revalidatePageWithin(Math.max(300, toMidnight + 120));
  const games = tonight(now);
  const leagues = ORDER.filter((l) => games.some((g) => g.league === l));
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" });
  const LABEL = "font-display text-[11px] font-black tracking-[0.18em] uppercase";

  return (
    <>
      <Header />
      <main className="max-w-[1200px] mx-auto px-5 py-6">
        <div className={`${LABEL} text-steel`}>{dateLabel}</div>
        <h1 className="font-display font-black text-[28px] sm:text-[38px] leading-tight mt-1">Uniforms tonight</h1>
        <p className="text-[15px] mt-1 mb-4">Every game today and what both teams are wearing. Tap a team for its page.</p>
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {leagues.map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} className="shrink-0 rounded-full border border-border pl-2 pr-4 py-1.5 font-display text-[13px] font-extrabold flex items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LEAGUE_LOGO[l]} alt="" className="w-5 h-5 object-contain" />
              {LEAGUE_NAME[l] ?? l} · {games.filter((g) => g.league === l).length}
            </a>
          ))}
        </div>
        {!games.length && <p className="font-display font-black text-[20px]">No games today. Check back tomorrow.</p>}
        {leagues.map((l) => (
          <section key={l} id={l.toLowerCase()} className="mb-8">
            <div className={`${LABEL} border-b-2 border-black pb-2 mb-4 flex items-center gap-2.5`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LEAGUE_LOGO[l]} alt="" className="w-8 h-8 object-contain" />
              {LEAGUE_NAME[l] ?? l}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {games.filter((g) => g.league === l).map((g) => (
                <div key={g.home.id + (g.away?.id ?? "")} className="rounded-2xl border border-border p-3 flex items-start gap-2">
                  {g.away && g.away !== g.home ? (
                    <>
                      <Side c={g.away} />
                      <div className="self-center font-display font-black text-[13px] text-steel">at</div>
                      <Side c={g.home} />
                    </>
                  ) : (
                    <Side c={g.home} solo />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
