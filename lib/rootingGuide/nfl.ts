// NFL Rooting Guide rules (11/20). Pure: standings + scoreboard sweep in,
// the page's data out. Seven teams per conference make it (four division
// winners, three wild cards), and only the No. 1 seed skips the first round.
//
// The idea in one line: for every game this week, which result leaves our
// team closer to a spot. Each other team in our conference gets a "threat"
// weight from how directly it stands in the way; a game's pick is "root
// against the bigger threat" and its level comes from that weight.
// We never claim elimination ourselves: only ESPN's clincher flag does that.

import type { Guide, GuideResult, NflData, NflTeam, RootGame, SlimGame } from "./types";
import { andList, capFirst, gamesWord, numWord, ORD, ordinal, playedWhen, possessive, variant, whenLine } from "./text";
import { playsLater, resultsBetween, row, seriesEdge, slugOf, sortRows } from "./shared";

const GAMES = 17;

type Kind =
  | "far" // far ahead, out of reach: let them win
  | "wc" // holds a wild card (seed 5 or 6)
  | "last" // holds the 7 seed
  | "between" // outside the seven, ahead of us
  | "close" // just ahead of us, barely
  | "tied"
  | "behind" // just behind us
  | "divLead" // leads our division, which we can still win
  | "divRival" // chasing our division too
  | "divChase" // we lead the division; they are chasing
  | "chasing" // we hold a spot; they are chasing it
  | "seed" // seeding race
  | "bye" // race for the No. 1 seed
  | "divAhead" // we hold a wild card; they lead our division
  | "none";

type Threat = { w: number; kind: Kind; wc: boolean };

/** "second" up to ninth, then "10th" (AP style). */
const seedWord = (n: number) => (n <= 9 ? ORD[n] : ordinal(n));
/** "the No. 1 seed", "the fifth seed" */
const seedName = (n: number) => (n === 1 ? "No. 1" : seedWord(n));
const rec = (t: NflTeam) => `${t.w}-${t.l}${t.t ? `-${t.t}` : ""}`;
const pts = (t: NflTeam) => t.w + t.t / 2;
const played = (t: NflTeam) => t.w + t.l + t.t;
const left = (t: NflTeam) => Math.max(0, GAMES - played(t));
const pace = (t: NflTeam) => (played(t) ? (pts(t) / played(t)) * GAMES : GAMES / 2);
const maxPts = (t: NflTeam) => pts(t) + left(t);
/** Games x is ahead of y (negative: behind). */
const ahead = (x: NflTeam, y: NflTeam) => (x.w - x.l - (y.w - y.l)) / 2;
const clinched = (t: NflTeam) => !!t.clincher && /[xyz*]/i.test(t.clincher);
const eliminated = (t: NflTeam) => !!t.clincher && /^e$/i.test(t.clincher.trim());

type Ctx = {
  d: NflData;
  T: NflTeam;
  byId: Map<string, NflTeam>;
  conf: NflTeam[];
  seed7: NflTeam;
  divLeader: NflTeam;
  /** Can T still realistically win its division (outside teams only). */
  canDiv: boolean;
  /** Short names: "Pittsburgh", but "the Rams" where a city has two teams. */
  city: (t: NflTeam) => string;
  the: string;
  threat: Map<string, Threat>;
  /** The NFC-over-AFC rule is spelled out once per section, then shortened. */
  ruleSaid: boolean;
};

function makeCtx(d: NflData, T: NflTeam): Ctx {
  const byId = new Map(d.teams.map((t) => [t.id, t]));
  const conf = d.teams.filter((t) => t.conf === T.conf).sort((a, b) => a.seed - b.seed);
  const seed7 = conf.find((t) => t.seed === 7)!;
  const div = conf.filter((t) => t.div === T.div);
  const divLeader = div[0];
  const shared = new Set(d.teams.map((t) => t.location).filter((loc, i, all) => all.indexOf(loc) !== i));
  const city = (t: NflTeam) => (shared.has(t.location) ? `the ${t.name}` : t.location);
  const ctx: Ctx = {
    d, T, byId, conf, seed7, divLeader,
    canDiv: T.seed > 4 && ahead(divLeader, T) <= 2.5,
    city,
    the: `the ${T.name}`,
    threat: new Map(),
    ruleSaid: false,
  };
  for (const x of conf) if (x.id !== T.id) ctx.threat.set(x.id, threatOf(ctx, x));
  return ctx;
}

function threatOf(c: Ctx, X: NflTeam): Threat {
  const { T, d } = c;
  const sameDiv = X.div === T.div;
  const wc = X.seed >= 5 && X.seed <= 7;
  let t: Threat;
  if (T.seed > 7) {
    // Outside the seven. Who holds or blocks the spot we are chasing?
    const far = pace(X) - maxPts(T) > 3 && !(c.canDiv && sameDiv);
    // When the division is clearly the shorter road, its rivals matter most
    // and the wild card holders a little less.
    const divRoad = c.canDiv && ahead(c.divLeader, T) + 1 <= ahead(c.seed7, T);
    if (far) t = { w: 0.9, kind: "far", wc };
    else if (sameDiv && c.canDiv && ahead(X, T) >= -1.5) {
      const lead = X.id === c.divLeader.id;
      t = { w: lead ? 3.3 : ahead(X, T) >= 0 ? 3.0 : 1.6, kind: lead ? "divLead" : "divRival", wc };
    } else if (wc) t = { w: divRoad ? 2.4 : 3.3, kind: X.seed === 7 ? "last" : "wc", wc };
    else if (X.seed <= 4) t = { w: 0.5, kind: "none", wc }; // another division's leader: either result is a wash
    else if (X.seed < T.seed) {
      const g = ahead(X, T);
      t = g >= 1.5 ? { w: divRoad ? 2.0 : 3.0, kind: "between", wc } : g > 0 ? { w: 1.5, kind: "close", wc } : { w: 1.0, kind: "tied", wc };
    } else {
      const g = ahead(T, X);
      t = g <= 0 ? { w: 1.0, kind: "tied", wc } : g <= 1 ? { w: 0.8, kind: "behind", wc } : { w: 0, kind: "none", wc };
    }
  } else if (T.seed <= 4) {
    // Division leader: the division race first, then the No. 1 seed (the
    // only bye), then the rest of the seeding.
    const g = ahead(X, T);
    if (sameDiv) {
      const lead = -g;
      t = { w: lead <= 0 ? 3.4 : lead <= 1 ? 3.2 : lead <= 2 ? 2.4 : lead <= 3 ? 1.4 : 0.2, kind: "divChase", wc };
    } else if (T.seed === 1 && g >= -1) t = { w: 2.6, kind: "bye", wc };
    else if (T.seed === 1 && g >= -2) t = { w: 1.8, kind: "bye", wc };
    else if (X.seed === 1 && g <= 1.5) t = { w: 1.8, kind: "bye", wc };
    else if (Math.abs(g) <= 1) t = { w: 1.0, kind: "seed", wc };
    else t = { w: 0.2, kind: "none", wc };
  } else {
    // Holding a wild card: keep the chasers behind, and the division is
    // still a prize when its leader is close.
    const g = ahead(X, T);
    if (sameDiv && Math.abs(g) <= 1.5 && ahead(c.divLeader, T) <= 2) {
      t = X.id === c.divLeader.id ? { w: 2.2, kind: "divAhead", wc } : { w: g <= 0 ? 3.4 : 2.2, kind: g <= 0 ? "chasing" : "divRival", wc };
    } else if (X.seed > T.seed) {
      const back = -g;
      t = { w: back <= 0 ? 3.4 : back <= 1 ? 3.2 : back <= 2 ? 2.4 : back <= 3 ? 1.4 : 0.2, kind: back <= 3 ? "chasing" : "none", wc };
    } else if (sameDiv && X.id === c.divLeader.id && g <= 2) t = { w: 1.8, kind: "divAhead", wc };
    else if (wc && g <= 1) t = { w: 1.2, kind: "seed", wc };
    else t = { w: 0.3, kind: "none", wc };
  }
  // Head-to-head: a team we already beat loses a tie to us, a team that beat
  // us wins it, and a team we still play can be handled in person.
  if (t.w >= 1.5 && t.kind !== "far") {
    const edge = seriesEdge(d.games, T.id, X.id);
    if (edge > 0) t.w -= 0.8;
    else if (edge < 0) t.w += 0.2;
    if (playsLater(d.games, T.id, X.id, d.week)) t.w -= 0.3;
  }
  return t;
}

/* ---------------------------------------------------------------- words -- */

function beatLine(c: Ctx, X: NflTeam): { tBeat?: string; xBeat?: string } {
  const rs = resultsBetween(c.d.games, c.T.id, X.id);
  const out: { tBeat?: string; xBeat?: string } = {};
  for (const r of rs) {
    const when = r.game.week === c.d.week - 1 ? playedWhen(r.game) : r.game.week === c.d.week ? "this week" : `in Week ${r.game.week}`;
    if (r.winner === c.T.id) out.tBeat = when;
    else out.xBeat = `${r.ws}-${r.ls}`;
  }
  return out;
}

/** Why a loss by X helps T. i rotates the wording. */
function againstReason(c: Ctx, X: NflTeam, i: number, ownGame = false): string {
  const { T, the } = c;
  const th = c.threat.get(X.id)!;
  const City = capFirst(c.city(X));
  const plural = City.startsWith("The ");
  const v = (one: string, many: string) => (plural ? many : one);
  const g = Math.abs(ahead(X, T));
  const { tBeat, xBeat } = beatLine(c, X);
  const later = playsLater(c.d.games, T.id, X.id, c.d.week);
  const laterLine = later && !ownGame ? ` ${capFirst(the)} still play the ${X.name} and can handle that one in person.` : "";
  switch (th.kind) {
    case "wc":
      return variant(
        [
          `${City} ${v("holds", "hold")} a wild card spot right now. Every ${X.name} loss pulls that spot closer.`,
          `The ${X.name} hold the ${seedWord(X.seed)} seed, a wild card spot ${the} are chasing.`,
        ],
        i,
      ) + (xBeat ? ` They also beat ${the} ${xBeat}.` : "");
    case "last":
      return `${City} ${v("holds", "hold")} the last playoff spot right now, ${gamesWord(g)} ahead of ${the}.${laterLine}`;
    case "between":
    case "close": {
      const wins = X.w - T.w;
      if (xBeat) return `The ${X.name} are ${numWord(wins)} win${wins === 1 ? "" : "s"} ahead and already beat ${the}.${laterLine}`;
      if (tBeat) return `${City} ${v("is", "are")} one of the teams ${the} have to pass. ${capFirst(the)} beat them ${tBeat}, so they win a tie with the ${X.name}.`;
      if (X.seed === 8) return `${City} ${v("is", "are")} the first team outside the playoff spots, ${gamesWord(g)} ahead of ${the}.${laterLine}`;
      if (th.kind === "close") return `${City} ${v("is", "are")} only ${gamesWord(g)} ahead of ${the}. A loss keeps them in reach.`;
      return variant(
        [
          `${City} ${v("is", "are")} ${gamesWord(g)} ahead of ${the}, one of the teams they have to pass.${laterLine}`,
          `The ${X.name} sit ${gamesWord(g)} ahead of ${the} in the ${T.conf} race.${laterLine}`,
        ],
        i,
      );
    }
    case "tied":
      return variant([`${City} ${v("is", "are")} tied with ${the} at ${rec(X)}.`, `${City} ${v("is", "are")} also ${rec(X)}. Keep them from getting ahead.`], i);
    case "behind":
      return `${City} ${v("is", "are")} ${gamesWord(g)} behind ${the}. Keep them there.`;
    case "divLead":
      return `${City} ${v("leads", "lead")} the ${T.div}, ${gamesWord(g)} ahead of ${the}. The division winner gets a playoff spot.`;
    case "divRival":
      return `${City} ${v("is", "are")} in the ${T.div} race too, ${ahead(X, T) === 0 ? `level with ${the}` : `${gamesWord(g)} ${ahead(X, T) > 0 ? "ahead of" : "behind"} ${the}`}.`;
    case "divChase":
      return ahead(X, T) === 0
        ? `${City} ${v("is", "are")} tied with ${the} for the ${T.div} lead.${tBeat ? ` ${capFirst(the)} beat them ${tBeat}.` : ""}`
        : variant(
            [
              `${City} ${v("is", "are")} ${gamesWord(g)} behind ${the} in the ${T.div}. A loss keeps ${the} in front.`,
              `The ${X.name} are the closest chaser in the ${T.div}, ${gamesWord(g)} back.`,
            ],
            i,
          );
    case "chasing":
      return X.seed === 8
        ? `${City} ${v("is", "are")} the first team outside the playoff spots, ${gamesWord(g)} behind ${the}.`
        : variant(
            [
              `${City} ${v("is", "are")} ${g === 0 ? `level with ${the}` : `${gamesWord(g)} behind ${the}`} in the wild card race.`,
              `The ${X.name} are ${X.seed <= 7 ? "in a wild card spot too" : "chasing a wild card spot"}, ${g === 0 ? "with the same record" : `${gamesWord(g)} back`}.`,
            ],
            i,
          ) + (tBeat ? ` ${capFirst(the)} beat them ${tBeat}, which wins a tie.` : "");
    case "divAhead":
      return `${City} ${v("leads", "lead")} the ${T.div} by ${gamesWord(g)}. A ${X.name} loss puts the division title in reach.`;
    case "bye":
      return `${City} ${v("is", "are")} ${g === 0 ? `level with ${the}` : ahead(X, T) > 0 ? `${gamesWord(g)} ahead of ${the}` : `${gamesWord(g)} behind ${the}`} in the race for the No. 1 seed, the only first-round bye.`;
    case "seed":
      return `${City} ${v("is", "are")} ${g === 0 ? `level with ${the}` : ahead(X, T) > 0 ? `${gamesWord(g)} ahead of ${the}` : `${gamesWord(g)} behind ${the}`} in the race for seeding.`;
    default:
      return `A ${X.name} loss does a little for ${the}.`;
  }
}

/* ------------------------------------------------------------- the picks -- */

type Pick = { row?: RootGame; footnote?: "other" | "small"; game: SlimGame };

const short = (s: { name: string }) => s.name;

function matchup(c: Ctx, g: SlimGame, withRecords = true): string {
  const side = (id: string, fallback: string) => {
    const t = c.byId.get(id);
    return t ? (withRecords ? `${t.name} (${rec(t)})` : t.name) : fallback;
  };
  return `${side(g.away.id, g.away.name)} ${g.neutral ? "vs." : "at"} ${side(g.home.id, g.home.name)}`;
}

function pickGame(c: Ctx, g: SlimGame, i: number, nextWeek = false): Pick {
  const { T, the } = c;
  const A = c.byId.get(g.away.id);
  const H = c.byId.get(g.home.id);
  if (!A || !H) return { game: g };
  const when = whenLine(g, nextWeek);
  const m = matchup(c, g);
  const mine = (x: NflTeam) => x.conf === T.conf;
  const other = T.conf === "AFC" ? "NFC" : "AFC";
  const out = (root: NflTeam, over: NflTeam, weight: number, reason: string): Pick => ({
    game: g,
    row: row({ game: g, root: { name: root.name, abbr: root.abbr, displayName: root.displayName }, over: over.name, matchup: m, when, reason, weight }),
    footnote: weight < 0.6 ? "small" : undefined,
  });

  if (!mine(A) && !mine(H)) return { game: g, footnote: "other" };
  if (mine(A) !== mine(H)) {
    // One of ours against the other conference: always root for the other conference.
    const X = mine(A) ? A : H;
    const Y = mine(A) ? H : A;
    const th = c.threat.get(X.id)!;
    if (th.w < 0.5) return { game: g, footnote: "small" };
    let reason: string;
    if (th.w >= 1.5) reason = againstReason(c, X, i);
    else if (!c.ruleSaid) {
      c.ruleSaid = true;
      reason = `When an ${T.conf} team plays an ${other} team, root for the ${other} team. An ${other} win never hurts ${the}.`;
    }
    else {
      const extra = th.kind === "far"
        ? X.div === T.div ? ` ${capFirst(c.city(X))} ${c.city(X).startsWith("the ") ? "are" : "is"} far ahead in the division.` : ` ${capFirst(c.city(X))} ${c.city(X).startsWith("the ") ? "are" : "is"} well ahead in the ${T.conf}.`
        : th.kind === "tied" || th.kind === "behind" ? ` ${againstReason(c, X, i)}` : "";
      reason = `Same rule: ${other} team over ${T.conf} team.${extra}`;
    }
    return out(Y, X, Math.max(th.w, 0.6), reason);
  }

  // Both in our conference: root against the bigger threat.
  const a = c.threat.get(A.id)!;
  const h = c.threat.get(H.id)!;
  if (Math.max(a.w, h.w) < 0.6) return { game: g, footnote: "small" };
  let X: NflTeam;
  let Y: NflTeam;
  if (Math.abs(a.w - h.w) > 0.05) [X, Y] = a.w > h.w ? [A, H] : [H, A];
  else if (a.kind === "far" || h.kind === "far") [X, Y] = a.kind === "far" ? [H, A] : [A, H];
  else {
    const ea = seriesEdge(c.d.games, T.id, A.id);
    const eh = seriesEdge(c.d.games, T.id, H.id);
    if (ea !== eh) [X, Y] = ea > eh ? [H, A] : [A, H]; // keep the team we beat ahead
    else [X, Y] = ahead(A, H) >= 0 ? [A, H] : [H, A];
  }
  const tx = c.threat.get(X.id)!;
  const ty = c.threat.get(Y.id)!;
  const weight = tx.w - 0.3 * ty.w;
  let reason: string;
  const ex = seriesEdge(c.d.games, T.id, X.id);
  const ey = seriesEdge(c.d.games, T.id, Y.id);
  if (tx.wc && ty.wc) {
    reason = X.l > Y.l
      ? `Both hold wild card spots. ${capFirst(c.city(X))} ${c.city(X).startsWith("the ") ? "have more losses, so they are" : "has more losses, so it is"} the one to pull down.`
      : `Both hold wild card spots. ${capFirst(c.city(X))} ${c.city(X).startsWith("the ") ? "are" : "is"} the one ${the} can still catch, so pull ${c.city(X).startsWith("the ") ? "them" : "it"} down.`;
  } else if (ty.w >= 1.5 && ey > 0 && ex < 0) {
    reason = `One of them has to lose. ${capFirst(the)} beat ${c.city(Y)} and lost to ${c.city(X)}, so they want the ${Y.name} to be the one ahead.`;
  } else {
    reason = againstReason(c, X, i);
    if (ty.kind === "far") reason += variant([` ${capFirst(c.city(Y))} ${c.city(Y).startsWith("the ") ? "are" : "is"} too far ahead to catch, so let them win.`, ` ${capFirst(c.city(Y))} ${c.city(Y).startsWith("the ") ? "are" : "is"} out of reach, so a ${Y.name} win costs nothing.`], i);
    else if (ty.w >= 1.5 && X.div === Y.div && X.div !== T.div && tx.kind !== "last") {
      // Two teams from the same other division: only one can win it.
      reason += ` The ${Y.name} are in the way too, but ${c.city(X)} ${c.city(X).startsWith("the ") ? "are" : "is"} the bigger problem.`;
    }
  }
  return out(Y, X, weight, reason);
}

/** Our own game this week. */
function ownBlock(c: Ctx, g: SlimGame | undefined, tag: string): Guide["own"] {
  const { T, the } = c;
  const The = capFirst(the);
  if (!g) {
    const next = c.d.games.filter((x) => x.week > c.d.week && [x.home.id, x.away.id].includes(T.id)).sort((a, b) => a.week - b.week)[0];
    const opp = next ? c.byId.get(next.home.id === T.id ? next.away.id : next.home.id) : undefined;
    return {
      label: `${The} Are Off This Week`,
      matchup: "Bye Week",
      when: next && opp ? `Next: Week ${next.week} ${next.home.id === T.id ? "vs." : "at"} ${opp.name}` : "",
      reason: `With ${the} off, every game below is the whole story this week.`,
    };
  }
  const oppId = g.home.id === T.id ? g.away.id : g.home.id;
  const O = c.byId.get(oppId);
  if (g.state === "post") {
    const won = (g.home.id === T.id ? g.home.score ?? 0 : g.away.score ?? 0) > (g.home.id === T.id ? g.away.score ?? 0 : g.home.score ?? 0);
    const hs = `${c.byId.get(g.home.id)?.name ?? g.home.name} ${g.home.score ?? 0}`;
    const as = `${c.byId.get(g.away.id)?.name ?? g.away.name} ${g.away.score ?? 0}`;
    return {
      label: won ? `${The} Won` : `${The} Lost`,
      matchup: (g.home.score ?? 0) >= (g.away.score ?? 0) ? `${hs}, ${as}` : `${as}, ${hs}`,
      when: playedWhen(g),
      reason: won ? `Done. Now ${the} need the rest of the week to break their way.` : `That one hurts. The games below matter even more now.`,
    };
  }
  const th = O ? c.threat.get(O.id) : undefined;
  const nth = ORD[T.l + 1] ?? ordinal(T.l + 1);
  const direct = th && th.w >= 2 && O ? ` ${capFirst(c.city(O))} ${c.city(O).startsWith("the ") ? "are" : "is"} in the same race, so this one counts double.` : "";
  const reason =
    tag === "Long Shot"
      ? `Nothing else on this page matters if ${the} lose. A ${nth} loss all but ends it.${direct}`
      : tag === "Clinched"
        ? `${The} are already in. A win helps their seeding more than anything below.${direct}`
        : tag === "In Position"
          ? `A win does more for ${the} than any game below.${direct}`
          : `Start here. A loss would undo whatever help comes from the games below.${direct}`;
  return { label: `First, ${The} Have To Win`, matchup: matchup(c, g), when: whenLine(g), reason };
}

/* ------------------------------------------------------------ the guide -- */

export function nflGuide(d: NflData, slug: string): GuideResult {
  const key = `nfl/${slug}`;
  const T = d.teams.find((t) => slugOf(t.displayName) === slug);
  if (!T) return { kind: "updating", key };
  const c = makeCtx(d, T);
  const { the } = c;
  const The = capFirst(the);
  const week = d.week;
  const weekGames = d.games.filter((g) => g.week === week);
  const own = weekGames.find((g) => [g.home.id, g.away.id].includes(T.id));

  // Status
  const gap7 = T.seed > 7 ? ahead(c.seed7, T) : 0;
  const gapDiv = ahead(c.divLeader, T);
  const reach = Math.min(gap7, c.canDiv ? gapDiv : Infinity);
  const tag = eliminated(T) ? "Eliminated" : clinched(T) ? "Clinched" : T.seed <= 7 ? "In Position" : reach > 3 ? "Long Shot" : "In The Hunt";
  const divTeams = c.conf.filter((t) => t.div === T.div);
  const divPlace = divTeams.findIndex((t) => t.id === T.id);
  const placeWord = divPlace === 0 ? "first" : divPlace === divTeams.length - 1 ? "last" : ORD[divPlace + 1];
  const line = `${The} are ${rec(T)}, ${placeWord} in the ${T.div} and ${seedWord(T.seed)} in the ${T.conf}. Seven teams make the playoffs.`;
  const L = left(T);
  const maxRec = `${T.w + L}-${T.l}${T.t ? `-${T.t}` : ""}`;
  const firstOut = c.conf.find((t) => t.seed === 8)!;
  let need: string;
  if (tag === "Eliminated") need = `${The} have been eliminated from playoff contention, so there is nothing left to root for this season.`;
  else if (tag === "Clinched") need = `${The} have clinched a playoff spot, so these games are about seeding. Only the No. 1 seed skips the first round.`;
  else if (tag === "In Position")
    need =
      T.seed <= 4
        ? `They lead the ${T.div}${ahead(T, divTeams[1]) > 0 ? ` by ${gamesWord(ahead(T, divTeams[1]))}` : " on tiebreakers"} and hold the ${seedName(T.seed)} seed. Here is what keeps them there.`
        : `They hold the ${seedWord(T.seed)} seed, ${ahead(T, firstOut) > 0 ? `${gamesWord(ahead(T, firstOut))} ahead of` : "level with"} the ${firstOut.name}, the first team out. Here is what keeps them in.`;
  else if (tag === "Long Shot")
    need =
      maxPts(T) <= pace(c.seed7) + 0.5
        ? `Realistically they have to win all ${numWord(L)} games left to finish ${maxRec}, and still need the teams below to lose. Here is what would help most.`
        : `They are ${gamesWord(gap7)} behind the ${c.seed7.name} for the last playoff spot with ${numWord(L)} games left, so they need to win nearly every week and get help. Here is what would help most.`;
  else
    need =
      c.canDiv && gapDiv <= gap7
        ? `They are ${gapDiv === 0 ? "level with" : `${gamesWord(gapDiv)} behind`} the ${c.divLeader.name} in the ${T.div}, and the division winner gets a playoff spot. ${numWord(L) === "one" ? "One game is" : `${capFirst(numWord(L))} games are`} left. Here is what would help most.`
        : `They are ${gamesWord(gap7)} behind the ${c.seed7.name} for the last playoff spot, with ${numWord(L)} games left. Here is what would help most.`;

  const facts = [
    { label: "Record", value: rec(T) },
    { label: `${T.conf} Rank`, value: `${ordinal(T.seed)} of 16` },
    { label: "Last Playoff Spot", value: `${c.seed7.name}, ${rec(c.seed7)}` },
    { label: "Games Left", value: String(L) },
  ];

  const sections: Guide["sections"] = [];
  if (tag !== "Eliminated") {
    // This week
    const rows: RootGame[] = [];
    const other: SlimGame[] = [];
    const small: SlimGame[] = [];
    const done: NonNullable<Guide["sections"][number]["done"]> = [];
    let i = 0;
    let crossSeen = 0;
    for (const g of [...weekGames].sort((a, b) => Date.parse(a.date) - Date.parse(b.date))) {
      if (g === own) continue;
      const crossConf = (c.byId.get(g.home.id)?.conf === T.conf) !== (c.byId.get(g.away.id)?.conf === T.conf);
      const p = pickGame(c, g, crossConf ? crossSeen++ : i++);
      if (p.footnote === "other") other.push(g);
      else if (!p.row) {
        if (g.state !== "post") small.push(g);
      }
      else if (g.state === "post") {
        const r = p.row;
        const winnerId = (g.home.score ?? 0) > (g.away.score ?? 0) ? g.home.id : g.away.id;
        const W = c.byId.get(winnerId)!;
        const Lt = c.byId.get(winnerId === g.home.id ? g.away.id : g.home.id)!;
        const good = W.name === r.root;
        const X = c.byId.get(good ? Lt.id : W.id)!; // the team we rooted against
        const { xBeat } = beatLine(c, X);
        const reason = good
          ? `${capFirst(c.city(X))} fell to ${rec(X)}.${c.threat.get(X.id)!.w >= 2.5 ? ` That is the result ${the} needed.` : ""}`
          : `${capFirst(c.city(X))} moved to ${rec(X)}${xBeat ? ` and already beat ${the} ${xBeat}` : c.threat.get(X.id)!.wc ? `, still in a playoff spot` : ""}.`;
        done.push({
          id: g.id,
          result: `${W.name} ${Math.max(g.home.score ?? 0, g.away.score ?? 0)}, ${Lt.name} ${Math.min(g.home.score ?? 0, g.away.score ?? 0)}`,
          when: playedWhen(g),
          verdict: good ? `Went ${possessive(The)} Way` : `Went Against ${The}`,
          reason,
        });
      } else rows.push(p.row);
    }
    const noEffect = other.map((g) => matchup(c, g, false));
    const byes = (d.byes[week] ?? [])
      .map((id) => c.byId.get(id)!)
      .filter((t) => t && t.id !== T.id && t.conf === T.conf && (c.threat.get(t.id)?.w ?? 0) >= 1.5);
    const notes: string[] = [];
    const otherConf = T.conf === "AFC" ? "NFC" : "AFC";
    if (noEffect.length) notes.push(`No effect this week: ${andList(noEffect)} ${noEffect.length === 1 ? "is an" : "are all"} ${otherConf} game${noEffect.length === 1 ? "" : "s"}.`);
    if (small.length) notes.push(`Little effect either way: ${andList(small.map((g) => matchup(c, g, false)))}.`);
    if (byes.length) notes.push(`The ${andList(byes.map(short))} ${byes.length === 1 ? "is" : "are"} off.`);
    sections.push({
      title: "This Week",
      sub: `Sorted by how much each game helps ${the}`,
      games: sortRows(rows),
      done,
      footnote: notes.join(" ") || undefined,
    });

    // Next week: same rules on next week's schedule with today's standings.
    if (week < d.lastWeek) {
      const nw = week + 1;
      const ng = d.games.filter((g) => g.week === nw && g.state === "pre");
      const mineNext = ng.find((g) => [g.home.id, g.away.id].includes(T.id));
      const picks: RootGame[] = [];
      let j = 0;
      c.ruleSaid = false;
      for (const g of ng.sort((a, b) => Date.parse(a.date) - Date.parse(b.date))) {
        if (g === mineNext) continue;
        const p = pickGame(c, g, j++, true);
        if (p.row) picks.push(p.row);
      }
      const top = [...picks].sort((a, b) => b.weight - a.weight).slice(0, 6);
      let lead: RootGame | undefined;
      if (mineNext) {
        const O = c.byId.get(mineNext.home.id === T.id ? mineNext.away.id : mineNext.home.id);
        const th = O ? c.threat.get(O.id) : undefined;
        if (O && th && th.w >= 1.5) {
          const why = againstReason(c, O, 0, true);
          lead = row({
            game: mineNext,
            root: { name: T.name, abbr: T.abbr, displayName: T.displayName },
            over: O.name,
            matchup: matchup(c, mineNext),
            when: whenLine(mineNext, true),
            reason: `A ${T.name} game that counts double. ${why}`,
            weight: 9,
            level: "Big",
          });
        }
      }
      const rest = sortRows(top.slice(0, lead ? 5 : 6));
      sections.push({
        title: "Next Week: Early Look",
        sub: `Week ${nw}. This list updates Monday night once this week's games are final.`,
        games: lead ? [lead, ...rest] : rest,
      });
    }
  }

  const first = sections[0]?.games ?? [];
  const picks = first.slice(0, 3).map((g) => g.root);
  const nextGame = d.games.filter((g) => g.state !== "post" && g.week >= week && [g.home.id, g.away.id].includes(T.id)).sort((a, b) => Date.parse(a.date) - Date.parse(b.date))[0];
  const ownBlk = ownBlock(c, own, tag);
  const title = `${T.name} Rooting Guide, Week ${week}: Who To Root For This Week`;
  const pairs = first.slice(0, 3).map((g) => `the ${g.root} over the ${g.over}`);
  const description = pairs.length
    ? `${T.name} fans, Week ${week}: root for ${andList(pairs)}. The ${T.name} are ${rec(T)}, ${seedWord(T.seed)} in the ${T.conf}, with ${numWord(L)} games left.`
    : `Where the ${T.name} stand in the ${T.conf} playoff race in Week ${week}: ${rec(T)}, ${seedWord(T.seed)} in the ${T.conf}.`;

  const faq: Guide["faq"] = [];
  faq.push({
    q: `Can The ${T.name} Still Make The Playoffs?`,
    a:
      tag === "Eliminated"
        ? `No. ESPN lists the ${T.name} as eliminated at ${rec(T)}.`
        : tag === "Clinched"
          ? `They already have. The ${T.name} are ${rec(T)} and have clinched a playoff spot.`
          : tag === "In Position"
            ? `Yes. At ${rec(T)} the ${T.name} hold the ${seedName(T.seed)} seed in the ${T.conf} right now, with ${numWord(L)} games left. Seven teams make it.`
            : `Yes, ${tag === "Long Shot" ? "but it is a long shot" : "they are still in the race"}. The ${T.name} are ${rec(T)} and ${seedWord(T.seed)} in the ${T.conf}, ${gamesWord(gap7)} behind the ${c.seed7.name} (${rec(c.seed7)}) for the last of seven playoff spots, with ${numWord(L)} games left.`,
  });
  if (pairs.length)
    faq.push({
      q: `Who Should ${T.name} Fans Root For This Week?`,
      a: `In Week ${week}, ${andList(pairs)} matter most${own && own.state === "pre" ? `, after ${possessive(the)} own game` : ""}. Every game is ranked on this page by how much it helps.`,
    });
  if (nextGame) {
    const O = c.byId.get(nextGame.home.id === T.id ? nextGame.away.id : nextGame.home.id);
    if (O)
      faq.push({
        q: `Who Do The ${T.name} Play Next?`,
        a: `The ${T.name} ${nextGame.neutral ? "play" : nextGame.home.id === T.id ? "host" : "visit"} the ${O.name} (${rec(O)})${nextGame.neutral ? " at a neutral site" : ""} in Week ${nextGame.week}: ${whenLine(nextGame, true)}.`,
      });
  }

  return {
    kind: "guide",
    guide: {
      key,
      league: "NFL",
      team: T.displayName,
      nickname: T.name,
      theName: the,
      logoName: T.displayName,
      weekLabel: `Week ${week}`,
      week,
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

/** Sanity checks a guide must pass before it is shown (the check script runs them too). */
export function guideProblems(g: Guide): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of g.sections) {
    for (const r of s.games) {
      if (`${r.root} ${r.matchup} ${r.reason} ${r.when}`.includes("undefined") || /NaN/.test(r.reason)) out.push(`undefined text in ${r.id}`);
      if (s.title === "This Week" && r.root === g.nickname) out.push(`roots for itself this week: ${r.id}`);
      if (r.over === g.nickname) out.push(`roots against itself: ${r.id}`);
      const k = `${s.title}:${r.id}`;
      if (seen.has(k)) out.push(`duplicate game ${r.id}`);
      seen.add(k);
    }
  }
  if (JSON.stringify(g.status).includes("undefined")) out.push("undefined in status");
  return out;
}
