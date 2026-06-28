"use client";

import { useState, useEffect, useCallback } from "react";
import {
  playerById,
  formation,
  posLabel,
  lastName,
  dealOptions,
  firstEmptySlot,
  TOTAL_SLOTS,
  type Player,
  type Squad,
} from "@/lib/wcSquadDraft";

const STORE_KEY = "cw-wc2026-xi-v1";
const BRAND = "#2f6bed";
const NAVY = "#0a1f4d";
const PITCH = "#15803d";

function Flag({ code, h = 16 }: { code: string; h?: number }) {
  return (
    <span style={{ display: "inline-block", width: Math.round(h * 1.4), height: h, borderRadius: 2, overflow: "hidden", flexShrink: 0, boxShadow: "0 0 0 1px rgba(0,0,0,0.18)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/flags/${code}.png`} alt="" width={Math.round(h * 1.4)} height={h} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </span>
  );
}

function usedIds(squad: Squad, exceptSlot?: string): Set<string> {
  const s = new Set<string>();
  for (const [slot, id] of Object.entries(squad)) if (slot !== exceptSlot) s.add(id);
  return s;
}

// Visual pitch rows, top (attack) to bottom (keeper).
const ROWS: { label: string; ids: string[] }[] = [
  { label: "Forwards", ids: ["f1", "f2", "f3"] },
  { label: "Midfield", ids: ["m1", "m2", "m3"] },
  { label: "Defense", ids: ["d1", "d2", "d3", "d4"] },
  { label: "Goalkeeper", ids: ["gk"] },
];

export default function WorldCupSquadDraft() {
  const [squad, setSquad] = useState<Squad>({});
  const [active, setActive] = useState<string>("gk");
  const [options, setOptions] = useState<Player[]>([]);
  const [mounted, setMounted] = useState(false);

  const redeal = useCallback((slot: string, sq: Squad) => {
    const def = formation.find((s) => s.id === slot)!;
    setOptions(dealOptions(def.pos, usedIds(sq, slot)));
  }, []);

  useEffect(() => {
    let sq: Squad = {};
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) sq = JSON.parse(raw);
    } catch {}
    const start = firstEmptySlot(sq) ?? "gk";
    // One-time hydration from localStorage (syncing from an external store on mount).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSquad(sq);
    setActive(start);
    redeal(start, sq);
    setMounted(true);
  }, [redeal]);

  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(squad));
      } catch {}
    }
  }, [squad, mounted]);

  const selectSlot = useCallback((slot: string) => {
    setActive(slot);
    redeal(slot, squad);
  }, [redeal, squad]);

  const draft = useCallback((playerId: string) => {
    setSquad((prev) => {
      const next = { ...prev, [active]: playerId };
      const nextSlot = firstEmptySlot(next);
      const target = nextSlot ?? active;
      setActive(target);
      redeal(target, next);
      return next;
    });
  }, [active, redeal]);

  const shuffle = useCallback(() => redeal(active, squad), [active, redeal, squad]);

  const reset = useCallback(() => {
    setSquad({});
    setActive("gk");
    redeal("gk", {});
  }, [redeal]);

  const filled = Object.keys(squad).length;
  const complete = filled === TOTAL_SLOTS;
  const activeDef = formation.find((s) => s.id === active)!;

  const share = useCallback(async () => {
    const url = drawShareImage(squad);
    if (!url) return;
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], "my-world-cup-xi.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean; share?: (d: unknown) => Promise<void> };
      if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: "My 2026 World Cup XI", text: "I drafted my 2026 World Cup XI on ColorWay Sports." });
        return;
      }
    } catch {}
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-world-cup-xi.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [squad]);

  return (
    <div className="not-prose">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="text-sm text-gray-500">
          <span className="font-bold tabular-nums" style={{ color: NAVY }}>{filled}</span>/{TOTAL_SLOTS} drafted
        </div>
        <div className="flex gap-2">
          <button onClick={share} className="px-3.5 py-2 rounded-lg text-[13px] font-bold text-white transition active:scale-95" style={{ background: BRAND }}>Share XI</button>
          <button onClick={reset} className="px-3.5 py-2 rounded-lg text-[13px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">Reset</button>
        </div>
      </div>

      {/* Pitch */}
      <div className="rounded-2xl p-4 sm:p-6 mb-5" style={{ background: `linear-gradient(160deg, #1a8f45 0%, ${PITCH} 100%)`, boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.12)" }}>
        <div className="space-y-4 sm:space-y-6">
          {ROWS.map((row) => (
            <div key={row.label} className="flex justify-center gap-2 sm:gap-4">
              {row.ids.map((id) => {
                const pid = squad[id];
                const pl = pid ? playerById[pid] : null;
                const isActive = active === id;
                return (
                  <button
                    key={id}
                    onClick={() => selectSlot(id)}
                    className="flex flex-col items-center gap-1 rounded-xl px-1.5 py-2 w-[72px] sm:w-[92px] transition"
                    style={{
                      background: pl ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.10)",
                      boxShadow: isActive ? `0 0 0 2.5px #ffffff, 0 0 0 5px ${BRAND}` : "none",
                    }}
                  >
                    {pl ? (
                      <>
                        <Flag code={pl.flag} h={18} />
                        <span className="text-[11px] sm:text-[12px] font-extrabold leading-tight text-center" style={{ color: NAVY }}>{lastName(pl.name)}</span>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ width: 22, height: 22, background: "rgba(255,255,255,0.22)" }}>{formation.find((s) => s.id === id)!.pos}</span>
                        <span className="text-[10px] font-bold text-white/80">Pick</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Draft board */}
      {complete ? (
        <div className="rounded-2xl p-5 text-center" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${BRAND} 100%)` }}>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: "#bcd0f5" }}>Your XI is set</div>
          <div className="text-white text-lg font-extrabold mb-3">All 11 drafted. Share your 2026 World Cup XI.</div>
          <button onClick={share} className="px-5 py-2.5 rounded-lg text-sm font-bold bg-white" style={{ color: NAVY }}>Share your XI</button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">On the clock</div>
              <div className="text-lg font-extrabold" style={{ color: NAVY }}>Pick your {posLabel[activeDef.pos]}</div>
            </div>
            <button onClick={shuffle} className="px-3 py-2 rounded-lg text-[13px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition shrink-0">↻ Shuffle 5</button>
          </div>
          {mounted && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {options.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => draft(pl.id)}
                  className="flex items-center gap-3 text-left px-3.5 py-3 rounded-xl border border-gray-200 bg-white hover:border-[#2f6bed] hover:bg-blue-50 transition"
                >
                  <Flag code={pl.flag} h={22} />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-bold text-gray-900 truncate">{pl.name}</span>
                    <span className="block text-[11px] text-gray-500">{pl.team} · {posLabel[pl.pos]}</span>
                  </span>
                  <span className="ml-auto text-[11px] font-bold text-[#2f6bed] shrink-0">Draft →</span>
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3">Tap a player to draft them into your {posLabel[activeDef.pos].toLowerCase()} slot, or tap any spot on the pitch to redraft it. Hit Shuffle for five new options.</p>
        </div>
      )}
    </div>
  );
}

// ---- Share image (native canvas, no deps) ----
function drawShareImage(squad: Squad): string | null {
  if (Object.keys(squad).length === 0) return null;
  const W = 1080, H = 1080;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return null;

  // pitch
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#1a8f45");
  g.addColorStop(1, "#0f5f30");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 150, W - 80, H - 260);
  ctx.beginPath(); ctx.arc(W / 2, (150 + (H - 110)) / 2, 90, 0, Math.PI * 2); ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 54px Inter, system-ui, sans-serif";
  ctx.fillText("My 2026 World Cup XI", W / 2, 95);

  const rows: { ids: string[]; y: number }[] = [
    { ids: ["f1", "f2", "f3"], y: 320 },
    { ids: ["m1", "m2", "m3"], y: 520 },
    { ids: ["d1", "d2", "d3", "d4"], y: 720 },
    { ids: ["gk"], y: 900 },
  ];
  for (const row of rows) {
    const n = row.ids.length;
    row.ids.forEach((id, i) => {
      const x = (W * (i + 1)) / (n + 1);
      const pid = squad[id];
      const pl = pid ? playerById[pid] : null;
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath(); ctx.arc(x, row.y, 30, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 26px Inter, system-ui, sans-serif";
      ctx.fillText(pl ? lastName(pl.name) : "—", x, row.y + 62);
    });
  }

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "700 26px Inter, system-ui, sans-serif";
  ctx.fillText("colorwaysports.com  ·  Draft your XI", W / 2, H - 36);
  return c.toDataURL("image/png");
}
