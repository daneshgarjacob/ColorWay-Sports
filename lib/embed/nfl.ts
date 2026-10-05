import fs from "node:fs";
import path from "node:path";
import { buildNflTeamIndex, nflTeamByKey, type NflGame, type NflTeamEntry } from "@/lib/nflTrackerTeamIndex";
import { findTrackerCard, type TrackerCard } from "@/lib/nflTrackerCards";
import { nflCurrentWeek } from "@/lib/teamWearAnswers";
import { SITE, type EmbedCard, type EmbedLeague, type EmbedPart } from "./types";

// NFL adapter for the embed widget. Same two sources the homepage week chips
// and the week board already use, so the widget can never disagree with the site:
//   1. the week cells in each club's "<team>-uniform-schedule-2026" post
//      (opponent, jersey label, the ★ that means the club announced it), via
//      lib/nflTrackerTeamIndex.ts;
//   2. the NFL uniform tracker card for that game, when Jake has built it
//      (helmet / jersey / pants words + colours, Confirmed / Projected, and
//      the jersey photo), via lib/nflTrackerCards.ts.
// With no tracker card the helmet and pants stay TBA rather than guessed.

const LAST_WEEK = 18;

// Grid labels carry game context next to the jersey ("White · TNF").
const TAG = /^(Home|Road|Away|TNF|SNF|MNF|Wed(nesday)?|Thu(rsday)?|Sat(urday)?|Christmas|Thanksgiving|Black Friday|Netflix|London|Dublin|Paris|Madrid|Munich|Berlin|Melbourne|Rio|São Paulo|Sao Paulo|Mexico City|Toronto)$/i;

function jerseyOnly(entry: NflTeamEntry, label: string): string {
  const parts = label.split(/\s*·\s*/).filter(Boolean);
  let u = parts.filter((p) => !TAG.test(p)).join(" · ") || label;
  if (u.startsWith(`${entry.nickname} `)) u = u.slice(entry.nickname.length + 1);
  return u;
}

const SHORT_DAYS: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};
const SHORT_MONTHS: Record<string, string> = {
  January: "Jan", February: "Feb", March: "Mar", April: "Apr", May: "May", June: "Jun", July: "Jul",
  August: "Aug", September: "Sep", October: "Oct", November: "Nov", December: "Dec",
};
/** "Monday, October 5" -> "Mon, Oct 5". */
function shortDay(s: string): string {
  const m = /^([A-Z][a-z]+day), ([A-Z][a-z]+) (\d{1,2})$/.exec(s.trim());
  return m ? `${SHORT_DAYS[m[1]] ?? m[1]}, ${SHORT_MONTHS[m[2]] ?? m[2]} ${m[3]}` : s;
}

/** "Thu, Oct 8 – Mon, Oct 12" -> "Oct 8–12"; across months "Sep 30–Oct 4". */
function shortWindow(s: string): string {
  const m = /^[A-Z][a-z]{2}, ([A-Z][a-z]{2}) (\d{1,2}) – [A-Z][a-z]{2}, ([A-Z][a-z]{2}) (\d{1,2})$/.exec(s.trim());
  if (!m) return s;
  return m[1] === m[3] ? `${m[1]} ${m[2]}–${m[4]}` : `${m[1]} ${m[2]}–${m[3]} ${m[4]}`;
}

function opponentEntry(game: NflGame): NflTeamEntry | undefined {
  const opp = game.opponent.replace(/\s*\(.*\)\s*$/, "").trim();
  return buildNflTeamIndex().find((t) => t.nickname === opp || t.name === opp || t.name.endsWith(` ${opp}`));
}

function cardFor(entry: NflTeamEntry, game: NflGame): { card?: TrackerCard; side: 0 | 1 } {
  const opp = opponentEntry(game);
  const side: 0 | 1 = game.home ? 1 : 0;
  if (!opp) return { side };
  const card = game.home
    ? findTrackerCard(game.week, opp.name, entry.name)
    : findTrackerCard(game.week, entry.name, opp.name);
  return { card, side };
}

// ---- Jersey photo -----------------------------------------------------------
// The tracker card's own photo wins. Otherwise we look for a tracker jersey
// photo whose filename carries every word of the schedule label
// ("Royal Legacy Alternate" -> giants-royal-legacy-alternate.jpg). Candidates are
// the photos the site's posts already reference, read from content/ so this
// never has to bundle or list public/. An ambiguous match shows no photo.

let jerseyPhotos: string[] | null = null;
function allJerseyPhotos(): string[] {
  if (jerseyPhotos) return jerseyPhotos;
  const dir = path.join(process.cwd(), "content/posts");
  const found = new Set<string>();
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".md")) continue;
    const raw = fs.readFileSync(path.join(dir, f), "utf8");
    for (const m of raw.matchAll(/\/images\/posts\/nfl-tracker-jerseys\/[a-z0-9-]+\.jpg/g)) found.add(m[0]);
  }
  return (jerseyPhotos = [...found]);
}

const STOP = new Set(["jersey", "jerseys", "uniform", "uniforms", "set", "the", "primary", "edition", "standard"]);
const SET_MARKERS = new Set(["home", "road", "alternate"]);

function photoForLabel(entry: NflTeamEntry, label: string, home: boolean): string | undefined {
  const want = label.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !STOP.has(w));
  if (want.length === 0) return undefined;
  const prefix = `${entry.key}-`;
  const scored = allJerseyPhotos()
    .map((p) => p.split("/").pop()!.replace(/\.jpg$/, ""))
    .filter((f) => f.startsWith(prefix))
    .map((f) => {
      const words = f.slice(prefix.length).split("-");
      if (!want.every((w) => words.includes(w))) return null;
      const extra = words.filter((w) => !want.includes(w));
      // Any extra word must be a set marker, never a design name: "White" may
      // map to lions-white-road.jpg but must NOT map to texans-white-liberty.jpg.
      if (!extra.every((w) => SET_MARKERS.has(w))) return null;
      const sideHint = extra.includes(home ? "home" : "road") ? 1 : 0;
      return { f, score: sideHint * 10 - extra.length };
    })
    .filter(Boolean) as { f: string; score: number }[];
  if (scored.length === 0) return undefined;
  scored.sort((a, b) => b.score - a.score);
  if (scored.length > 1 && scored[0].score === scored[1].score) return undefined;
  return `/images/posts/nfl-tracker-jerseys/${scored[0].f}.jpg`;
}

// ---- The card -----------------------------------------------------------------

function nflCard(teamKey: string, now: Date): EmbedCard | null {
  const entry = nflTeamByKey(teamKey);
  if (!entry) return null;

  // "This week" for a reader is the next game not yet played: once Thursday's
  // or Sunday's game is Final on the tracker, roll on to the next week, and
  // step over a bye with a note.
  let week = Math.min(nflCurrentWeek(now), LAST_WEEK);
  let notice: string | undefined;
  let game: NflGame | undefined;
  let found: { card?: TrackerCard; side: 0 | 1 } = { side: 0 };
  for (; week <= LAST_WEEK; week++) {
    game = entry.games.find((g) => g.week === week);
    if (!game) continue;
    if (game.bye) {
      notice = `After Week ${week} bye`;
      continue;
    }
    found = cardFor(entry, game);
    if (found.card?.final && week < LAST_WEEK) continue;
    break;
  }
  if (!game || game.bye) return null;

  const { card, side } = found;
  const s = card?.sides[side];
  const uniform = jerseyOnly(entry, game.uniform);

  let parts: EmbedPart[];
  let status: EmbedCard["status"];
  let statusNote: string | undefined;

  if (card?.final && s) {
    status = "worn";
    parts = ["Helmet", "Jersey", "Pants"].map((p, i) => ({ part: p, label: s.words[i] ?? "", hex: s.hexes[i] }));
  } else if (s && s.words.length === 3) {
    parts = ["Helmet", "Jersey", "Pants"].map((p, i) => ({ part: p, label: s.words[i], hex: s.hexes[i] }));
    if (/^confirmed$/i.test(s.status)) {
      status = "confirmed";
    } else if (/jersey confirmed/i.test(s.status) || game.confirmed) {
      status = "confirmed";
      statusNote = "Helmet and pants are our read";
    } else {
      status = "expected";
      statusNote = "Not announced by the team yet";
    }
  } else {
    parts = [
      { part: "Helmet", label: "TBA" },
      { part: "Jersey", label: uniform },
      { part: "Pants", label: "TBA" },
    ];
    status = game.confirmed ? "confirmed" : "expected";
    statusNote = game.confirmed ? "Helmet and pants TBA" : "Not announced by the team yet";
  }
  // Headline is the jersey; the pants already have their own row.
  const headline = uniform.split(/\s*·\s*/).filter((p) => !/\bpants$/i.test(p)).join(" · ") || uniform;

  const image = s?.img ?? photoForLabel(entry, uniform, game.home);
  const when = game.date ? shortDay(game.date) : card?.day ? shortDay(card.day) : shortWindow(game.window);

  return {
    league: "nfl",
    leagueLabel: "NFL",
    teamName: entry.name,
    nickname: entry.nickname,
    logo: entry.logo,
    accent: entry.color,
    period: `Week ${week}`,
    matchup: `${game.home ? "vs" : "at"} ${game.opponent}`,
    when,
    uniform: headline,
    parts,
    image,
    imageAlt: image ? `${entry.name} ${headline} jersey` : undefined,
    swatch: game.background,
    status,
    statusNote,
    notice,
    sourceUrl: `${SITE}/stories/${entry.scheduleSlug}`,
  };
}

export const nflLeague: EmbedLeague = {
  key: "nfl",
  label: "NFL",
  teams: () => buildNflTeamIndex().map((t) => ({ key: t.key, name: t.name, logo: t.logo })),
  card: nflCard,
};
