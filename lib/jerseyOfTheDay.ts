// Jersey of the Day (MOCK, 2026-10-24, not linked from the site yet).
//
// One entry per day in content/data/jersey-of-the-day.json, keyed by Pacific
// date. Adding a day = adding one entry; nothing else changes. The page is
// static and re-renders just after midnight Pacific (same ISR hint the
// homepage uses for its daily lead, see app/page.tsx), so a new day turns
// over by itself without a deploy.

import data from "@/content/data/jersey-of-the-day.json";

export type JotdCredit = { text: string; url?: string; license?: string; licenseUrl?: string };
export type JotdStatus = "Confirmed" | "Announced" | "Scheduled" | "Projected";
export type JotdEntry = {
  date: string; // YYYY-MM-DD, Pacific
  team: string;
  teamShort: string;
  league: string;
  season: string;
  edition: string;
  jerseyName: string;
  image: string;
  imageAlt: string;
  imagePosition?: string;
  imageCaption?: string;
  credit: JotdCredit;
  worn: { date: string; matchup: string; status: JotdStatus; note?: string };
  why: string;
  whyPlaceholder?: boolean;
  story: string;
  scheduleSlug: string;
  scheduleLabel: string;
  related: { slug: string; label: string }[];
};

type RawEntry = Omit<JotdEntry, "date">;

const ALL: JotdEntry[] = Object.entries((data as { days: Record<string, RawEntry> }).days)
  .map(([date, e]) => ({ ...e, date, worn: { ...e.worn, status: e.worn.status as JotdStatus } }))
  .sort((a, b) => a.date.localeCompare(b.date));

export const JOTD_TZ = "America/Los_Angeles";

/** Today's date in Pacific time, YYYY-MM-DD. JOTD_PREVIEW_DATE overrides it
 *  at build time so a mock can be screenshotted on a future sample day. */
export function ptToday(now: Date = new Date()): string {
  const preview = process.env.JOTD_PREVIEW_DATE;
  if (preview && /^\d{4}-\d{2}-\d{2}$/.test(preview)) return preview;
  return now.toLocaleDateString("en-CA", { timeZone: JOTD_TZ });
}

/** Seconds until just after the next Pacific midnight (ISR hint). */
export function secsToPtMidnight(now: Date = new Date()): number {
  const pt = new Date(now.toLocaleString("en-US", { timeZone: JOTD_TZ }));
  const secs = pt.getHours() * 3600 + pt.getMinutes() * 60 + pt.getSeconds();
  return Math.max(300, 86_400 - secs + 120);
}

/** Entries published so far (never shows a future day). */
export function publishedEntries(today = ptToday()): JotdEntry[] {
  return ALL.filter((e) => e.date <= today);
}

/**
 * Today's pick: the entry for today, else the most recent past entry (a
 * missed day never leaves the page empty), else the first entry on file
 * (only before launch, so the mock always has something to show).
 */
export function pickFor(today = ptToday()): { entry: JotdEntry | null; isToday: boolean } {
  const past = publishedEntries(today);
  const entry = past[past.length - 1] ?? ALL[0] ?? null;
  return { entry, isToday: entry?.date === today };
}

/** The 7 days ending on `date` that have an entry, newest last. */
export function weekEnding(date: string): JotdEntry[] {
  const end = Date.parse(date + "T00:00:00Z");
  const start = end - 6 * 86_400_000;
  return ALL.filter((e) => {
    const t = Date.parse(e.date + "T00:00:00Z");
    return t >= start && t <= end;
  });
}

const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", ...opts });

/** "Monday, October 26" */
export const longDay = (d: string) => fmt(d, { weekday: "long", month: "long", day: "numeric" });
/** "Mon" */
export const shortDow = (d: string) => fmt(d, { weekday: "short" });
/** "Oct 26" */
export const shortDate = (d: string) => fmt(d, { month: "short", day: "numeric" });

/** "Worn tonight" / "Worn Sunday" / "Worn Oct 25", relative to the pick's day. */
export function wornWhen(entry: JotdEntry): string {
  const diff = (Date.parse(entry.worn.date) - Date.parse(entry.date)) / 86_400_000;
  if (diff === 0) return "Today";
  if (diff > 0 && diff < 7) return fmt(entry.worn.date, { weekday: "long" });
  return shortDate(entry.worn.date);
}
