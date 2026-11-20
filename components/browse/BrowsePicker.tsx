"use client";

import Link from "next/link";
import { useState } from "react";
import { LEAGUE_HUBS, groupPath, groupsOf, type HubLeague } from "@/lib/teamGroups";

// "Browse By Team" on /news (11/19). /news is a static page, so this does not
// filter the feed in place (that would make the page per-request). Tapping a
// league opens its divisions or conferences right here; each chip goes to that
// static page (/nfl/afc-west), where every team and its stories are one tap away.

const CHIP =
  "shrink-0 inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 font-display text-[14px] font-extrabold whitespace-nowrap transition-colors";

export default function BrowsePicker() {
  const [open, setOpen] = useState<HubLeague | null>(null);
  const hub = LEAGUE_HUBS.find((h) => h.key === open);
  return (
    <nav aria-label="Browse by league, division and team" className="pt-5">
      <h2 className="font-display text-[12px] font-extrabold tracking-[0.18em] uppercase text-steel m-0 mb-2">Browse By Team</h2>
      <div className="flex items-center gap-2 -mx-5 px-5 overflow-x-auto chip-scroll pb-1">
        {LEAGUE_HUBS.map((h) => (
          <button
            key={h.key}
            type="button"
            aria-expanded={open === h.key}
            onClick={() => setOpen(open === h.key ? null : h.key)}
            className={`${CHIP} gap-1.5 ${open === h.key ? "bg-navy-deep border-navy-deep text-white" : "bg-white border-border text-black hover:border-black/30"}`}
          >
            {h.name}
            <svg width="12" height="12" aria-hidden="true" className={`transition-transform duration-200 ${open === h.key ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ))}
        <Link prefetch={false} href="/my-teams" className={`${CHIP} bg-white border-border text-black hover:border-black/30`}>
          My Teams
        </Link>
      </div>
      {hub && (
        <div className="flex items-center gap-2 -mx-5 px-5 overflow-x-auto chip-scroll pb-1 pt-2">
          <Link prefetch={false} href={hub.path} className={`${CHIP} bg-white border-orange text-orange`}>
            All {hub.name} Teams
          </Link>
          {groupsOf(hub.key).map((x) => (
            <Link prefetch={false} key={x.slug} href={groupPath(x)} className={`${CHIP} bg-white border-border text-black hover:border-black/30`}>
              {x.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
