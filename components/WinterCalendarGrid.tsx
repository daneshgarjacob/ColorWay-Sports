import WinterGameCard from "@/components/WinterGameCard";
import MvSlot from "@/components/MvSlot";
import { winterGamesByMonth, shortDate, type WinterTeamEntry } from "@/lib/winterTrackerIndex";

// The month-by-month game calendar for one NBA/NHL club. Shared by the
// /nba-tracker and /nhl-tracker calendar pages and, since Jake 11/4, embedded
// in each club's uniform schedule post (fans search "uniform schedule", not
// "uniform calendar", so the calendar lives where they land).

// adSlots (tracker calendar pages only, off in schedule posts where Mediavine
// already fills the prose): an in-content ad spot after every second month
// and a phone-only one after the months between, the slotAfterCard rhythm.
export default function WinterCalendarGrid({
  entry,
  league,
  adSlots = false,
}: {
  entry: WinterTeamEntry;
  league: "nba" | "nhl";
  adSlots?: boolean;
}) {
  const months = winterGamesByMonth(entry);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
  const garment = league === "nba" ? "jersey" : "sweater";
  return (
    <>
      {months.map(({ month, games }, mi) => (
        <div key={month}>
        <div className="mb-8">
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
        {adSlots && mi < months.length - 1 && (
          <MvSlot device={mi % 2 === 1 ? "all" : "mobile"} className="mb-8" />
        )}
        </div>
      ))}
    </>
  );
}
