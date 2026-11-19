"use client";

import { useEffect, useRef, useState } from "react";

// Tap-to-enlarge for jersey and uniform images, plus tap-to-jump for the
// game cells in a schedule post's week grid.
//
// Why (Clarity, Nov 2026): readers on the schedule posts and Jersey of the Day
// tap the jersey pictures and the game cells expecting something to happen,
// and nothing did. Every story renders through lib/posts.ts into a .prose
// <article>, so mounting this once on the story page covers every schedule
// post in every league (fix one team = fix all teams) without touching 248
// <img> tags across the markdown, and a new post gets it automatically.
//
// What counts as an enlargeable image: a local /images/ raster inside .prose
// (or any <img data-zoom>) that is not already inside a link or button, and is
// drawn at least 64px wide when tapped (so small logos and broadcast badges
// stay inert). The lightbox is a native <dialog>: Esc, the close button or a
// tap anywhere closes it. No dependency; nothing loads until a tap.
//
// Week-grid cells whose game has a write-up in the post become a jump to it:
// college cells by date ("**September 6 vs. Washington State.**"), NFL cells by
// week (a "... (Week 14)" section heading or a "**Week 11 ...**" paragraph;
// Clarity 11/19: readers tapped the NFL week cards and nothing happened).
// Cells with no write-up stay as they were and never look tappable.


// Styles live here (not only in globals.css) so the lightbox works even when a
// cached stylesheet is served; globals.css keeps the same rules as a fallback.
const ZOOM_CSS = `
.cw-zoomable{cursor:zoom-in}
.cw-zoomable:focus-visible,.cw-jump:focus-visible{outline:3px solid #0b5cff;outline-offset:3px}
.cw-jump{position:relative;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .15s ease,box-shadow .15s ease,filter .15s ease;box-shadow:0 1px 0 rgba(0,0,0,.06),0 2px 6px rgba(11,22,42,.10)}
.cw-jump::after{content:"\\2193";position:absolute;top:6px;right:8px;font-size:13px;font-weight:800;line-height:1;opacity:.6}
@media (hover:hover){.cw-jump:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(11,22,42,.18)}}
.cw-jump:active{transform:scale(.97);filter:brightness(.92);box-shadow:0 1px 3px rgba(11,22,42,.18)}
@keyframes cw-flash{from{background-color:rgba(255,213,79,.45)}to{background-color:transparent}}
.cw-flash{animation:cw-flash 1.8s ease-out;border-radius:6px}
.cw-lightbox{position:fixed;inset:0;width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:16px;border:0;background:transparent;display:none;align-items:center;justify-content:center;cursor:zoom-out}
.cw-lightbox[open]{display:flex}
.cw-lightbox::backdrop{background:rgba(8,12,22,.88)}
`;

const MONTHS: Record<string, string> = {
  AUG: "August", SEP: "September", OCT: "October", NOV: "November", DEC: "December", JAN: "January",
};

function eligible(img: HTMLImageElement): boolean {
  if (img.closest("a, button, [data-no-zoom]")) return false;
  if (img.hasAttribute("data-zoom")) return true;
  if (!img.closest(".prose")) return false;
  const src = img.getAttribute("src") || "";
  return src.startsWith("/images/") && !/\.svg($|\?)/i.test(src);
}

function label(img: HTMLImageElement): string {
  const alt = (img.getAttribute("alt") || "").trim();
  return alt ? `Enlarge image: ${alt}` : "Enlarge image";
}

/** Week numbers a heading covers: "(Week 14)", "(Weeks 6, 7 and 13)", "Weeks 9 and 16, Confirmed". */
function headingWeeks(text: string): number[] {
  const m = /\bWeeks?\s+(\d{1,2}(?:\s*(?:,|and|&)\s*\d{1,2})*)(\s*[-–—]|\s+(?:to|through)\s+\d)?/i.exec(text);
  // A span ("Weeks 1-8") is a season overview, not one game's write-up.
  if (!m || m[2]) return [];
  return (m[1].match(/\d{1,2}/g) || []).map(Number);
}

/**
 * The write-up for a grid cell, or null. College cells start "SEP 6" and match
 * a paragraph led by "**September 6 ...**". NFL cells start "WEEK 11" and match
 * (in order) a section heading naming that week ("Navy in Miami (Week 14)"),
 * a paragraph led by "**Week 11 ...**", or a bold "**Week 11 ...**" run inside
 * a paragraph. NFL posts split the body around the grid, so every .prose block
 * on the page is searched, never the grid itself.
 */
function findWriteUp(cell: HTMLElement, roots: HTMLElement[], grid: HTMLElement): HTMLElement | null {
  const first = cell.firstElementChild?.textContent?.trim() || "";
  const outside = (el: Element) => !grid.contains(el);

  const m = /^([A-Z]{3})\s+(\d{1,2})$/.exec(first);
  if (m && MONTHS[m[1]]) {
    const want = `${MONTHS[m[1]]} ${m[2]}`;
    for (const root of roots) {
      for (const strong of root.querySelectorAll<HTMLElement>("p > strong:first-child")) {
        const t = strong.textContent?.trim() || "";
        if (outside(strong) && (t === want || t.startsWith(`${want} `) || t.startsWith(`${want}.`) || t.startsWith(`${want},`))) {
          return strong.parentElement;
        }
      }
    }
    return null;
  }

  const w = /^WEEK\s+(\d{1,2})$/i.exec(first);
  if (!w) return null;
  const week = Number(w[1]);
  const leadsWith = (t: string) => new RegExp(`^Week\\s+${week}(?!\\d)`, "i").test(t.trim());
  for (const root of roots) {
    for (const h of root.querySelectorAll<HTMLElement>("h2, h3")) {
      if (outside(h) && headingWeeks(h.textContent || "").includes(week)) return h;
    }
  }
  for (const root of roots) {
    for (const strong of root.querySelectorAll<HTMLElement>("p > strong:first-child")) {
      if (outside(strong) && leadsWith(strong.textContent || "")) return strong.parentElement;
    }
  }
  for (const root of roots) {
    // Mid-paragraph: land on (and highlight) the bold run itself, since the
    // paragraph may cover several weeks.
    for (const strong of root.querySelectorAll<HTMLElement>("p strong")) {
      if (outside(strong) && leadsWith(strong.textContent || "")) return strong;
    }
  }
  return null;
}

export default function ImageZoom() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    // Mark the images: pointer cursor, keyboard focus, a spoken label.
    for (const img of document.querySelectorAll<HTMLImageElement>(".prose img, img[data-zoom]")) {
      if (!eligible(img)) continue;
      img.classList.add("cw-zoomable");
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", label(img));
    }

    // Mark the week-grid cells that have a write-up to jump to. The whole card
    // (week label, matchup, jersey badge, date) is the link; cells without a
    // write-up are left untouched so they never look tappable.
    const roots = Array.from(document.querySelectorAll<HTMLElement>(".prose"));
    for (const root of roots) {
      for (const grid of root.querySelectorAll<HTMLElement>('div[style*="grid"]')) {
        for (const cell of Array.from(grid.children) as HTMLElement[]) {
          if (cell.tagName !== "DIV" || cell.closest("a") || cell.querySelector("a")) continue;
          const target = findWriteUp(cell, roots, grid);
          if (!target) continue;
          if (!target.id) target.id = `game-${(cell.firstElementChild?.textContent || "").trim().toLowerCase().replace(/\s+/g, "-")}`;
          cell.classList.add("cw-jump");
          cell.dataset.jump = target.id;
          cell.tabIndex = 0;
          cell.setAttribute("role", "link");
          const matchup = cell.children[1]?.textContent?.trim();
          const when = cell.firstElementChild?.textContent?.trim();
          cell.setAttribute("aria-label", `Jump to the ${when ? `${when} ` : ""}${matchup ? `${matchup} ` : ""}write-up`);
          // An image inside a jump card belongs to the card's tap, not the lightbox.
          for (const img of cell.querySelectorAll<HTMLImageElement>("img.cw-zoomable")) {
            img.classList.remove("cw-zoomable");
            img.removeAttribute("tabindex");
            img.removeAttribute("role");
            img.removeAttribute("aria-label");
          }
        }
      }
    }

    const open = (img: HTMLImageElement) => {
      setShown({ src: img.currentSrc || img.src, alt: img.getAttribute("alt") || "" });
    };
    const jump = (cell: HTMLElement) => {
      const target = cell.dataset.jump ? document.getElementById(cell.dataset.jump) : null;
      if (!target) return;
      if (/^H[23]$/.test(target.tagName)) {
        // A section heading lands near the top, clear of the sticky header.
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 96, behavior: "smooth" });
      } else {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      target.classList.remove("cw-flash");
      void target.offsetWidth; // restart the highlight animation
      target.classList.add("cw-flash");
    };
    const act = (e: Event) => {
      const el = e.target as HTMLElement | null;
      if (!el) return false;
      const img = el.closest<HTMLImageElement>("img.cw-zoomable");
      if (img && img.getBoundingClientRect().width >= 64) {
        e.preventDefault();
        open(img);
        return true;
      }
      const cell = el.closest<HTMLElement>(".cw-jump");
      if (cell) {
        e.preventDefault();
        jump(cell);
        return true;
      }
      return false;
    };
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      act(e);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const el = e.target as HTMLElement | null;
      if (el?.matches("img.cw-zoomable, .cw-jump")) act(e);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (shown && !d.open) d.showModal();
    if (!shown && d.open) d.close();
  }, [shown]);

  return (
    <>
      <style>{ZOOM_CSS}</style>
      <dialog
        ref={dialogRef}
        className="cw-lightbox"
        aria-label={shown?.alt ? `Enlarged image: ${shown.alt}` : "Enlarged image"}
        onClose={() => setShown(null)}
        onClick={() => setShown(null)}
      >
        {shown && (
          <figure style={{ margin: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <img
              src={shown.src}
              alt={shown.alt}
              style={{ display: "block", maxWidth: "94vw", maxHeight: "82vh", width: "auto", height: "auto", objectFit: "contain", borderRadius: 8, background: "#fff" }}
            />
            {shown.alt && (
              <figcaption style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.4, textAlign: "center", maxWidth: 640, padding: "0 16px" }}>
                {shown.alt}
              </figcaption>
            )}
          </figure>
        )}
        <button
          type="button"
          style={{ position: "absolute", top: "max(12px, env(safe-area-inset-top, 0px))", right: 12, width: 44, height: 44, borderRadius: 999, background: "rgba(255,255,255,0.95)", color: "#000", fontSize: 26, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", border: 0, cursor: "pointer" }}
          aria-label="Close enlarged image"
          onClick={() => setShown(null)}
        >
          &times;
        </button>
      </dialog>
    </>
  );
}
