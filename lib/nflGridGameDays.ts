// Adds the game day and, for prime-time games, the broadcast's own logo to every
// cell of an NFL schedule post's week grid (Jake 11/4: "this uniform calendar
// should show what day of the week the game is and if its primetime").
//
// The grid in each "<team>-uniform-schedule-2026" post only carries the week, so
// this reads the exact kickoff from content/data/nfl-kickoffs-2026.json (refresh
// with `node scripts/fetch-nfl-kickoffs.mjs` when the league flexes a game) and
// rewrites the HTML at render time. The posts themselves never change, so
// lib/nflTrackerTeamIndex.ts keeps parsing the same cells.
//
// Prime time is read off the Eastern kickoff: Thursday night = TNF (Prime Video,
// from Week 2; the Week 1 Thursday is the league's own opener), Sunday night =
// SNF, Monday night = MNF. Thanksgiving night (NBC), Black Friday, Christmas and
// the December Saturdays are different deals, so they get the day and no badge.

import kickoffData from "@/content/data/nfl-kickoffs-2026.json";

type Kickoff = { week: number; away: string; home: string; kickoff: string; timeSet?: boolean };
const KICKOFFS = (kickoffData as { games: Kickoff[] }).games;

const BADGES = {
  TNF: { alt: "Thursday Night Football", light: "/logos/primetime/tnf.png", dark: "/logos/primetime/tnf.png" },
  SNF: { alt: "Sunday Night Football", light: "/logos/primetime/snf.png", dark: "/logos/primetime/snf-white.png" },
  MNF: { alt: "Monday Night Football", light: "/logos/primetime/mnf.png", dark: "/logos/primetime/mnf.png" },
} as const;

// Same cell shape lib/nflTrackerTeamIndex.ts parses: an outer styled div around
// WEEK n / matchup / jersey.
const CELL = new RegExp(
  '(<div style="([^"]*)">\\s*<div style="[^"]*">WEEK\\s*(\\d+)</div>' +
    '\\s*<div style="[^"]*">.*?</div>' +
    '\\s*<div style="[^"]*">.*?</div>)',
  "gs",
);

/** Where the section after the week grid starts: the first <h2> past the last
 *  WEEK cell. Not simply the post's second <h2>, because about half the posts
 *  open with a section ahead of the grid. -1 when no <h2> follows it. */
export function nflGridEnd(html: string): number {
  const last = [...html.matchAll(/>WEEK\s*\d+<\/div>/g)].at(-1);
  if (last?.index === undefined) return -1;
  const next = html.slice(last.index).search(/<h2\b/);
  return next < 0 ? -1 : last.index + next;
}

function et(ms: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", hour: "numeric", hour12: false,
  }).formatToParts(new Date(ms));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { weekday: get("weekday"), month: get("month"), day: get("day"), hour: Number(get("hour")) % 24 };
}

function primeTime(week: number, ms: number, timeSet: boolean): keyof typeof BADGES | null {
  if (!timeSet) return null;
  const { weekday, month, day, hour } = et(ms);
  if (hour < 19) return null;
  if (weekday === "Thu") return week >= 2 && !(month === "Nov" && Number(day) >= 22 && Number(day) <= 28) ? "TNF" : null;
  if (weekday === "Sun") return "SNF";
  if (weekday === "Mon") return "MNF";
  return null;
}

// Dark tiles (team color, navy) get the white SNF wordmark; light ones the black.
function isDark(style: string): boolean {
  const hex = /background:\s*#([0-9a-f]{6})/i.exec(style)?.[1];
  if (!hex) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b < 150;
}

export function addNflGameDays(html: string, nickname: string): string {
  return html.replace(CELL, (cell: string, _all: string, style: string, weekStr: string) => {
    const week = Number(weekStr);
    const k = KICKOFFS.find((g) => g.week === week && (g.away === nickname || g.home === nickname));
    if (!k) return cell; // bye
    const ms = Date.parse(k.kickoff);
    const { weekday, month, day } = et(ms);
    const pt = primeTime(week, ms, k.timeSet !== false);
    const dayLine = `<div style="font-size: 0.66em; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; opacity: 0.8; margin-top: 6px;">${weekday} · ${month} ${day}</div>`;
    const badge = pt
      ? `<img src="${isDark(style) ? BADGES[pt].dark : BADGES[pt].light}" alt="${BADGES[pt].alt}" title="${BADGES[pt].alt}" style="display: block; height: 30px; width: auto; max-width: 90%; margin: 6px auto 0; border-radius: 0; box-shadow: none;" loading="lazy" />`
      : "";
    return cell + dayLine + badge;
  });
}
