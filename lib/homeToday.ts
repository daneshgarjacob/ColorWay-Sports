import { getAllPosts, type PostMeta } from "@/lib/posts";
import { getAllNewsMeta, type NewsMeta } from "@/lib/news";
import { buildMlbTonight, type MlbSlateGame } from "@/lib/mlbTonight";
import { getConfirmedUniforms, mlbEtToday } from "@/lib/mlbConfirmed";
import { buildNflWeekSlate } from "@/lib/nflWeekSlate";
import { buildWinterIndex, nhlTeams } from "@/lib/winterTrackerIndex";
import fs from "node:fs";
import path from "node:path";

// MOCK (homepage refresh, 10/5). Everything the "changes by itself every day"
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
  note?: string;
};
export type TonightLeague = {
  league: "MLB" | "NFL" | "NHL";
  label: string;
  href: string;
  games: TonightGame[];
  confirmed: string;
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
      label: "Division Series",
      href: "/stories/mlb-uniform-tracker-2026",
      confirmed: `${mlb.confirmedTeams} of ${mlb.games * 2} uniforms confirmed`,
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
      out.push({
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
// From the Stands: Jake's own photos, one per day, rotating on its own.
// Add a line every time Jake shoots a game. His photography only.
// ---------------------------------------------------------------------------
export type StandsPhoto = { src: string; caption: string; where: string; href: string; position?: string };

export const FROM_THE_STANDS: StandsPhoto[] = [
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

export function standsPhotoFor(date: string): StandsPhoto {
  return FROM_THE_STANDS[dayNumber(date) % FROM_THE_STANDS.length];
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
    lines.push(`${n} playoff game${mlb.games.length === 1 ? "" : "s"} tonight: ${g}. ${mlb.confirmed[0].toUpperCase()}${mlb.confirmed.slice(1)} so far.`);
  }
  const nfl = tonight.find((l) => l.league === "NFL");
  if (nfl && nfl.games[0]) {
    const g = nfl.games[0];
    lines.push(`NFL ${nfl.label} still has ${g.away} at ${g.home} to play, with the ${g.home} in ${g.homeLook ?? "TBA"}.`);
  }
  const latestWire = takes.find((t) => t.kind === "Wire");
  if (latestWire) {
    const words = latestWire.quote.split(/\s+/);
    const q = words.slice(0, 18).join(" ").replace(/[,.;:]$/, "");
    lines.push(`Jake's newest take, on ${latestWire.headline.replace(/[.:].*$/, "")}: "${q}${words.length > 18 ? "..." : ""}"`);
  }
  return lines;
}
