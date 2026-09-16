// Question-and-answer copy for the live "what are they wearing" boxes on team
// schedule posts, for NFL, MLB and college football.
//
// Researched 2026-09-14 (Google autocomplete + Search Console): people almost
// never search the past tense. Google folds "what were the Chargers wearing"
// into "what are the Chargers wearing today / tonight / tomorrow / this week",
// and the other real phrasings are "what jerseys / uniforms / color". So each
// box answers a handful of those DISTINCT intents with real data, rather than
// piling up near-identical questions.
//
// Every answer here is shown on screen AND declared as FAQ schema, from the
// same objects, so the two can never drift.

import type { NflTeamEntry } from "./nflTrackerTeamIndex";
import { nflComboSentence, type NflLatest } from "./nflTeamLatest";
import { mlbEtTodayLong } from "./mlbConfirmed";

export type WearAnswer = { q: string; a: string };

export type WearHeadline = {
  /** The box's H2, phrased as the search. */
  question: string;
  /** "Powder Blue · Gold Pants" */
  uniform: string;
  confirmed: boolean;
  /** "Week 2 · Sun, Sep 20 · vs Raiders" */
  detail: string;
};

const DAY = 86400000;

/** Today's calendar date in Los Angeles, as a UTC-midnight timestamp. */
function todayPacific(now: Date): number {
  const [y, m, d] = now
    .toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" })
    .split("-")
    .map(Number);
  return Date.UTC(y, m - 1, d);
}

const clean = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&middot;/g, "·")
    .replace(/&#9733;|&starf;|&#x2605;/gi, "★")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

/* ------------------------------------------------------------------ NFL -- */

// 2026 Week 1 opens Thursday, September 10. A game week runs Tuesday to
// Monday, so from Tuesday on "this week" means the next slate.
const NFL_WEEK_ONE_TUESDAY = Date.UTC(2026, 8, 8);

export function nflCurrentWeek(now: Date): number {
  const w = Math.floor((todayPacific(now) - NFL_WEEK_ONE_TUESDAY) / (7 * DAY)) + 1;
  return Math.max(1, w);
}

export function buildNflWear(
  entry: NflTeamEntry,
  latest: NflLatest | null,
  now: Date,
): { headline: WearHeadline | null; answers: WearAnswer[] } {
  const n = entry.nickname;
  let week = nflCurrentWeek(now);
  // Once this week's game is already in the tracker (Thursday and Sunday
  // teams on a Monday), "this week" for the reader is the next game.
  const thisWeek = entry.games.find((g) => g.week === week);
  if (latest && thisWeek && !thisWeek.bye && latest.opponent.endsWith(` ${thisWeek.opponent}`)) week += 1;
  const game = entry.games.find((g) => g.week === week);
  const answers: WearAnswer[] = [];
  let headline: WearHeadline | null = null;

  if (game && game.bye) {
    const a = `The ${n} are on their bye in Week ${week}, so there is no game this week.`;
    answers.push({ q: `What jerseys are the ${n} wearing this week?`, a });
  } else if (game) {
    const when = game.date ?? game.window;
    const where = game.home ? `at home against the ${game.opponent}` : `on the road at the ${game.opponent}`;
    const verb = game.confirmed ? "are wearing" : "are expected to wear";
    const source = game.confirmed ? "The team has confirmed it." : "The team has not confirmed it yet.";
    headline = {
      question: `What Are the ${n} Wearing This Week?`,
      uniform: game.uniform,
      confirmed: game.confirmed,
      detail: `Week ${week} · ${when} · ${game.home ? "vs" : "at"} ${game.opponent}`,
    };
    const look = game.uniform.replace(/\s*·\s*/g, ", ");
    answers.push(
      {
        q: `What jerseys are the ${n} wearing today?`,
        a: `In Week ${week} (${when}) the ${n} ${verb} their ${look} uniform ${where}. ${source}`,
      },
      {
        q: `What color are the ${n} wearing this week?`,
        a: `${look}, ${where} in Week ${week}. ${source}`,
      },
    );
  }

  if (latest) {
    const a = `In their most recent game, on ${latest.day}, ${latest.home ? "against" : "at"} the ${latest.opponent}, the ${n} wore ${nflComboSentence(latest)}. Final: ${latest.final}.`;
    answers.push(
      { q: `What uniform did the ${n} wear last week?`, a },
      { q: `What were the ${n} wearing in their last game?`, a },
    );
  }

  return { headline, answers };
}

/* -------------------------------------------------------------- College -- */

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export type CollegeGame = {
  ts: number;
  label: string;
  matchup: string;
  home: boolean;
  uniform: string;
  confirmed: boolean;
};

// One grid cell: date / matchup / uniform, e.g.
// "SEP 12" · "vs Ohio State" · "★ Burnt Orange" (a "· W 41-13 · A-" tail is dropped)
const COLLEGE_CELL =
  /<div style="[^"]*opacity:\s*0\.8\d?;">((?:[A-Z]{3} )?([A-Z]{3}) (\d{1,2}))<\/div>\s*<div style="[^"]*">(.*?)<\/div>\s*<div style="[^"]*">(.*?)<\/div>/g;

export function parseCollegeGrid(markdown: string): CollegeGame[] {
  const out: CollegeGame[] = [];
  for (const m of markdown.matchAll(COLLEGE_CELL)) {
    const month = MONTHS.indexOf(m[2]);
    if (month === -1) continue;
    // Bowl season spills into the new year.
    const year = month < 6 ? 2027 : 2026;
    const matchup = clean(m[4]);
    const raw = clean(m[5]);
    const confirmed = raw.startsWith("★");
    const uniform = raw.replace(/^★\s*/, "").split(" · ")[0].trim();
    if (!matchup || !uniform || /^bye$/i.test(matchup)) continue;
    const pretty = m[1].replace(/^[A-Z]{3} (?=[A-Z]{3} )/, "");
    out.push({
      ts: Date.UTC(year, month, Number(m[3])),
      label: pretty.charAt(0) + pretty.slice(1, 3).toLowerCase() + pretty.slice(3),
      matchup,
      home: /^vs/i.test(matchup),
      uniform,
      confirmed,
    });
  }
  return out.sort((a, b) => a.ts - b.ts);
}

/** "at home against UTSA" / "at Kentucky" */
const place = (g: CollegeGame) =>
  g.home ? `at home against ${g.matchup.replace(/^vs\.?\s+/i, "")}` : g.matchup;

export function buildCollegeWear(
  team: string,
  markdown: string,
  now: Date,
): { headline: WearHeadline | null; answers: WearAnswer[]; last: CollegeGame | null } {
  const games = parseCollegeGrid(markdown);
  if (games.length < 6) return { headline: null, answers: [], last: null };
  const today = todayPacific(now);

  const next = games.find((g) => g.ts > today || (g.ts === today && !g.confirmed)) ?? null;
  const last = [...games].reverse().find((g) => g.ts <= today && g.confirmed) ?? null;

  const answers: WearAnswer[] = [];
  let headline: WearHeadline | null = null;

  if (next) {
    const source = next.confirmed ? "The program has confirmed it." : "This is the expected look; it has not been confirmed yet.";
    headline = {
      question: `What Is ${team} Wearing This Week?`,
      uniform: next.uniform,
      confirmed: next.confirmed,
      detail: `${next.label} · ${next.matchup}`,
    };
    answers.push(
      {
        q: `What uniform is ${team} wearing today?`,
        a: `${team} plays next on ${next.label}, ${place(next)}, in ${next.uniform}. ${source}`,
      },
      {
        q: `What color is ${team} wearing this week?`,
        a: `${next.uniform}, ${place(next)} on ${next.label}. ${source}`,
      },
    );
  }

  if (last) {
    answers.push({
      q: `What did ${team} wear last week?`,
      a: `On ${last.label}, ${place(last)}, ${team} wore ${last.uniform}, confirmed from the game.`,
    });
  }

  return { headline, answers, last };
}

/* ------------------------------------------------------------------ MLB -- */

/**
 * Reads the dated "What the <Team> Are Wearing" block that
 * scripts/mlb-wearing-blocks.mjs writes into each MLB schedule post.
 */
export function buildMlbWear(
  team: string,
  contentHtml: string,
  now: Date = new Date(),
): WearAnswer[] {
  const block = /<div data-mlb-wearing[\s\S]*?Every jersey they have worn/.exec(contentHtml);
  if (!block) return [];
  const b = block[0];
  const date = /rgba\(255,255,255,0\.9\);">([^<]+)</.exec(b)?.[1];
  const uniform = /font-size: 2em;[^"]*">([^<]+)</.exec(b)?.[1];
  const status = /letter-spacing: 1px;">([^<]+)</.exec(b)?.[1];
  const matchup = /margin-top: 14px;[^"]*">([^<]+)</.exec(b)?.[1];
  if (!date || !uniform || !status || !matchup) return [];

  // On an off day scripts/mlb-wearing-blocks.mjs writes "NO GAME TODAY" into the
  // uniform slot, so the generic path below rendered "are expected to wear the NO
  // GAME TODAY" on every club's schedule post. Answer the off day plainly instead.
  if (/^NO GAME TODAY$/i.test(clean(uniform))) {
    const off = `For ${clean(date)}, the ${team} are off, so there is no uniform to confirm today. We confirm every jersey once we see it, and the full season plan is in the table below.`;
    return [
      { q: `What jerseys are the ${team} wearing today?`, a: off },
      { q: `What color are the ${team} wearing today?`, a: off },
    ];
  }

  const confirmed = /confirmed/i.test(status);
  const game = clean(matchup).split(" · ")[0];
  // The block carries the date it was written for. While that is still today,
  // a confirmed uniform is one the club is wearing right now, not one it wore.
  const blockDate = clean(date);
  const isToday = blockDate === mlbEtTodayLong(now);
  const verb = confirmed ? (isToday ? "are wearing" : "wore") : "are expected to wear";
  const a = `For ${blockDate} (${game}), the ${team} ${verb} the ${clean(uniform)}. ${confirmed ? "Confirmed." : "Not confirmed yet."}`;

  const out: WearAnswer[] = [
    { q: `What jerseys are the ${team} wearing today?`, a },
    { q: `What color are the ${team} wearing today?`, a },
  ];

  // The block carries the cap from MLB's uniform feed once the jersey is confirmed.
  const cap = /data-cap="([^"]+)"/.exec(b)?.[1];
  if (cap && confirmed) {
    out.push({
      q: `What hat are the ${team} wearing today?`,
      a: `For ${blockDate} (${game}), the ${team} ${isToday ? "are wearing" : "wore"} the ${clean(cap)} cap with the ${clean(uniform)}.`,
    });
  }
  return out;
}

/** Lower-cased, punctuation-free form used to drop duplicate FAQ questions. */
export const normQuestion = (q: string) => q.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
