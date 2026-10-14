// Game-day <title> and meta description for the team uniform schedule posts.
//
// Why (site audit 2026-10-13): Google already shows these posts for ~209
// "what are the <team> wearing today / <team> uniforms today" queries at an
// average position of 4, but NFL click-through sat at 2-3% (packers uniforms
// today: 21 clicks from 777 impressions at position 1.7) because the snippet
// never said "today". On game days the title now answers the question:
//
//   What Are the Packers Wearing Today? Expected: Green vs Cowboys | 2026 Uniform Schedule
//
// Honesty rules, same as the live "What Are the X Wearing This Week?" box:
// - The look comes from the same data as that box (the post's own week grid,
//   the NFL tracker card, the MLB dated block, the NHL/NBA game table).
// - "Confirmed" only when that data says so (grid star, tracker card, block or
//   row status); otherwise "Expected".
// - No data, a bye, a TBA, or a schedule that disagrees with the post: return
//   null and the page keeps its normal title.
//
// Window: the game day itself ("Today"), plus the day before, phrased by
// weekday ("What Are the Packers Wearing Sunday?") so a snippet Google cached
// on Saturday never says "today" about tomorrow. All days are US Eastern.
//
// Each result carries `revalidate`: how long the page can stay cached before
// its title could change. app/stories/[slug]/page.tsx hands it to Next as a
// per-page ISR hint, so only schedule posts revalidate, and only as often as
// their title actually changes.

import { unstable_cache } from "next/cache";
import kickoffData from "@/content/data/nfl-kickoffs-2026.json";
import { buildNflTeamIndex, type NflGame, type NflTeamEntry } from "./nflTrackerTeamIndex";
import { nflTrackerCards } from "./nflTrackerCards";
import { clean, readMlbWearingBlock } from "./teamWearAnswers";

export type GameDay = {
  /** "What Are the Packers Wearing Today?" / "What Are the Packers Wearing Sunday?" */
  question: string;
  title: string;
  description: string;
  /** Seconds until this page's title can next change (ISR hint). */
  revalidate: number;
  /** NFL only: the grid week this game belongs to, to match the This-Week box. */
  week?: number;
};

const HOUR = 3600;
const DAY_MS = 86400000;
/** Keep the part before the "|" about this long; Google cuts near 60. */
const TITLE_MAX = 65;
const DESC_MAX = 155;

/* ---------------------------------------------------------- Eastern time -- */

type Et = { y: number; m: number; d: number; dow: number; secs: number };

const ET_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "short",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hourCycle: "h23",
});
const DOWS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function et(at: Date): Et {
  const p = Object.fromEntries(ET_FMT.formatToParts(at).map((x) => [x.type, x.value]));
  return {
    y: Number(p.year),
    m: Number(p.month),
    d: Number(p.day),
    dow: DOWS.indexOf(p.weekday),
    secs: Number(p.hour) * 3600 + Number(p.minute) * 60 + Number(p.second),
  };
}

/** Calendar-day number (days since epoch) of an Eastern date. */
const dayNum = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d) / DAY_MS;

/** Seconds from `now` until Eastern midnight `days` days ahead (1 = tonight). */
function secsToEtMidnight(now: Date, days: number): number {
  return (days - 1) * 86400 + (86400 - et(now).secs);
}

/** A cache lifetime that lands just after the boundary, within sane bounds. */
const clampTtl = (secs: number, max: number) => Math.max(300, Math.min(max, Math.ceil(secs) + 60));

/* --------------------------------------------------------------- Shared -- */

type Game = {
  team: string;
  /** Eastern calendar day number of the game. */
  day: number;
  dow: number;
  m: number;
  d: number;
  /** "8:20 PM ET" when known. */
  time?: string;
  evening: boolean;
  look: string;
  confirmed: boolean;
  /** Description sentence when confirmed: who confirmed it ("Confirmed by the team."). */
  confirmedNote?: string;
  home: boolean;
  opponent: string;
  /** " in London" for neutral sites. */
  where?: string;
  /** " | 2026 Uniform Schedule" */
  suffix: string;
};

/** Picks the title for one game, given today's Eastern day number. */
function compose(g: Game, today: number, maxTtl: number, now: Date): GameDay | null {
  const offset = g.day - today; // 0 = game day, 1 = the day before
  if (offset !== 0 && offset !== 1) return null;
  const whenWord = offset === 0 ? "Today" : DOW_LONG[g.dow];
  const question = `What Are the ${g.team} Wearing ${whenWord}?`;
  const status = g.confirmed ? "Confirmed" : "Expected";
  const vs = `${g.home ? "vs" : "at"} ${g.opponent}`;
  const short = `${DOWS[g.dow]} ${g.m}/${g.d}`;

  // Longest first; a multi-part look ("White · Gold Pants") can shed its
  // extras before the title gives up the opponent.
  const jersey = g.look.split(" · ")[0];
  const heads = [
    `${question} ${status}: ${g.look} ${vs} (${short})`,
    `${question} ${status}: ${g.look} ${vs}`,
    `${question} ${status}: ${jersey} ${vs}`,
    `${question} ${status}: ${g.look}`,
    `${question} ${status}: ${jersey}`,
    question,
  ];
  const head = heads.find((h) => h.length <= TITLE_MAX) ?? question;

  const lead =
    offset === 0 ? (g.evening ? "tonight" : "today") : DOW_LONG[g.dow];
  const date = `${DOWS[g.dow]}, ${MON[g.m - 1]} ${g.d}`;
  const verdict = g.confirmed
    ? g.confirmedNote ?? "Confirmed."
    : "Expected; not confirmed yet.";
  const opp = `${g.home ? "vs" : "at"} the ${g.opponent}${g.where ?? ""}`;
  const lookText = g.look.replace(/ · /g, ", ");
  const descs = [
    `${g.team} uniform ${lead}: ${lookText} ${opp} (${date}${g.time ? `, ${g.time}` : ""}). ${verdict} Every ${g.team} jersey by date, confirmed and expected.`,
    `${g.team} uniform ${lead}: ${lookText} ${opp} (${date}${g.time ? `, ${g.time}` : ""}). ${verdict} Every ${g.team} jersey by date.`,
    `${g.team} uniform ${lead}: ${lookText} ${opp} (${date}). ${verdict} Every ${g.team} jersey by date.`,
    `${g.team} uniform ${lead}: ${lookText} ${opp} (${date}). ${verdict}`,
  ];
  const description = descs.find((s) => s.length <= DESC_MAX) ?? descs[descs.length - 1];

  // The title next changes at Eastern midnight: the day before flips to
  // "Today", and game day flips back to the normal title.
  const revalidate = clampTtl(secsToEtMidnight(now, 1), maxTtl);
  return { question, title: `${head}${g.suffix}`, description, revalidate };
}

/** How long a page with no game in the window can stay cached: until the
 *  window for its next game opens (the Eastern midnight two days before). */
function ttlUntilWindow(nextGameDay: number | undefined, today: number, now: Date): number | undefined {
  if (nextGameDay === undefined) return undefined;
  const opensIn = nextGameDay - 1 - today; // days until the day-before
  if (opensIn < 1) return clampTtl(secsToEtMidnight(now, 1), 86400);
  return clampTtl(secsToEtMidnight(now, opensIn), 86400);
}

export type GameDayResult = { gameDay: GameDay | null; revalidate?: number };

/* ------------------------------------------------------------------ NFL -- */

type Kickoff = {
  week: number;
  away: string;
  home: string;
  kickoff: string;
  timeSet: boolean;
  venue: string;
  neutral: boolean;
};
const KICKOFFS = (kickoffData as { games: Kickoff[] }).games;

// Grid labels mix the jersey with game context ("White · TNF", "Red ·
// Expected"); only the jersey belongs in a title. Same tag list as the week board.
const NFL_TAG = /^(TNF|SNF|MNF|Wed(nesday)?|Thu(rsday)?|Sat(urday)?|Christmas|Thanksgiving|Black Friday|Netflix|London|Dublin|Paris|Madrid|Munich|Berlin|Melbourne|Rio|São Paulo|Sao Paulo|Mexico City|Toronto|Expected|Road|Home)$/i;
const UNKNOWN = /^(off|bye|tba|tbd|unknown|\?+)$/i;

function nflLook(label: string): string | null {
  const parts = label
    .split(/\s*·\s*/)
    .map((p) => p.replace(/\s*\((confirmed|announced|expected)\)\s*$/i, "").trim())
    .filter((p) => p && !NFL_TAG.test(p) && !/\bin\b/.test(p));
  const look = parts.join(" · ");
  return look && !UNKNOWN.test(look) ? look : null;
}

/** "Bills (London)" -> "Bills" */
const bareOpponent = (s: string) => s.replace(/\s*\(.*\)\s*$/, "").trim();

const NEUTRAL_CITY: Record<string, string> = {
  "Wembley Stadium": "London",
  "Tottenham Hotspur Stadium": "London",
};

export function nflGameDay(entry: NflTeamEntry, now: Date): GameDayResult {
  const t = et(now);
  const today = dayNum(t.y, t.m, t.d);
  const n = entry.nickname;

  // This club's schedule with Eastern game days, in order.
  const mine = KICKOFFS.filter((k) => k.away === n || k.home === n)
    .map((k) => {
      const at = new Date(k.kickoff);
      const e = et(at);
      return { k, at, e, day: dayNum(e.y, e.m, e.d) };
    })
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  const next = mine.find((x) => x.day >= today);
  if (!next) return { gameDay: null };

  const inWindow = next.day - today <= 1 && next.k.timeSet;
  if (!inWindow) return { gameDay: null, revalidate: ttlUntilWindow(next.day, today, now) };

  // In the window but nothing we can stand behind: look again at midnight.
  const outside = { gameDay: null, revalidate: clampTtl(secsToEtMidnight(now, 1), 86400) };

  // The post's own grid must agree with the league schedule on the opponent and
  // home/away, or we do not trust either enough to put it in the title.
  const k = next.k;
  const isHome = k.home === n;
  const opponent = isHome ? k.away : k.home;
  const game: NflGame | undefined = entry.games.find((g) => g.week === k.week);
  if (!game || game.bye) return outside;
  if (bareOpponent(game.opponent) !== opponent) return outside;
  if (!k.neutral && game.home !== isHome) return outside;

  // Tracker card: a Final card is what they actually wore; a "Confirmed"
  // card means the club announced the whole look.
  const card = nflTrackerCards().find(
    (c) => c.week === k.week && (c.away === entry.name || c.home === entry.name),
  );
  const side = card ? card.sides[card.away === entry.name ? 0 : 1] : undefined;
  let look = nflLook(game.uniform);
  let confirmed = game.confirmed;
  let confirmedNote = "Confirmed by the team.";
  const cardKnows = card && side && (card.final || /^(jersey )?confirmed$/i.test(side.status));
  if (cardKnows) {
    confirmed = true;
    if (card.final) confirmedNote = "Confirmed from the game.";
    // The grid names alternates ("Darkness Falls"); the card only has colours.
    // Keep the grid's name when the club confirmed it, else use the card's
    // jersey colour, since an unstarred grid label is only our expectation.
    if (!game.confirmed && side.words[1]) look = side.words[1];
  }
  if (!look) return outside;

  const e = next.e;
  const hh = Math.floor(e.secs / 3600);
  const mm = Math.floor((e.secs % 3600) / 60);
  const time = `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, "0")} ${hh < 12 ? "AM" : "PM"} ET`;
  const city = k.neutral ? NEUTRAL_CITY[k.venue] ?? (/\(([^)]+)\)/.exec(game.opponent)?.[1]) : undefined;

  const gd = compose(
    {
      team: n,
      day: next.day,
      dow: e.dow,
      m: e.m,
      d: e.d,
      time,
      evening: hh >= 18,
      look,
      confirmed,
      confirmedNote,
      home: isHome,
      opponent,
      where: city ? ` in ${city}` : undefined,
      suffix: " | 2026 Uniform Schedule",
    },
    today,
    HOUR,
    now,
  );
  if (!gd) return outside;
  gd.week = k.week;
  return { gameDay: gd, revalidate: gd.revalidate };
}

/* ------------------------------------------------------------------ MLB -- */

// Two-word nicknames, so "Tampa Bay Rays" -> "Rays" but "Boston Red Sox" -> "Red Sox".
const MLB_TWO_WORD = ["Red Sox", "White Sox", "Blue Jays"];
const mlbNick = (full: string) =>
  MLB_TWO_WORD.find((x) => full.endsWith(x)) ?? full.split(" ").slice(-1)[0];

/**
 * MLB schedule posts carry a dated "What the <Team> Are Wearing" block that the
 * daily pass rewrites (scripts/mlb-wearing-blocks.mjs). It only speaks for the
 * date printed on it, so the title only changes while that date is today.
 */
export function mlbGameDay(contentHtml: string, now: Date): GameDayResult {
  const b = readMlbWearingBlock(contentHtml);
  if (!b) return { gameDay: null };
  const uniform = clean(b.uniform);
  if (/^(NO GAMES? TODAY|SEASON OVER)$/i.test(uniform) || UNKNOWN.test(uniform)) return { gameDay: null };

  // "Tuesday, October 13, 2026"
  const dm = /^([A-Za-z]+), ([A-Za-z]+) (\d{1,2}), (\d{4})$/.exec(clean(b.date));
  const team = /What the (.+?) Are Wearing/.exec(b.html)?.[1];
  // "Guardians at Tampa Bay Rays · 8:00 PM ET" on the road; at home the
  // script writes "<Opponent> at <Team> · <time>".
  const mm = /^(.+?) at (.+?)(?: · (.+))?$/.exec(clean(b.matchup));
  if (!dm || !team || !mm) return { gameDay: null };
  const nick = clean(team);
  const home = mm[2].endsWith(nick);
  const opponentFull = home ? mm[1] : mm[2];
  const month = MON.findIndex((x) => dm[2].startsWith(x)) + 1;
  if (month === 0) return { gameDay: null };

  const t = et(now);
  const today = dayNum(t.y, t.m, t.d);
  const day = dayNum(Number(dm[4]), month, Number(dm[3]));
  if (day !== today) return { gameDay: null };

  const time = mm[3] && /^\d{1,2}:\d{2} [AP]M ET$/.test(mm[3]) ? mm[3] : undefined;
  const hour = time ? (Number(time.split(":")[0]) % 12) + (time.includes("PM") ? 12 : 0) : 19;
  const gd = compose(
    {
      team: nick,
      day,
      dow: DOW_LONG.indexOf(dm[1]),
      m: month,
      d: Number(dm[3]),
      time,
      evening: hour >= 18,
      look: uniform,
      confirmed: /^confirmed/i.test(clean(b.status)),
      home,
      opponent: mlbNick(opponentFull),
      suffix: " | 2026 Uniform Schedule",
    },
    today,
    HOUR,
    now,
  );
  return { gameDay: gd, revalidate: gd?.revalidate };
}

/* ------------------------------------------------------------ NHL / NBA -- */

// One row of the generated "All 82/84 Games" table on 2026-27 schedule posts
// (scripts/gen-nhl-schedule-tables.mjs, gen-nba-schedule-tables.mjs):
// date / matchup (+ result once played) / call / status.
const ROW =
  /<span style="flex: 0 0 92px;[^"]*">([A-Z][a-z]{2}) (\d{1,2})<\/span><span style="flex: 1 1 auto;[^"]*">(vs|at) ([^<]+?)\s*(?:<span[^>]*>[^<]*<\/span>)?<\/span><span style="flex: 0 0 auto;[^"]*">([^<]+)<\/span><span style="flex: 0 0 74px;[^"]*">([^<]+)<\/span>/g;

const titleCase = (slug: string) =>
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/**
 * NHL and NBA schedule posts list every game with its date, the call and a
 * status (Confirmed, Announced, Expected, TBA). No start times, so the
 * description gives the date only.
 */
export function seasonTableGameDay(slug: string, contentHtml: string, now: Date): GameDayResult {
  const team = titleCase(slug.replace(/-uniform-schedule-2026-27$/, ""));
  const t = et(now);
  const today = dayNum(t.y, t.m, t.d);

  type Row = { day: number; m: number; d: number; home: boolean; opponent: string; call: string; status: string };
  const rows: Row[] = [];
  for (const r of contentHtml.matchAll(ROW)) {
    const m = MON.indexOf(r[1]) + 1;
    if (m === 0) continue;
    // The season runs September to June.
    const y = m >= 7 ? 2026 : 2027;
    rows.push({
      day: dayNum(y, m, Number(r[2])),
      m,
      d: Number(r[2]),
      home: r[3] === "vs",
      opponent: clean(r[4]),
      call: clean(r[5]),
      status: clean(r[6]),
    });
  }
  if (rows.length < 10) return { gameDay: null };
  rows.sort((a, b) => a.day - b.day);

  const next = rows.find((r) => r.day >= today);
  if (!next) return { gameDay: null };
  if (next.day - today > 1) return { gameDay: null, revalidate: ttlUntilWindow(next.day, today, now) };

  const outside = { gameDay: null, revalidate: clampTtl(secsToEtMidnight(now, 1), 86400) };
  const status = next.status.toLowerCase();
  if (!["confirmed", "announced", "expected"].includes(status)) return outside;
  if (UNKNOWN.test(next.call) || /not yet announced/i.test(next.call)) return outside;

  const dow = new Date(next.day * DAY_MS).getUTCDay();
  // Tables carry no start time, so the copy says "today" (some games are
  // matinees) and the lifetime never runs past Eastern midnight.
  const gd = compose(
    {
      team,
      day: next.day,
      dow,
      m: next.m,
      d: next.d,
      evening: false,
      look: next.call,
      confirmed: status !== "expected",
      confirmedNote: status === "announced" ? "Announced by the team." : "Confirmed.",
      home: next.home,
      opponent: next.opponent,
      suffix: " | 2026-27 Uniform Schedule",
    },
    today,
    86400,
    now,
  );
  return { gameDay: gd, revalidate: gd?.revalidate };
}

/* ------------------------------------------------------------- Dispatch -- */

/** Game-day title data for any team schedule post; `{ gameDay: null }` for the rest. */
export function gameDayForPost(
  post: { slug: string; league?: string; contentHtml: string },
  now: Date,
): GameDayResult {
  const { slug, league, contentHtml } = post;
  if (league === "nfl" && /-uniform-schedule-2026$/.test(slug)) {
    const entry = buildNflTeamIndex().find((t) => t.scheduleSlug === slug);
    return entry ? nflGameDay(entry, now) : { gameDay: null };
  }
  if (league === "mlb" && /-uniform-schedule-2026$/.test(slug)) return mlbGameDay(contentHtml, now);
  if ((league === "nhl" || league === "nba") && /-uniform-schedule-2026-27$/.test(slug)) {
    return seasonTableGameDay(slug, contentHtml, now);
  }
  return { gameDay: null };
}

/**
 * Per-page ISR hint. The story route sets no `revalidate`, so posts stay static
 * until the next deploy. The Next 16 guide for apps without Cache Components:
 * a cached call with a lower `revalidate` lowers it for the page that makes the
 * call, and only that page ("dynamically opt-in to more frequent revalidation
 * for certain routes"). `unstable_cache` is the non-fetch form of that. The
 * cached value is a constant that nothing reads; one fixed key, so it is one
 * tiny data-cache entry, not one per page.
 */
export async function revalidatePageWithin(seconds: number | undefined): Promise<void> {
  if (!seconds) return;
  await unstable_cache(async () => true, ["schedule-post-title-ttl"], { revalidate: seconds })();
}
