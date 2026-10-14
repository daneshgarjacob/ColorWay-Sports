// Word-based story search for /stories?q=.
//
// The old filter matched the query as one exact phrase, so "eagles wearing
// today" found nothing (no headline contains that string) and "packers" listed
// the schedule post 4th behind newer stories. Readers type the way they talk to
// Google, so this:
//   1. splits the query into words and drops filler ("what are the ... wearing
//      today"), keeping the words that actually narrow the search;
//   2. matches each word on its own, against the title, teams, category and
//      excerpt, with a light plural fold ("jerseys" finds "jersey");
//   3. requires every word for 1-2 word queries and most words for longer ones;
//   4. ranks by where the words hit (title beats excerpt), with a bonus when
//      the whole phrase appears in the title;
//   5. pins the named team's uniform schedule post first (passed in by the
//      server, which already resolves "what are the bears wearing" to the Bears).
//
// Pure functions with no React, so the header search box can reuse them.

export interface SearchablePost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  teams?: string[];
}

// Words that never narrow a uniform search. "wearing" and "today" are here on
// purpose: on this site every page is about what someone is wearing.
const STOP_WORDS = new Set([
  "a", "an", "and", "are", "at", "be", "by", "can", "did", "do", "does", "for",
  "from", "how", "i", "in", "is", "it", "its", "me", "my", "of", "on", "or",
  "the", "their", "them", "they", "this", "to", "today", "tonight", "vs",
  "was", "wear", "wearing", "wears", "wore", "what", "whats", "when", "where",
  "which", "who", "why", "will", "with", "worn",
]);

export function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Meaningful words of a query. Falls back to every word if all are filler. */
export function searchTerms(query: string): string[] {
  const words = normalizeSearch(query).split(" ").filter(Boolean);
  const kept = words.filter((w) => !STOP_WORDS.has(w));
  return [...new Set(kept.length ? kept : words)];
}

// "jerseys" -> "jersey", "uniforms" -> "uniform". Deliberately crude: it only
// has to make singular and plural find each other, and "ss" words are left alone.
function stem(w: string): string {
  if (w.length > 3 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

// True when `term` starts a word in `text` (both normalized). Word-start, not
// substring, so "rays" never matches "grays" and "red" never matches "reds"
// unless the stem says so.
function hasWord(text: string, term: string): boolean {
  const t = stem(term);
  const re = new RegExp(`(?:^| )${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
  return re.test(text);
}

const FIELD_WEIGHTS = { title: 4, teams: 3, category: 2, excerpt: 1 } as const;

/**
 * Score one post for a set of terms. Returns -1 when the post does not match
 * enough terms to be a result.
 */
export function scorePost(post: SearchablePost, terms: string[], phrase: string): number {
  if (!terms.length) return -1;
  const fields = {
    title: normalizeSearch(post.title),
    teams: normalizeSearch((post.teams ?? []).join(" ")),
    category: normalizeSearch(post.category),
    excerpt: normalizeSearch(post.excerpt),
  };

  let matched = 0;
  let score = 0;
  for (const term of terms) {
    let best = 0;
    for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
      if (weight > best && hasWord(fields[field as keyof typeof fields], term)) best = weight;
    }
    if (best > 0) {
      matched++;
      score += best;
    }
  }

  // 1-2 words: all of them. Longer queries: most of them, so one stray word
  // ("eagles green jersey history") does not zero the results.
  const needed = terms.length <= 2 ? terms.length : Math.ceil(terms.length * 0.6);
  if (matched < needed) return -1;

  if (matched === terms.length) score += 5;
  if (terms.length > 1 && phrase && fields.title.includes(phrase)) score += 6;
  return score;
}

/**
 * Filter and rank posts for a query. `prioritySlugs` (the named team's uniform
 * schedule post) always come first when they match or are named outright.
 * Ties keep the incoming order, which is newest first.
 */
export function searchPosts<T extends SearchablePost>(
  posts: T[],
  query: string,
  prioritySlugs: string[] = []
): T[] {
  const terms = searchTerms(query);
  const phrase = terms.join(" ");
  const priority = new Set(prioritySlugs);
  // The named team's other stories rank above same-nickname clubs: "eagles"
  // puts Philadelphia's ranked post above Georgia Southern and Boston College.
  const priorityTeams = new Set(
    posts.filter((p) => priority.has(p.slug)).flatMap((p) => p.teams ?? [])
  );

  return posts
    .map((p, i) => {
      let s = scorePost(p, terms, phrase);
      if (priority.has(p.slug)) s = Math.max(s, 0) + 1000;
      else if (s >= 0 && p.teams?.some((t) => priorityTeams.has(t))) s += 3;
      return { p, s, i };
    })
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.p);
}
