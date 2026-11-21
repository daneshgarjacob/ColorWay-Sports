// Head-to-head fan votes (components/BracketVote.tsx, app/api/votes).
//
// Every vote the API accepts must be for a poll listed here, so a stray or
// made-up item id is a 404, not a new row. A poll is two choices, A and B,
// and closes at `closesAt` (UTC); after that the API still answers GET but
// refuses new votes.
//
// The markdown places a vote with a placeholder the component fills in:
//   <div data-cw-vote="tg26:r1-m1" data-a="Cowboys 1960s Classic" data-b="Rams Fearsome White"></div>
//
// Next round: add its matchups here (same id pattern, new closesAt) once the
// previous round's winners are known.

export const CHOICES = ["A", "B"] as const;
export type Choice = (typeof CHOICES)[number];
export const isChoice = (c: unknown): c is Choice => c === "A" || c === "B";

export type Poll = { id: string; closesAt: string };

// Best NFL Thanksgiving Uniforms bracket, 2026. Round 1 closes Saturday
// night, November 21, 11:59 p.m. Eastern (= 04:59 UTC Sunday).
const TG26_R1_CLOSE = "2026-11-22T04:59:00Z";

export const POLLS: Poll[] = [
  { id: "tg26:r1-m1", closesAt: TG26_R1_CLOSE },
  { id: "tg26:r1-m2", closesAt: TG26_R1_CLOSE },
  { id: "tg26:r1-m3", closesAt: TG26_R1_CLOSE },
  { id: "tg26:r1-m4", closesAt: TG26_R1_CLOSE },
];

export const pollFor = (id: unknown): Poll | null =>
  typeof id === "string" ? POLLS.find((p) => p.id === id) ?? null : null;

export const isClosed = (p: Poll, now = Date.now()) => now >= Date.parse(p.closesAt);

export type VoteTally = { item: string; count: number; a: number; b: number; closed: boolean };

/** Whole-number percentages that always add to 100 (when there is a vote). */
export function percents(t: Pick<VoteTally, "a" | "b" | "count">): { a: number; b: number } {
  if (!t.count) return { a: 0, b: 0 };
  const a = Math.round((t.a / t.count) * 100);
  return { a, b: 100 - a };
}
