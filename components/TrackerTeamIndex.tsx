"use client";

import { useState } from "react";
import Link from "next/link";
import { ARTICLE_ROW, ARTICLE_COL } from "@/lib/articleColumn";
import type { TeamIndexEntry } from "@/lib/mlbTrackerTeamIndex";

// "Find a team on this page" on the MLB daily tracker. It used to be a big
// 30-team Browse by Team box, which sat right under the TrackerToolbar logo row
// (the same 30 clubs, linking to their calendars) and read as a repeat. Now it is
// one line: pick a team and the page jumps to its newest game card; a second
// select reaches any older game on the page. Same h3 anchors as before; the
// page passes only games inside the rendered (trimmed) days, so every option
// lands on a real card. Older games live on the team calendars.
export default function TrackerTeamIndex({ teams }: { teams: TeamIndexEntry[] }) {
  const [selected, setSelected] = useState("");
  const [game, setGame] = useState("");

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

  const selectClass =
    "h-10 min-w-0 rounded-full border border-black/15 bg-white pl-3.5 pr-8 text-[13.5px] font-semibold text-blue-dark hover:border-black/30 focus:outline-none focus:border-[#2f6bed] appearance-none bg-no-repeat bg-[right_0.75rem_center] bg-[length:12px_12px]";
  const caret =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230a1733' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")";

  return (
    <section aria-label="Find a team on this page" className={`${ARTICLE_ROW} pt-5`}>
      <div className={`${ARTICLE_COL} flex flex-wrap items-center gap-x-3 gap-y-2`}>
        <label
          htmlFor="tracker-team-find"
          className="w-full sm:w-auto text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/45 whitespace-nowrap"
        >
          Find a team on this page
        </label>
        <select
          id="tracker-team-find"
          value={selected}
          onChange={(e) => {
            const key = e.target.value;
            setSelected(key);
            const t = teams.find((x) => x.key === key);
            const newest = t?.games[0]?.id ?? "";
            setGame(newest);
            if (newest) jumpTo(newest);
          }}
          className={`${selectClass} w-full sm:w-[170px]`}
          style={{ backgroundImage: caret }}
        >
          <option value="">Choose a team</option>
          {divisions.map((div) => (
            <optgroup key={div} label={div}>
              {teams
                .filter((t) => t.division === div)
                .map((t) => (
                  <option key={t.key} value={t.key} disabled={t.games.length === 0}>
                    {t.name}
                    {t.games.length ? ` (${t.games.length})` : " (not on this page)"}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>

        {active && active.games.length > 1 && (
          <select
            aria-label={`Jump to a ${active.name} game`}
            value={game}
            onChange={(e) => {
              setGame(e.target.value);
              if (e.target.value) jumpTo(e.target.value);
            }}
            className={`${selectClass} w-full sm:w-[230px]`}
            style={{ backgroundImage: caret }}
          >
            {active.games.map((g, i) => (
              <option key={`${g.id}-${i}`} value={g.id}>
                {g.day} {g.opp}
                {g.uniform ? ` · ${g.uniform}` : ""}
              </option>
            ))}
          </select>
        )}

        {active && (
          <Link
            prefetch={false}
            href={`/mlb-tracker/${active.key}`}
            aria-label={`${active.name} uniform calendar`}
            className="text-[12.5px] font-bold text-[#2f6bed] whitespace-nowrap hover:underline"
          >
            Calendar&nbsp;&rarr;
          </Link>
        )}
      </div>
    </section>
  );
}
