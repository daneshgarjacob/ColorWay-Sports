import fs from "node:fs";
import path from "node:path";
import { getAllPosts } from "@/lib/posts";

// "This Week in the NFL": one chip per team showing the jersey its schedule post
// lists for the current week. The 32 schedule posts are the site's biggest
// earners, and until 2026-09-07 the homepage gave them no slot at all.
//
// Cells are read straight from the raw markdown (the same WEEK / opponent /
// label markup the schedule grids are built from), so nothing here has to be
// kept in sync by hand: fixing a post fixes the chip.

export type NflTeamWeek = {
  slug: string;
  team: string;          // "Eagles"
  logo?: string;
  accent: string;        // first hex in the post's gradient
  opponent: string;      // "vs Bills", "at Lions", or "Bye"
  label: string;         // "White", "★ Liberty White"
  confirmed: boolean;    // the cell carried a star
};

// Week 1 opens Wednesday, September 9, 2026. Weeks roll over on Tuesday
// morning (Eastern), so a Monday-night game still reads as the current week.
const WEEK_ONE_TUESDAY_UTC = Date.UTC(2026, 8, 8, 8, 0, 0); // Tue Sep 8, 04:00 ET
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function currentNflWeek(now = new Date()): number {
  const n = Math.floor((now.getTime() - WEEK_ONE_TUESDAY_UTC) / WEEK_MS) + 1;
  return Math.min(18, Math.max(1, n));
}

export function nflWeekDates(week: number): string {
  const start = new Date(WEEK_ONE_TUESDAY_UTC + (week - 1) * WEEK_MS + 24 * 60 * 60 * 1000); // Wed
  const end = new Date(start.getTime() + 5 * 24 * 60 * 60 * 1000); // Mon
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${fmt(start)}–${fmt(end)}`;
}

const CELL_RE =
  /<div style="font-size: 0\.68em[^>]*>WEEK (\d+)<\/div><div style="font-size: 0\.95em[^>]*>([^<]+)<\/div><div style="font-size: 0\.76em[^>]*>([^<]+)<\/div>/g;

function decode(s: string): string {
  return s
    .replace(/&#9733;|&#x2605;/g, "★")
    .replace(/&middot;/g, "·")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function getNflWeekChips(week: number): NflTeamWeek[] {
  const posts = getAllPosts().filter(
    (p) =>
      p.league === "nfl" &&
      p.slug.endsWith("-uniform-schedule-2026") &&
      p.slug !== "nfl-uniform-schedule-2026",
  );
  const out: NflTeamWeek[] = [];
  for (const p of posts) {
    let raw = "";
    try {
      raw = fs.readFileSync(path.join(process.cwd(), "content/posts", `${p.slug}.md`), "utf8");
    } catch {
      continue;
    }
    let cell: RegExpExecArray | null = null;
    CELL_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = CELL_RE.exec(raw)) !== null) {
      if (Number(m[1]) === week) {
        cell = m;
        break;
      }
    }
    if (!cell) continue;
    const name = p.title.replace(/\s+2026 Uniform Schedule.*$/, "").trim();
    const team = name.split(" ").pop() || name;
    const label = decode(cell[3]);
    const accent = (p.gradient.match(/#[0-9A-Fa-f]{6}/) || ["#14284b"])[0];
    out.push({
      slug: p.slug,
      team,
      logo: p.logoSrc2,
      accent,
      opponent: decode(cell[2]),
      label: label.replace(/^★\s*/, ""),
      confirmed: label.startsWith("★"),
    });
  }
  out.sort((a, b) => a.team.localeCompare(b.team));
  return out;
}

// ---- Week-level numbers for the homepage strip ------------------------------
// Before the games these come from the schedule cells (the plan); once the NFL
// tracker logs the week they should come from the log instead. Labels are the
// cells' own words, so "standard" is a short allow-list of base jersey names and
// everything else counts as an alternate or special.

export type NflWeekStats = {
  homeTotal: number;
  homeColor: number;
  homeWhite: number;
  alternates: number;
  confirmed: number;
  colorVsColor: number;
};

const BASE_LABELS = new Set([
  "white", "black", "blue", "navy", "red", "teal", "green", "royal", "purple", "aqua", "orange",
  "gold", "silver", "brown", "honolulu blue", "midnight green", "college navy", "titans blue",
  "cardinal red", "scarlet", "burgundy", "pewter", "panther blue", "powder blue", "royal blue",
  "green (home)", "navy (home)",
]);

function baseLabel(label: string): string {
  return label.replace(/^★\s*/, "").split("·")[0].trim().toLowerCase();
}
export function isWhiteJersey(label: string): boolean {
  const b = baseLabel(label);
  return b.startsWith("white") || /\b(liberty white|summit white|fearsome white|white bengal|white out|white noise|winter warrior)\b/.test(b);
}
export function isAlternate(label: string): boolean {
  const b = baseLabel(label);
  if (BASE_LABELS.has(b)) return false;
  return true;
}

export function getNflWeekStats(chips: NflTeamWeek[]): NflWeekStats {
  const home = chips.filter((c) => c.opponent.startsWith("vs"));
  const homeWhite = home.filter((c) => isWhiteJersey(c.label)).length;
  const byTeam = new Map(chips.map((c) => [c.team.toLowerCase(), c]));
  let colorVsColor = 0;
  for (const h of home) {
    const oppName = h.opponent.replace(/^vs\s+/, "").replace(/\s*\(.*\)$/, "").trim();
    const opp = byTeam.get(oppName.split(" ").pop()!.toLowerCase());
    if (opp && !isWhiteJersey(h.label) && !isWhiteJersey(opp.label)) colorVsColor++;
  }
  return {
    homeTotal: home.length,
    homeColor: home.length - homeWhite,
    homeWhite,
    alternates: chips.filter((c) => isAlternate(c.label)).length,
    confirmed: chips.filter((c) => c.confirmed).length,
    colorVsColor,
  };
}
