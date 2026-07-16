"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  YEARS, GRADES, GRADE_GRADIENT, logoSrc, encodeGrades, decodeGrades, fanaticsSearch,
  type Grade, type CwGrade, type LogoYear,
} from "@/lib/wsLogos";

const STORE_KEY = "cw-ws-logo-grades-v1";
const NOTES_KEY = "cw-ws-logo-notes-v1";

const solid = (g: CwGrade) => GRADE_GRADIENT[g][0];
const shine = (g: CwGrade) =>
  `linear-gradient(135deg, ${GRADE_GRADIENT[g][0]} 0%, ${GRADE_GRADIENT[g][1]} 100%)`;
/** Warm tile behind every logo so the marks pop instead of floating on white. */
const TILE = "linear-gradient(160deg, #fdf7ec 0%, #efe0c6 100%)";

export default function WorldSeriesLogoGrader({ shared }: { shared?: string }) {
  const [grades, setGrades] = useState<Record<number, Grade>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [open, setOpen] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (shared) {
      const g = decodeGrades(shared);
      if (Object.keys(g).length) {
        setGrades(g);
        setIsShared(true);
        setMounted(true);
        return;
      }
    }
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setGrades(JSON.parse(raw));
      const n = localStorage.getItem(NOTES_KEY);
      if (n) setNotes(JSON.parse(n));
    } catch {}
    setMounted(true);
  }, [shared]);

  useEffect(() => {
    if (!mounted || isShared) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(grades));
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch {}
  }, [grades, notes, mounted, isShared]);

  const graded = useMemo(() => Object.keys(grades).length, [grades]);

  const setGrade = useCallback((year: number, g: Grade) => {
    setIsShared(false);
    setGrades((p) => {
      // Tapping the grade you already gave clears it, same as the bracket's deselect.
      if (p[year] === g) { const n = { ...p }; delete n[year]; return n; }
      return { ...p, [year]: g };
    });
  }, []);

  const share = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}?g=${encodeGrades(grades)}`;
    try {
      if (navigator.share) { await navigator.share({ title: "My World Series logo grades", url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [grades]);

  const reset = useCallback(() => {
    setGrades({}); setNotes({}); setIsShared(false); setOpen(null);
  }, []);

  // Close the panel on Escape, and stop the grid scrolling behind the open panel.
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const current: LogoYear | undefined = YEARS.find((y) => y.year === open);
  const pct = Math.round((graded / YEARS.length) * 100);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
      {isShared && (
        <div style={{ margin: "0 0 20px", padding: "14px 18px", background: "#eef3fe", border: "1px solid #cfdcfb", borderRadius: 12, color: "#1b3a8f", fontSize: 15, fontWeight: 600 }}>
          You are viewing someone else&apos;s grades. Tap any logo to start your own.
        </div>
      )}

      {/* progress */}
      <div style={{ position: "sticky", top: 64, zIndex: 20, background: "#fff", borderBottom: "1px solid #eee", padding: "14px 0 12px", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 800, color: "#003087", fontSize: 15, letterSpacing: "-0.01em" }}>
            {graded} / {YEARS.length} graded
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={share} disabled={!graded}
              style={{ padding: "8px 16px", borderRadius: 999, border: "none", cursor: graded ? "pointer" : "not-allowed",
                background: graded ? "#2f6bed" : "#d8d8d8", color: "#fff", fontWeight: 800, fontSize: 13 }}>
              {copied ? "Link copied" : "Share my grades"}
            </button>
            {graded > 0 && (
              <button onClick={reset}
                style={{ padding: "8px 16px", borderRadius: 999, border: "1px solid #ddd", cursor: "pointer", background: "#fff", color: "#666", fontWeight: 700, fontSize: 13 }}>
                Reset
              </button>
            )}
          </div>
        </div>
        <div style={{ height: 5, background: "#eee", borderRadius: 999, marginTop: 10, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#003087,#2f6bed)", transition: "width .25s ease" }} />
        </div>
      </div>

      {/* grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 14 }}>
        {YEARS.map((y) => {
          const g = grades[y.year];
          return (
            <button key={y.year} onClick={() => setOpen(y.year)}
              aria-label={`Grade the ${y.year} World Series logo`}
              style={{ position: "relative", background: TILE, border: g ? `2px solid ${solid(g)}` : "1px solid rgba(0,0,0,.07)",
                borderRadius: 14, padding: "14px 10px 10px", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.07)",
                transition: "transform .12s ease, box-shadow .12s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,.16)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.07)"; }}>
              {g && (
                <span style={{ position: "absolute", top: 8, right: 8, minWidth: 24, height: 24, padding: "0 6px", borderRadius: 999, background: shine(g),
                  boxShadow: `0 2px 8px ${solid(g)}66`, color: "#fff", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{g}</span>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoSrc(y.year)} alt={`${y.year} World Series logo`} loading="lazy"
                style={{ width: "100%", height: 92, objectFit: "contain", display: "block" }} />
              <p style={{ margin: "10px 0 0", fontSize: 13, fontWeight: 800, color: "#1a1a1a" }}>{y.year}</p>
            </button>
          );
        })}
      </div>

      {/* detail panel */}
      {current && (
        <div role="dialog" aria-modal="true" aria-label={`${current.year} World Series logo`}
          onClick={() => setOpen(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(10,16,32,.62)", zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 18, maxWidth: 460, width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "24px 24px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.02em" }}>{current.year} World Series</p>
                <p style={{ margin: "3px 0 0", fontSize: 13, color: "#666", fontWeight: 600 }}>{current.result}</p>
              </div>
              <button onClick={() => setOpen(null)} aria-label="Close"
                style={{ border: "none", background: "#f2f2f2", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 17, color: "#555", lineHeight: 1 }}>×</button>
            </div>

            <div style={{ background: "linear-gradient(135deg,#F8EFE0,#E5D5BC)", borderRadius: 12, padding: 18, margin: "16px 0" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoSrc(current.year)} alt={`${current.year} World Series logo, ${current.result}`}
                style={{ width: "100%", height: 170, objectFit: "contain", display: "block" }} />
            </div>

            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888" }}>Your grade</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
              {GRADES.map((g) => {
                const on = grades[current.year] === g;
                return (
                  <button key={g} onClick={() => setGrade(current.year, g)}
                    aria-pressed={on}
                    style={{ padding: "12px 0", borderRadius: 10, cursor: "pointer", fontWeight: 900, fontSize: 17,
                      border: on ? `2px solid ${solid(g)}` : "1px solid #e0e0e0",
                      boxShadow: on ? `0 4px 14px ${solid(g)}59` : "none",
                      background: on ? shine(g) : "#fff", color: on ? "#fff" : "#555" }}>{g}</button>
                );
              })}
            </div>

            <p style={{ margin: "18px 0 8px", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888" }}>Your note</p>
            <textarea
              value={notes[current.year] ?? ""}
              onChange={(e) => { setNotes((n) => ({ ...n, [current.year]: e.target.value })); }}
              placeholder="What do you see in this one?"
              rows={3}
              style={{ width: "100%", borderRadius: 10, border: "1px solid #e0e0e0", padding: "10px 12px", fontSize: 14,
                fontFamily: "inherit", resize: "vertical", color: "#1a1a1a", boxSizing: "border-box" }} />
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#999" }}>Saved on this device. Notes stay private and are never part of a shared link.</p>

            <div style={{ marginTop: 18, padding: "13px 16px", background: "#f7f7f8", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888" }}>ColorWay Sports Grade</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#666", fontWeight: 600 }}>{current.era}</p>
              </div>
              <span style={{ minWidth: 46, height: 38, padding: "0 12px", borderRadius: 999, background: shine(current.cwGrade), color: "#fff",
                boxShadow: `0 4px 14px ${solid(current.cwGrade)}59`,
                fontSize: 17, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{current.cwGrade}</span>
            </div>

            <a href={fanaticsSearch(`${current.year} world series`)} target="_blank" rel="sponsored noopener" data-fanatics-cta
              style={{ display: "block", marginTop: 12, padding: "12px 0", borderRadius: 999, textAlign: "center",
                background: "linear-gradient(135deg, #C8102E 0%, #8B0000 100%)", color: "#fff", fontWeight: 800, fontSize: 13,
                letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none", boxShadow: "0 4px 14px rgba(200,16,46,.35)" }}>
              Shop {current.year} World Series gear
            </a>

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button
                onClick={() => { const i = YEARS.findIndex((y) => y.year === current.year); setOpen(YEARS[(i + 1) % YEARS.length].year); }}
                style={{ flex: 1, padding: "12px 0", borderRadius: 999, border: "none", background: "#003087", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                Next logo →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
