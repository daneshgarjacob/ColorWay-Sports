"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  playerById,
  formation,
  lastName,
  dealMixed,
  squadOverall,
  verdict,
  needSummary,
  openSlotPositions,
  slotForPlayer,
  encodeSquad,
  decodeSquad,
  TOTAL_SLOTS,
  type Player,
  type Squad,
} from "@/lib/wcSquadDraft";

const STORE_KEY = "cw-wc2026-xi-v1";
const BRAND = "#2f6bed";
const NAVY = "#0a1f4d";
const PITCH = "#15803d";
const ANIM_MS = 720;
const ANIM_TICK = 80;

function ratingColor(r: number): string {
  if (r >= 88) return "#15803d";
  if (r >= 84) return "#2f6bed";
  if (r >= 80) return "#b45309";
  return "#6b7280";
}

function Flag({ code, h = 16 }: { code: string; h?: number }) {
  return (
    <span style={{ display: "inline-block", width: Math.round(h * 1.4), height: h, borderRadius: 2, overflow: "hidden", flexShrink: 0, boxShadow: "0 0 0 1px rgba(0,0,0,0.18)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/flags/${code}.png`} alt="" width={Math.round(h * 1.4)} height={h} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </span>
  );
}

const usedSet = (squad: Squad): Set<string> => new Set(Object.values(squad));

const ROWS: { ids: string[] }[] = [
  { ids: ["lw", "st", "rw"] },
  { ids: ["cm1", "cm2", "cm3"] },
  { ids: ["lb", "cb1", "cb2", "rb"] },
  { ids: ["gk"] },
];

export default function WorldCupSquadDraft() {
  const [squad, setSquad] = useState<Squad>({});
  const [display, setDisplay] = useState<Player[]>([]);
  const [shuffling, setShuffling] = useState(false);
  const [rerollUsed, setRerollUsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [copied, setCopied] = useState(false);

  const finalRef = useRef<Player[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    intervalRef.current = null;
    timeoutRef.current = null;
  };

  // Deal a fresh set of 5 mixed-position players with a visible shuffle.
  const deal = useCallback((sq: Squad) => {
    if (openSlotPositions(sq).size === 0) return;
    const exclude = usedSet(sq);
    const final = dealMixed(sq, exclude);
    finalRef.current = final;
    clearTimers();
    setShuffling(true);
    setDisplay(dealMixed(sq, exclude));
    intervalRef.current = setInterval(() => setDisplay(dealMixed(sq, exclude)), ANIM_TICK);
    timeoutRef.current = setTimeout(() => {
      clearTimers();
      setDisplay(finalRef.current);
      setShuffling(false);
    }, ANIM_MS);
  }, []);

  useEffect(() => {
    const xi = new URLSearchParams(window.location.search).get("xi");
    if (xi) {
      const shared = decodeSquad(xi);
      if (Object.keys(shared).length) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSquad(shared);
        setIsShared(true);
        setMounted(true);
        return;
      }
    }
    let sq: Squad = {};
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) sq = JSON.parse(raw);
    } catch {}
    setSquad(sq);
    if (Object.keys(sq).length < TOTAL_SLOTS) deal(sq);
    setMounted(true);
    return clearTimers;
  }, [deal]);

  useEffect(() => {
    if (mounted && !isShared) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(squad)); } catch {}
    }
  }, [squad, mounted, isShared]);

  const draft = useCallback((playerId: string) => {
    if (shuffling) return;
    const pl = playerById[playerId];
    if (!pl) return;
    setSquad((prev) => {
      const slot = slotForPlayer(prev, pl);
      if (!slot) return prev;
      const next = { ...prev, [slot]: playerId };
      if (openSlotPositions(next).size > 0) deal(next);
      return next;
    });
  }, [deal, shuffling]);

  const reroll = useCallback(() => {
    if (shuffling || rerollUsed) return;
    setRerollUsed(true);
    setSquad((sq) => { deal(sq); return sq; });
  }, [deal, shuffling, rerollUsed]);

  const reset = useCallback(() => {
    setSquad({});
    setRerollUsed(false);
    deal({});
  }, [deal]);

  const startOwn = useCallback(() => { window.location.assign("/world-cup-fantasy-draft"); }, []);

  const filled = Object.keys(squad).length;
  const complete = filled === TOTAL_SLOTS;
  const ovr = squadOverall(squad);
  const v = ovr != null ? verdict(ovr) : null;
  const needs = needSummary(squad);

  const share = useCallback(async () => {
    const o = squadOverall(squad);
    if (o == null) return;
    const vd = verdict(o);
    const url = `${window.location.origin}/world-cup-fantasy-draft?xi=${encodeSquad(squad)}`;
    const text = `My 2026 World Cup XI scored ${o} OVR — ${vd.label} ${vd.emoji}. Think you can draft a better one?`;
    const nav = navigator as Navigator & { share?: (d: unknown) => Promise<void> };
    if (nav.share) {
      try { await nav.share({ title: "My 2026 World Cup XI", text, url }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  }, [squad]);

  const ovrBadge = (
    <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-white" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${BRAND} 100%)` }} title="Average FIFA-style overall rating of your drafted players">
      <span className="text-2xl font-black tabular-nums leading-none">{ovr ?? "--"}</span>
      <span className="text-[9px] font-bold uppercase tracking-wider leading-tight opacity-90">Squad<br />OVR</span>
    </div>
  );

  return (
    <div className="not-prose">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          {ovrBadge}
          <div className="text-sm text-gray-500"><span className="font-bold tabular-nums" style={{ color: NAVY }}>{filled}</span>/{TOTAL_SLOTS} drafted</div>
        </div>
        <div className="flex gap-2">
          {!isShared && <button onClick={share} className="px-3.5 py-2 rounded-lg text-[13px] font-bold text-white transition active:scale-95" style={{ background: BRAND }}>{copied ? "Link copied!" : "Share XI"}</button>}
          {!isShared && <button onClick={reset} className="px-3.5 py-2 rounded-lg text-[13px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">Reset</button>}
        </div>
      </div>

      {/* Shared-view banner */}
      {isShared && (
        <div className="rounded-2xl p-4 mb-5 flex flex-wrap items-center justify-between gap-3" style={{ background: "#eef3ff", border: "1px solid #cfdcff" }}>
          <div className="text-sm font-semibold" style={{ color: NAVY }}>
            You&apos;re viewing a shared XI{v ? <> — <strong>{ovr} OVR · {v.label}</strong> {v.emoji}</> : ""}. Think you can beat it?
          </div>
          <button onClick={startOwn} className="px-4 py-2 rounded-lg text-[13px] font-bold text-white shrink-0" style={{ background: BRAND }}>Draft your own XI →</button>
        </div>
      )}

      {/* Pitch */}
      <div className="rounded-2xl p-4 sm:p-6 mb-5" style={{ background: `linear-gradient(160deg, #1a8f45 0%, ${PITCH} 100%)`, boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.12)" }}>
        <div className="space-y-4 sm:space-y-6">
          {ROWS.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-2 sm:gap-4">
              {row.ids.map((id) => {
                const pid = squad[id];
                const pl = pid ? playerById[pid] : null;
                return (
                  <div key={id} className="flex flex-col items-center gap-1 rounded-xl px-1.5 py-2 w-[72px] sm:w-[92px]" style={{ background: pl ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.10)" }}>
                    {pl ? (
                      <>
                        <Flag code={pl.flag} h={18} />
                        <span className="text-[11px] sm:text-[12px] font-extrabold leading-tight text-center" style={{ color: NAVY }}>{lastName(pl.name)}</span>
                        <span className="text-[10px] font-black tabular-nums leading-none" style={{ color: ratingColor(pl.rating) }}>{pl.rating}</span>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ width: 22, height: 22, background: "rgba(255,255,255,0.22)" }}>{formation.find((s) => s.id === id)!.pos}</span>
                        <span className="text-[10px] font-bold text-white/80">Open</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Verdict (complete) or draft board */}
      {complete ? (
        <div className="rounded-2xl p-6 text-center text-white" style={{ background: v?.champion ? "linear-gradient(135deg, #b8860b 0%, #f5c542 50%, #b8860b 100%)" : `linear-gradient(135deg, ${NAVY} 0%, ${BRAND} 100%)` }}>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: v?.champion ? "#3a2c00" : "#bcd0f5" }}>Your team would reach the</div>
          <div className="text-4xl mb-1">{v?.emoji}</div>
          <div className="text-3xl sm:text-4xl font-black mb-1" style={{ color: v?.champion ? "#2a1f00" : "#fff" }}>{v?.label}</div>
          <div className="text-sm font-semibold mb-1" style={{ color: v?.champion ? "#3a2c00" : "rgba(255,255,255,0.9)" }}>{ovr} overall · {v?.blurb}</div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button onClick={share} className="px-5 py-2.5 rounded-lg text-sm font-bold bg-white" style={{ color: NAVY }}>{copied ? "Link copied!" : "Send to friends"}</button>
            {!v?.champion && <button onClick={reset} className="px-5 py-2.5 rounded-lg text-sm font-bold" style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>Re-draft</button>}
          </div>
          {!v?.champion && <div className="text-xs mt-3" style={{ color: v?.champion ? "#3a2c00" : "rgba(255,255,255,0.75)" }}>Only a near-perfect XI reaches World Cup Winner. Re-draft and chase it.</div>}
        </div>
      ) : isShared ? null : (
        <div>
          <div className="flex items-center justify-between mb-2 gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">On the clock · pick any position</div>
              <div className="text-lg font-extrabold" style={{ color: NAVY }}>Draft your next player</div>
            </div>
            <button onClick={reroll} disabled={shuffling || rerollUsed} className={`px-3 py-2 rounded-lg text-[13px] font-bold transition shrink-0 ${rerollUsed || shuffling ? "text-gray-400 bg-gray-100 cursor-not-allowed" : "text-gray-700 bg-gray-100 hover:bg-gray-200"}`}>
              {rerollUsed ? "Re-roll used" : "🎲 Re-roll (1 left)"}
            </button>
          </div>
          {needs.length > 0 && (
            <div className="text-[12px] text-gray-500 mb-3">
              Still need: {needs.map((n) => `${n.left} ${n.pos}`).join("  ·  ")}
            </div>
          )}
          {mounted && (
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${shuffling ? "opacity-90" : ""}`}>
              {display.map((pl, i) => (
                <button key={`${i}-${pl.id}`} onClick={() => draft(pl.id)} disabled={shuffling} className={`flex items-center gap-3 text-left px-3.5 py-3 rounded-xl border bg-white transition ${shuffling ? "border-gray-200 blur-[0.4px] scale-[0.99]" : "border-gray-200 hover:border-[#2f6bed] hover:bg-blue-50"}`}>
                  <Flag code={pl.flag} h={22} />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-bold text-gray-900 truncate">{pl.name}</span>
                    <span className="block text-[11px] text-gray-500">{pl.team} · {pl.positions.join("/")}</span>
                  </span>
                  <span className="ml-auto flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center justify-center rounded-md text-[13px] font-black text-white tabular-nums" style={{ width: 34, height: 28, background: ratingColor(pl.rating) }}>{pl.rating}</span>
                    {!shuffling && <span className="text-[11px] font-bold text-[#2f6bed]">Draft →</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3">
            {shuffling ? "Shuffling the deck…" : "Each turn you are dealt five random players across the positions you still need. Pick the best fit — you only get one re-roll for the whole draft."}
          </p>
        </div>
      )}
    </div>
  );
}
