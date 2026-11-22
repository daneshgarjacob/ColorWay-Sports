// Fan votes (components/BracketVote.tsx, components/FavoriteVote.tsx, app/api/votes).
//
// Every vote the API accepts must be for a poll listed here, so a stray or
// made-up item id is a 404, not a new row. A poll closes at `closesAt` (UTC);
// after that the API still answers GET but refuses new votes.
//
// Two kinds of poll:
//
// - Head-to-head (no `options`): two choices, A and B, stored in the `votes`
//   table. The markdown places one with
//     <div data-cw-vote="tg26:r1-m1" data-a="Cowboys 1960s Classic" data-b="Rams Fearsome White"></div>
//
// - Pick one of many (`options` listed): each option has a stable key, which is
//   what gets stored (table `poll_votes`), plus the name and image the vote box
//   shows. The markdown places one with
//     <div data-cw-poll="tg26:favorite"></div>

export const CHOICES = ["A", "B"] as const;
export type Choice = (typeof CHOICES)[number];
export const isChoice = (c: unknown): c is Choice => c === "A" || c === "B";

export type PollOption = {
  /** Stored in the database; never rename once votes exist. */
  key: string;
  team: string;
  look: string;
  img: string;
  alt: string;
};

export type Poll = { id: string; closesAt: string; options?: PollOption[] };

// Best NFL Thanksgiving Uniforms, 2026. The four Round 1 head-to-head polls
// closed Saturday night, November 21 (04:59 UTC Sunday). Their rows stay in the
// database; the post no longer shows them. They stay listed so GET still works.
const TG26_R1_CLOSE = "2026-11-22T04:59:00Z";

// The one vote that replaced the bracket rounds: favorite of all eight, open
// until Wednesday, November 25, 11:59 p.m. Eastern (= 04:59 UTC Thursday).
const TG26_IMG = "/images/posts/best-nfl-thanksgiving-uniforms-bracket-2026";
export const TG26_FAVORITE: Poll = {
  id: "tg26:favorite",
  closesAt: "2026-11-26T04:59:00Z",
  options: [
    {
      key: "cowboys-classic",
      team: "Cowboys",
      look: "1960s Classic Throwback",
      img: `${TG26_IMG}/cowboys-classic.jpg`,
      alt: "Cowboys 1960s Classic throwback: white helmet with a single navy star, navy jersey with white shoulders and stars",
    },
    {
      key: "lions-1934",
      team: "Lions",
      look: "1934 Throwback",
      img: `${TG26_IMG}/lions-1934-throwback.jpg`,
      alt: "Lions player in the 1934 throwback: Honolulu blue jersey, silver pants and silver helmet, Thanksgiving 2025",
    },
    {
      key: "cowboys-double-star-white",
      team: "Cowboys",
      look: "Double-Star White",
      img: `${TG26_IMG}/cowboys-double-star-white.jpg`,
      alt: "Dez Bryant modeling the Cowboys Double-Star white Color Rush uniform with navy star shoulders",
    },
    {
      key: "bears-orange",
      team: "Bears",
      look: "Orange Throwback",
      img: `${TG26_IMG}/bears-orange-2004.jpg`,
      alt: "Bears defensive lineman in the orange throwback jersey at Dallas on Thanksgiving 2004",
    },
    {
      key: "packers-1967",
      team: "Packers",
      look: "1967 Throwback",
      img: `${TG26_IMG}/packers-1967-throwback-2003.jpg`,
      alt: "Brett Favre in the Packers 1967 throwback at Detroit on Thanksgiving 2003",
    },
    {
      key: "lions-wolf-gray",
      team: "Lions",
      look: "Wolf Gray",
      img: `${TG26_IMG}/lions-wolf-gray.jpg`,
      alt: "Lions player in the wolf gray Color Rush uniform for Thanksgiving 2022",
    },
    {
      key: "panthers-all-blue",
      team: "Panthers",
      look: "All Blue",
      img: `${TG26_IMG}/panthers-all-blue.jpg`,
      alt: "Luke Kuechly modeling the Panthers all-blue Color Rush uniform, head to toe in Panther blue",
    },
    {
      key: "rams-fearsome-white",
      team: "Rams",
      look: "Fearsome White",
      img: `${TG26_IMG}/rams-fearsome-white.jpg`,
      alt: "A Rams player modeling the Fearsome White uniform: white jersey with royal numbers and a royal stripe over the shoulder, white pants, royal helmet with white horns and a white facemask",
    },
  ],
};

export const POLLS: Poll[] = [
  { id: "tg26:r1-m1", closesAt: TG26_R1_CLOSE },
  { id: "tg26:r1-m2", closesAt: TG26_R1_CLOSE },
  { id: "tg26:r1-m3", closesAt: TG26_R1_CLOSE },
  { id: "tg26:r1-m4", closesAt: TG26_R1_CLOSE },
  TG26_FAVORITE,
];

export const pollFor = (id: unknown): Poll | null =>
  typeof id === "string" ? POLLS.find((p) => p.id === id) ?? null : null;

export const isClosed = (p: Poll, now = Date.now()) => now >= Date.parse(p.closesAt);

/** True for a pick-one-of-many poll (has `options`). */
export const isMulti = (p: Poll): p is Poll & { options: PollOption[] } => !!p.options?.length;

export const isOptionOf = (p: Poll, key: unknown): key is string =>
  typeof key === "string" && !!p.options?.some((o) => o.key === key);

export type VoteTally = { item: string; count: number; a: number; b: number; closed: boolean };

/** Tally for a pick-one-of-many poll: one count per option key (every key present). */
export type OptionTally = { item: string; count: number; counts: Record<string, number>; closed: boolean };

/** Whole-number percentages that always add to 100 (when there is a vote). */
export function percents(t: Pick<VoteTally, "a" | "b" | "count">): { a: number; b: number } {
  if (!t.count) return { a: 0, b: 0 };
  const a = Math.round((t.a / t.count) * 100);
  return { a, b: 100 - a };
}

/**
 * Whole-number percentages for many options that add to exactly 100 when
 * there is a vote (largest remainder; ties go to the earlier option).
 */
export function optionPercents(counts: Record<string, number>, keys: string[]): Record<string, number> {
  const total = keys.reduce((s, k) => s + (counts[k] ?? 0), 0);
  const out: Record<string, number> = {};
  if (!total) {
    for (const k of keys) out[k] = 0;
    return out;
  }
  const raw = keys.map((k, i) => ({ k, i, exact: ((counts[k] ?? 0) / total) * 100 }));
  for (const r of raw) out[r.k] = Math.floor(r.exact);
  let left = 100 - raw.reduce((s, r) => s + out[r.k], 0);
  const order = [...raw].sort((x, y) => y.exact - Math.floor(y.exact) - (x.exact - Math.floor(x.exact)) || x.i - y.i);
  for (const r of order) {
    if (left <= 0) break;
    out[r.k] += 1;
    left -= 1;
  }
  return out;
}
