import { getAllPosts, type PostMeta } from "@/lib/posts";
import { getAllNewsMeta, type NewsMeta } from "@/lib/news";
import { buildMlbTonight, type MlbSlateGame } from "@/lib/mlbTonight";
import { getConfirmedUniforms, mlbEtToday } from "@/lib/mlbConfirmed";
import { buildNflWeekSlate } from "@/lib/nflWeekSlate";
import { buildWinterIndex, nhlTeams } from "@/lib/winterTrackerIndex";
import { getFeaturedSeries } from "@/lib/worldSeries";
import fs from "node:fs";
import path from "node:path";

// Homepage refresh (shipped 10/5). Everything the "changes by itself every day"
// homepage needs, read from files the daily passes already write. Nothing here
// is typed in by hand except the From the Stands photo list, and that is Jake's
// own photography only.

const dayNumber = (d: string) => Math.floor(Date.parse(d.slice(0, 10) + "T00:00:00Z") / 86_400_000);

// ---------------------------------------------------------------------------
// Jake's Takes: wire items with a take + stories he bylined, newest first.
// ---------------------------------------------------------------------------
export type Take = {
  key: string;
  href: string;
  headline: string;
  quote: string;
  when: string; // ISO date or timestamp
  kind: "Wire" | "Column" | "Story";
  tag: string;
};

export function getJakesTakes(limit = 5, skipSlugs: Set<string> = new Set()): Take[] {
  const wire: Take[] = getAllNewsMeta()
    .filter((n: NewsMeta) => n.take)
    .map((n) => ({
      key: `n-${n.slug}`,
      href: `/news/${n.slug}`,
      headline: n.title,
      quote: n.take!,
      when: n.at,
      kind: "Wire" as const,
      tag: n.tag,
    }));
  const stories: Take[] = getAllPosts()
    // A story already on the page above (hero, Latest grid) is not repeated.
    .filter((p: PostMeta) => p.author === "jake-daneshgar" && !skipSlugs.has(p.slug))
    .map((p) => ({
      key: `p-${p.slug}`,
      href: `/stories/${p.slug}`,
      headline: p.title,
      quote: p.excerpt,
      // Posts carry a date, not a time; stamp them mid-morning Pacific.
      when: `${p.date}T09:00:00-07:00`,
      kind: /opinion/i.test(p.kicker ?? "") ? ("Column" as const) : ("Story" as const),
      tag: p.category,
    }));
  return [...wire, ...stories]
    .sort((a, b) => Date.parse(b.when) - Date.parse(a.when))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Tonight: one row per league, built from the slate / schedule files.
// ---------------------------------------------------------------------------
export type TonightGame = {
  away: string;
  home: string;
  time?: string;
  awayLook?: string;
  homeLook?: string;
  /** NFL: the home look is announced or worn, not just the expected grid jersey. */
  homeLookConfirmed?: boolean;
  note?: string;
};
export type TonightLeague = {
  league: "MLB" | "NFL" | "NHL";
  label: string;
  href: string;
  games: TonightGame[];
  confirmed: string;
  /**
   * NFL only: where the week stands, so the brief never says a week "still
   * has" games to play before it has kicked off.
   * - before: first game is on a later day
   * - kickoff: first game is today and nothing is Final yet
   * - underway: at least one game is Final, or the first game day has passed
   */
  phase?: "before" | "kickoff" | "underway";
  /** NFL only: day the week's first game is played ("Thursday"). */
  startDay?: string;
  /** NFL only: games[0] is the dated opener, not just first alphabetically. */
  openerKnown?: boolean;
  /** NFL only: sides with an announced or worn look this week. */
  confirmedSides?: number;
};

const cap = (s: string) => s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

export function getTonight(now = new Date()): TonightLeague[] {
  const out: TonightLeague[] = [];
  const today = mlbEtToday(now);

  // MLB: tonight's slate file + what the clubs confirmed.
  const mlb = buildMlbTonight(now);
  if (mlb && mlb.games > 0) {
    const slate = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "scripts", "mlb-slate", `${mlb.date}.json`), "utf8"),
    ) as { games: MlbSlateGame[] };
    const conf = getConfirmedUniforms(mlb.date);
    out.push({
      league: "MLB",
      // The round follows the postseason results file: ALCS until the AL
      // champion is set, then World Series. ("Division Series" was hardcoded
      // and still showed on ALCS Game 4, 10/17.)
      label: getFeaturedSeries()?.kind ?? "Postseason",
      href: "/stories/mlb-uniform-tracker-2026",
      // A confirmed file marked "_expected": true holds our expected looks
      // (Jake's call during a rain delay), not team confirmations.
      confirmed: expectedOnly(mlb.date)
        ? "expected looks posted, confirmed at first pitch"
        : `${mlb.confirmedTeams} of ${mlb.games * 2} uniforms confirmed`,
      games: slate.games.map((g) => ({
        away: cap(g.awaySlug),
        home: cap(g.homeSlug),
        time: g.time,
        awayLook: conf[g.awaySlug],
        homeLook: conf[g.homeSlug],
      })),
    });
  }

  // NFL: games on this week's slate that have not gone Final yet.
  const nfl = buildNflWeekSlate(now);
  if (nfl) {
    const left = nfl.games.filter((g) => !g.score).slice(0, 3);
    if (left.length) {
      // Slate games are sorted by date, so the first one opens the week once the
      // tracker has dated it ("Thursday, October 15"). Before the week's cards
      // are built every game only carries the window ("Thu, Oct 15 – Mon,
      // Oct 19"), and the slate order is alphabetical, so no opener is named.
      const opener = nfl.games[0]?.when ?? "";
      const openerKnown = /^[A-Z][a-z]+day, [A-Z][a-z]+ \d+$/.test(opener);
      const startMatch = nfl.window.match(/^(\w{3}), (\w{3}) (\d+)/);
      const startTs = openerKnown
        ? Date.parse(`${opener} 2026`)
        : startMatch
          ? Date.parse(`${startMatch[2]} ${startMatch[3]} 2026`)
          : NaN;
      const todayTs = Date.parse(`${today}T00:00:00`);
      const phase: TonightLeague["phase"] =
        nfl.games.some((g) => g.score) || Number.isNaN(startTs) || startTs < todayTs
          ? "underway"
          : startTs > todayTs
            ? "before"
            : "kickoff";
      const DAY: Record<string, string> = {
        Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday",
        Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
      };
      out.push({
        phase,
        startDay: openerKnown
          ? opener.split(",")[0]
          : startMatch
            ? DAY[startMatch[1]] ?? startMatch[1]
            : undefined,
        openerKnown,
        confirmedSides: nfl.confirmedSides,
        league: "NFL",
        label: `Week ${nfl.week}`,
        href: "/stories/nfl-uniform-tracker-2026",
        confirmed: `${nfl.confirmedSides} of ${nfl.totalSides} looks confirmed this week`,
        games: left.map((g) => ({
          away: g.away?.team.nickname ?? g.awayName,
          home: g.home.team.nickname,
          time: g.label || g.when,
          awayLook: g.away?.uniform,
          homeLook: g.home.uniform,
          homeLookConfirmed: g.home.look.state !== "tba" || g.home.game.confirmed,
        })),
      });
    }
  }

  // NHL: tonight's home games off the season schedule file; the sweater is the
  // expected one (league default or an announced special from the game log).
  const teams = nhlTeams();
  const nhl = buildWinterIndex().filter((t) => t.league === "nhl");
  const games: TonightGame[] = [];
  for (const t of nhl) {
    const g = t.games.find((x) => x.date === today && x.home);
    if (!g) continue;
    const awayEntry = nhl.find((x) => x.name === g.opponent);
    const awayGame = awayEntry?.games.find((x) => x.date === today && !x.home);
    games.push({
      away: awayEntry?.nickname ?? teams[g.opponentAbbr]?.short ?? g.opponent,
      home: t.nickname,
      awayLook: awayGame?.expected,
      homeLook: g.expected,
    });
  }
  if (games.length) {
    out.push({
      league: "NHL",
      label: "Tonight",
      href: "/stories/nhl-uniform-tracker-2026-27",
      confirmed: `${games.length} game${games.length === 1 ? "" : "s"}`,
      games: games.slice(0, 4),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
function expectedOnly(date: string): boolean {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "mlb-confirmed", `${date}.json`), "utf8"));
    return raw?._expected === true;
  } catch {
    return false;
  }
}

// From the Stands: Jake's own photos, one per day, rotating on its own.
// Add a line every time Jake shoots a game. His photography only.
// ---------------------------------------------------------------------------
export type StandsPhoto = { src: string; caption: string; where: string; href: string; position?: string };

export const FROM_THE_STANDS: StandsPhoto[] = [
  {
    src: "/images/posts/from-the-stands/brewers-dodgers-2026-10-15/dodgers-fans-ohtani-turner-jerseys.jpg",
    caption: "Ohtani and Turner jerseys in the stands for NLCS Game 4, the night the Brewers finished the sweep",
    where: "Dodger Stadium · Oct 15",
    href: "/stories/brewers-uniform-schedule-2026",
    position: "center 60%",
  },
  {
    src: "/images/posts/from-the-stands/brewers-dodgers-2026-10-15/dodger-stadium-dusk-scoreboard.jpg",
    caption: "Dusk over the palm trees and the 76 ball during NLCS Game 4",
    where: "Dodger Stadium · Oct 15",
    href: "/stories/dodgers-uniform-schedule-2026",
    position: "center 50%",
  },
  {
    src: "/images/posts/from-the-stands/brewers-dodgers-2026-10-15/make-some-noise-under-the-lights.jpg",
    caption: "Make Some Noise: Dodger Stadium under the lights with the season on the line",
    where: "Dodger Stadium · Oct 15",
    href: "/stories/mlb-uniform-tracker-2026",
    position: "center 55%",
  },
  {
    src: "/images/posts/from-the-stands/brewers-dodgers-2026-10-15/dodgers-dugout-nlcs-game-4.jpg",
    caption: "The Dodgers dugout in home whites during NLCS Game 4",
    where: "Dodger Stadium · Oct 15",
    href: "/stories/dodgers-uniform-schedule-2026",
    position: "center 70%",
  },
  {
    src: "/images/posts/from-the-stands/brewers-dodgers-2026-10-15/dodger-stadium-first-pitch-light.jpg",
    caption: "Early light at Dodger Stadium as NLCS Game 4 gets going",
    where: "Dodger Stadium · Oct 15",
    href: "/stories/brewers-uniform-schedule-2026",
    position: "center 60%",
  },
  {
    src: "/images/posts/from-the-stands/rams-bills-2026-10-12/sofi-tied-34-late.jpg",
    caption: "Tied at 34 late, before the Bills won it in overtime",
    where: "SoFi Stadium · Oct 12",
    href: "/stories/nfl-uniform-tracker-2026",
    position: "center 55%",
  },
  {
    src: "/images/posts/from-the-stands/rams-bills-2026-10-12/sofi-halftime-latino-youth-honors.jpg",
    caption: "The SoFi halo board during the first half of Monday Night Football",
    where: "SoFi Stadium · Oct 12",
    href: "/stories/rams-uniform-schedule-2026",
    position: "center 45%",
  },
  {
    src: "/images/posts/from-the-stands/rams-bills-2026-10-12/sofi-rams-bills-wide.jpg",
    caption: "Rams royal against an all-white Bills, Monday Night Football",
    where: "SoFi Stadium · Oct 12",
    href: "/stories/rams-uniform-schedule-2026",
    position: "center 60%",
  },
  {
    src: "/images/posts/from-the-stands/rams-bills-2026-10-12/sofi-halo-board.jpg",
    caption: "Under the halo board before the Bills took a 37-34 overtime win",
    where: "SoFi Stadium · Oct 12",
    href: "/stories/nfl-uniform-tracker-2026",
    position: "center 40%",
  },
  {
    src: "/images/posts/from-the-stands/rams-bills-2026-10-12/sofi-rams-end-zone.jpg",
    caption: "The Los Angeles end zone from the top of SoFi",
    where: "SoFi Stadium · Oct 12",
    href: "/stories/rams-uniform-schedule-2026",
    position: "75% 60%",
  },
  {
    src: "/images/posts/braves-navy-alternate-jersey-nlds-game-2/acuna-navy-dodger-stadium.jpg",
    caption: "Acuña in the navy alternate, NLDS Game 2",
    where: "Dodger Stadium · Oct 4",
    href: "/stories/braves-navy-alternate-jersey-nlds-game-2",
    position: "center 60%",
  },
  {
    src: "/images/posts/braves-navy-alternate-jersey-nlds-game-2/dodger-stadium-before-first-pitch.jpg",
    caption: "Minutes before first pitch, seats still filling",
    where: "Dodger Stadium · Oct 4",
    href: "/stories/dodgers-fans-leaving-early-la-sports-fans-spoiled",
    position: "center 55%",
  },
  {
    src: "/images/posts/braves-navy-alternate-jersey-nlds-game-2/dodgers-hernandez-dugout.jpg",
    caption: "Teoscar and Kiké at the rail in home whites",
    where: "Dodger Stadium · Oct 4",
    href: "/stories/braves-navy-alternate-jersey-nlds-game-2",
  },
  {
    src: "/images/posts/IMG_1007.JPG",
    caption: "Opening Night sunset over the ring ceremony",
    where: "Dodger Stadium · March",
    href: "/stories/dodgers-opening-night-2026-ring-ceremony-review",
    position: "center 30%",
  },
];

// Jake 10/6: the Stands photo must never repeat a photo already on the page.
// A photo whose story is in the lead or Latest slots is skipped (that story's
// cover is the same shot), and the rotation moves on to the next one.
// Every photo whose story is not already on the page (the browser picks one at random).
export function standsPool(shownSlugs: Set<string> = new Set()): StandsPhoto[] {
  const pool = FROM_THE_STANDS.filter((p) => !shownSlugs.has(p.href.replace("/stories/", "")));
  return pool.length ? pool : FROM_THE_STANDS;
}

export function standsPhotoFor(date: string, shownSlugs: Set<string> = new Set()): StandsPhoto {
  const n = FROM_THE_STANDS.length;
  const start = dayNumber(date) % n;
  for (let i = 0; i < n; i++) {
    const photo = FROM_THE_STANDS[(start + i) % n];
    if (!shownSlugs.has(photo.href.replace("/stories/", ""))) return photo;
  }
  return FROM_THE_STANDS[start];
}

// ---------------------------------------------------------------------------
// Today's brief: two or three plain sentences written from the data above.
// Real prose on the homepage, so Mediavine's Content unit has somewhere to go.
// ---------------------------------------------------------------------------
export function todayBrief(tonight: TonightLeague[], takes: Take[]): string[] {
  const lines: string[] = [];
  const mlb = tonight.find((l) => l.league === "MLB");
  if (mlb) {
    const g = mlb.games
      .map((x) => `${x.away} at ${x.home}${x.awayLook && x.homeLook ? ` (${x.awayLook} vs ${x.homeLook})` : ""}`)
      .join(" and ");
    const n = ["No", "One", "Two", "Three", "Four"][mlb.games.length] ?? String(mlb.games.length);
    lines.push(`${n} playoff game${mlb.games.length === 1 ? "" : "s"} tonight: ${g}. ${mlb.confirmed[0].toUpperCase()}${mlb.confirmed.slice(1)}${mlb.confirmed.startsWith("expected") ? "" : " so far"}.`);
  }
  const nfl = tonight.find((l) => l.league === "NFL");
  if (nfl && nfl.games[0]) {
    // Reads right before, on and after the opening night of the week:
    //   before:   "NFL Week 6 starts Thursday with the Seahawks at the Broncos, ..."
    //             (or, before the tracker has dated the opener,
    //             "NFL Week 6 starts Thursday, and no uniforms are confirmed yet.")
    //   kickoff:  "NFL Week 6 kicks off tonight with the Seahawks at the Broncos, ..."
    //   underway: "Still to play in NFL Week 6: Commanders at 49ers, ..."
    const g = nfl.games[0];
    const look = g.homeLook
      ? `, with the ${g.home} ${g.homeLookConfirmed ? "in" : "expected in"} ${g.homeLook}`
      : "";
    const n = nfl.confirmedSides ?? 0;
    const status = n
      ? `, with ${n} look${n === 1 ? "" : "s"} already confirmed`
      : ", and no uniforms are confirmed yet";
    if (nfl.phase === "before") {
      const when = nfl.startDay ? `starts ${nfl.startDay}` : "is up next";
      lines.push(
        nfl.openerKnown
          ? `NFL ${nfl.label} ${when} with the ${g.away} at the ${g.home}${look}.`
          : `NFL ${nfl.label} ${when}${status}.`,
      );
    } else if (nfl.phase === "kickoff") {
      lines.push(
        nfl.openerKnown
          ? `NFL ${nfl.label} kicks off tonight with the ${g.away} at the ${g.home}${look}.`
          : `NFL ${nfl.label} kicks off tonight${status}.`,
      );
    } else {
      lines.push(`Still to play in NFL ${nfl.label}: ${g.away} at ${g.home}${look}.`);
    }
  }
  const latestWire = takes.find((t) => t.kind === "Wire");
  if (latestWire) {
    const words = latestWire.quote.split(/\s+/);
    const q = words.slice(0, 18).join(" ").replace(/[,.;:]$/, "");
    lines.push(`Jake's newest take, on ${latestWire.headline.replace(/[.:].*$/, "")}: "${q}${words.length > 18 ? "..." : ""}"`);
  }
  return lines;
}
