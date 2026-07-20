"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TeamGame } from "@/lib/mlbTrackerTeamIndex";

type Scope = "all" | "home" | "road";

const TRACKER_SLUG = "mlb-uniform-tracker-2026";

// Uniform usage with a home/road filter. Picking "At Home" answers the question
// Jake actually asks of this page: which jerseys has this club worn at home,
// and on exactly which days.
export default function TeamUniformBreakdown({
  teamName,
  games,
}: {
  teamName: string;
  games: TeamGame[];
}) {
  const [scope, setScope] = useState<Scope>("all");

  // The hero stat tiles link to #usage-home / #usage-road, so honour that.
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash;
      if (h === "#usage-home") setScope("home");
      else if (h === "#usage-road") setScope("road");
      else if (h === "#usage") setScope("all");
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const filtered = games.filter((g) =>
    scope === "all" ? true : scope === "home" ? g.home : !g.home,
  );

  // Group the filtered games by uniform, most-worn first.
  const byUniform = new Map<
    string,
    { uniform: string; color?: string; img?: string; games: TeamGame[] }
  >();
  for (const g of filtered) {
    const key = g.uniform || "Unlogged";
    let u = byUniform.get(key);
    if (!u) {
      u = { uniform: key, color: g.uniformColor, img: g.img, games: [] };
      byUniform.set(key, u);
    }
    u.games.push(g);
    if (!u.img && g.img) u.img = g.img;
  }
  const uniforms = [...byUniform.values()].sort(
    (a, b) => b.games.length - a.games.length || a.uniform.localeCompare(b.uniform),
  );

  const tabs: Array<{ id: Scope; label: string; count: number }> = [
    { id: "all", label: "All Games", count: games.length },
    { id: "home", label: "At Home", count: games.filter((g) => g.home).length },
    { id: "road", label: "On the Road", count: games.filter((g) => !g.home).length },
  ];

  return (
    <section id="usage" className="max-w-[860px] mx-auto px-5 pt-12 scroll-mt-24">
      <h2 className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-blue-dark mb-1">
        Uniform Usage
      </h2>
      <p className="text-[13px] text-black/45 mt-0 mb-4">
        Which jerseys the {teamName} have worn, and exactly which days they wore them.
      </p>

      <div
        role="tablist"
        aria-label="Filter uniform usage by home or road"
        className="inline-flex rounded-xl border border-black/[0.09] p-1 bg-[#f6f7f9] mb-5"
      >
        {tabs.map((t) => {
          const active = scope === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setScope(t.id)}
              className={`px-3.5 py-2 rounded-lg text-[13px] font-bold transition-colors ${
                active ? "bg-white text-blue-dark shadow-[0_1px_3px_rgba(10,23,51,0.12)]" : "text-black/50 hover:text-black/75"
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-[11px] font-semibold ${active ? "text-black/40" : "text-black/30"}`}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {uniforms.length === 0 ? (
        <p className="text-[14px] text-black/50 m-0">
          No {scope === "home" ? "home" : "road"} games logged for the {teamName} yet.
        </p>
      ) : (
        <div className="grid gap-3">
          {uniforms.map((u) => (
            <div key={u.uniform} className="border border-black/[0.08] rounded-xl p-4 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-[#f2f3f6] flex items-center justify-center shrink-0 overflow-hidden">
                  {u.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.img}
                      alt={`${teamName} ${u.uniform}`}
                      className="max-h-[52px] max-w-full object-contain"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="w-5 h-5 rounded-full border border-black/15"
                      style={{ background: u.color || "#dcdce2" }}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-blue-dark m-0">{u.uniform}</p>
                  <p className="text-[12px] text-black/45 m-0 mt-0.5">
                    <strong className="text-black/70">{u.games.length}</strong>{" "}
                    {u.games.length === 1 ? "game" : "games"}
                    {scope === "all" && (
                      <>
                        {" "}&middot; {u.games.filter((g) => g.home).length} home &middot;{" "}
                        {u.games.filter((g) => !g.home).length} road
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-black/[0.06]">
                {u.games.map((g, i) => (
                  <Link
                    key={`${g.id}-${i}`}
                    href={`/stories/${TRACKER_SLUG}#${g.id}`}
                    title={`${g.day} — ${g.home ? "vs" : "at"} ${g.oppName}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-black/[0.09] bg-[#fafbfc] hover:border-black/30 transition-colors"
                  >
                    <span className="text-[11.5px] font-bold text-blue-dark">{g.day}</span>
                    <span className="text-[10.5px] text-black/40">
                      {g.home ? "vs" : "at"} {g.oppName}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
