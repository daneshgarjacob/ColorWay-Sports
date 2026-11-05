// Today's games across leagues, paired home and away (Jake 11/4, the ESPN
// Scores tab for uniforms). Built from the My Teams cards: a home card
// ("vs Heat") pairs with the away card whose next game is "at <home>". Used by
// /tonight and the homepage's Tonight row.

import { getMyTeamCards, type MyTeamCard } from "@/lib/myTeams";

export const ORDER = ["NFL", "CFB", "NBA", "NHL", "MLB"];
export const LEAGUE_NAME: Record<string, string> = { CFB: "College Football" };
export const LEAGUE_LOGO: Record<string, string> = {
  NFL: "/logos/leagues/nfl.png", CFB: "/logos/leagues/college-football.svg", NBA: "/logos/leagues/nba.png",
  NHL: "/logos/leagues/nhl.png", MLB: "/logos/leagues/mlb.png",
};

export type Matchup = { league: string; away?: MyTeamCard; home: MyTeamCard };

export function tonightMatchups(now: Date): Matchup[] {
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

