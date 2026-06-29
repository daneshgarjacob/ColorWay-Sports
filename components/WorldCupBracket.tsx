"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  teams,
  rounds,
  tiesByRound,
  tieById,
  participants,
  slotLeaves,
  pickWinner,
  champion,
  results,
  effectivePicks,
  flagEmoji,
  encodePicks,
  decodePicks,
  type Picks,
  type RoundId,
  type Tie,
  type Slot,
  type Result,
} from "@/lib/wcBracket";

const STORE_KEY = "cw-wc2026-bracket-v1";
const BRAND = "#2f6bed";
const NAVY = "#0a1f4d";
const TOTAL_TIES = 31; // 16 + 8 + 4 + 2 + 1

// R32 order for the desktop bracket so each tie sits next to its R16 feeder partner
// (matches the FotMob R16 pairings).
const DESKTOP_R32_ORDER = [
  "r32-3", "r32-6", "r32-1", "r32-4",
  "r32-12", "r32-11", "r32-10", "r32-9",
  "r32-2", "r32-5", "r32-7", "r32-8",
  "r32-15", "r32-14", "r32-13", "r32-16",
];

function Flag({ code, h = 16 }: { code: string; h?: number }) {
  return (
    <span style={{ display: "inline-block", width: Math.round(h * 1.4), height: h, borderRadius: 2, overflow: "hidden", flexShrink: 0, boxShadow: "0 0 0 1px rgba(0,0,0,0.12)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/flags/${code}.png`} alt="" width={Math.round(h * 1.4)} height={h} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </span>
  );
}

function placeholderText(slot: Slot): string {
  const leaves = slotLeaves(slot);
  if (leaves.length <= 4) return `Winner of ${leaves.join(" / ")}`;
  return `Winner — ${leaves.length} teams left`;
}

function TeamRow({
  teamKey, slot, selected, clickable, onClick, compact, dim, lockedWin,
}: {
  teamKey: string | null; slot: Slot; selected: boolean; clickable: boolean;
  onClick: () => void; compact?: boolean; dim?: boolean; lockedWin?: boolean;
}) {
  const pad = compact ? "px-2.5 py-1.5" : "px-3 py-2.5";
  if (!teamKey) {
    return (
      <div className={`flex items-center gap-2 ${pad} text-gray-400 ${compact ? "text-[11px]" : "text-[12px]"} italic`}>
        <span className="inline-block rounded-full bg-gray-200 shrink-0" style={{ width: compact ? 16 : 18, height: compact ? 11 : 13 }} />
        <span className="truncate">{placeholderText(slot)}</span>
      </div>
    );
  }
  const team = teams[teamKey];
  const bg = selected ? (lockedWin ? NAVY : BRAND) : undefined;
  return (
    <button
      type="button" onClick={onClick} disabled={!clickable}
      className={`flex items-center gap-2 w-full text-left ${pad} transition ${
        selected ? "text-white font-bold" : clickable ? "text-gray-800 font-semibold hover:bg-blue-50" : "text-gray-700 font-semibold"
      } ${clickable ? "cursor-pointer" : "cursor-default"} ${dim ? "opacity-45" : ""}`}
      style={bg ? { background: bg } : undefined}
    >
      <Flag code={team.flag} h={compact ? 15 : 18} />
      <span className={`truncate ${compact ? "text-[12.5px]" : "text-[14px]"} ${dim ? "line-through" : ""}`}>{team.name}</span>
      {selected && <span className="ml-auto text-[10px] font-bold opacity-90">{lockedWin ? "✓" : "▶"}</span>}
    </button>
  );
}

function TieCard({
  tie, picks, onPick, result, compact,
}: {
  tie: Tie; picks: Picks; onPick: (tieId: string, teamKey: string) => void; result?: Result; compact?: boolean;
}) {
  const [pa, pb] = participants(tie.id, picks);
  const ready = pa !== null && pb !== null;
  const chosen = picks[tie.id];
  const locked = !!result;
  const clickable = ready && !locked;
  return (
    <div
      className={`rounded-xl border bg-white overflow-hidden ${ready ? "border-gray-200" : "border-dashed border-gray-200"}`}
      style={chosen ? { boxShadow: `0 0 0 1.5px ${locked ? NAVY : BRAND}` } : { boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
    >
      {locked && (
        <div className="flex items-center justify-center gap-1.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-white" style={{ background: NAVY }}>
          <span>Final</span><span className="opacity-60">·</span><span>{result!.score}</span>
        </div>
      )}
      <TeamRow teamKey={pa} slot={tie.a} selected={chosen === pa && !!pa} clickable={clickable} onClick={() => pa && onPick(tie.id, pa)} compact={compact} dim={locked && chosen !== pa} lockedWin={locked && chosen === pa} />
      <div className="border-t border-gray-100" />
      <TeamRow teamKey={pb} slot={tie.b} selected={chosen === pb && !!pb} clickable={clickable} onClick={() => pb && onPick(tie.id, pb)} compact={compact} dim={locked && chosen !== pb} lockedWin={locked && chosen === pb} />
    </div>
  );
}

export default function WorldCupBracket() {
  const [picks, setPicks] = useState<Picks>({});
  const [activeRound, setActiveRound] = useState<RoundId>("r32");
  const [mounted, setMounted] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If the URL carries a shared bracket (?b=), load it in read-only "viewing" mode
    // without touching the visitor's own saved bracket.
    const b = new URLSearchParams(window.location.search).get("b");
    if (b) {
      const shared = decodePicks(b);
      if (Object.keys(shared).length) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPicks(shared);
        setIsShared(true);
        setMounted(true);
        return;
      }
    }
    let saved: Picks | null = null;
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch {}
    if (saved) setPicks(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isShared) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(picks)); } catch {}
    }
  }, [picks, mounted, isShared]);

  const onPick = useCallback((tieId: string, teamKey: string) => {
    if (results[tieId]) return;
    setPicks((p) => pickWinner(p, tieId, teamKey));
  }, []);

  const reset = useCallback(() => { setPicks({}); setActiveRound("r32"); }, []);
  const startOwn = useCallback(() => { window.location.assign("/world-cup-rooting-guide"); }, []);

  const eff = effectivePicks(picks);
  const champKey = champion(eff);
  const decided = Object.keys(eff).length;
  const roundCount = (r: RoundId) => tiesByRound(r).filter((x) => eff[x.id]).length;

  const scrollToRound = useCallback((id: RoundId) => {
    setActiveRound(id);
    const idx = rounds.findIndex((r) => r.id === id);
    const sc = scrollerRef.current;
    if (sc) sc.scrollTo({ left: idx * sc.clientWidth, behavior: "smooth" });
  }, []);

  const onScroll = useCallback(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const idx = Math.round(sc.scrollLeft / sc.clientWidth);
    const id = rounds[Math.max(0, Math.min(rounds.length - 1, idx))].id;
    setActiveRound((prev) => (prev === id ? prev : id));
  }, []);

  const share = useCallback(async () => {
    const e = effectivePicks(picks);
    const code = encodePicks(e);
    const url = `${window.location.origin}/world-cup-rooting-guide?b=${code}`;
    const champ = champion(e);
    const lead = champ
      ? `My pick to win the 2026 World Cup is ${teams[champ].name} ${flagEmoji(teams[champ].flag)}`
      : "Check out my 2026 World Cup bracket";
    const text = `${lead} — see my full bracket and fill out your own:`;
    const nav = navigator as Navigator & { share?: (d: unknown) => Promise<void> };
    if (nav.share) {
      try { await nav.share({ title: "My 2026 World Cup Bracket", text, url }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  }, [picks]);

  return (
    <div className="not-prose">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="text-sm text-gray-500">
          <span className="font-bold tabular-nums" style={{ color: NAVY }}>{decided}</span>/{TOTAL_TIES} spots filled
        </div>
        <div className="flex gap-2">
          <button onClick={share} className="px-3.5 py-2 rounded-lg text-[13px] font-bold text-white transition active:scale-95" style={{ background: BRAND }}>
            {copied ? "Link copied!" : "Share bracket"}
          </button>
          <button onClick={reset} className="px-3.5 py-2 rounded-lg text-[13px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">Reset</button>
        </div>
      </div>

      {/* Shared-view banner */}
      {isShared && (
        <div className="rounded-2xl p-4 mb-5 flex flex-wrap items-center justify-between gap-3" style={{ background: "#eef3ff", border: "1px solid #cfdcff" }}>
          <div className="text-sm font-semibold" style={{ color: NAVY }}>
            You&apos;re viewing a shared bracket{champKey ? <> — <strong>{teams[champKey].name}</strong> to win {flagEmoji(teams[champKey].flag)}</> : ""}.
          </div>
          <button onClick={startOwn} className="px-4 py-2 rounded-lg text-[13px] font-bold text-white shrink-0" style={{ background: BRAND }}>Start your own bracket →</button>
        </div>
      )}

      {/* Champion banner */}
      {champKey ? (
        <div className="rounded-2xl p-5 mb-6 text-center" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${BRAND} 100%)` }}>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#bcd0f5" }}>{isShared ? "Their" : "Your"} 2026 World Cup Champion</div>
          <div className="flex items-center justify-center gap-3">
            <Flag code={teams[champKey].flag} h={26} />
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{teams[champKey].name}</span>
            <span className="text-2xl">🏆</span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 p-4 mb-6 text-center text-sm text-gray-400">
          Tap a team to send them through. Fill every round to crown your champion.
        </div>
      )}

      {/* ===== Mobile / tablet: swipeable round-by-round ===== */}
      <div className="lg:hidden">
        <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1 -mx-1 px-1">
          {rounds.map((r) => {
            const active = activeRound === r.id;
            return (
              <button
                key={r.id}
                onClick={() => scrollToRound(r.id)}
                className={`shrink-0 px-3 py-2 rounded-lg text-[12.5px] font-bold transition ${active ? "text-white" : "text-gray-600 bg-gray-100 hover:bg-gray-200"}`}
                style={active ? { background: NAVY } : undefined}
              >
                {r.short}
                <span className={`ml-1.5 text-[10px] ${active ? "opacity-80" : "text-gray-400"}`}>{roundCount(r.id)}/{tiesByRound(r.id).length}</span>
              </button>
            );
          })}
        </div>
        <div className="text-center text-[11px] text-gray-400 mb-3">← swipe between rounds →</div>
        <div ref={scrollerRef} onScroll={onScroll} className="flex overflow-x-auto snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
          {rounds.map((r) => (
            <div key={r.id} className="min-w-full snap-start px-0.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-center mb-3" style={{ color: NAVY }}>{r.name}</div>
              <div className="space-y-3">
                {tiesByRound(r.id).map((tie) => (
                  <div key={tie.id}>
                    {tie.date && <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 ml-0.5">{tie.date}</div>}
                    <TieCard tie={tie} picks={eff} onPick={onPick} result={results[tie.id]} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Desktop: single-direction visual bracket ===== */}
      <div className="hidden lg:block overflow-x-auto">
        <div className="flex gap-4 min-w-[920px]">
          {rounds.map((r) => {
            const list = r.id === "r32" ? DESKTOP_R32_ORDER.map((id) => tieById[id]) : tiesByRound(r.id);
            return (
              <div key={r.id} className="flex-1 flex flex-col">
                <div className="text-[11px] font-bold uppercase tracking-wider text-center mb-3 pb-2 border-b" style={{ color: NAVY, borderColor: "#e5e7eb" }}>{r.short}</div>
                <div className="flex-1 flex flex-col justify-around gap-2">
                  {list.map((tie) =>
                    r.id === "final" ? (
                      <div key={tie.id} className="flex flex-col items-center gap-3">
                        <TieCard tie={tie} picks={eff} onPick={onPick} result={results[tie.id]} compact />
                        {champKey && (
                          <div className="text-center">
                            <div className="text-3xl">🏆</div>
                            <div className="text-[11px] font-bold mt-1" style={{ color: NAVY }}>{teams[champKey].name}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <TieCard key={tie.id} tie={tie} picks={eff} onPick={onPick} result={results[tie.id]} compact />
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
