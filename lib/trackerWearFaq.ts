// FAQ copy for the two per-team calendar pages, /mlb-tracker/<team> and
// /nfl-tracker/<team>.
//
// Why this exists: both pages used to answer "what are they wearing today" with
// a pointer ("shown at the top of this page") rather than the jersey, so the
// FAQ schema named no uniform and Google had nothing specific to serve. The team
// SCHEDULE posts already answer it properly, out of lib/teamWearAnswers. These
// builders call those same functions and reuse their sentences word for word, so
// the calendar page and the schedule post can never disagree, then add the season
// context that only the calendar pages carry.
//
// Nothing here invents a uniform, a game or a count: every answer is built from
// the schedule post's dated wearing block, the club's week grid, or the tracker.

import {
  buildMlbWear,
  buildNflWear,
  normQuestion,
  type WearAnswer,
  type WearHeadline,
} from "./teamWearAnswers";
import type { NflTeamEntry } from "./nflTrackerTeamIndex";
import type { NflLatest } from "./nflTeamLatest";

/** scripts/mlb-wearing-blocks.mjs writes this in the jersey slot on an off day. */
const OFF_DAY = "NO GAME TODAY";

function dedupe(answers: WearAnswer[]): WearAnswer[] {
  const seen = new Set<string>();
  const out: WearAnswer[] = [];
  for (const a of answers) {
    const key = normQuestion(a.q);
    if (seen.has(key) || !a.a) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}

/* ------------------------------------------------------------------ MLB -- */

export type MlbToday = {
  /** "Tuesday, September 15, 2026" */
  date: string;
  /** "Blue Alternate", or NO GAME TODAY on an off day. */
  uniform: string;
  confirmed: boolean;
  /** "Dodgers at Cincinnati Reds · 6:40 PM ET" */
  matchup: string;
  offDay: boolean;
};

/**
 * Reads the dated "What the <Team> Are Wearing" block out of a team's schedule
 * post. Same block, same fields as buildMlbWear; this one also reports the off
 * day, which buildMlbWear does not distinguish.
 */
export function readMlbToday(html: string | null): MlbToday | null {
  if (!html) return null;
  const block = /<div data-mlb-wearing[\s\S]*?Every jersey they have worn/.exec(html)?.[0];
  if (!block) return null;
  const date = /rgba\(255,255,255,0\.9\);">([^<]+)</.exec(block)?.[1];
  const uniform = /font-size: 2em;[^"]*">([^<]+)</.exec(block)?.[1];
  const status = /letter-spacing: 1px;">([^<]+)</.exec(block)?.[1];
  const matchup = /margin-top: 14px;[^"]*">([^<]+)</.exec(block)?.[1];
  if (!date || !uniform || !status || !matchup) return null;

  const jersey = uniform.trim();
  const offDay = jersey === OFF_DAY;
  return {
    date: date.trim(),
    uniform: jersey,
    confirmed: !offDay && /confirmed/i.test(status),
    matchup: matchup.replace(/&middot;/g, "·").replace(/\s+/g, " ").trim(),
    offDay,
  };
}

export type MlbTrackerFaqInput = {
  /** Short club name as the rest of the page says it, e.g. "Dodgers". */
  team: string;
  /** Rendered HTML of the club's own uniform-schedule post. */
  scheduleHtml: string | null;
  /** Most recent logged game from the daily tracker. `uniform` is absent when
   *  the tracker card has no jersey label yet. */
  lastGame: { day: string; opp: string; uniform?: string } | null;
  gamesLogged: number;
  uniformsWorn: number;
  topUniform: { uniform: string; total: number } | null;
};

export function mlbTrackerFaq(input: MlbTrackerFaqInput): WearAnswer[] {
  const { team, scheduleHtml, lastGame, gamesLogged, uniformsWorn, topUniform } = input;
  const today = readMlbToday(scheduleHtml);
  const out: WearAnswer[] = [];

  if (today && !today.offDay && scheduleHtml) {
    // The schedule post's own sentence, verbatim, so both surfaces read alike:
    // "For Tuesday, September 15, 2026 (Dodgers at Cincinnati Reds), the Dodgers
    // wore the Blue Alternate. Confirmed."
    const shared = buildMlbWear(team, scheduleHtml);
    const core = shared[0]?.a;
    if (core) {
      const answer = today.confirmed ? core : `${core} We confirm it once we see it.`;
      out.push(
        { q: `What are the ${team} wearing today?`, a: answer },
        { q: `What are the ${team} wearing tonight?`, a: answer },
      );
    }
    out.push(...shared);
  } else if (today?.offDay) {
    const a = `The ${team} are off on ${today.date}, so there is no uniform to confirm today. We confirm every jersey once we see it, and the calendar on this page has each one they have worn in 2026.`;
    out.push(
      { q: `What are the ${team} wearing today?`, a },
      { q: `What are the ${team} wearing tonight?`, a },
    );
  } else {
    // No wearing block on the schedule post yet. Say so plainly rather than
    // naming a jersey we have not read anywhere.
    const a = `We have not posted today's ${team} uniform yet. We confirm each game's jersey once we see it, and it lands on this page and on the ${team} uniform schedule the same morning.`;
    out.push(
      { q: `What are the ${team} wearing today?`, a },
      { q: `What are the ${team} wearing tonight?`, a },
    );
  }

  if (lastGame) {
    const worn = lastGame.uniform ? `the ${lastGame.uniform}` : "a uniform we are still confirming";
    out.push(
      {
        q: `What jersey did the ${team} wear last night?`,
        a: `In the most recent ${team} game we have logged (${lastGame.day}, ${lastGame.opp}), they wore ${worn}. We log every game the morning after it is played, so this updates daily.`,
      },
      {
        q: `What uniform did the ${team} wear yesterday?`,
        a: `Our latest logged ${team} game is ${lastGame.day} (${lastGame.opp}), when they wore ${worn}. The day-by-day calendar on this page shows every jersey they have worn in 2026.`,
      },
    );
  }

  out.push({
    q: `What are the ${team} wearing tomorrow?`,
    a: `Uniform assignments are usually confirmed the day of the game, so we do not call tomorrow's jersey before the club does. The ${team} 2026 uniform schedule breaks down which jersey they wear on which day, at home and on the road.`,
  });

  if (gamesLogged > 0) {
    out.push({
      q: `How many different uniforms have the ${team} worn in 2026?`,
      a: `The ${team} have worn ${uniformsWorn} different uniform${uniformsWorn === 1 ? "" : "s"} across the ${gamesLogged} game${gamesLogged === 1 ? "" : "s"} we have logged this season${topUniform ? `. Their most-worn look is the ${topUniform.uniform}, in ${topUniform.total} game${topUniform.total === 1 ? "" : "s"}` : ""}.`,
    });
  }

  return dedupe(out);
}

/* ------------------------------------------------------------------ NFL -- */

export type NflTrackerFaqInput = {
  entry: NflTeamEntry;
  /** Most recent PLAYED game from the NFL tracker, for the last-game answers. */
  latest: NflLatest | null;
  now: Date;
  playedCount: number;
  confirmedCount: number;
  homeGames: number;
  roadGames: number;
  usage: Array<{ uniform: string; total: number }>;
  confirmedGames: Array<{ week: number; matchup: string; uniform: string }>;
};

/**
 * This week's look plus the season questions. The headline is handed straight to
 * TeamWearBox, the same component the schedule posts use, so the calendar page
 * leads with the week's jersey instead of only a confirmed-games count.
 */
export function nflTrackerFaq(input: NflTrackerFaqInput): {
  headline: WearHeadline | null;
  faq: WearAnswer[];
} {
  const { entry, latest, now, playedCount, confirmedCount, homeGames, roadGames, usage, confirmedGames } =
    input;

  const wear = buildNflWear(entry, latest, now);
  // buildNflWear phrases this week as "What jerseys are the Bills wearing today?"
  // (or the bye-week line). That sentence is the specific answer this page was
  // missing, so it leads the FAQ too.
  const weekSentence =
    wear.answers.find((a) => /wearing (today|this week)/i.test(a.q))?.a ?? null;

  const season = `${confirmedCount} of ${playedCount} ${entry.name} games are officially confirmed by the team; the rest follow the standard home and road sets.`;

  const faq: WearAnswer[] = [
    {
      q: `What uniform are the ${entry.name} wearing this week?`,
      a: weekSentence
        ? `${weekSentence} ${season}`
        : `The calendar on this page lists all 18 weeks of the ${entry.name} 2026 season with the jersey for each one. ${season}`,
    },
    ...wear.answers,
    {
      q: `How many different uniforms do the ${entry.name} wear in 2026?`,
      a: `${usage.length} across the season: ${usage
        .map((u) => `${u.uniform} (${u.total} game${u.total === 1 ? "" : "s"})`)
        .join(", ")}.`,
    },
    {
      q: `Which ${entry.name} games have a confirmed uniform?`,
      a: confirmedGames.length
        ? confirmedGames.map((g) => `Week ${g.week} ${g.matchup} in the ${g.uniform}`).join("; ") + "."
        : `The ${entry.name} have not announced any special uniform dates for 2026 yet. This page updates as they do.`,
    },
    {
      q: `Do the ${entry.name} wear the same uniform at home and on the road?`,
      a: `No. Across 2026 the ${entry.name} have ${homeGames} home game${homeGames === 1 ? "" : "s"} and ${roadGames} road game${roadGames === 1 ? "" : "s"}, and the calendar shows which jersey goes with each.`,
    },
  ];

  return { headline: wear.headline, faq: dedupe(faq) };
}
