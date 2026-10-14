import { ARTICLE_ROW, ARTICLE_COL } from "@/lib/articleColumn";
import { isLogHeading, type HeadingItem } from "@/lib/posts";
import { buildNflTeamIndex } from "@/lib/nflTrackerTeamIndex";
import { allTeamKeys, teamMetaByKey } from "@/lib/mlbTrackerTeamIndex";
import { buildWinterIndex } from "@/lib/winterTrackerIndex";

// Compact shortcut bar at the top of the three live league trackers.
//
// The trackers are very long on a phone (the NFL one runs ~57,000px) and the
// first screen used to be all intro. This puts the two things a reader came for
// above the fold: a jump to the newest week/day, and their team's calendar.
//
// Server-rendered on purpose: the 30+ team links are plain <a> tags in the HTML
// (internal links crawlers can follow) and nothing here moves after load. It sits
// OUTSIDE the <article>, so Mediavine's in-content ad insertion never lands in it.

type Chip = { href: string; name: string; logo: string };

interface TrackerConfig {
  league: string;
  /** Picks the newest log heading and the label for the jump link. */
  jump: (headings: HeadingItem[]) => { id: string; label: string } | null;
  chips: () => Chip[];
  hub: { href: string; label: string };
  /** Optional second destination, shown beside the "Your team's calendar" label. */
  also?: { href: string; label: string };
}

const MONTH_SHORT: Record<string, string> = {
  January: "Jan", February: "Feb", March: "Mar", April: "Apr", May: "May", June: "Jun",
  July: "Jul", August: "Aug", September: "Sep", October: "Oct", November: "Nov", December: "Dec",
};

// "Tuesday, October 13" -> "Tue, Oct 13". Falls back to the raw text.
function shortDay(text: string): string {
  const m = /^([A-Z][a-z]+),\s+([A-Z][a-z]+)\s+(\d{1,2})/.exec(text);
  if (!m) return text;
  return `${m[1].slice(0, 3)}, ${MONTH_SHORT[m[2]] ?? m[2]} ${m[3]}`;
}

// MLB and NHL log one h2 per day ("Tuesday, October 13"), newest first.
function latestDay(headings: HeadingItem[]) {
  const h = headings.find((x) => x.level === 2 && isLogHeading(x.text));
  return h ? { id: h.id, label: `Jump to ${shortDay(h.text)}` } : null;
}

const byName = (a: Chip, b: Chip) => a.name.localeCompare(b.name);

const TRACKERS: Record<string, TrackerConfig> = {
  "nfl-uniform-tracker-2026": {
    league: "NFL",
    // NFL groups days under a "Week 5: …" h2; the first one is the current week.
    jump: (headings) => {
      const h = headings.find((x) => x.level === 2 && /^Week\s+\d+/i.test(x.text));
      if (!h) return latestDay(headings);
      const week = /^Week\s+(\d+)/i.exec(h.text)![1];
      return { id: h.id, label: `Jump to Week ${week}` };
    },
    chips: () =>
      buildNflTeamIndex()
        .map((t) => ({ href: `/nfl-tracker/${t.key}`, name: t.nickname, logo: t.logo }))
        .sort(byName),
    hub: { href: "/nfl-tracker", label: "All 32 calendars" },
    // The schedule post is still the right place for the league-wide week grid.
    also: { href: "/stories/nfl-uniform-schedule-2026", label: "2026 schedule guide" },
  },
  "mlb-uniform-tracker-2026": {
    league: "MLB",
    jump: latestDay,
    chips: () =>
      allTeamKeys()
        .map((key) => teamMetaByKey(key))
        .filter((t): t is NonNullable<ReturnType<typeof teamMetaByKey>> => !!t)
        .map((t) => ({ href: `/mlb-tracker/${t.key}`, name: t.name, logo: t.logo }))
        .sort(byName),
    hub: { href: "/mlb-tracker", label: "All 30 calendars" },
  },
  "nhl-uniform-tracker-2026-27": {
    league: "NHL",
    jump: latestDay,
    chips: () =>
      buildWinterIndex()
        .filter((t) => t.league === "nhl")
        .map((t) => ({ href: `/nhl-tracker/${t.key}`, name: t.nickname, logo: t.logo }))
        .sort(byName),
    hub: { href: "/nhl-tracker", label: "All 32 calendars" },
  },
};

export default function TrackerToolbar({ slug, headings }: { slug: string; headings: HeadingItem[] }) {
  const cfg = TRACKERS[slug];
  if (!cfg) return null;

  const jump = cfg.jump(headings);
  const chips = cfg.chips();
  if (!jump && chips.length === 0) return null;

  return (
    <nav aria-label={`${cfg.league} tracker shortcuts`} className={`${ARTICLE_ROW} pt-5 sm:pt-6`}>
      <div className={ARTICLE_COL}>
        <div className="flex items-center justify-between gap-3 h-10">
          {jump ? (
            <a
              href={`#${jump.id}`}
              className="inline-flex items-center gap-2 h-10 pl-4 pr-3.5 rounded-full bg-blue-dark text-white text-[13.5px] font-bold tracking-[0.005em] whitespace-nowrap hover:bg-[#2f6bed] transition-colors"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {jump.label}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </a>
          ) : (
            <span />
          )}
          <a
            href={cfg.hub.href}
            className="text-[12.5px] font-bold text-[#2f6bed] whitespace-nowrap hover:underline"
          >
            {cfg.hub.label}&nbsp;&rarr;
          </a>
        </div>

        {chips.length > 0 && (
          <>
            <div className="mt-4 mb-2 flex items-baseline justify-between gap-3">
              <p className="m-0 text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/45">
                Your team&rsquo;s calendar
              </p>
              {cfg.also && (
                <a
                  href={cfg.also.href}
                  className="text-[12px] font-semibold text-black/55 whitespace-nowrap hover:text-[#2f6bed] hover:underline"
                >
                  {cfg.also.label}&nbsp;&rarr;
                </a>
              )}
            </div>
            {/* Phones: one row that scrolls sideways, fading at the right edge so
                it reads as scrollable. sm+: the names drop and the logos wrap into
                two tidy rows, so desktop readers never have to scroll sideways. */}
            <ul
              className="m-0 p-0 list-none flex gap-2 overflow-x-auto overscroll-x-contain -mx-5 px-5 pb-1 sm:mx-0 sm:px-0 sm:pb-0 sm:flex-wrap sm:overflow-visible sm:gap-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,#000_85%,transparent)] sm:[mask-image:none]"
            >
              {chips.map((c) => (
                <li key={c.href} className="shrink-0">
                  <a
                    href={c.href}
                    title={`${c.name} uniform calendar`}
                    aria-label={`${c.name} uniform calendar`}
                    className="flex items-center gap-1.5 h-10 pl-2.5 pr-3 sm:w-9 sm:h-9 sm:p-0 sm:justify-center rounded-full border border-black/10 bg-white text-[13px] font-semibold text-blue-dark whitespace-nowrap hover:border-[#2f6bed] hover:text-[#2f6bed] transition-colors"
                  >
                    {c.logo ? (
                      <img src={c.logo} alt="" width={22} height={22} loading="lazy" decoding="async" className="w-[22px] h-[22px] object-contain shrink-0" />
                    ) : (
                      <span aria-hidden className="w-[22px] h-[22px] shrink-0" />
                    )}
                    <span className="sm:sr-only">{c.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </nav>
  );
}
