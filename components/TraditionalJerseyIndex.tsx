import Link from "next/link";

interface RoundStat {
  label: string;
  traditional: number;
  total: number;
  complete: boolean;
  slug?: string;
  note?: string;
}

const rounds: RoundStat[] = [
  {
    label: "Round 1",
    traditional: 16,
    total: 48,
    complete: true,
    slug: "nba-playoffs-2026-round-1-home-jersey-breakdown",
  },
  {
    label: "Round 2",
    traditional: 8,
    total: 21,
    complete: true,
    slug: "nba-playoffs-2026-round-2-jersey-tracker",
  },
  {
    label: "Conference Finals",
    traditional: 3,
    total: 11,
    complete: true,
    slug: "nba-playoffs-2026-conference-finals-jersey-tracker",
  },
  {
    label: "NBA Finals",
    traditional: 3,
    total: 4,
    complete: false,
    slug: "nba-finals-2026-jersey-tracker-knicks-spurs",
    note: "Knicks in their traditional Association whites",
  },
];

export default function TraditionalJerseyIndex() {
  return (
    <section className="max-w-[1200px] mx-auto px-5 pb-6">
      <div className="border border-border rounded-xl p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-1">
          <div className="flex items-baseline gap-3">
            <span
              style={{ fontFamily: "var(--font-mono, monospace)" }}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange"
            >
              NBA Playoffs 2026
            </span>
            <h2 className="text-[13px] font-bold text-[#0B1F4A] uppercase tracking-widest">
              Traditional Jersey Index
            </h2>
          </div>
          <Link
            href="/stories/nba-playoffs-2026-round-1-home-jersey-breakdown"
            className="text-[11px] font-semibold text-orange hover:underline uppercase tracking-widest"
          >
            Full breakdown →
          </Link>
        </div>
        <p className="text-[11px] text-[#8A8F98] mb-5">
          Home team in white — tracked every game of the 2026 NBA playoffs.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rounds.map((r) => {
            const pct = Math.round((r.traditional / r.total) * 100);
            return (
              <div key={r.label}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-[#0B1F4A]">
                    {r.label}
                    <span className="ml-2 text-[10px] font-semibold text-[#8A8F98]">
                      {r.complete ? "Complete" : "In Progress"}
                    </span>
                  </span>
                  <span className="text-[11px] font-bold text-[#0B1F4A]">
                    {r.traditional} / {r.total}
                    <span className="ml-1.5 text-[10px] text-[#8A8F98] font-normal">
                      ({pct}%)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-[#F0F0F4] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background:
                        pct >= 60
                          ? "#1F6B4E"
                          : pct >= 40
                          ? "#FF5910"
                          : "#C0392B",
                    }}
                  />
                </div>
                <p className="text-[10px] text-[#8A8F98] mt-1">
                  {r.note
                    ? `${r.traditional} of ${r.total} games · ${r.note}`
                    : `${r.traditional} of ${r.total} home games in traditional white`}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
