import { getAllPosts } from "@/lib/posts";

// MLB POSTSEASON MODE for the homepage MLB band (MlbUniformsZone). From the
// first Wild Card day (US Eastern, same date logic as app/page.tsx) the band
// leads with the postseason uniforms post and shows one chip per team still
// alive, linking that team's schedule post. Built 2026-09-28.
export const MLB_POSTSEASON_START = "2026-09-29";
export const MLB_POSTSEASON_POST = "mlb-postseason-uniforms-2026";

// Nickname for each playoff team, keyed by the schedule-post prefix
// (<key>-uniform-schedule-2026).
const TEAM_NAMES: Record<string, string> = {
  phillies: "Phillies",
  braves: "Braves",
  "white-sox": "White Sox",
  astros: "Astros",
  "red-sox": "Red Sox",
  yankees: "Yankees",
  cubs: "Cubs",
  padres: "Padres",
  rays: "Rays",
  guardians: "Guardians",
  dodgers: "Dodgers",
  brewers: "Brewers",
};

// THE FIELD. Remove a team when it's eliminated. Nothing else has to change:
// its chip disappears, and its opponent's chip flips to "Advanced".
export const MLB_POSTSEASON_ALIVE: string[] = [
  // "phillies" eliminated 2026-10-01 (Braves won the Wild Card, 2-1)
  "braves",
  "white-sox",
  // "astros" eliminated 2026-09-30 (White Sox swept the Wild Card, 2-0)
  // "red-sox" eliminated 2026-09-30 (Yankees swept the Wild Card, 2-0)
  "yankees",
  // "cubs" eliminated 2026-09-30 (Padres swept the Wild Card, 2-0)
  "padres",
  "rays",
  "guardians",
  "dodgers",
  "brewers",
];

// THIS ROUND's series, road team first ("Away at Home"). Chips are ordered by
// this list, then any alive team not in a series (the byes). Optional to update:
// when a round ends, replace these with the next round's matchups.
export const MLB_POSTSEASON_SERIES: { round: string; away: string; home: string }[] = [
  { round: "ALDS", away: "white-sox", home: "guardians" },
  { round: "NLDS", away: "braves", home: "dodgers" },
  { round: "ALDS", away: "yankees", home: "rays" },
  { round: "NLDS", away: "padres", home: "brewers" },
];
// Where the teams without a series are waiting.
const BYE_LABEL = "Bye · Division Series";

export interface MlbPostseasonChip {
  slug: string;
  team: string;
  logo?: string;
  accent: string;
  opponent: string;
  label: string;
}

export function todayEt(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export function isMlbPostseason(today: string = todayEt()): boolean {
  return today >= MLB_POSTSEASON_START;
}

export function getMlbPostseasonChips(): MlbPostseasonChip[] {
  const alive = new Set(MLB_POSTSEASON_ALIVE);
  const bySlug = new Map(getAllPosts().map((p) => [p.slug, p]));
  const name = (k: string) => TEAM_NAMES[k] ?? k;

  const ordered: { key: string; opponent: string; label: string }[] = [];
  const placed = new Set<string>();
  for (const s of MLB_POSTSEASON_SERIES) {
    for (const [key, opp, where] of [
      [s.away, s.home, "at"],
      [s.home, s.away, "vs"],
    ] as const) {
      if (!alive.has(key) || placed.has(key)) continue;
      placed.add(key);
      ordered.push(
        alive.has(opp)
          ? { key, opponent: `${where} ${name(opp)}`, label: s.round }
          : { key, opponent: `Beat the ${name(opp)}`, label: `Advanced · ${s.round}` }
      );
    }
  }
  for (const key of MLB_POSTSEASON_ALIVE) {
    if (placed.has(key)) continue;
    ordered.push({ key, opponent: "Waiting on a winner", label: BYE_LABEL });
  }

  const chips: MlbPostseasonChip[] = [];
  for (const o of ordered) {
    const slug = `${o.key}-uniform-schedule-2026`;
    const p = bySlug.get(slug);
    if (!p) continue; // no schedule post, no chip
    chips.push({
      slug,
      team: name(o.key),
      logo: p.logoSrc2,
      accent: (p.gradient.match(/#[0-9A-Fa-f]{6}/) || ["#14284b"])[0],
      opponent: o.opponent,
      label: o.label,
    });
  }
  return chips;
}

// Every story the MLB band links to today, so app/page.tsx can keep them out
// of More Stories. Must mirror what MlbUniformsZone renders.
export function mlbBandSlugs(today: string = todayEt()): string[] {
  if (!isMlbPostseason(today)) {
    return ["mlb-uniform-tracker-2026", "mlb-uniform-schedule-2026"];
  }
  return [
    MLB_POSTSEASON_POST,
    "mlb-uniform-tracker-2026",
    ...getMlbPostseasonChips().map((c) => c.slug),
  ];
}
