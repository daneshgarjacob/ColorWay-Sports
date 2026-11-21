// College football Rooting Guide rules (11/20). Pure.
//
// The playoff: 12 teams = the champions of the ACC, Big Ten, Big 12 and SEC,
// the highest-ranked champion of the other six conferences, and the next
// seven highest-ranked teams. A committee picks, so this is a best read, not
// math. Today's stand-in champions are the conference leaders (best
// conference record, ties to the higher-ranked team); the seven open spots go
// to the highest-ranked teams after them, and the lowest of those is the cut.

import type { CfbData, CfbTeam, Guide, GuideResult, RootGame, SlimGame } from "./types";
import { CFB_POWER } from "./parse";
import { andList, capFirst, numWord, ORD, playedWhen, possessive, variant, whenLine } from "./text";
import { resultsBetween, row, siteSlug, sortRows } from "./shared";

const NOTRE_DAME = "87";

type Kind = "ahead" | "last" | "above" | "behind" | "conf" | "confLead" | "bye" | "chaser" | "none";
type Threat = { w: number; kind: Kind };

type Field = {
  rank: Map<string, number>;
  auto: Set<string>;
  /** Stand-in champion per conference id. */
  leaders: Map<string, string>;
  field: Set<string>;
  cutRank: number;
};

const recOf = (t: Pick<CfbTeam, "w" | "l">) => `${t.w}-${t.l}`;
const pct = (w: number, l: number) => (w + l ? w / (w + l) : 0);

export function fieldToday(d: CfbData): Field {
  const rank = new Map(d.ranked.map((id, i) => [id, i + 1]));
  const r = (id: string) => rank.get(id) ?? 99;
  const leaders = new Map<string, string>();
  const byConf = new Map<string, CfbTeam[]>();
  for (const t of d.teams) {
    if (t.confId === "18") continue; // independents have no title to win
    (byConf.get(t.confId) ?? byConf.set(t.confId, []).get(t.confId)!).push(t);
  }
  for (const [conf, ts] of byConf) {
    const best = [...ts].sort((a, b) => pct(b.confW, b.confL) - pct(a.confW, a.confL) || r(a.id) - r(b.id) || a.confSeed - b.confSeed)[0];
    if (best) leaders.set(conf, best.id);
  }
  const auto = new Set<string>();
  for (const [conf, id] of leaders) if (CFB_POWER.has(conf)) auto.add(id);
  const g6 = [...leaders].filter(([conf]) => !CFB_POWER.has(conf)).map(([, id]) => id).sort((a, b) => r(a) - r(b))[0];
  if (g6) auto.add(g6);
  let atLarge = d.ranked.filter((id) => !auto.has(id));
  // Notre Dame is in if it is ranked in the top 12.
  const nd = atLarge.indexOf(NOTRE_DAME);
  if (nd >= 7 && r(NOTRE_DAME) <= 12) atLarge = [...atLarge.slice(0, 6), NOTRE_DAME, ...atLarge.slice(6).filter((x) => x !== NOTRE_DAME)];
  const field = new Set([...auto, ...atLarge.slice(0, 7)]);
  return { rank, auto, leaders, field, cutRank: r(atLarge[6]) };
}

type Ctx = {
  d: CfbData;
  T: CfbTeam;
  f: Field;
  byId: Map<string, CfbTeam>;
  rT: number;
  inField: boolean;
  threat: Map<string, Threat>;
  /** Next week's opponent when it is ranked ahead of T (root for it this week). */
  boost?: string;
};

const r = (c: Ctx, id: string) => c.f.rank.get(id) ?? 99;
const nameOf = (c: Ctx, id: string, side?: { location: string }) => c.byId.get(id)?.location ?? side?.location ?? "";
const ranked = (c: Ctx, id: string, side?: { location: string }) => {
  const k = c.f.rank.get(id);
  return `${k ? `No. ${k} ` : ""}${nameOf(c, id, side)}`;
};
const lossWord = (n: number) => ORD[n] ?? `${n}th`;

function threatOf(c: Ctx, X: CfbTeam): Threat {
  const { T, f, rT } = c;
  const rX = r(c, X.id);
  const cut = f.cutRank;
  const sameConf = X.confId === T.confId && T.confId !== "18";
  const confGb = ((T.confW - T.confL) - (X.confW - X.confL)) / 2; // + : T ahead
  if (!c.inField) {
    // Our own conference title is a road in too (an automatic spot).
    if (sameConf && f.leaders.get(T.confId) === X.id && -confGb <= 1 && (CFB_POWER.has(T.confId) || f.auto.has(X.id))) return { w: 3.0, kind: "confLead" };
    if (f.auto.has(X.id) || rX === 99) return { w: 0, kind: "none" };
    if (rX < rT) {
      if (rX >= cut - 1 && rT - rX <= 4) return { w: 3.0, kind: rX <= cut + 1 ? "last" : "ahead" };
      if (rX >= cut + 2) return { w: rT - rX <= 4 || X.l <= T.l ? 3.0 : 2.0, kind: "ahead" };
      if (rX >= cut - 1) return { w: 2.0, kind: "last" };
      if (rX === cut - 2) return { w: 1.0, kind: "above" };
      return { w: 0, kind: "none" };
    }
    if (rX - rT <= 2 && X.l <= T.l) return { w: 1.0, kind: "behind" };
    return { w: 0, kind: "none" };
  }
  // In the field today.
  let t: Threat = { w: 0, kind: "none" };
  const take = (n: Threat) => {
    t = n.w > t.w ? (t.w > 0 ? { w: n.w + 0.3, kind: n.kind } : n) : t.w > 0 && n.w > 0 ? { w: t.w + 0.3, kind: t.kind } : t;
  };
  const leader = f.leaders.get(T.confId) === T.id;
  if (sameConf && Math.abs(confGb) <= 1) {
    // The conference title: an automatic spot (and the title game in most leagues).
    const needsTitle = f.auto.has(T.id) && rT > cut;
    if (leader) take({ w: needsTitle ? 3.0 : 2.0, kind: "conf" });
    else if (f.leaders.get(T.confId) === X.id) take({ w: 2.0, kind: "confLead" });
  }
  if (!f.auto.has(X.id) && rX !== 99 && !f.auto.has(T.id) && rT >= cut - 3 && rX > rT && rX <= cut + 4) {
    take({ w: rX - rT <= 3 ? 3.0 : 2.0, kind: "chaser" });
  }
  if (rT <= 6 && rX !== 99) {
    // Top four seeds skip the first round.
    if (rT <= 4 && rX > rT && rX <= 6 && rX - rT <= 2) take({ w: rX - rT === 1 ? 2.6 : 1.8, kind: "bye" });
    if (rT > 4 && rX <= 4 && rT - rX <= 2) take({ w: 1.8, kind: "bye" });
  }
  return t;
}

function makeCtx(d: CfbData, T: CfbTeam): Ctx {
  const f = fieldToday(d);
  const c: Ctx = { d, T, f, byId: new Map(d.teams.map((t) => [t.id, t])), rT: f.rank.get(T.id) ?? 99, inField: f.field.has(T.id), threat: new Map() };
  for (const x of d.teams) if (x.id !== T.id) c.threat.set(x.id, threatOf(c, x));
  // Next week against a team ranked ahead of us: we want it strong.
  const next = d.games.find((g) => g.week === d.week + 1 && !g.championship && [g.home.id, g.away.id].includes(T.id));
  if (next) {
    const opp = next.home.id === T.id ? next.away.id : next.home.id;
    if (r(c, opp) < c.rT && (c.threat.get(opp)?.w ?? 0) < 1) c.boost = opp;
  }
  return c;
}

const MONTH = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "long" }).format(new Date(iso));

function againstReason(c: Ctx, X: CfbTeam, i: number): string {
  const { T, rT, f } = c;
  const th = c.threat.get(X.id)!;
  const rX = r(c, X.id);
  const n = Math.abs(rT - rX);
  const spots = `${numWord(n)} spot${n === 1 ? "" : "s"}`;
  const nth = lossWord(X.l + 1);
  const hh = resultsBetween(c.d.games, T.id, X.id);
  const tBeat = hh.find((x) => x.winner === T.id);
  const xBeat = hh.find((x) => x.winner === X.id);
  const xBeatLine = xBeat ? ` and beat the ${T.name} in ${MONTH(xBeat.game.date)}` : "";
  const N = X.location;
  switch (th.kind) {
    case "ahead":
      if (X.l === T.l && tBeat) return `${N} has the same ${recOf(X)} record and sits ${spots} ahead, even though ${T.location} beat them ${tBeat.ws}-${tBeat.ls}. A ${nth} loss drops the ${X.name} behind ${T.location}.`;
      if (X.l === T.l && xBeat) return `${N} is ${spots} ahead and beat the ${T.name} in ${MONTH(xBeat.game.date)}. A ${nth} loss takes the ${X.name} out of the way.`;
      if (X.l === T.l) return `${N} is ${recOf(X)} and ${spots} ahead. A ${nth} loss takes the ${X.name} out of the way.`;
      if (X.l < T.l) return `${N} is ${spots} ahead of ${T.location}${xBeatLine}. A ${nth} loss puts the ${X.name} level with the ${T.name}.`;
      return `${N} is ${spots} ahead of ${T.location} with more losses${xBeatLine}. Another loss should drop them behind.`;
    case "last":
      if (rX === f.cutRank) return `${N} sits in the last spot today.`;
      if (rX > f.cutRank) return rX === f.cutRank + 1 ? `${N} is the first team left out today and is in ${possessive(T.location)} way.` : `${N} is just outside the field today, ${spots} ahead of ${T.location}.`;
      return `${N} holds one of the last spots. A ${nth} loss opens it up.`;
    case "above":
      return `A ${nth} loss would pull ${N} back toward ${possessive(T.location)} group.`;
    case "behind":
      return `${N} is ${spots} behind ${T.location}${X.l === T.l ? " with the same record" : ""}. Keep them there.`;
    case "conf": {
      const gb = ((T.confW - T.confL) - (X.confW - X.confL)) / 2;
      return gb === 0
        ? `${N} is level with ${T.location} in the ${T.conf} race, and the ${T.conf} champion gets in on its own.`
        : `${N} is ${gb === 0.5 ? "half a game" : `${numWord(gb)} game${gb === 1 ? "" : "s"}`} behind ${T.location} in the ${T.conf}. The champion gets in on its own.`;
    }
    case "confLead":
      return `${N} leads the ${T.conf}. A ${nth} loss opens up the conference race for ${T.location}.`;
    case "chaser":
      return variant(
        [`${N} is ${spots} behind ${T.location} and would like that spot.`, `${N} sits ${spots} back. A loss keeps the ${X.name} from passing ${T.location}.`],
        i,
      ) + (rX === f.cutRank + 1 ? ` It is the first team left out today.` : "");
    case "bye":
      return rX > rT
        ? rX <= 4
          ? `${N} is right behind ${T.location} in the race for the ${rT === 1 ? "No. 1 seed" : "top seeds"}.`
          : `${N} is right behind ${T.location} in the race for a top-four seed and a first-round bye.`
        : `${N} holds a top-four seed today. A loss could open a first-round bye for ${T.location}.`;
    default:
      return `A ${N} loss does a little for ${T.location}.`;
  }
}

/** "The Ducks are five spots ahead of USC and beat the Trojans in September." */
function doneContext(c: Ctx, X: CfbTeam): string {
  const n = r(c, X.id) - c.rT;
  const xBeat = resultsBetween(c.d.games, c.T.id, X.id).find((x) => x.winner === X.id);
  const where = n === 0 ? "" : `${numWord(Math.abs(n))} spot${Math.abs(n) === 1 ? "" : "s"} ${n < 0 ? "ahead of" : "behind"} ${c.T.location}`;
  if (!where) return "";
  return `The ${X.name} are ${where}${xBeat ? ` and beat the ${c.T.name} in ${MONTH(xBeat.game.date)}` : ""}.`;
}

function matchupLine(c: Ctx, g: SlimGame): string {
  const side = (s: SlimGame["home"]) => {
    const t = c.byId.get(s.id);
    const rec = t ? recOf(t) : s.record;
    return `${ranked(c, s.id, s)}${rec ? ` (${rec})` : ""}`;
  };
  return `${side(g.away)} ${g.neutral ? "vs." : "at"} ${side(g.home)}`;
}

function pickGame(c: Ctx, g: SlimGame, i: number, nextWeek = false): RootGame | undefined {
  const { T } = c;
  const A = c.byId.get(g.away.id);
  const H = c.byId.get(g.home.id);
  const wa = A ? c.threat.get(A.id)?.w ?? 0 : 0;
  const wh = H ? c.threat.get(H.id)?.w ?? 0 : 0;
  const sideName = (id: string, s: SlimGame["home"]) => ({ name: nameOf(c, id, s), abbr: s.abbr, displayName: c.byId.get(id)?.displayName ?? s.displayName });
  const when = whenLine(g, nextWeek);
  const m = matchupLine(c, g);
  // Root for next week's ranked opponent (it makes our win worth more), unless
  // the other side is a bigger problem.
  if (!nextWeek && c.boost && [g.home.id, g.away.id].includes(c.boost) && Math.max(wa, wh) < 2) {
    const O = c.byId.get(c.boost)!;
    const other = g.home.id === O.id ? g.away : g.home;
    const rO = r(c, O.id);
    const tier = rO <= 4 ? "top-four" : rO <= 10 ? "top-10" : "ranked";
    return row({
      game: g,
      root: sideName(O.id, g.home.id === O.id ? g.home : g.away),
      over: ranked(c, other.id, other),
      matchup: m,
      when,
      reason: `Yes, really. ${T.location} plays ${O.location} next week, and beating ${O.l === 0 ? "an unbeaten" : "a"} ${tier} team is worth far more than beating one that just lost.`,
      weight: 2.0,
    });
  }
  if (Math.max(wa, wh) < 0.6) return undefined;
  const [X, Y, wx, wy] = wa >= wh ? [g.away, g.home, wa, wh] : [g.home, g.away, wh, wa];
  const Xt = c.byId.get(X.id)!;
  let reason = againstReason(c, Xt, i);
  // A team we already beat: its wins make ours look better.
  const tBeatY = resultsBetween(c.d.games, T.id, Y.id).some((x) => x.winner === T.id);
  if (tBeatY && Y.id !== c.boost) reason += ` ${T.location} also beat ${nameOf(c, Y.id, Y)}, so a ${c.byId.get(Y.id)?.name ?? Y.name} win makes that result look better.`;
  return row({ game: g, root: sideName(Y.id, Y), over: ranked(c, X.id, X), matchup: m, when, reason, weight: wx - 0.3 * wy });
}

export function cfbSupportedSlugs(d: CfbData): string[] {
  const byId = new Map(d.teams.map((t) => [t.id, t]));
  return d.ranked.map((id) => byId.get(id)).filter((t): t is CfbTeam => !!t).map((t) => siteSlug(t.displayName));
}

export function cfbGuide(d: CfbData, slug: string): GuideResult {
  const key = `college-football/${slug}`;
  const T = d.teams.find((t) => siteSlug(t.displayName) === slug);
  if (!T) return { kind: "updating", key };
  const pollName = d.poll === "cfp" ? "College Football Playoff rankings" : "AP Top 25";
  const weekLabel = `Week ${d.week}`;
  if (!d.ranked.includes(T.id))
    return {
      kind: "outside",
      key,
      team: T.displayName,
      nickname: T.location,
      weekLabel,
      line: `${T.location} is ${recOf(T)} and not in the ${pollName} this week, so it is not in the playoff picture right now.`,
    };

  const c = makeCtx(d, T);
  const { f, rT } = c;
  const N = T.location;
  const mine = (g: SlimGame) => [g.home.id, g.away.id].includes(T.id);
  const weekGames = d.games.filter((g) => g.week === d.week && !g.championship);
  const own = weekGames.find(mine);
  const left = d.games.filter((g) => mine(g) && !g.championship && g.state !== "post" && g.week >= d.week).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  const nextAfter = d.games.filter((g) => mine(g) && !g.championship && g.week > d.week).sort((a, b) => a.week - b.week)[0];

  // Status
  const bubble = !c.inField && rT <= f.cutRank + 2;
  const tag = c.inField ? "In The Field Today" : bubble ? "On The Bubble" : T.l >= 4 || rT >= 20 ? "Long Shot" : "Needs Help";
  const line = `${N} is ${recOf(T)} and No. ${rT} in the ${pollName}. Twelve teams get in.`;
  const oppName = (g: SlimGame) => ranked(c, g.home.id === T.id ? g.away.id : g.home.id, g.home.id === T.id ? g.away : g.home);
  const aheadAtLarge = d.ranked.slice(0, rT - 1).filter((id) => !f.auto.has(id)).length;
  const pass = Math.max(1, aheadAtLarge - 6);
  const committee = "A committee picks the field, so these are our best reads, not math.";
  let need: string;
  if (c.inField) {
    const how = f.auto.has(T.id) ? `as the ${T.conf} leader, which stands in for the champion` : "with one of the open spots";
    need = `As the rankings stand today, ${N} is in ${how}. The last open spot goes to No. ${f.cutRank}. ${committee}`;
  } else {
    const beat = left.length ? `has to beat ${andList(left.map(oppName))}, then pass` : "is done with the regular season, so it needs to pass";
    need = `As the rankings stand today, the last open spot goes to No. ${f.cutRank}. ${N} ${beat} about ${numWord(pass)} team${pass === 1 ? "" : "s"}. ${committee}`;
  }
  const facts = [
    { label: "Record", value: recOf(T) },
    { label: d.poll === "cfp" ? "Playoff Ranking" : "AP Ranking", value: `No. ${rT}` },
    { label: "Last Spot Today", value: `No. ${f.cutRank}` },
    { label: "Games Left", value: String(left.length) },
  ];

  // Own game
  let ownBlk: Guide["own"];
  if (!own) {
    ownBlk = {
      label: `${N} Is Off This Week`,
      matchup: "Bye Week",
      when: nextAfter ? `Next: ${oppName(nextAfter)}` : "",
      reason: `With ${N} off, the games below are the whole story this week.`,
    };
  } else if (own.state === "post") {
    const us = own.home.id === T.id ? own.home : own.away;
    const them = own.home.id === T.id ? own.away : own.home;
    const won = (us.score ?? 0) > (them.score ?? 0);
    const hi = won ? us : them;
    const lo = won ? them : us;
    ownBlk = {
      label: won ? `${N} Won` : `${N} Lost`,
      matchup: `${nameOf(c, hi.id, hi)} ${hi.score ?? 0}, ${nameOf(c, lo.id, lo)} ${lo.score ?? 0}`,
      when: playedWhen(own),
      reason: won ? `Done. Now ${N} needs the rest of the week to break its way.` : `That one hurts. The games below matter even more now.`,
    };
  } else {
    const nth = lossWord(T.l + 1);
    const nextBig = nextAfter && r(c, nextAfter.home.id === T.id ? nextAfter.away.id : nextAfter.home.id) < 26
      ? ` Win, and next week ${nextAfter.home.id === T.id ? "against" : "at"} ${oppName(nextAfter)} becomes the biggest game of ${possessive(N)} season.`
      : "";
    ownBlk = {
      label: `First, ${N} Has To Win`,
      matchup: matchupLine(c, own),
      when: whenLine(own),
      reason: c.inField
        ? `Win and ${N} stays in the field. A loss would put every game below in play.`
        : `A ${nth} loss ends the playoff talk.${nextBig}`,
    };
  }

  // This week
  const rows: RootGame[] = [];
  const done: NonNullable<Guide["sections"][number]["done"]> = [];
  let i = 0;
  for (const g of [...weekGames].sort((a, b) => Date.parse(a.date) - Date.parse(b.date))) {
    if (g === own) continue;
    const p = pickGame(c, g, i);
    if (!p) continue;
    i++;
    if (g.state !== "post") {
      rows.push(p);
      continue;
    }
    const homeWon = (g.home.score ?? 0) > (g.away.score ?? 0);
    const W = homeWon ? g.home : g.away;
    const L = homeWon ? g.away : g.home;
    const good = nameOf(c, W.id, W) === p.root;
    const X = good ? L : W; // the team we rooted against
    const Xt = c.byId.get(X.id);
    done.push({
      id: g.id,
      result: `${ranked(c, W.id, W)} ${W.score ?? 0}, ${ranked(c, L.id, L)} ${L.score ?? 0}`,
      when: playedWhen(g),
      verdict: good ? `Went ${possessive(N)} Way` : `Went Against ${N}`,
      reason: good
        ? `${N} needed ${p.root}, and got it. ${Xt ? `${Xt.location} fell to ${recOf(Xt)}.` : ""}`.trim()
        : `${N} needed ${p.root}. ${Xt ? `${Xt.location} won ${W.score ?? 0}-${L.score ?? 0} and moved to ${recOf(Xt)}. ${doneContext(c, Xt)}` : ""}`.trim(),
    });
  }
  // Champions-in-waiting between the cut and us are not on the list: say why.
  const notes: string[] = [];
  if (!c.inField) {
    for (const id of d.ranked) {
      const k = r(c, id);
      if (!f.auto.has(id) || k <= f.cutRank - 2 || k >= rT) continue;
      const X = c.byId.get(id);
      if (!X) continue;
      notes.push(
        CFB_POWER.has(X.confId)
          ? `No. ${k} ${X.location} is not on this list. It leads the ${X.conf}, and the ${X.conf} champion gets in on its own, so it is not chasing the open spots ${N} needs.`
          : `No. ${k} ${X.location} is not on this list. One playoff spot is saved for the best conference champion outside the four biggest leagues, and ${X.location} is chasing that one, not the open spots ${N} needs.`,
      );
    }
  }
  const sections: Guide["sections"] = [
    // Long shots can have a dozen teams in the way: keep the ten that matter most.
    { title: "This Week", sub: `Sorted by how much each game helps ${N}`, games: sortRows([...rows].sort((a, b) => b.weight - a.weight || a.at - b.at).slice(0, 10)), done, footnote: notes.join(" ") || undefined },
  ];

  // Next week
  if (d.week < d.lastWeek) {
    const nw = d.week + 1;
    const ng = d.games.filter((g) => g.week === nw && !g.championship && g.state === "pre");
    const mineNext = ng.find(mine);
    const picks: RootGame[] = [];
    let j = 0;
    for (const g of ng.sort((a, b) => Date.parse(a.date) - Date.parse(b.date))) {
      if (g === mineNext) continue;
      const p = pickGame(c, g, j++, true);
      if (p) picks.push(p);
    }
    let lead: RootGame | undefined;
    if (mineNext) {
      const oppId = mineNext.home.id === T.id ? mineNext.away.id : mineNext.home.id;
      const opp = mineNext.home.id === T.id ? mineNext.away : mineNext.home;
      const rO = r(c, oppId);
      const th = c.threat.get(oppId)?.w ?? 0;
      if (rO < 99 && (rO < rT || th >= 1.5)) {
        lead = row({
          game: mineNext,
          root: { name: N, abbr: T.abbr, displayName: T.displayName },
          over: ranked(c, oppId, opp),
          matchup: `${ranked(c, mineNext.away.id, mineNext.away)}${mineNext.away.id === T.id ? "" : ` (${c.byId.get(mineNext.away.id) ? recOf(c.byId.get(mineNext.away.id)!) : mineNext.away.record ?? ""})`} ${mineNext.neutral ? "vs." : "at"} ${ranked(c, mineNext.home.id, mineNext.home)}${mineNext.home.id === T.id ? "" : ` (${c.byId.get(mineNext.home.id) ? recOf(c.byId.get(mineNext.home.id)!) : mineNext.home.record ?? ""})`}`,
          when: whenLine(mineNext, true),
          reason: rO < rT
            ? `The whole season. A win here is the one result that can lift ${N} several spots at once.`
            : `A ${N} game that counts double. ${againstReason(c, c.byId.get(oppId)!, 0)}`,
          weight: 9,
          level: "Big",
        });
      }
    }
    const top = sortRows([...picks].sort((a, b) => b.weight - a.weight).slice(0, lead ? 5 : 6));
    sections.push({
      title: "Next Week: Early Look",
      sub: `Week ${nw}. This list updates Tuesday night when the new playoff rankings come out.`,
      games: lead ? [lead, ...top] : top,
    });
  }

  const first = sections[0].games;
  const picks = first.slice(0, 3).map((g) => g.root);
  const title = `${N} Rooting Guide, Week ${d.week}: Who To Root For To Help ${N} Make The Playoff`;
  const pairs = first.slice(0, 3).map((g) => `${g.root} over ${g.over}`);
  const description = pairs.length
    ? `${N} fans, Week ${d.week}: root for ${andList(pairs)}. ${N} is ${recOf(T)} and No. ${rT} in the ${pollName}; the last open playoff spot today is No. ${f.cutRank}.`
    : `${N} is ${recOf(T)} and No. ${rT} in the ${pollName}. Where ${N} stands in the playoff race in Week ${d.week}.`;
  const nextGame = left[0];
  const faq: Guide["faq"] = [
    {
      q: `Can ${N} Still Make The College Football Playoff?`,
      a: c.inField
        ? `As the rankings stand today, yes: ${N} is ${recOf(T)} and No. ${rT}, inside the 12-team field, where the last open spot goes to No. ${f.cutRank}. ${committee}`
        : `${tag === "Long Shot" ? "It is a long shot" : "Yes, but it needs help"}. ${N} is ${recOf(T)} and No. ${rT}, and as the rankings stand today the last open spot goes to No. ${f.cutRank}. ${committee}`,
    },
  ];
  if (pairs.length) faq.push({ q: `Who Should ${N} Fans Root For This Week?`, a: `In Week ${d.week}, ${andList(pairs)} matter most${own && own.state === "pre" ? `, after ${possessive(N)} own game` : ""}. Every game is ranked on this page by how much it helps.` });
  if (nextGame) {
    const home = nextGame.home.id === T.id;
    faq.push({ q: `Who Does ${N} Play Next?`, a: `${N} ${nextGame.neutral ? "plays" : home ? "hosts" : "visits"} ${oppName(nextGame)}${nextGame.neutral ? " at a neutral site" : ""}: ${whenLine(nextGame, true)}.` });
  }

  return {
    kind: "guide",
    guide: {
      key,
      league: "College Football",
      team: T.displayName,
      nickname: N,
      theName: N,
      logoName: T.displayName,
      weekLabel,
      week: d.week,
      season: d.season,
      h1: title,
      title,
      description,
      status: { tag, line, need, facts },
      own: ownBlk,
      sections,
      faq,
      picks,
    },
  };
}

export { capFirst };
