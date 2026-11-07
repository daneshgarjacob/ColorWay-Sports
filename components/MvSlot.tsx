// Mediavine in-feed ad spot for listing pages (homepage, /stories, team pages,
// /tonight, My Teams). Mediavine support (Mary Parks, 11/6) sent these targets:
// their script fills each one on load. They have to be in the server-rendered
// markup because anything added after load is wiped by React. Mediavine drops
// its ad box NEXT TO the target, not inside it (11/6 dev logs: hydration
// failed on the wrapper around a homepage spot), so the target is written as
// raw HTML inside an outer div React treats as opaque; the injected sibling
// then lives inside that div and React never sees it. col-span-full lets a
// spot sit inside a card grid and take the whole row.
const CLASS = {
  all: "mv_slot_target",
  desktop: "mv_slot_target_desktop",
  mobile: "mv_slot_target_mobile",
} as const;

export default function MvSlot({ device = "all", className = "" }: { device?: keyof typeof CLASS; className?: string }) {
  return (
    <div
      className={`col-span-full ${className}`.trim()}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: `<div class="${CLASS[device]}" data-slot="content"></div>` }}
    />
  );
}

// Card-grid spots per Mediavine's recipe: an all-devices spot after every 6th
// card (only when more cards follow) and a mobile-only spot after the 3rd card
// of each group of six.
export function slotAfterCard(i: number, total: number) {
  const n = i + 1;
  if (n % 6 === 0 && n < total) return <MvSlot key={`mv-${n}`} />;
  if (n % 6 === 3 && n < total) return <MvSlot key={`mv-${n}`} device="mobile" />;
  return null;
}
