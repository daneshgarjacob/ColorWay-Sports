import { getAllPostsByDate, type PostMeta } from "@/lib/posts";

// The "why" and origin stories: why the Cowboys wear white at home, how every
// NFL team got its colors, who picks the jersey each night. They are the
// steadiest non-quiz format on TikTok, and before /explained they were
// scattered among 800+ posts with no index.
//
// A story belongs here when its front matter says `kicker: Explained`. The slug
// prefixes are a safety net so a new "why-..." or "how-every-..." story lands on
// the hub even if the kicker is forgotten.

const SLUG_RE = /^(why-|how-every-)/;

export function isExplained(p: Pick<PostMeta, "slug" | "kicker">): boolean {
  return (p.kicker ?? "").trim().toLowerCase() === "explained" || SLUG_RE.test(p.slug);
}

/** Every Explained story, newest first. */
export function getExplainedPosts(): PostMeta[] {
  return getAllPostsByDate().filter(isExplained);
}

export interface ExplainedGroup {
  key: string;
  label: string;
  posts: PostMeta[];
}

// Hub sections, in the order fans care about right now (football season first).
export const EXPLAINED_SECTIONS: { key: string; label: string }[] = [
  { key: "nfl", label: "NFL" },
  { key: "college", label: "College Football" },
  { key: "nba", label: "NBA" },
  { key: "nhl", label: "NHL" },
  { key: "mlb", label: "MLB" },
  { key: "soccer", label: "Soccer" },
  { key: "other", label: "Every Sport" },
];

const KNOWN = new Set(EXPLAINED_SECTIONS.map((s) => s.key));

export function sectionKey(p: Pick<PostMeta, "league">): string {
  const l = (p.league ?? "").toLowerCase();
  return KNOWN.has(l) ? l : "other";
}

/** Explained stories grouped by league, empty groups dropped. */
export function groupExplained(posts: PostMeta[] = getExplainedPosts()): ExplainedGroup[] {
  return EXPLAINED_SECTIONS.map((s) => ({
    ...s,
    posts: posts.filter((p) => sectionKey(p) === s.key),
  })).filter((g) => g.posts.length > 0);
}

/**
 * The "More Explained" rail under an Explained story: stories about the same
 * team first, then the same league, then the newest of the rest.
 */
export function relatedExplained(
  current: Pick<PostMeta, "slug" | "league" | "teams">,
  limit = 3
): PostMeta[] {
  const teams = new Set(current.teams ?? []);
  const league = sectionKey(current);
  const pool = getExplainedPosts().filter((p) => p.slug !== current.slug);
  const score = (p: PostMeta) =>
    ((p.teams ?? []).some((t) => teams.has(t)) ? 100 : 0) + (sectionKey(p) === league ? 10 : 0);
  return pool
    .map((p, i) => ({ p, s: score(p), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.p);
}

/**
 * The best Explained story for one team: a story about that team alone (or a
 * small group) beats a league-wide piece like "How Every NFL Team Got Its
 * Colors", which is tagged with all 32 clubs.
 */
export function explainedForTeam(teamSlug: string): PostMeta | undefined {
  const hits = getExplainedPosts().filter((p) => (p.teams ?? []).includes(teamSlug));
  if (hits.length === 0) return undefined;
  return [...hits].sort((a, b) => (a.teams?.length ?? 0) - (b.teams?.length ?? 0))[0];
}
