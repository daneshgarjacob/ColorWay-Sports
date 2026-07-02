"use client";

import { useRef } from "react";

export interface JumpNavItem {
  id: string;
  label: string;
  group?: string;
}

// Slim sticky bar under the site header on long tracker posts.
// Lets readers jump straight to any match instead of scrolling 80+ cards.
export default function TrackerJumpNav({ items }: { items: JumpNavItem[] }) {
  const selectRef = useRef<HTMLSelectElement>(null);

  if (items.length === 0) return null;

  const grouped = items.some((i) => i.group);
  const groups: { name: string; items: JumpNavItem[] }[] = [];
  if (grouped) {
    for (const item of items) {
      const name = item.group || "Matches";
      const last = groups[groups.length - 1];
      if (last && last.name === name) {
        last.items.push(item);
      } else {
        groups.push({ name, items: [item] });
      }
    }
  }

  const jumpTo = (id: string) => {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) {
      history.replaceState(null, "", `#${id}`);
      el.scrollIntoView({ behavior: "smooth" });
    }
    // Reset so re-selecting the same match still works after scrolling away.
    if (selectRef.current) selectRef.current.value = "";
  };

  const renderOptions = (list: JumpNavItem[]) =>
    list.map((item) => (
      <option key={item.id} value={item.id}>
        {item.label}
      </option>
    ));

  return (
    <nav
      aria-label="Jump to match"
      className="sticky top-[80px] sm:top-[100px] z-40 bg-white/85 supports-[backdrop-filter]:bg-white/75 backdrop-blur-xl border-b border-black/[0.07] shadow-[0_1px_8px_rgba(10,23,51,0.05)]"
    >
      <div className="max-w-[720px] mx-auto px-5 py-2.5 flex items-center gap-3">
        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A8F98] whitespace-nowrap">
          {items.length} matches graded
        </span>
        <select
          ref={selectRef}
          defaultValue=""
          onChange={(e) => jumpTo(e.target.value)}
          className="flex-1 min-w-0 text-sm font-semibold text-blue-dark bg-white border border-black/10 rounded-lg px-3 py-1.5 cursor-pointer hover:border-black/25 focus:outline-none focus:ring-2 focus:ring-[#2f6bed]/40 transition-colors duration-150"
        >
          <option value="" disabled>
            Jump to a match…
          </option>
          {grouped
            ? groups.map((g) => (
                <optgroup key={g.name} label={g.name}>
                  {renderOptions(g.items)}
                </optgroup>
              ))
            : renderOptions(items)}
        </select>
      </div>
    </nav>
  );
}
