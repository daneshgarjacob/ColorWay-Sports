import fs from "fs";
import path from "path";

// Reads the helmet / jersey / pants colours off the NFL uniform tracker's game
// cards so other pages can draw each side's uniform without re-entering it.
//
// The tracker is where Jake logs every look (scripts/nfl-tracker-log.py and
// scripts/nfl-tracker-card.py write the cards). Every icon on a card carries
// data-color="#HEX" in helmet, jersey, pants order, away side first, and a
// data-status line per side ("Confirmed", "Jersey confirmed", "Projected")
// until the game is played, when the pill flips to "Final · score".

const TRACKER_FILE = path.join(process.cwd(), "content/posts/nfl-uniform-tracker-2026.md");

export type TrackerSide = {
  /** Helmet, jersey, pants. */
  hexes: [string, string, string];
  /** "Black", "White", "Gold": the card's combination line. */
  words: string[];
  /** "Confirmed" / "Jersey confirmed" / "Projected", empty once the game is Final. */
  status: string;
  /** Only when the card's own write-up names this club's socks unambiguously. */
  socks?: string;
};

export type TrackerCard = {
  week: number;
  /** Full club names, as in the card heading. */
  away: string;
  home: string;
  /** Day heading above the card, e.g. "Thursday, October 1". */
  day: string;
  /** Kickoff / TV / venue from the pill: "Thursday Night Football", "9:30 ET · London". */
  label: string;
  final: boolean;
  /** "Bears 27, Eagles 7" once played. */
  score?: string;
  /** Position in the tracker, which runs games in kickoff order within a day. */
  order: number;
  sides: [TrackerSide, TrackerSide];
};

const ent = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&middot;/g, "·")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const BASIC: Record<string, string> = {
  white: "#FFFFFF",
  black: "#101820",
};

// "black socks" in the card's prose, credited to a side only when the sentence
// names that club (nickname or city) and not the opponent.
function socksFromProse(prose: string, away: string, home: string, sides: TrackerSide[]) {
  const ids = (full: string) => {
    const nick = full.split(" ").slice(-1)[0];
    const city = full.slice(0, -nick.length).trim();
    return [nick, city].filter(Boolean);
  };
  const mentions = (sentence: string, full: string) =>
    ids(full).some((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(sentence));

  const out: (string | undefined)[] = [undefined, undefined];
  for (const sentence of prose.split(/(?<=\.)\s+/)) {
    const m = /\b([a-z]+) socks\b/i.exec(sentence);
    if (!m) continue;
    const a = mentions(sentence, away);
    const h = mentions(sentence, home);
    if (a === h) continue; // neither or both: too ambiguous to credit
    const i = a ? 0 : 1;
    const word = m[1].toLowerCase();
    const part = sides[i].words.findIndex((w) => w.toLowerCase() === word);
    out[i] = part >= 0 ? sides[i].hexes[part] : BASIC[word];
  }
  return out;
}

let cache: TrackerCard[] | null = null;

/** Every regular-season game card on the tracker, newest week first. */
export function nflTrackerCards(): TrackerCard[] {
  if (cache) return cache;
  if (!fs.existsSync(TRACKER_FILE)) return (cache = []);
  let md = fs.readFileSync(TRACKER_FILE, "utf8");
  const cut = md.search(/\n## [^\n]*Preseason/);
  if (cut !== -1) md = md.slice(0, cut);

  const out: TrackerCard[] = [];
  const heads = [...md.matchAll(/^(##|###) (.+)$/gm)];
  let week = 0;
  let day = "";
  heads.forEach((h, i) => {
    const text = h[2].trim();
    if (h[1] === "##") {
      const w = /^Week (\d+)\b/.exec(text);
      if (w) week = Number(w[1]);
      else if (/^[A-Z][a-z]+day, [A-Z][a-z]+ \d{1,2}$/.test(text)) day = text;
      return;
    }
    const [away, home] = text.split(/\s+at\s+/);
    if (!home || !week) return;
    const start = h.index! + h[0].length;
    const body = md.slice(start, heads[i + 1]?.index ?? md.length);

    const hexes = [...body.matchAll(/data-color="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1].toUpperCase());
    if (hexes.length !== 6) return;
    const combos = [
      ...body.matchAll(/text-transform:uppercase;opacity:\.85;margin:4px 0 0;font-weight:600;">([^<]+)</g),
    ].map((m) => ent(m[1]).split(" · "));
    const status = [...body.matchAll(/<p data-status[^>]*>([^<]+)<\/p>/g)].map((m) => ent(m[1]));
    const pill = /letter-spacing:2px;display:inline-block;">([^<]+)</.exec(body);
    const pillText = pill ? ent(pill[1]) : "";
    const final = /^Final\b/.test(pillText);

    const sides = [0, 1].map((s) => ({
      hexes: hexes.slice(s * 3, s * 3 + 3) as [string, string, string],
      words: combos[s] ?? [],
      status: final ? "" : (status[s] ?? ""),
    })) as [TrackerSide, TrackerSide];

    const prose = body.trim().split("\n")[0] ?? "";
    const socks = socksFromProse(prose, away, home, sides);
    sides.forEach((s, k) => {
      if (socks[k]) s.socks = socks[k];
    });

    out.push({
      week,
      away,
      home,
      day,
      label: final ? "" : pillText.replace(/^Week \d+\s*·\s*/, ""),
      final,
      score: final ? pillText.replace(/^Final\s*·\s*/, "") || undefined : undefined,
      order: out.length,
      sides,
    });
  });

  cache = out;
  return out;
}

export function findTrackerCard(week: number, away: string, home: string): TrackerCard | undefined {
  return nflTrackerCards().find((c) => c.week === week && c.away === away && c.home === home);
}
