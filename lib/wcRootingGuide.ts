// 2026 World Cup "rooting guide" data + engine.
//
// Small, hand-maintained data file (Jake's call) powering /world-cup-rooting-guide.
// Only groups that have reached their FINAL matchday belong here (standings after
// 2 games + the two third-round fixtures). As more groups reach their last games,
// add them; update standings as results come in.
//
// REAL standings as of 2026-06-20 (source: CBS Sports live WC standings).
// Groups A-D are at their final matchday (games 6/24-6/25). Groups E-L are still
// mid-group-stage (final games 6/25-6/27) and will be added as they get there.
//
// Tiebreakers (v1): points -> goal difference -> goals for. GD modeled on 1-0
// results. Head-to-head / fair-play not yet included. Top two of each group advance.

export type RGTeam = {
  key: string;
  name: string;
  pts: number;
  gd: number;
  gf: number;
  color: string;
};

export type RGFixture = { home: string; away: string };

export type RGGroup = {
  id: string;        // "A".."L"
  teams: RGTeam[];   // current standings, leader first
  fixtures: [RGFixture, RGFixture]; // the two final-matchday games
};

// ---- DATA ----
export const wcGroups: RGGroup[] = [
  {
    id: "A",
    teams: [
      { key: "MEX", name: "Mexico", pts: 6, gd: 3, gf: 3, color: "#006847" },
      { key: "KOR", name: "South Korea", pts: 3, gd: 0, gf: 2, color: "#0A3DA8" },
      { key: "CZE", name: "Czechia", pts: 1, gd: -1, gf: 2, color: "#D7141A" },
      { key: "RSA", name: "South Africa", pts: 1, gd: -2, gf: 1, color: "#007A4D" },
    ],
    fixtures: [{ home: "CZE", away: "MEX" }, { home: "RSA", away: "KOR" }],
  },
  {
    id: "B",
    teams: [
      { key: "CAN", name: "Canada", pts: 4, gd: 6, gf: 7, color: "#FF1F1F" },
      { key: "SUI", name: "Switzerland", pts: 4, gd: 3, gf: 5, color: "#D52B1E" },
      { key: "BIH", name: "Bosnia and Herzegovina", pts: 1, gd: -3, gf: 2, color: "#1F4FA8" },
      { key: "QAT", name: "Qatar", pts: 1, gd: -6, gf: 1, color: "#8A1538" },
    ],
    fixtures: [{ home: "SUI", away: "CAN" }, { home: "BIH", away: "QAT" }],
  },
  {
    id: "C",
    teams: [
      { key: "BRA", name: "Brazil", pts: 4, gd: 3, gf: 4, color: "#FFD400" },
      { key: "MAR", name: "Morocco", pts: 4, gd: 0, gf: 2, color: "#C1272D" },
      { key: "SCO", name: "Scotland", pts: 3, gd: 0, gf: 1, color: "#1F3F7A" },
      { key: "HAI", name: "Haiti", pts: 0, gd: -4, gf: 0, color: "#2563EB" },
    ],
    fixtures: [{ home: "SCO", away: "BRA" }, { home: "MAR", away: "HAI" }],
  },
  {
    id: "D",
    teams: [
      { key: "USA", name: "United States", pts: 6, gd: 5, gf: 6, color: "#1A3A8F" },
      { key: "AUS", name: "Australia", pts: 3, gd: 0, gf: 2, color: "#00843D" },
      { key: "PAR", name: "Paraguay", pts: 3, gd: -1, gf: 1, color: "#D52B1E" },
      { key: "TUR", name: "Türkiye", pts: 0, gd: -4, gf: 1, color: "#E30A17" },
    ],
    fixtures: [{ home: "TUR", away: "USA" }, { home: "PAR", away: "AUS" }],
  },
];

// ---- ENGINE ----
type Res = "home" | "draw" | "away";

function applyResult(state: Record<string, RGTeam>, fx: RGFixture, res: Res) {
  const h = state[fx.home], a = state[fx.away];
  if (res === "home") { h.pts += 3; h.gd += 1; h.gf += 1; a.gd -= 1; }
  else if (res === "away") { a.pts += 3; a.gd += 1; a.gf += 1; h.gd -= 1; }
  else { h.pts += 1; a.pts += 1; }
}

function topTwo(group: RGGroup, r0: Res, r1: Res): string[] {
  const s: Record<string, RGTeam> = {};
  group.teams.forEach((t) => { s[t.key] = { ...t }; });
  applyResult(s, group.fixtures[0], r0);
  applyResult(s, group.fixtures[1], r1);
  return Object.values(s)
    .sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf)
    .slice(0, 2)
    .map((t) => t.key);
}

export type RGVerdict = {
  badge: string;
  tone: "in" | "win" | "help" | "out";
  yourGame: string;
  rootLine: string;
  reason: string;
};

export function analyzeTeam(group: RGGroup, teamKey: string): RGVerdict {
  const myIdx = group.fixtures.findIndex((f) => f.home === teamKey || f.away === teamKey);
  const otherFix = group.fixtures[1 - myIdx];
  const myFix = group.fixtures[myIdx];
  const iAmHome = myFix.home === teamKey;
  const oppKey = iAmHome ? myFix.away : myFix.home;
  const nameOf = (k: string) => group.teams.find((t) => t.key === k)!.name;
  const opp = nameOf(oppKey);
  const homeT = nameOf(otherFix.home);
  const awayT = nameOf(otherFix.away);

  const myWin: Res = iAmHome ? "home" : "away";
  const ORES: Res[] = ["home", "draw", "away"];
  const adv = (mr: Res, or: Res) => {
    const r0 = myIdx === 0 ? mr : or;
    const r1 = myIdx === 0 ? or : mr;
    return topTwo(group, r0, r1).includes(teamKey);
  };

  const all: boolean[] = [];
  ([myWin, "draw", iAmHome ? "away" : "home"] as Res[]).forEach((m) =>
    ORES.forEach((o) => all.push(adv(m, o)))
  );
  const alreadyThrough = all.every(Boolean);
  const cannot = all.every((x) => !x);
  const winOK = ORES.filter((o) => adv(myWin, o));

  function rootText(list: Res[]): { root: string; reason: string } {
    const s = new Set(list);
    if (s.size === 3) return { root: "Doesn't matter — relax and watch", reason: `No result in ${homeT} vs ${awayT} can change your fate.` };
    if (s.has("home") && s.has("draw") && !s.has("away")) return { root: `Root for ${homeT} (win or draw)`, reason: `You're fine unless ${awayT} wins — so cheer ${homeT} to avoid the slip-up.` };
    if (s.has("away") && s.has("draw") && !s.has("home")) return { root: `Root for ${awayT} (win or draw)`, reason: `You're fine unless ${homeT} wins — so cheer ${awayT} to avoid the slip-up.` };
    if (s.has("home") && !s.has("draw") && !s.has("away")) return { root: `Root for ${homeT} to win`, reason: `Only a ${homeT} win keeps you safely ahead.` };
    if (s.has("away") && !s.has("draw") && !s.has("home")) return { root: `Root for ${awayT} to win`, reason: `Only an ${awayT} win keeps you safely ahead.` };
    if (s.has("draw") && !s.has("home") && !s.has("away")) return { root: `Root for a draw`, reason: `A draw is the one result that keeps both of them behind you.` };
    if (s.has("home") && s.has("away") && !s.has("draw")) return { root: `Root against a draw`, reason: `You need someone to take all three points — a stalemate is the danger.` };
    return { root: "It's tight — multiple results help", reason: `Several outcomes keep you alive; watch the goal difference.` };
  }

  if (alreadyThrough) {
    return { badge: "✓ You're already through", tone: "in", yourGame: `${nameOf(teamKey)} vs ${opp} — nothing to stress about.`, rootLine: "Doesn't matter — you're in", reason: "You advance regardless of every result. Enjoy it." };
  }
  if (cannot) {
    return { badge: "✕ Realistically out", tone: "out", yourGame: `${nameOf(teamKey)} vs ${opp} — you'd need a big win and a lot of help.`, rootLine: "Long shot only", reason: "Even winning doesn't get you to the top two in this scenario." };
  }
  if (winOK.length === 3) {
    return { badge: "Win and you're in", tone: "win", yourGame: `Beat ${opp} and you're through — simple as that.`, rootLine: "Doesn't matter — just win yours", reason: `If you win, no result in ${homeT} vs ${awayT} can stop you.` };
  }
  if (winOK.length > 0) {
    const r = rootText(winOK);
    return { badge: "Win + get a little help", tone: "help", yourGame: `Beat ${opp} first — that's on you.`, rootLine: r.root, reason: r.reason };
  }
  const r = rootText(ORES.filter((o) => adv("draw", o)));
  return { badge: "You need help", tone: "help", yourGame: `${nameOf(teamKey)} vs ${opp} — even a win may not be enough alone.`, rootLine: r.root, reason: r.reason };
}
