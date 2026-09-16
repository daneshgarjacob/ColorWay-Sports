import fs from "node:fs";
import path from "node:path";
import { getConfirmedUniforms, mlbEtToday } from "@/lib/mlbConfirmed";

// Tonight's MLB slate and how much of it we have confirmed, for the homepage
// band. The NFL band next to it reads "10 of 32 are confirmed by the team" off
// the schedule posts; this is the same idea for baseball, counted off the two
// files the daily pass already writes:
//
//   scripts/mlb-slate/<date>.json      { date, games: [{ away, awaySlug, ... }] }
//   scripts/mlb-confirmed/<date>.json  { "dodgers": "Blue Alternate", ... }
//
// Both are written by scripts/mlb-wearing-blocks.mjs, so the homepage never
// calls the MLB feed itself and the count can only ever be what we confirmed.
// Nothing is invented: no slate file for today means no band, and the zone
// falls back to last night's recap.

export type MlbSlateGame = {
  away: string;      // "Los Angeles Dodgers"
  awaySlug: string;  // "dodgers"
  home: string;
  homeSlug: string;
  time: string;      // "6:40 PM ET"
};

export type MlbTonight = {
  date: string;           // "2026-09-15"
  day: string;            // "Tuesday, September 15"
  games: number;          // games on tonight's slate
  confirmedGames: number; // games where we have confirmed BOTH uniforms
  confirmedTeams: number; // teams confirmed out of the ones playing tonight
  firstPitch: string;     // earliest first pitch, "6:40 PM ET"
};

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

export function buildMlbTonight(now = new Date()): MlbTonight | null {
  const date = mlbEtToday(now);
  const root = process.cwd();
  const slate = readJson<{ date: string; games: MlbSlateGame[] }>(
    path.join(root, "scripts", "mlb-slate", `${date}.json`),
  );
  if (!slate) return null;

  // one reader for the confirmed data, shared with the tonight block and wear answers
  const confirmed = getConfirmedUniforms(date);
  const games = Array.isArray(slate.games) ? slate.games : [];

  // A game counts as confirmed only when we have BOTH uniforms, so the number
  // matches what a reader sees on the tracker card for that matchup.
  const confirmedGames = games.filter((g) => confirmed[g.awaySlug] && confirmed[g.homeSlug]).length;
  const confirmedTeams = games.reduce(
    (n, g) => n + (confirmed[g.awaySlug] ? 1 : 0) + (confirmed[g.homeSlug] ? 1 : 0),
    0,
  );

  const day = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return {
    date,
    day,
    games: games.length,
    confirmedGames,
    confirmedTeams,
    firstPitch: games[0]?.time ?? "",
  };
}
