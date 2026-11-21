// Rooting Guide data layer (11/20): the only file here that does I/O.
//
// Cost: every ESPN feed is one Next data-cache entry (unstable_cache, which
// is the non-fetch form the Next 16 "caching without Cache Components" guide
// gives), shared by every rooting-guide page. A page render reads the cache;
// it never fetches ESPN itself. Entries refresh at most once an hour (the
// live week, next week, standings, rankings) or once a day (finished weeks
// and weeks further out), and only when a page that reads them is rendered.
// At most ~7 ESPN requests an hour, plus ~30 a day, however many pages there are.
// The values are slimmed first: the raw college scoreboard alone is over 1 MB,
// and the data cache refuses entries over 2 MB.
//
// In one build worker 140 pages render at once, so the assembled data is also
// memoized per process for a few minutes; without it a cold cache would send
// the same requests 140 times.

import { unstable_cache } from "next/cache";
import overridesJson from "@/content/data/rooting-guide-overrides.json";
import { TEAM_LOGOS, TEAM_LOGO_BY_SLUG } from "@/lib/teamLogos";
import { assembleCfb, assembleNfl, slimBoard, slimCfbRankings, slimCfbStandings, slimNflStandings, weekPlan, type Board, type WeekPhase } from "./parse";
import { nflGuide, guideProblems } from "./nfl";
import { cfbGuide, cfbSupportedSlugs } from "./cfb";
import { applyOverrides, siteSlug } from "./shared";
import type { CfbData, Guide, GuideResult, NflData, Overrides } from "./types";

const HOUR = 3600;
const DAY = 86400;
const E = "https://site.api.espn.com/apis";
const NFL_BOARD = `${E}/site/v2/sports/football/nfl/scoreboard`;
const CFB_BOARD = `${E}/site/v2/sports/football/college-football/scoreboard?groups=80&limit=300`;

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`ESPN ${res.status}: ${url}`);
  return res.json();
}

const weekUrl = (base: string, season: number, week: number) => `${base}${base.includes("?") ? "&" : "?"}seasontype=2&week=${week}&dates=${season}`;

// One cache entry per feed (and per week + phase for the sweeps).
const board = unstable_cache(async (url: string) => slimBoard(await getJson(url)), ["rg-board-v1"], { revalidate: HOUR });
// The phase argument only splits the cache key (see weekPlan).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const boardDaily = unstable_cache(async (url: string, _phase: WeekPhase) => slimBoard(await getJson(url)), ["rg-board-daily-v1"], { revalidate: DAY });
const nflStandings = unstable_cache(async (season: number) => slimNflStandings(await getJson(`${E}/v2/sports/football/nfl/standings?season=${season}&level=3`)), ["rg-nfl-standings-v1"], { revalidate: HOUR });
// group=80 is every FBS conference in one response (ids inside: ACC 1, Big 12 4,
// Big Ten 5, SEC 8, American 151, C-USA 12, MAC 15, Mountain West 17, Pac-12 9,
// Sun Belt 37, Independents 18).
const cfbStandings = unstable_cache(async (season: number) => slimCfbStandings(await getJson(`${E}/v2/sports/football/college-football/standings?season=${season}&group=80`)), ["rg-cfb-standings-v1"], { revalidate: HOUR });
const cfbRankings = unstable_cache(async () => slimCfbRankings(await getJson(`${E}/site/v2/sports/football/college-football/rankings`)), ["rg-cfb-rankings-v1"], { revalidate: HOUR });

async function sweep(base: string, cur: Board): Promise<Board[]> {
  return Promise.all(
    weekPlan(cur).map(({ week, phase }) => (phase === "next" ? board(weekUrl(base, cur.season, week)) : boardDaily(weekUrl(base, cur.season, week), phase))),
  );
}

async function loadNfl(): Promise<NflData> {
  const cur = await board(NFL_BOARD);
  const [others, teams] = await Promise.all([sweep(NFL_BOARD, cur), nflStandings(cur.season)]);
  return assembleNfl(cur, others, teams);
}

async function loadCfb(): Promise<CfbData> {
  const cur = await board(CFB_BOARD);
  const [others, teams, rank] = await Promise.all([sweep(CFB_BOARD, cur), cfbStandings(cur.season), cfbRankings()]);
  return assembleCfb(cur, others, teams, rank);
}

/** Per-process memo so concurrent renders share one load. Failures are not kept. */
function memo<T>(fn: () => Promise<T>, ttlMs = 5 * 60_000): () => Promise<T> {
  let hit: { at: number; p: Promise<T> } | undefined;
  return () => {
    if (hit && Date.now() - hit.at < ttlMs) return hit.p;
    const p = fn();
    hit = { at: Date.now(), p };
    p.catch(() => {
      if (hit?.p === p) hit = undefined;
    });
    return p;
  };
}

export const getNflData = memo(loadNfl);
export const getCfbData = memo(loadCfb);

const OVERRIDES = overridesJson as Overrides;

/** Site logo for an ESPN display name, when we have one. */
export function logoFor(displayName: string): string | undefined {
  return TEAM_LOGOS[displayName] ?? TEAM_LOGO_BY_SLUG[siteSlug(displayName)];
}

function finish(res: GuideResult): GuideResult {
  if (res.kind !== "guide") return res;
  const g = applyOverrides(res.guide, OVERRIDES);
  // Junk guard: a guide that fails its own checks is not shown.
  if (guideProblems(g).length) return { kind: "updating", key: g.key };
  for (const s of g.sections) for (const r of s.games) r.rootLogo = r.rootDisplayName ? logoFor(r.rootDisplayName) : undefined;
  return { kind: "guide", guide: g };
}

/** The guide for one team page. Never throws: a failed feed is the "updating" state. */
export async function getRootingGuide(league: string, team: string): Promise<GuideResult> {
  const key = `${league}/${team}`;
  try {
    if (league === "nfl") return finish(nflGuide(await getNflData(), team));
    if (league === "college-football") return finish(cfbGuide(await getCfbData(), team));
  } catch (e) {
    console.error(`[rooting-guide] ${key}: ${(e as Error).message}`);
  }
  return { kind: "updating", key };
}

export type HubData = {
  nfl?: { week: number; teams: { slug: string; name: string; div: string; conf: string; record: string; tag: string; picks: string[] }[] };
  cfb?: { week: number; poll: "cfp" | "ap"; teams: { slug: string; name: string; displayName: string; rank: number; record: string; tag: string; picks: string[] }[] };
};

/** Everything the /rooting-guide hub lists. Each league fails on its own. */
export async function getRootingHub(): Promise<HubData> {
  const out: HubData = {};
  try {
    const d = await getNflData();
    out.nfl = {
      week: d.week,
      teams: d.teams.map((t) => {
        const slug = siteSlug(t.displayName);
        const res = finish(nflGuide(d, slug));
        const g = res.kind === "guide" ? res.guide : undefined;
        return { slug, name: t.name, div: t.div, conf: t.conf, record: `${t.w}-${t.l}${t.t ? `-${t.t}` : ""}`, tag: g?.status.tag ?? "", picks: g?.picks ?? [] };
      }),
    };
  } catch (e) {
    console.error(`[rooting-guide] hub nfl: ${(e as Error).message}`);
  }
  try {
    const d = await getCfbData();
    const byId = new Map(d.teams.map((t) => [t.id, t]));
    out.cfb = {
      week: d.week,
      poll: d.poll,
      teams: cfbSupportedSlugs(d).map((slug) => {
        const res = finish(cfbGuide(d, slug));
        const g = res.kind === "guide" ? res.guide : undefined;
        const t = d.teams.find((x) => siteSlug(x.displayName) === slug)!;
        return { slug, name: t.location, displayName: t.displayName, rank: d.ranked.indexOf(t.id) + 1, record: `${byId.get(t.id)!.w}-${byId.get(t.id)!.l}`, tag: g?.status.tag ?? "", picks: g?.picks ?? [] };
      }),
    };
  } catch (e) {
    console.error(`[rooting-guide] hub cfb: ${(e as Error).message}`);
  }
  return out;
}

/**
 * "nfl:los-angeles-chargers" -> ["Eagles", "Broncos", "Panthers"], for the My
 * Teams line. Cached for six hours on its own key, so the homepage and
 * /my-teams (which refresh about once a day) revalidate at most four times a
 * day because of it, instead of hourly like the guide pages.
 */
export const getRootingPicks = unstable_cache(
  async (): Promise<Record<string, string[]>> => {
    const hub = await getRootingHub();
    // Throwing keeps a half-loaded result out of the six-hour cache.
    if (!hub.nfl || !hub.cfb) throw new Error("rooting picks: a league failed to load");
    const out: Record<string, string[]> = {};
    for (const t of hub.nfl?.teams ?? []) if (t.picks.length) out[`nfl:${t.slug}`] = t.picks;
    for (const t of hub.cfb?.teams ?? []) if (t.picks.length) out[`cfb:${t.slug}`] = t.picks;
    return out;
  },
  ["rg-picks-v1"],
  { revalidate: 6 * HOUR },
);

/** Safe wrapper for pages that only decorate with picks. */
export async function rootingPicksOrEmpty(): Promise<Record<string, string[]>> {
  try {
    return await getRootingPicks();
  } catch {
    return {};
  }
}

export type { Guide };
