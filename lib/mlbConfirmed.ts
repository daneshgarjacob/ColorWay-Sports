// The confirmed-uniform files the daily MLB pass writes, read from the site.
//
// scripts/mlb-confirmed/<YYYY-MM-DD>.json is slug -> uniform label, e.g.
//   { "dodgers": "Blue Alternate", "reds": "Home White" }
// and it is the same file scripts/mlb-tracker-day.mjs and
// scripts/mlb-wearing-blocks.mjs read when they build the tracker day and the
// "What the <Team> Are Wearing" blocks in the schedule posts. Before this, the
// only readers were those scripts, so pages that rendered on their own (the
// /mlb-tracker/<team> "wearing today" block) fell back to a home/road guess and
// could contradict the confirmed uniform shown elsewhere on the same page.
//
// Nothing here invents a uniform. A day we have not confirmed reads as empty,
// and callers say so rather than guessing.

import fs from "fs";
import path from "path";

const confirmedDir = path.join(process.cwd(), "scripts/mlb-confirmed");

/**
 * Today in US Eastern (YYYY-MM-DD), the day MLB's schedule is keyed to and the
 * name of the confirmed file. Eastern, not local or UTC, is what the rest of
 * the MLB code uses: a 10pm ET first pitch is still "today" on the west coast,
 * and a UTC date would roll over mid-slate.
 */
export function mlbEtToday(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

/**
 * The same Eastern day as month name + date, to compare against tracker games,
 * which carry "September" / 15 rather than an ISO date.
 */
export function mlbEtTodayParts(now: Date = new Date()): {
  month: string;
  date: number;
} {
  const month = now.toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    month: "long",
  });
  const date = Number(
    now.toLocaleDateString("en-US", { timeZone: "America/New_York", day: "numeric" }),
  );
  return { month, date };
}

/** Eastern day spelled the way the schedule posts' wearing blocks stamp it. */
export function mlbEtTodayLong(now: Date = new Date()): string {
  return now.toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Tracker team key -> uniform label, for one date. */
export type ConfirmedUniforms = Record<string, string>;

/**
 * Every uniform confirmed for `date`, keyed by tracker team key ("blue-jays").
 * An unwritten or unreadable file is not an error: it means we have not
 * confirmed that day yet, and callers fall back to the expected look.
 */
export function getConfirmedUniforms(date: string = mlbEtToday()): ConfirmedUniforms {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return {};
  let raw: string;
  try {
    raw = fs.readFileSync(path.join(confirmedDir, `${date}.json`), "utf8");
  } catch {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: ConfirmedUniforms = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "string" && value.trim()) out[key] = value.trim();
    }
    return out;
  } catch {
    return {};
  }
}

/** The confirmed uniform for one club on one date, or undefined if we have none. */
export function getConfirmedUniform(
  teamKey: string,
  date: string = mlbEtToday(),
): string | undefined {
  return getConfirmedUniforms(date)[teamKey];
}
