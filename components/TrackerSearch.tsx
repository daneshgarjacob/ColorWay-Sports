"use client";

import { useMemo, useRef, useState } from "react";
import type { JumpNavItem } from "@/components/TrackerJumpNav";

// Sticky search bar under the site header on the MLB daily tracker.
// A real text box: type any team, matchup, or day and jump straight to the
// card. Beats the old dropdown once the log runs dozens of games deep.
export default function TrackerSearch({
  items,
  unitLabel = "games logged",
  placeholder = "Search a team, matchup, or day…",
}: {
  items: JumpNavItem[];
  unitLabel?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as JumpNavItem[];
    return items
      .filter((i) => {
        const hay = `${i.label} ${i.group || ""}`.toLowerCase();
        return q.split(/\s+/).every((word) => hay.includes(word));
      })
      .slice(0, 8);
  }, [items, query]);

  if (items.length === 0) return null;

  const jumpTo = (id: string) => {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) {
      history.replaceState(null, "", `#${id}`);
      // Instant jump with an offset that clears the sticky header + this bar.
      // (Smooth scrolling silently dies on these very long tracker pages as
      // lazy-loading images reflow the layout mid-animation.)
      const top = el.getBoundingClientRect().top + window.scrollY - 150;
      window.scrollTo({ top: Math.max(0, top), behavior: "instant" as ScrollBehavior });
    }
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[active] || results[0];
      if (pick) jumpTo(pick.id);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <nav
      aria-label="Search games"
      className="sticky top-[80px] sm:top-[100px] z-40 bg-white/85 supports-[backdrop-filter]:bg-white/75 backdrop-blur-xl border-b border-black/[0.07] shadow-[0_1px_8px_rgba(10,23,51,0.05)]"
    >
      <div className="max-w-[720px] mx-auto px-5 py-2.5 flex items-center gap-3">
        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A8F98] whitespace-nowrap">
          {items.length} {unitLabel}
        </span>
        <div className="relative flex-1 min-w-0">
          <span
            aria-hidden
            className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open && results.length > 0}
            aria-controls="tracker-search-results"
            autoComplete="off"
            value={query}
            placeholder={placeholder}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={onKeyDown}
            className="w-full text-sm font-semibold text-blue-dark bg-white border border-black/10 rounded-lg pl-9 pr-8 py-1.5 placeholder:text-black/40 placeholder:font-medium hover:border-black/25 focus:outline-none focus:ring-2 focus:ring-[#2f6bed]/40 transition-colors duration-150"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setQuery("");
                setOpen(false);
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/35 hover:text-black/70 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          {open && results.length > 0 && (
            <ul
              id="tracker-search-results"
              role="listbox"
              className="absolute left-0 right-0 top-[calc(100%+6px)] max-h-[60vh] overflow-y-auto bg-white border border-black/10 rounded-xl shadow-[0_12px_40px_rgba(10,23,51,0.16)] py-1.5 z-50"
            >
              {results.map((item, i) => (
                <li key={item.id} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => jumpTo(item.id)}
                    className={`w-full text-left px-4 py-2 flex items-baseline justify-between gap-3 transition-colors ${
                      i === active ? "bg-[#2f6bed]/[0.08]" : "hover:bg-black/[0.03]"
                    }`}
                  >
                    <span className="text-sm font-semibold text-blue-dark truncate">
                      {item.label}
                    </span>
                    {item.group && (
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-black/40 whitespace-nowrap">
                        {item.group}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}
