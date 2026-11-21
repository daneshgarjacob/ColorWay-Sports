// Turns ESPN's raw JSON into the small shapes in types.ts. Pure functions:
// they throw on junk so the caller can show the "updating" state instead of
// wrong picks. Keep the output small (the Next data cache refuses entries over
// 2 MB, and the raw college scoreboard alone is over 1 MB).

import type { CfbTeam, NflTeam, Side, SlimGame } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Raw = any;

const num = (v: unknown, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : d);

function side(c: Raw): Side {
  const t = c?.team ?? {};
  const rec = Array.isArray(c?.records) ? c.records.find((r: Raw) => r?.type === "total" || r?.name === "overall") ?? c.records[0] : undefined;
  const score = c?.score;
  return {
    id: String(t.id ?? ""),
    abbr: String(t.abbreviation ?? ""),
    location: String(t.location ?? t.shortDisplayName ?? ""),
    name: String(t.name ?? ""),
    displayName: String(t.displayName ?? ""),
    score: score === undefined || score === "" ? undefined : num(typeof score === "object" ? score.value : score),
    record: rec?.summary ? String(rec.summary) : undefined,
  };
}

function tvOf(comp: Raw): string | undefined {
  const one = typeof comp?.broadcast === "string" && comp.broadcast ? comp.broadcast : comp?.broadcasts?.[0]?.names?.[0];
  return one ? String(one) : undefined;
}

/** One week of a scoreboard response. */
export function slimBoard(raw: Raw): { season: number; seasonType: number; week: number; games: SlimGame[]; byes: string[]; weeks: number[] } {
  if (!raw || !Array.isArray(raw.events)) throw new Error("scoreboard: no events");
  const week = num(raw.week?.number, NaN);
  const season = num(raw.season?.year, NaN);
  if (!Number.isFinite(week) || !Number.isFinite(season)) throw new Error("scoreboard: no week/season");
  const games: SlimGame[] = [];
  for (const e of raw.events) {
    const comp = e?.competitions?.[0];
    const cs = comp?.competitors;
    if (!Array.isArray(cs) || cs.length !== 2) continue;
    const home = cs.find((c: Raw) => c.homeAway === "home") ?? cs[0];
    const away = cs.find((c: Raw) => c.homeAway === "away") ?? cs[1];
    const st = e.status?.type ?? comp.status?.type ?? {};
    const headline = Array.isArray(comp.notes) && comp.notes[0]?.headline ? String(comp.notes[0].headline) : undefined;
    const typeAbbr = String(comp.type?.abbreviation ?? "");
    games.push({
      id: String(e.id),
      week: num(e.week?.number, week),
      date: String(e.date ?? comp.date),
      timeValid: comp.timeValid !== false && !/T05:00Z$/.test(String(e.date ?? "")),
      state: st.state === "post" ? "post" : st.state === "in" ? "in" : "pre",
      detail: String(st.shortDetail ?? st.detail ?? ""),
      neutral: !!comp.neutralSite,
      home: side(home),
      away: side(away),
      tv: tvOf(comp),
      headline,
      championship: /championship/i.test(`${typeAbbr} ${headline ?? ""}`) || undefined,
    });
  }
  const byes = Array.isArray(raw.week?.teamsOnBye) ? raw.week.teamsOnBye.map((t: Raw) => String(t.id)) : [];
  // Regular-season week numbers from the calendar, so nothing is hardcoded.
  const reg = Array.isArray(raw.leagues?.[0]?.calendar) ? raw.leagues[0].calendar.find((c: Raw) => /regular/i.test(String(c?.label))) : undefined;
  const weeks = Array.isArray(reg?.entries) ? reg.entries.map((x: Raw) => num(x.value, NaN)).filter((n: number) => Number.isFinite(n)) : [];
  return { season, seasonType: num(raw.season?.type, 2), week, games, byes, weeks };
}

function statMap(e: Raw): Record<string, Raw> {
  const m: Record<string, Raw> = {};
  for (const s of e?.stats ?? []) {
    if (s?.name && !(s.name in m)) m[s.name] = s;
    if (s?.type && !(`t:${s.type}` in m)) m[`t:${s.type}`] = s;
  }
  return m;
}

const recParts = (s: string | undefined) => {
  const m = String(s ?? "").match(/^(\d+)-(\d+)(?:-(\d+))?$/);
  return m ? { w: +m[1], l: +m[2], t: m[3] ? +m[3] : 0 } : undefined;
};

/** NFL standings (level=3: conference > division). */
export function slimNflStandings(raw: Raw): NflTeam[] {
  const out: NflTeam[] = [];
  for (const conf of raw?.children ?? []) {
    const c = String(conf.abbreviation ?? "").toUpperCase();
    if (c !== "AFC" && c !== "NFC") continue;
    for (const div of conf.children ?? []) {
      for (const e of div.standings?.entries ?? []) {
        const st = statMap(e);
        const rec = recParts(st.overall?.displayValue ?? st["t:total"]?.displayValue);
        const t = e.team ?? {};
        out.push({
          id: String(t.id),
          abbr: String(t.abbreviation),
          name: String(t.name ?? t.shortDisplayName),
          location: String(t.location ?? ""),
          displayName: String(t.displayName),
          conf: c,
          div: String(div.name ?? ""),
          seed: num(st.playoffSeed?.value, 99),
          w: rec?.w ?? num(st.wins?.value),
          l: rec?.l ?? num(st.losses?.value),
          t: rec?.t ?? num(st.ties?.value),
          clincher: st.clincher?.displayValue ? String(st.clincher.displayValue) : undefined,
        });
      }
    }
  }
  // Junk check: 32 teams, 16 per conference, seeds 1-16 each once.
  if (out.length !== 32) throw new Error(`nfl standings: ${out.length} teams`);
  for (const c of ["AFC", "NFC"] as const) {
    const seeds = out.filter((t) => t.conf === c).map((t) => t.seed).sort((a, b) => a - b);
    if (seeds.join(",") !== Array.from({ length: 16 }, (_, i) => i + 1).join(",")) throw new Error(`nfl standings: bad ${c} seeds`);
  }
  return out;
}

/** Conference names we print, by ESPN group id. */
export const CFB_CONF_NAMES: Record<string, string> = {
  "1": "ACC",
  "4": "Big 12",
  "5": "Big Ten",
  "8": "SEC",
  "151": "American",
  "12": "Conference USA",
  "15": "MAC",
  "17": "Mountain West",
  "9": "Pac-12",
  "37": "Sun Belt",
  "18": "Independents",
};
/** The four conferences whose champions get in automatically. */
export const CFB_POWER = new Set(["1", "4", "5", "8"]);

/** College standings for every FBS conference (group=80). */
export function slimCfbStandings(raw: Raw): CfbTeam[] {
  const out: CfbTeam[] = [];
  const walk = (n: Raw, confId: string) => {
    for (const e of n?.standings?.entries ?? []) {
      const st = statMap(e);
      const all = recParts(st["t:total"]?.displayValue ?? st.overall?.displayValue);
      const conf = recParts(st["t:vsconf"]?.displayValue ?? st["vs. Conf."]?.displayValue);
      const t = e.team ?? {};
      if (!all) continue;
      out.push({
        id: String(t.id),
        abbr: String(t.abbreviation ?? ""),
        location: String(t.location ?? ""),
        name: String(t.name ?? ""),
        displayName: String(t.displayName ?? ""),
        confId,
        conf: CFB_CONF_NAMES[confId] ?? String(n.abbreviation ?? ""),
        w: all.w,
        l: all.l,
        confW: conf?.w ?? 0,
        confL: conf?.l ?? 0,
        confSeed: num(st.playoffSeed?.value, 99),
      });
    }
    for (const c of n?.children ?? []) walk(c, confId);
  };
  for (const conf of raw?.children ?? []) walk(conf, String(conf.id));
  if (out.length < 120) throw new Error(`cfb standings: ${out.length} teams`);
  return out;
}

/** The committee's ranking when it exists, the AP poll before that. */
export function slimCfbRankings(raw: Raw): { poll: "cfp" | "ap"; ranked: string[] } {
  const list: Raw[] = Array.isArray(raw?.rankings) ? raw.rankings : [];
  const cfp = list.find((r) => r?.type === "cfp" || /playoff/i.test(String(r?.name)));
  const ap = list.find((r) => r?.type === "ap" || /^AP/i.test(String(r?.name)));
  const pick = cfp?.ranks?.length ? cfp : ap;
  if (!pick?.ranks?.length) throw new Error("cfb rankings: none");
  const ranked = [...pick.ranks]
    .sort((a: Raw, b: Raw) => num(a.current) - num(b.current))
    .map((r: Raw) => String(r.team?.id))
    .filter((x: string) => x && x !== "undefined");
  if (ranked.length < 20) throw new Error("cfb rankings: short");
  return { poll: pick === cfp ? "cfp" : "ap", ranked };
}

/* ------------------------------------------------------------- assembly -- */

export type Board = ReturnType<typeof slimBoard>;
export type WeekPhase = "past" | "next" | "future";

/**
 * Which other weeks to load and how long each can be cached: finished weeks
 * and far-off weeks change rarely (a day), next week hourly. The phase is part
 * of the cache key, so a week cached while it was in the future is never
 * reused once it has been played.
 */
export function weekPlan(current: Board): { week: number; phase: WeekPhase }[] {
  const weeks = current.weeks.length ? current.weeks : Array.from({ length: current.week + 1 }, (_, i) => i + 1);
  return weeks
    .filter((w) => w !== current.week)
    .map((w) => ({ week: w, phase: w < current.week ? "past" : w === current.week + 1 ? "next" : "future" }));
}

function mergeGames(current: Board, others: Board[]) {
  const games = new Map<string, SlimGame>();
  for (const b of others) for (const g of b.games) games.set(g.id, g);
  for (const g of current.games) games.set(g.id, g); // the live week wins
  return [...games.values()];
}

export function assembleNfl(current: Board, others: Board[], teams: NflTeam[]) {
  if (current.seasonType !== 2) throw new Error("nfl: not the regular season");
  const byes: Record<number, string[]> = { [current.week]: current.byes };
  for (const b of others) byes[b.week] = b.byes;
  const lastWeek = current.weeks.length ? Math.max(...current.weeks) : 18;
  return { season: current.season, week: current.week, lastWeek, teams, games: mergeGames(current, others), byes };
}

export function assembleCfb(current: Board, others: Board[], teams: CfbTeam[], rank: { poll: "cfp" | "ap"; ranked: string[] }) {
  if (current.seasonType !== 2) throw new Error("cfb: not the regular season");
  // The last regular-season week with ordinary games (title games excluded).
  const all = mergeGames(current, others);
  const lastWeek = Math.max(current.week, ...all.filter((g) => !g.championship).map((g) => g.week));
  return { season: current.season, week: current.week, lastWeek, poll: rank.poll, ranked: rank.ranked, teams, games: all };
}
