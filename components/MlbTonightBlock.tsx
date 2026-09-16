import Link from "next/link";
import { getConfirmedUniform, mlbEtToday } from "@/lib/mlbConfirmed";

// Tracker team-key (short-name slug) -> MLB statsapi teamId
const MLB_TEAM_ID: Record<string, number> = {
  yankees: 147, "red-sox": 111, "blue-jays": 141, rays: 139, orioles: 110,
  guardians: 114, twins: 142, "white-sox": 145, tigers: 116, royals: 118,
  astros: 117, mariners: 136, rangers: 140, angels: 108, athletics: 133,
  braves: 144, phillies: 143, mets: 121, marlins: 146, nationals: 120,
  brewers: 158, cubs: 112, cardinals: 138, pirates: 134, reds: 113,
  dodgers: 119, padres: 135, giants: 137, diamondbacks: 109, rockies: 115,
};

const KEY_BY_ID: Record<number, string> = Object.fromEntries(
  Object.entries(MLB_TEAM_ID).map(([key, id]) => [id, key]),
);

// "blue-jays" -> "Blue Jays". Going through the key rather than chopping the
// last word off the feed's club name is what keeps Boston and Chicago from both
// reading "Sox" and Toronto from reading "Jays".
function nickname(key: string): string {
  return key
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

type SchedGame = {
  gameDate: string;
  status?: { detailedState?: string };
  teams: {
    home: { team: { id: number; name: string } };
    away: { team: { id: number; name: string } };
  };
};

export default async function MlbTonightBlock({
  teamKey,
  teamName,
  color,
  trackerSlug,
  scheduleHref,
}: {
  teamKey: string;
  teamName: string;
  color: string;
  trackerSlug: string;
  scheduleHref?: string;
}) {
  const id = MLB_TEAM_ID[teamKey];
  if (!id) return null;

  const today = mlbEtToday();
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

  // The uniform we have actually confirmed for today, from the same file the
  // daily pass writes. Without this the block answered "what are they wearing
  // today" with a home/road guess, and contradicted the confirmed uniform in
  // the hero of this very page.
  const confirmed = game ? getConfirmedUniform(teamKey, today) : undefined;

  const isHome = game ? game.teams.home.team.id === id : false;
  const oppId = game
    ? isHome
      ? game.teams.away.team.id
      : game.teams.home.team.id
    : 0;
  const oppKey = KEY_BY_ID[oppId];
  const opp = game
    ? isHome
      ? game.teams.away.team.name
      : game.teams.home.team.name
    : "";
  const oppShort = oppKey ? nickname(oppKey) : opp;
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
                {confirmed
                  ? `Confirmed: the ${teamName} are wearing the ${confirmed} today, ${
                      isHome ? `at home against the ${oppShort}` : `on the road at the ${oppShort}`
                    }. We confirmed it from the game itself, and the full card is in the daily tracker.`
                  : `${
                      isHome
                        ? `The ${teamName} are home today, so we expect one of their home looks, the white uniform or a home alternate.`
                        : `The ${teamName} are on the road today, so we expect the road grays or a road alternate.`
                    } Expected, not confirmed. We confirm the exact jersey here as soon as we see it.`}
              </p>
            </>
          ) : (
            <p className="text-[14px] text-black/70 leading-relaxed m-0">
              The {teamName} do not have a game today. When they are back on the
              field we will log exactly what they wear, right here.
            </p>
          )}
          <div className="mt-3.5 flex flex-col gap-1.5">
            <Link prefetch={false}
              href={`/stories/${trackerSlug}`}
              className="text-[13px] font-bold text-[#2f6bed] hover:underline"
            >
              See today&rsquo;s confirmed uniforms in the daily tracker &rarr;
            </Link>
            {scheduleHref && (
              <Link prefetch={false}
                href={scheduleHref}
                className="text-[13px] font-bold text-[#2f6bed] hover:underline"
              >
                Browse the {teamName}&rsquo; full 2026 uniform schedule: every jersey and when they wear it &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-black/35 mt-2 mb-0 px-0.5">
        {confirmed
          ? `Confirmed uniform for today's ${teamName} game, logged from the game itself. Updated hourly.`
          : `Expected look based on the ${teamName}' 2026 pattern; the exact jersey is confirmed as soon as we see it. Updated hourly.`}
      </p>
    </section>
  );
}
