import fs from "node:fs";
import path from "node:path";

// WORLD SERIES MODE for the homepage (Jake approved the mock 10/16). The band
// switches itself on when MLB's schedule names the AL opponent in the World
// Series games, or when an ALCS team reaches 4 wins. Both come from
// scripts/data/mlb-postseason-results-2026.json, which
// `node scripts/mlb-postseason-results.mjs` rewrites during the nightly pass.
// Jerseys come from the same scripts/mlb-confirmed/<date>.json files the MLB
// tracker uses; before a game is confirmed we show the team's expected look.

type Result = {
  date: string;
  round: string; // F, D, L, W
  description: string;
  gameNumber: number | null;
  away: string;
  home: string;
  awayScore: number | null;
  homeScore: number | null;
  final: boolean;
};

export type WsTeam = {
  key: string;
  name: string;
  short: string;
  record: string;
  league: "AL" | "NL";
  logo: string;
  /** Expected World Series look at home and on the road, in tracker labels. */
  expected: { home: string; road: string };
  /** Jerseys worth listing in "October in Uniforms" even if never worn. */
  watch?: string[];
};

const TEAMS: Record<string, WsTeam> = {
  brewers: {
    key: "brewers",
    name: "Brewers",
    short: "MIL",
    record: "103-59",
    league: "NL",
    logo: "/logos/teams-hd/mlb-brewers.png",
    expected: { home: "Home Cream", road: "Navy Alternate" },
    watch: ["Powder Blue Road"],
  },
  rays: {
    key: "rays",
    name: "Rays",
    short: "TB",
    record: "98-64",
    league: "AL",
    logo: "/logos/teams-hd/mlb-rays.png",
    expected: { home: "Home White", road: "Road Gray" },
  },
  guardians: {
    key: "guardians",
    name: "Guardians",
    short: "CLE",
    record: "85-77",
    league: "AL",
    logo: "/logos/teams-hd/mlb-guardians.png",
    expected: { home: "Red Alternate", road: "Road Gray" },
  },
};

// Short jersey names for the game strip and the records card.
const LABELS: Record<string, string> = {
  "Home Cream": "Cream",
  "Navy Alternate": "Navy",
  "Powder Blue Road": "Powder blue",
  "Home White": "White",
  "Road Gray": "Gray",
  "Red Alternate": "Red",
  "Devil Rays Throwback": "Devil Rays throwback",
};
export const shortLabel = (l: string) => LABELS[l] ?? l;

const root = process.cwd();
function readResults(): Result[] {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(root, "scripts", "data", "mlb-postseason-results-2026.json"), "utf8"),
    ) as Result[];
  } catch {
    return [];
  }
}
function confirmed(date: string): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, "scripts", "mlb-confirmed", `${date}.json`), "utf8"));
  } catch {
    return {};
  }
}

export type WsGame = {
  n: number;
  date: string;
  dayLabel: string;
  site: string; // short code of the home team
  ifNecessary: boolean;
  played: boolean;
  away: { key: string; short: string; jersey: string; confirmed: boolean; score: number | null };
  home: { key: string; short: string; jersey: string; confirmed: boolean; score: number | null };
};

export type WsRecordRow = { jersey: string; w: number; l: number };

export type WorldSeries = {
  nl: WsTeam;
  al: WsTeam;
  games: WsGame[];
  wins: Record<string, number>;
  next: WsGame | null;
  records: { team: WsTeam; overall: string; rows: WsRecordRow[] }[];
};

const fmtDay = (d: string) =>
  new Date(d + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
    timeZone: "UTC",
  });

function alChampion(results: Result[]): string | null {
  const ws = results.find((r) => r.round === "W" && (TEAMS[r.away] || TEAMS[r.home]));
  if (ws) {
    const k = TEAMS[ws.away]?.league === "AL" ? ws.away : TEAMS[ws.home]?.league === "AL" ? ws.home : null;
    if (k) return k;
  }
  const wins: Record<string, number> = {};
  for (const r of results) {
    if (r.round !== "L" || !r.final || r.awayScore == null || r.homeScore == null) continue;
    if (!r.description.startsWith("ALCS")) continue;
    const w = r.awayScore > r.homeScore ? r.away : r.home;
    wins[w] = (wins[w] ?? 0) + 1;
  }
  return Object.entries(wins).find(([, n]) => n >= 4)?.[0] ?? null;
}

export function getWorldSeries(): WorldSeries | null {
  const results = readResults();
  const alKey = alChampion(results);
  if (!alKey || !TEAMS[alKey]) return null;
  const nl = TEAMS.brewers;
  const al = TEAMS[alKey];

  const wins: Record<string, number> = { [nl.key]: 0, [al.key]: 0 };
  const games: WsGame[] = results
    .filter((r) => r.round === "W")
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r, i) => {
      const homeKey = TEAMS[r.home] ? r.home : nl.key === r.home ? nl.key : al.key;
      const awayKey = homeKey === nl.key ? al.key : nl.key;
      const conf = confirmed(r.date);
      const side = (key: string, isHome: boolean, score: number | null) => {
        const t = TEAMS[key];
        const c = conf[key];
        return {
          key,
          short: t.short,
          jersey: c ?? (isHome ? t.expected.home : t.expected.road),
          confirmed: Boolean(c),
          score,
        };
      };
      const g: WsGame = {
        n: r.gameNumber ?? i + 1,
        date: r.date,
        dayLabel: fmtDay(r.date),
        site: TEAMS[homeKey].short,
        ifNecessary: (r.gameNumber ?? i + 1) >= 5,
        played: r.final,
        away: side(awayKey, false, r.awayScore),
        home: side(homeKey, true, r.homeScore),
      };
      if (g.played && g.away.score != null && g.home.score != null) {
        wins[g.away.score > g.home.score ? awayKey : homeKey] += 1;
      }
      return g;
    });
  // Games 5-7 only count as "if necessary" until they are needed.
  const decided = wins[nl.key] >= 4 || wins[al.key] >= 4;
  for (const g of games) {
    const before = games.filter((x) => x.n < g.n && x.played).length;
    if (g.n >= 5 && !g.played) g.ifNecessary = !(before >= g.n - 1 && !decided);
    else if (g.played) g.ifNecessary = false;
  }
  const next = decided ? null : games.find((g) => !g.played && !g.ifNecessary) ?? null;

  // Record in each jersey across the whole postseason.
  const records = [nl, al].map((team) => {
    const rows = new Map<string, WsRecordRow>();
    let w = 0;
    let l = 0;
    for (const r of results) {
      if (!r.final || r.awayScore == null || r.homeScore == null) continue;
      if (r.away !== team.key && r.home !== team.key) continue;
      const jersey = confirmed(r.date)[team.key];
      const won = (r.away === team.key ? r.awayScore > r.homeScore : r.homeScore > r.awayScore);
      won ? w++ : l++;
      if (!jersey) continue;
      const row = rows.get(jersey) ?? { jersey, w: 0, l: 0 };
      won ? row.w++ : row.l++;
      rows.set(jersey, row);
    }
    for (const j of team.watch ?? []) if (!rows.has(j)) rows.set(j, { jersey: j, w: 0, l: 0 });
    return {
      team,
      overall: `${w}-${l}`,
      rows: [...rows.values()].sort((a, b) => b.w + b.l - (a.w + a.l)),
    };
  });

  return { nl, al, games, wins, next, records };
}
