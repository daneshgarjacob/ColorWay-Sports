"use client";

import { useState, useEffect, useCallback } from "react";
import {
  teams,
  rounds,
  tiesByRound,
  tieById,
  participants,
  slotLeaves,
  pickWinner,
  champion,
  type Picks,
  type RoundId,
  type Tie,
  type Slot,
} from "@/lib/wcBracket";

const STORE_KEY = "cw-wc2026-bracket-v1";
const BRAND = "#2f6bed";
const NAVY = "#0a1f4d";
const TOTAL_TIES = 31; // 16 + 8 + 4 + 2 + 1

// R32 order for the desktop visual bracket so each tie sits between its two feeders.
const DESKTOP_R32_ORDER = [
  "r32-1", "r32-4", "r32-2", "r32-3",
  "r32-5", "r32-6", "r32-7", "r32-8",
  "r32-9", "r32-10", "r32-11", "r32-12",
  "r32-13", "r32-16", "r32-14", "r32-15",
];

function Flag({ code, h = 16 }: { code: string; h?: number }) {
  return (
    <span
      style={{ display: "inline-block", width: Math.round(h * 1.4), height: h, borderRadius: 2, overflow: "hidden", flexShrink: 0, boxShadow: "0 0 0 1px rgba(0,0,0,0.12)" }}
    >
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
  teamKey,
  slot,
  selected,
  clickable,
  onClick,
  compact,
}: {
  teamKey: string | null;
  slot: Slot;
  selected: boolean;
  clickable: boolean;
  onClick: () => void;
  compact?: boolean;
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
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`flex items-center gap-2 w-full text-left ${pad} transition ${
        selected ? "text-white font-bold" : clickable ? "text-gray-800 font-semibold hover:bg-blue-50" : "text-gray-700 font-semibold"
      } ${clickable ? "cursor-pointer" : "cursor-default"}`}
      style={selected ? { background: BRAND } : undefined}
    >
      <Flag code={team.flag} h={compact ? 15 : 18} />
      <span className={`truncate ${compact ? "text-[12.5px]" : "text-[14px]"}`}>{team.name}</span>
      {selected && <span className="ml-auto text-[10px] font-bold opacity-90">▶</span>}
    </button>
  );
}

function TieCard({
  tie,
  picks,
  onPick,
  compact,
}: {
  tie: Tie;
  picks: Picks;
  onPick: (tieId: string, teamKey: string) => void;
  compact?: boolean;
}) {
  const [pa, pb] = participants(tie.id, picks);
  const ready = pa !== null && pb !== null;
  const chosen = picks[tie.id];
  return (
    <div
      className={`rounded-xl border bg-white overflow-hidden ${ready ? "border-gray-200" : "border-dashed border-gray-200"}`}
      style={chosen ? { boxShadow: `0 0 0 1.5px ${BRAND}` } : { boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
    >
      <TeamRow teamKey={pa} slot={tie.a} selected={chosen === pa && !!pa} clickable={ready} onClick={() => pa && onPick(tie.id, pa)} compact={compact} />
      <div className="border-t border-gray-100" />
      <TeamRow teamKey={pb} slot={tie.b} selected={chosen === pb && !!pb} clickable={ready} onClick={() => pb && onPick(tie.id, pb)} compact={compact} />
    </div>
  );
}

export default function WorldCupBracket() {
  const [picks, setPicks] = useState<Picks>({});
  const [activeRound, setActiveRound] = useState<RoundId>("r32");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setPicks(JSON.parse(raw));
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(picks));
      } catch {}
    }
  }, [picks, mounted]);

  const onPick = useCallback((tieId: string, teamKey: string) => {
    setPicks((p) => pickWinner(p, tieId, teamKey));
  }, []);

  const reset = useCallback(() => {
    setPicks({});
    setActiveRound("r32");
  }, []);

  const champKey = champion(picks);
  const decided = Object.keys(picks).length;
  const roundCount = (r: RoundId) => tiesByRound(r).filter((x) => picks[x.id]).length;

  const share = useCallback(async () => {
    const url = drawShareImage(picks);
    if (!url) return;
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], "my-world-cup-bracket.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean; share?: (d: unknown) => Promise<void> };
      if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: "My 2026 World Cup Bracket", text: "I filled out my 2026 World Cup bracket on ColorWay Sports." });
        return;
      }
    } catch {}
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-world-cup-bracket.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [picks]);

  return (
    <div className="not-prose">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="text-sm text-gray-500">
          <span className="font-bold tabular-nums" style={{ color: NAVY }}>{decided}</span>/{TOTAL_TIES} picks made
        </div>
        <div className="flex gap-2">
          <button onClick={share} className="px-3.5 py-2 rounded-lg text-[13px] font-bold text-white transition active:scale-95" style={{ background: BRAND }}>
            Share bracket
          </button>
          <button onClick={reset} className="px-3.5 py-2 rounded-lg text-[13px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">
            Reset
          </button>
        </div>
      </div>

      {/* Champion banner */}
      {champKey ? (
        <div className="rounded-2xl p-5 mb-6 text-center" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${BRAND} 100%)` }}>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#bcd0f5" }}>Your 2026 World Cup Champion</div>
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

      {/* ===== Mobile / tablet: round-by-round ===== */}
      <div className="lg:hidden">
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
          {rounds.map((r) => {
            const total = tiesByRound(r.id).length;
            const done = roundCount(r.id);
            const active = activeRound === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setActiveRound(r.id)}
                className={`shrink-0 px-3 py-2 rounded-lg text-[12.5px] font-bold transition ${active ? "text-white" : "text-gray-600 bg-gray-100 hover:bg-gray-200"}`}
                style={active ? { background: NAVY } : undefined}
              >
                {r.short}
                <span className={`ml-1.5 text-[10px] ${active ? "opacity-80" : "text-gray-400"}`}>{done}/{total}</span>
              </button>
            );
          })}
        </div>
        <div className="space-y-3">
          {tiesByRound(activeRound).map((tie) => (
            <div key={tie.id}>
              {tie.date && <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 ml-0.5">{tie.date}</div>}
              <TieCard tie={tie} picks={picks} onPick={onPick} />
            </div>
          ))}
        </div>
      </div>

      {/* ===== Desktop: full visual bracket ===== */}
      <div className="hidden lg:block overflow-x-auto">
        <div className="flex gap-4 min-w-[920px]">
          {rounds.map((r) => {
            const list = r.id === "r32" ? DESKTOP_R32_ORDER.map((id) => tieById[id]) : tiesByRound(r.id);
            return (
              <div key={r.id} className="flex-1 flex flex-col">
                <div className="text-[11px] font-bold uppercase tracking-wider text-center mb-3 pb-2 border-b" style={{ color: NAVY, borderColor: "#e5e7eb" }}>
                  {r.short}
                </div>
                <div className="flex-1 flex flex-col justify-around gap-2">
                  {list.map((tie) =>
                    r.id === "final" ? (
                      <div key={tie.id} className="flex flex-col items-center gap-3">
                        <TieCard tie={tie} picks={picks} onPick={onPick} compact />
                        {champKey && (
                          <div className="text-center">
                            <div className="text-3xl">🏆</div>
                            <div className="text-[11px] font-bold mt-1" style={{ color: NAVY }}>{teams[champKey].name}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <TieCard key={tie.id} tie={tie} picks={picks} onPick={onPick} compact />
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

// ---- Share image (native canvas, no dependencies, no external images) ----
function lum(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function drawShareImage(picks: Picks): string | null {
  const W = 1080, H = 1080;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return null;

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0a1f4d");
  grad.addColorStop(1, "#04102e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.fillStyle = "#8fb0ee";
  ctx.font = "700 30px Inter, system-ui, sans-serif";
  ctx.fillText("C O L O R W A Y   S P O R T S", W / 2, 96);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 64px Inter, system-ui, sans-serif";
  ctx.fillText("My 2026 World Cup", W / 2, 188);
  ctx.fillText("Bracket", W / 2, 262);

  const champKey = picks["final"];
  // Champion
  ctx.fillStyle = "#bcd0f5";
  ctx.font = "700 26px Inter, system-ui, sans-serif";
  ctx.fillText("MY CHAMPION", W / 2, 380);
  if (champKey) {
    const t = teams[champKey];
    ctx.fillStyle = t.color;
    roundRect(ctx, W / 2 - 320, 410, 640, 130, 24);
    ctx.fill();
    ctx.fillStyle = lum(t.color) > 0.6 ? "#0a1f4d" : "#ffffff";
    ctx.font = "800 60px Inter, system-ui, sans-serif";
    ctx.fillText(`🏆  ${t.name}`, W / 2, 493);
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "700 44px Inter, system-ui, sans-serif";
    ctx.fillText("— still picking —", W / 2, 480);
  }

  // Final
  const finalTie = tieById["final"];
  const [fa, fb] = participants("final", picks);
  ctx.fillStyle = "#bcd0f5";
  ctx.font = "700 24px Inter, system-ui, sans-serif";
  ctx.fillText("THE FINAL", W / 2, 640);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 40px Inter, system-ui, sans-serif";
  const fName = (k: string | null) => (k ? teams[k].name : "—");
  ctx.fillText(`${fName(fa)}   vs   ${fName(fb)}`, W / 2, 696);

  // Final four
  ctx.fillStyle = "#bcd0f5";
  ctx.font = "700 24px Inter, system-ui, sans-serif";
  ctx.fillText("FINAL FOUR", W / 2, 800);
  const semis = ["qf-1", "qf-2", "qf-3", "qf-4"].map((id) => picks[id]);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 32px Inter, system-ui, sans-serif";
  const ff = semis.map((k) => (k ? teams[k].name : "—")).join("    ·    ");
  ctx.fillText(ff, W / 2, 852);

  ctx.fillStyle = "#8fb0ee";
  ctx.font = "700 28px Inter, system-ui, sans-serif";
  ctx.fillText("colorwaysports.com  ·  Make your picks", W / 2, 1010);

  void finalTie;
  return c.toDataURL("image/png");
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
