import WinterGameCard from "@/components/WinterGameCard";
import { winterGamesByMonth, shortDate, type WinterTeamEntry } from "@/lib/winterTrackerIndex";

// The month-by-month game calendar for one NBA/NHL club. Shared by the
// /nba-tracker and /nhl-tracker calendar pages and, since Jake 11/4, embedded
// in each club's uniform schedule post (fans search "uniform schedule", not
// "uniform calendar", so the calendar lives where they land).

export default function WinterCalendarGrid({ entry, league }: { entry: WinterTeamEntry; league: "nba" | "nhl" }) {
  const months = winterGamesByMonth(entry);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
  const garment = league === "nba" ? "jersey" : "sweater";
  return (
    <>
      {months.map(({ month, games }) => (
        <div key={month} className="mb-8">
          <h3 className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#5b6474] mb-3">
            {month}
            <span className="ml-2 font-bold text-[#9aa0ac] tracking-normal normal-case">
              {games.length} game{games.length === 1 ? "" : "s"}
            </span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {games.map((g) => (
              <WinterGameCard
                key={g.date + g.opponentAbbr}
                game={g}
                accent={entry.color}
                today={today}
                kit={garment}
                dateLabel={shortDate(g.date)}
                nickname={entry.nickname}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
