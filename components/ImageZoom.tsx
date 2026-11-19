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
// Week-grid cells (college posts) whose date has a matching game write-up
// below ("**September 6 vs. Washington State.**") become a jump to that
// paragraph. Cells with no write-up (NFL posts, which have none) stay as they
// were.


// Styles live here (not only in globals.css) so the lightbox works even when a
// cached stylesheet is served; globals.css keeps the same rules as a fallback.
const ZOOM_CSS = `
.cw-zoomable{cursor:zoom-in}
.cw-zoomable:focus-visible,.cw-jump:focus-visible{outline:3px solid #0b5cff;outline-offset:3px}
.cw-jump{cursor:pointer;transition:transform .15s ease}
@media (hover:hover){.cw-jump:hover{transform:translateY(-2px)}}
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

/** Game write-up paragraph for a grid cell like "SEP 6", or null. */
function findWriteUp(cell: HTMLElement, root: HTMLElement): HTMLElement | null {
  const first = cell.firstElementChild?.textContent?.trim() || "";
  const m = /^([A-Z]{3})\s+(\d{1,2})$/.exec(first);
  if (!m || !MONTHS[m[1]]) return null;
  const want = `${MONTHS[m[1]]} ${m[2]}`;
  for (const strong of root.querySelectorAll<HTMLElement>("p > strong:first-child")) {
    const t = strong.textContent?.trim() || "";
    if (t === want || t.startsWith(`${want} `) || t.startsWith(`${want}.`) || t.startsWith(`${want},`)) {
      return strong.parentElement;
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

    // Mark the week-grid cells that have a write-up to jump to.
    for (const root of document.querySelectorAll<HTMLElement>(".prose")) {
      for (const grid of root.querySelectorAll<HTMLElement>('div[style*="grid"]')) {
        for (const cell of Array.from(grid.children) as HTMLElement[]) {
          if (cell.tagName !== "DIV" || cell.closest("a")) continue;
          const target = findWriteUp(cell, root);
          if (!target) continue;
          if (!target.id) target.id = `game-${(cell.firstElementChild?.textContent || "").trim().toLowerCase().replace(/\s+/g, "-")}`;
          cell.classList.add("cw-jump");
          cell.dataset.jump = target.id;
          cell.tabIndex = 0;
          cell.setAttribute("role", "link");
          const matchup = cell.children[1]?.textContent?.trim();
          cell.setAttribute("aria-label", `Jump to the ${matchup ? `${matchup} ` : ""}game details`);
        }
      }
    }

    const open = (img: HTMLImageElement) => {
      setShown({ src: img.currentSrc || img.src, alt: img.getAttribute("alt") || "" });
    };
    const jump = (cell: HTMLElement) => {
      const target = cell.dataset.jump ? document.getElementById(cell.dataset.jump) : null;
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
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
