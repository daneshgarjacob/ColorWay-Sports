"use client";

import { useState } from "react";
import Link from "next/link";
import type { TeamIndexEntry } from "@/lib/mlbTrackerTeamIndex";

// Browse-by-team index at the top of the MLB daily tracker: all 30 clubs
// grouped by division. Tap a team to see every game we've logged for them —
// day, opponent, what they wore, matchup grade — and jump straight to the card.
export default function TrackerTeamIndex({ teams }: { teams: TeamIndexEntry[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  const divisions = ["AL East", "AL Central", "AL West", "NL East", "NL Central", "NL West"];
  const active = teams.find((t) => t.key === selected) || null;

  const jumpTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      history.replaceState(null, "", `#${id}`);
      const top = el.getBoundingClientRect().top + window.scrollY - 150;
      window.scrollTo({ top: Math.max(0, top), behavior: "instant" as ScrollBehavior });
    }
  };

  return (
    <section aria-label="Browse the tracker by team" className="max-w-[720px] mx-auto px-5 pt-10">
      <div className="border border-black/[0.08] rounded-2xl p-5 sm:p-6 bg-white shadow-[0_1px_10px_rgba(10,23,51,0.04)]">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-blue-dark m-0">
            Browse by Team
          </h2>
          <span className="text-[11px] font-medium text-black/45">
            Tap a team for every jersey we&rsquo;ve logged
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-4">
          {divisions.map((div) => (
            <div key={div}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/40 mb-1.5">
                {div}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {teams
                  .filter((t) => t.division === div)
                  .map((t) => {
                    const isActive = selected === t.key;
                    const disabled = t.games.length === 0;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelected(isActive ? null : t.key)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[12px] font-semibold transition-colors ${
                          isActive
                            ? "bg-blue-dark text-white border-blue-dark"
                            : disabled
                              ? "border-black/[0.06] text-black/30 cursor-default"
                              : "border-black/10 text-blue-dark hover:border-black/30"
                        }`}
                      >
                        <span
                          aria-hidden
                          className="inline-block w-2 h-2 rounded-full shrink-0"
                          style={{ background: t.color, opacity: disabled ? 0.35 : 1 }}
                        />
                        {t.name}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        {active && (
          <div className="mt-5 pt-4 border-t border-black/[0.07]">
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <p className="text-sm font-extrabold text-blue-dark m-0">
                {active.name}
                <span className="ml-2 text-[11px] font-semibold text-black/40">
                  {active.games.length} game{active.games.length === 1 ? "" : "s"} logged
                </span>
              </p>
              <Link
                href={active.scheduleHref}
                className="text-[11px] font-bold text-[#2f6bed] hover:underline whitespace-nowrap"
              >
                Full 2026 uniform schedule &rarr;
              </Link>
            </div>
            <ul className="m-0 p-0 list-none divide-y divide-black/[0.05]">
              {active.games.map((g, i) => (
                <li key={`${g.id}-${i}`}>
                  <button
                    type="button"
                    onClick={() => jumpTo(g.id)}
                    className="w-full text-left py-2 flex items-center gap-3 group"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wide text-black/40 w-12 shrink-0">
                      {g.day}
                    </span>
                    <span className="text-[13px] font-semibold text-blue-dark truncate group-hover:text-[#2f6bed] transition-colors">
                      {g.opp}
                    </span>
                    <span className="ml-auto flex items-center gap-2.5 shrink-0">
                      {g.uniform && (
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-black/45">
                          {g.uniform}
                        </span>
                      )}
                      {g.grade && (
                        <span className="text-[11px] font-extrabold text-[#7a9e17] tabular-nums">
                          {g.grade}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
