import fs from "node:fs";
import path from "node:path";
import { mlbEtToday } from "@/lib/mlbConfirmed";

// NBA slate for the homepage band: today's games (ET), or the next night with
// games when today has none. Jerseys come from the official 2026-27 uniform
// schedule (scripts/data/nba-announced-uniforms-2026-27.json), grades from our
// own pre-game calls (scripts/data/nba-matchup-grades-2026-27.json).

const TEAMS: Record<string, { name: string; city: string; slug: string; logo: string }> = {
  ATL: { name: "Hawks", city: "Atlanta", slug: "hawks", logo: "nba-atlanta-hawks" },
  BOS: { name: "Celtics", city: "Boston", slug: "celtics", logo: "nba-boston-celtics" },
  BKN: { name: "Nets", city: "Brooklyn", slug: "nets", logo: "nba-brooklyn-nets" },
  CHA: { name: "Hornets", city: "Charlotte", slug: "hornets", logo: "nba-charlotte-hornets" },
  CHI: { name: "Bulls", city: "Chicago", slug: "bulls", logo: "nba-chicago-bulls" },
  CLE: { name: "Cavaliers", city: "Cleveland", slug: "cavaliers", logo: "nba-cleveland-cavaliers" },
  DAL: { name: "Mavericks", city: "Dallas", slug: "mavericks", logo: "nba-dallas-mavericks" },
  DEN: { name: "Nuggets", city: "Denver", slug: "nuggets", logo: "nba-denver-nuggets" },
  DET: { name: "Pistons", city: "Detroit", slug: "pistons", logo: "nba-detroit-pistons" },
  GSW: { name: "Warriors", city: "Golden State", slug: "warriors", logo: "nba-golden-state-warriors" },
  HOU: { name: "Rockets", city: "Houston", slug: "rockets", logo: "nba-houston-rockets" },
  IND: { name: "Pacers", city: "Indiana", slug: "pacers", logo: "nba-indiana-pacers" },
  LAC: { name: "Clippers", city: "LA", slug: "clippers", logo: "nba-la-clippers" },
  LAL: { name: "Lakers", city: "Los Angeles", slug: "lakers", logo: "nba-los-angeles-lakers" },
  MEM: { name: "Grizzlies", city: "Memphis", slug: "grizzlies", logo: "nba-memphis-grizzlies" },
  MIA: { name: "Heat", city: "Miami", slug: "miami-heat", logo: "nba-miami-heat" },
  MIL: { name: "Bucks", city: "Milwaukee", slug: "bucks", logo: "nba-milwaukee-bucks" },
  MIN: { name: "Timberwolves", city: "Minnesota", slug: "timberwolves", logo: "nba-minnesota-timberwolves" },
  NOP: { name: "Pelicans", city: "New Orleans", slug: "pelicans", logo: "nba-new-orleans-pelicans" },
  NYK: { name: "Knicks", city: "New York", slug: "knicks", logo: "nba-new-york-knicks" },
  OKC: { name: "Thunder", city: "Oklahoma City", slug: "oklahoma-city-thunder", logo: "nba-oklahoma-city-thunder" },
  ORL: { name: "Magic", city: "Orlando", slug: "orlando-magic", logo: "nba-orlando-magic" },
  PHI: { name: "76ers", city: "Philadelphia", slug: "76ers", logo: "nba-philadelphia-76ers" },
  PHX: { name: "Suns", city: "Phoenix", slug: "suns", logo: "nba-phoenix-suns" },
  POR: { name: "Trail Blazers", city: "Portland", slug: "trail-blazers", logo: "nba-portland-trail-blazers" },
  SAC: { name: "Kings", city: "Sacramento", slug: "sacramento-kings", logo: "nba-sacramento-kings" },
  SAS: { name: "Spurs", city: "San Antonio", slug: "spurs", logo: "nba-san-antonio-spurs" },
  TOR: { name: "Raptors", city: "Toronto", slug: "raptors", logo: "nba-toronto-raptors" },
  UTA: { name: "Jazz", city: "Utah", slug: "utah-jazz", logo: "nba-utah-jazz" },
  WAS: { name: "Wizards", city: "Washington", slug: "wizards", logo: "nba-washington-wizards" },
};

const LABEL: Record<string, string> = {
  "Association White": "Association",
  "Icon Edition": "Icon",
  "Statement Edition": "Statement",
  "City Edition": "City Edition",
  "Classic Edition": "Classic",
  "Specter Edition": "Specter",
};

export type NbaSide = { tri: string; name: string; href: string; logo: string; jersey: string; white: boolean };
export type NbaGame = { away: NbaSide; home: NbaSide; grade: string | null };
export type NbaSlate = { date: string; label: string; isToday: boolean; games: NbaGame[] };

const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function getNbaSlate(now = new Date()): NbaSlate | null {
  const dir = path.join(process.cwd(), "scripts", "data");
  let lines: string[];
  let ann: Record<string, { games: Record<string, string> }>;
  let grades: Record<string, string> = {};
  try {
    lines = fs.readFileSync(path.join(dir, "nba-schedule-2026-27.txt"), "utf8").trim().split("\n");
    ann = JSON.parse(fs.readFileSync(path.join(dir, "nba-announced-uniforms-2026-27.json"), "utf8"));
    grades = JSON.parse(fs.readFileSync(path.join(dir, "nba-matchup-grades-2026-27.json"), "utf8"));
  } catch {
    return null;
  }
  const today = mlbEtToday(now);
  const games = lines.map((l) => { const [d, a, h] = l.split("|"); return { d, a, h }; });
  const date = games.map((g) => g.d).filter((d) => d >= today).sort()[0];
  if (!date) return null;

  const side = (tri: string): NbaSide => {
    const t = TEAMS[tri];
    const call = ann[tri]?.games?.[date] ?? "";
    return {
      tri,
      name: t.name,
      href: `/stories/${t.slug}-uniform-schedule-2026-27`,
      logo: `/logos/teams/${t.logo}.png`,
      jersey: LABEL[call] ?? "TBA",
      white: call === "Association White",
    };
  };
  const [y, m, d] = date.split("-").map(Number);
  const dow = DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return {
    date,
    isToday: date === today,
    label: `${dow}, ${MON[m]} ${d}`,
    games: games
      .filter((g) => g.d === date)
      .map((g) => ({ away: side(g.a), home: side(g.h), grade: grades[`${date}|${g.a}|${g.h}`] ?? null })),
  };
}

// Per-team "next game" for the NBA team schedule posts' wear box: the team's
// next game on or after today (ET), both jerseys and our matchup grade.
export type NbaTeamNext = {
  team: string;
  opp: { name: string; href: string; jersey: string };
  jersey: string;
  home: boolean;
  isToday: boolean;
  dayLabel: string;
  grade: string | null;
};

export function getNbaTeamNext(postSlug: string, now = new Date()): NbaTeamNext | null {
  const slug = postSlug.replace(/-uniform-schedule-2026-27$/, "");
  const tri = Object.keys(TEAMS).find((t) => TEAMS[t].slug === slug);
  if (!tri) return null;
  const dir = path.join(process.cwd(), "scripts", "data");
  let lines: string[];
  let ann: Record<string, { games: Record<string, string> }>;
  let grades: Record<string, string> = {};
  try {
    lines = fs.readFileSync(path.join(dir, "nba-schedule-2026-27.txt"), "utf8").trim().split("\n");
    ann = JSON.parse(fs.readFileSync(path.join(dir, "nba-announced-uniforms-2026-27.json"), "utf8"));
    grades = JSON.parse(fs.readFileSync(path.join(dir, "nba-matchup-grades-2026-27.json"), "utf8"));
  } catch {
    return null;
  }
  const today = mlbEtToday(now);
  const g = lines
    .map((l) => { const [d, a, h] = l.split("|"); return { d, a, h }; })
    .filter((x) => x.d >= today && (x.a === tri || x.h === tri))
    .sort((x, y) => x.d.localeCompare(y.d))[0];
  if (!g) return null;
  const home = g.h === tri;
  const oTri = home ? g.a : g.h;
  const label = (t: string) => LABEL[ann[t]?.games?.[g.d] ?? ""] ?? "TBA";
  const [y, m, d] = g.d.split("-").map(Number);
  const dow = DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()].slice(0, 3);
  return {
    team: TEAMS[tri].name,
    opp: { name: TEAMS[oTri].name, href: `/stories/${TEAMS[oTri].slug}-uniform-schedule-2026-27`, jersey: label(oTri) },
    jersey: label(tri),
    home,
    isToday: g.d === today,
    dayLabel: `${dow}, ${MON[m]} ${d}`,
    grade: grades[`${g.d}|${g.a}|${g.h}`] ?? null,
  };
}
