import Link from "next/link";

// Tracker team-key (short-name slug) -> MLB statsapi teamId
const MLB_TEAM_ID: Record<string, number> = {
  yankees: 147, "red-sox": 111, "blue-jays": 141, rays: 139, orioles: 110,
  guardians: 114, twins: 142, "white-sox": 145, tigers: 116, royals: 118,
  astros: 117, mariners: 136, rangers: 140, angels: 108, athletics: 133,
  braves: 144, phillies: 143, mets: 121, marlins: 146, nationals: 120,
  brewers: 158, cubs: 112, cardinals: 138, pirates: 134, reds: 113,
  dodgers: 119, padres: 135, giants: 137, diamondbacks: 109, rockies: 115,
};

type SchedGame = {
  gameDate: string;
  status?: { detailedState?: string };
  teams: {
    home: { team: { id: number; name: string } };
    away: { team: { id: number; name: string } };
  };
};

function etToday(): string {
  // YYYY-MM-DD in US Eastern, the day MLB's schedule is keyed to
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export default async function MlbTonightBlock({
  teamKey,
  teamName,
  color,
  trackerSlug,
}: {
  teamKey: string;
  teamName: string;
  color: string;
  trackerSlug: string;
}) {
  const id = MLB_TEAM_ID[teamKey];
  if (!id) return null;

  const today = etToday();
  let game: SchedGame | null = null;
  try {
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&teamId=${id}`,
      { next: { revalidate: 1800 } },
    );
    if (res.ok) {
      const data = await res.json();
      const games: SchedGame[] = data?.dates?.[0]?.games ?? [];
      game = games[0] ?? null;
    }
  } catch {
    game = null;
  }

  const isHome = game ? game.teams.home.team.id === id : false;
  const opp = game
    ? isHome
      ? game.teams.away.team.name
      : game.teams.home.team.name
    : "";
  const time = game
    ? new Date(game.gameDate).toLocaleTimeString("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "2-digit",
      }) + " ET"
    : "";

  return (
    <section className="max-w-[860px] mx-auto px-5 pt-8" id="tonight">
      <div
        className="rounded-2xl overflow-hidden border border-black/[0.08]"
        style={{ boxShadow: "0 2px 14px rgba(10,23,51,0.06)" }}
      >
        <div
          className="px-5 py-3"
          style={{ background: color }}
        >
          <h2 className="text-white text-[15px] sm:text-[17px] font-extrabold m-0 leading-tight">
            What are the {teamName} wearing today?
          </h2>
        </div>
        <div className="bg-white px-5 py-5">
          {game ? (
            <>
              <p className="text-[15px] sm:text-[16px] text-blue-dark font-bold m-0 mb-1.5">
                {isHome ? `${teamName} vs ${opp}` : `${teamName} at ${opp}`}
                <span className="text-black/45 font-semibold"> &middot; {time}</span>
              </p>
              <p className="text-[14px] text-black/70 leading-relaxed m-0">
                {isHome
                  ? `The ${teamName} are home today, so expect one of their home looks — the white uniform or a home alternate.`
                  : `The ${teamName} are on the road today, so expect the road grays or a road alternate.`}{" "}
                We confirm the exact jersey they wear here every morning after the game.
              </p>
            </>
          ) : (
            <p className="text-[14px] text-black/70 leading-relaxed m-0">
              The {teamName} do not have a game today. When they are back on the
              field we will log exactly what they wear, right here.
            </p>
          )}
          <Link
            href={`/stories/${trackerSlug}`}
            className="inline-block mt-3.5 text-[13px] font-bold text-[#2f6bed] hover:underline"
          >
            See today&rsquo;s confirmed uniforms in the daily tracker &rarr;
          </Link>
        </div>
      </div>
      <p className="text-[11px] text-black/35 mt-2 mb-0 px-0.5">
        Expected look based on the {teamName}&rsquo; 2026 pattern; the exact
        jersey is confirmed each morning. Updated hourly.
      </p>
    </section>
  );
}
