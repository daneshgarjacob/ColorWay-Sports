"use client";

import { useState } from "react";
import { wcGroups, analyzeTeam } from "@/lib/wcRootingGuide";

const tone: Record<string, string> = {
  in: "bg-emerald-50 border-emerald-200 text-emerald-800",
  win: "bg-blue-50 border-blue-200 text-blue-800",
  help: "bg-amber-50 border-amber-200 text-amber-900",
  out: "bg-rose-50 border-rose-200 text-rose-800",
};

export default function RootingGuide() {
  const [groupId, setGroupId] = useState("A");
  const [teamKey, setTeamKey] = useState<string | null>(null);

  const group = wcGroups.find((g) => g.id === groupId)!;
  const verdict = group.ready && teamKey ? analyzeTeam(group, teamKey) : null;
  const teamColor = (k: string) => group.teams.find((t) => t.key === k)!.color;
  const teamName = (k: string) => group.teams.find((t) => t.key === k)!.name;

  // For a group at its final matchday, classify each team: clinched (through),
  // eliminated (out), or still alive — so the standings + picker can flag it.
  const statusByKey: Record<string, "in" | "out" | "live"> = {};
  if (group.ready) {
    for (const t of group.teams) {
      const tn = analyzeTeam(group, t.key).tone;
      statusByKey[t.key] = tn === "in" ? "in" : tn === "out" ? "out" : "live";
    }
  }

  return (
    <div className="not-prose">
      {/* Group selector */}
      <div className="mb-5">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Pick the group</div>
        <div className="flex flex-wrap gap-2">
          {wcGroups.map((g) => (
            <button
              key={g.id}
              onClick={() => { setGroupId(g.id); setTeamKey(null); }}
              className={`w-10 h-10 rounded-lg text-sm font-extrabold transition ${
                g.id === groupId ? "bg-[#003087] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } ${!g.ready ? "opacity-60" : ""}`}
              title={g.ready ? `Group ${g.id}` : `Group ${g.id} — final matchday ${g.finalDate}`}
            >
              {g.id}
            </button>
          ))}
        </div>
      </div>

      {group.ready ? (
        <>
          {/* Standings + fixtures */}
          <div className="rounded-2xl border border-gray-200 p-5 mb-5">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Group {group.id} — standings before the final matchday
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-[11px] uppercase tracking-wide">
                  <th className="text-left font-semibold pb-2">Team</th>
                  <th className="text-center font-semibold pb-2 w-12">Pts</th>
                  <th className="text-center font-semibold pb-2 w-12">GD</th>
                  <th className="text-center font-semibold pb-2 w-12">GF</th>
                </tr>
              </thead>
              <tbody>
                {group.teams.map((t) => (
                  <tr key={t.key} className={`border-t border-gray-100 ${statusByKey[t.key] === "out" ? "opacity-50" : ""}`}>
                    <td className="py-2.5 font-semibold text-gray-800">
                      <span className="inline-block w-2.5 h-2.5 rounded-full mr-2.5 align-middle" style={{ background: t.color }} />
                      <span className={statusByKey[t.key] === "out" ? "line-through" : ""}>{t.name}</span>
                      {statusByKey[t.key] === "in" && <span className="ml-2 align-middle text-[9px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">Through</span>}
                      {statusByKey[t.key] === "out" && <span className="ml-2 align-middle text-[9px] font-bold uppercase tracking-wide text-rose-700 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5">Out</span>}
                    </td>
                    <td className="text-center tabular-nums text-gray-700">{t.pts}</td>
                    <td className="text-center tabular-nums text-gray-700">{t.gd > 0 ? "+" : ""}{t.gd}</td>
                    <td className="text-center tabular-nums text-gray-700">{t.gf}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-5 mb-2">Final matchday · {group.finalDate}</div>
            <div className="space-y-2">
              {group.fixtures.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-800">
                  <span>
                    <span className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle" style={{ background: teamColor(f.home) }} />
                    {teamName(f.home)}
                  </span>
                  <span className="text-gray-400 text-xs tracking-widest">VS</span>
                  <span>
                    {teamName(f.away)}
                    <span className="inline-block w-2.5 h-2.5 rounded-full ml-2 align-middle" style={{ background: teamColor(f.away) }} />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Team picker */}
          <div className="mb-5">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Who are you rooting for?</div>
            <div className="grid grid-cols-2 gap-2.5">
              {group.teams.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTeamKey(t.key)}
                  className={`flex items-center gap-2.5 text-left px-4 py-3 rounded-xl font-bold text-[15px] border transition ${
                    teamKey === t.key ? "border-[#003087] bg-[#003087]/5 ring-1 ring-[#003087]" : "border-gray-200 hover:bg-gray-50"
                  } ${statusByKey[t.key] === "out" ? "opacity-55" : ""}`}
                >
                  <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ background: t.color }} />
                  <span className={statusByKey[t.key] === "out" ? "line-through" : ""}>{t.name}</span>
                  {statusByKey[t.key] === "out" && <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-rose-600">Out</span>}
                  {statusByKey[t.key] === "in" && <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-emerald-600">Through</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Verdict */}
          {verdict ? (
            <div className="rounded-2xl border border-gray-200 p-5">
              <span className={`inline-block text-[13px] font-extrabold rounded-full px-3.5 py-1.5 border mb-4 ${tone[verdict.tone]}`}>
                {verdict.badge}
              </span>
              <div className="mb-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Your game</div>
                <div className="text-[15px] text-gray-800">{verdict.yourGame}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">The other game</div>
                <div className="text-xl font-extrabold text-[#003087]">{verdict.rootLine}</div>
                <div className="text-sm text-gray-500 mt-1">{verdict.reason}</div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400 text-sm">
              Pick your team above to see exactly who to root for.
            </div>
          )}
        </>
      ) : (
        /* Not yet at the final matchday */
        <div className="rounded-2xl border border-gray-200 p-6">
          <span className="inline-block text-[13px] font-extrabold rounded-full px-3.5 py-1.5 border mb-4 bg-amber-50 border-amber-200 text-amber-900">
            ⏳ Final matchday · {group.finalDate}
          </span>
          <p className="text-[15px] text-gray-700 mb-5">
            Group {group.id} still has games to play. The rooting guide unlocks once these teams reach their final matchday on <strong>{group.finalDate}</strong> — check back then to see exactly who to root for.
          </p>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">The games to watch · {group.finalDate}</div>
          <div className="space-y-2">
            {group.fixtures.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-800">
                <span>
                  <span className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle" style={{ background: teamColor(f.home) }} />
                  {teamName(f.home)}
                </span>
                <span className="text-gray-400 text-xs tracking-widest">VS</span>
                <span>
                  {teamName(f.away)}
                  <span className="inline-block w-2.5 h-2.5 rounded-full ml-2 align-middle" style={{ background: teamColor(f.away) }} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
