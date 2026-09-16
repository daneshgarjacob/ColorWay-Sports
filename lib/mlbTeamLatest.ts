// Pulls a single team's most recent logged game out of the MLB daily tracker so
// the team's SCHEDULE POST — the page that actually ranks — can answer "what did
// they wear last night" with live data.
//
// Why here and not on the tracker page: measured 2026-08-14, the league-wide
// tracker earns 136 clicks/28d on purely navigational queries, while the team
// schedule posts earn 1,400+ each on team queries. Google is right to send
// "what are the Dodgers wearing" to the Dodgers page. So rather than fight that,
// the freshness moves onto the page that already wins.

import { buildMlbTeamIndex, type TeamGame } from "./mlbTrackerTeamIndex";
import { mlbEtTodayParts } from "./mlbConfirmed";

export type TeamLatest = {
  team: string;
  /** Most recent logged game, or null if the team has none yet. */
  latest: TeamGame | null;
  /**
   * True when that game is being played TODAY (US Eastern, the day the MLB
   * schedule is keyed to). We log a slate as it is confirmed, so the newest
   * game is often in progress rather than finished, and "wore ... last night"
   * would be describing a game that is still going on.
   */
  latestIsToday: boolean;
  /** Total games logged for this team, for the "we track all of it" line. */
  logged: number;
  /** Anchor back into the tracker for the exact game card. */
  trackerHref: string;
};

/**
 * Resolve a schedule-post slug (e.g. "dodgers-uniform-schedule-2026") to that
 * team's latest tracker appearance. Returns null for any slug that is not an
 * MLB team schedule post, so callers can render nothing.
 */
export function getTeamLatestFromTracker(
  trackerHtml: string,
  slug: string,
  now: Date = new Date(),
): TeamLatest | null {
  const entries = buildMlbTeamIndex(trackerHtml);
  const entry = entries.find((t) => t.scheduleHref === `/stories/${slug}`);
  if (!entry) return null;

  // buildMlbTeamIndex walks the tracker in document order and the tracker is
  // newest-day-first, so games[0] is the most recent appearance.
  const latest = entry.games[0] ?? null;

  // Tracker games carry "September" / 15 rather than an ISO date, and the
  // tracker is a single season, so month + day is enough to spot today.
  const today = mlbEtTodayParts(now);
  const latestIsToday = Boolean(
    latest && latest.month === today.month && latest.date === today.date,
  );

  return {
    team: entry.name,
    latest,
    latestIsToday,
    logged: entry.games.length,
    trackerHref: latest
      ? `/stories/mlb-uniform-tracker-2026#${latest.id}`
      : "/stories/mlb-uniform-tracker-2026",
  };
}

/**
 * The question phrasings this block is built to own, per Jake 2026-08-14.
 * Kept here so the visible copy and the FAQ schema can never drift apart.
 *
 * `isToday` flips the two answered-with-data questions into the present tense.
 * A game that is in progress right now is not "last night", and the third slot
 * moves forward to tomorrow so the page never asks one question twice.
 */
export function teamWearQuestions(team: string, isToday = false) {
  return {
    lastNight: isToday
      ? `What are the ${team} wearing tonight?`
      : `What did the ${team} wear last night?`,
    were: isToday
      ? `What are the ${team} wearing right now?`
      : `What were the ${team} wearing last night?`,
    tonight: isToday
      ? `What are the ${team} wearing tomorrow?`
      : `What are the ${team} wearing tonight?`,
    rightNow: `What are the ${team} wearing right now?`,
    whichJersey: `What jersey did the ${team} wear?`,
  };
}
