/**
 * Author registry.
 *
 * Every post gets a named human byline. Posts can opt into a specific author
 * with an `author:` frontmatter key (slug or full name); everything else falls
 * back to DEFAULT_AUTHOR_SLUG, so the 380+ existing posts need no edits.
 *
 * Why this exists: the whole site is opinion — we hand out letter grades. An
 * anonymous organization grading jerseys carries far less weight with readers
 * and with Google than a named person with a visible track record.
 */

export interface Author {
  slug: string;
  name: string;
  /** Shown under the name on the author page and in the post footer. */
  role: string;
  /** One or two sentences, appended to the end of every post. */
  shortBio: string;
  /** Full bio paragraphs for the author page. */
  bio: string[];
  /** Profile URLs for schema.org sameAs — X, LinkedIn, etc. Omit if unknown. */
  sameAs?: string[];
  email?: string;
}

export const DEFAULT_AUTHOR_SLUG = "jake-daneshgar";

export const AUTHORS: Author[] = [
  {
    slug: "jake-daneshgar",
    name: "Jake Daneshgar",
    role: "Founder and Editor, ColorWay Sports",
    shortBio:
      "Jake Daneshgar is the founder and editor of ColorWay Sports, where he grades uniforms, kits, logos and broadcast design across every major league.",
    bio: [
      "Jake Daneshgar founded ColorWay Sports in 2026 to cover the part of sports that most outlets skip: the way the game actually looks. Uniforms, kits, logos, caps, scorebugs, stadium design, liveries and paint schemes.",
      "He graded all 143 MLB jerseys worn in the 2026 season, team by team, and maintains daily uniform trackers for MLB and the NFL that log what every club wore, in every game, as it happens. He also grades European club kits, college football uniforms, F1 liveries and NASCAR paint schemes.",
      "Every grade on this site is his own judgment call, made against the same criteria each time: color, contrast, typography, restraint, and whether a design earns its place in a team's wardrobe. Nothing is graded by committee and nothing is promoted to make a list flow better.",
    ],
    // TODO: add X profile URL once confirmed — see note in AuthorBio.
    sameAs: [],
    email: "jake@colorwaysports.com",
  },
];

const BY_SLUG = new Map(AUTHORS.map((a) => [a.slug, a]));
const BY_NAME = new Map(AUTHORS.map((a) => [a.name.toLowerCase(), a]));

/**
 * Resolve a frontmatter `author` value (slug OR display name) to an Author.
 * Unknown or missing values fall back to the default author rather than
 * throwing, so a typo in frontmatter can never break a build.
 */
export function getAuthor(value?: string): Author {
  if (value) {
    const key = value.trim().toLowerCase();
    const hit = BY_SLUG.get(key) ?? BY_NAME.get(key);
    if (hit) return hit;
  }
  return BY_SLUG.get(DEFAULT_AUTHOR_SLUG)!;
}

export function authorUrl(author: Author): string {
  return `https://www.colorwaysports.com/authors/${author.slug}`;
}

/** schema.org Person node, reused by post pages and author pages. */
export function authorSchema(author: Author): Record<string, unknown> {
  return {
    "@type": "Person",
    name: author.name,
    url: authorUrl(author),
    jobTitle: author.role,
    description: author.shortBio,
    ...(author.sameAs && author.sameAs.length > 0 ? { sameAs: author.sameAs } : {}),
    worksFor: {
      "@type": "Organization",
      name: "ColorWay Sports",
      url: "https://www.colorwaysports.com",
    },
  };
}
