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
  /**
   * schema.org type. Use "Person" for a real named human who actually wrote the
   * piece. Use "Organization" for a desk/staff credit — claiming a Person that
   * is not a real writer is exactly the pattern Google's spam policies target.
   */
  type: "Person" | "Organization";
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
    type: "Person",
    role: "Founder and Editor",
    shortBio:
      "Jake Daneshgar is the founder and editor of ColorWay Sports. He writes about uniforms, kits and logo design, and grades the jerseys teams actually wear.",
    bio: [
      "Jake Daneshgar founded ColorWay Sports in 2026 to cover the part of sports that most outlets skip: the way the game actually looks. Uniforms, kits, logos, caps, scorebugs, stadium design and liveries.",
      "He edits the site and writes across baseball, football and European soccer, with a particular interest in what makes a uniform worth keeping — color, contrast, typography, restraint, and whether a design earns its place in a team's wardrobe.",
      "Grades here are judgment calls, made against the same criteria every time. Nothing is promoted to make a list flow better.",
    ],
    // sameAs is intentionally empty until the ColorWay Sports X URL is confirmed.
    // Do NOT guess a handle — a wrong sameAs points Google at someone else's identity.
    sameAs: [],
    email: "jake@colorwaysports.com",
  },
  {
    // Desk credit for continuously-updated data posts (daily trackers, uniform
    // schedules). Typed Organization, not Person, because no single human sits
    // behind a page that is re-logged every night — that is the honest credit
    // and it is what wire desks use.
    slug: "colorway-sports-staff",
    name: "ColorWay Sports Staff",
    type: "Organization",
    role: "Uniform Tracking Desk",
    shortBio:
      "The ColorWay Sports tracking desk logs what every team wears, game by game, and keeps the trackers current all season.",
    bio: [
      "The ColorWay Sports tracking desk maintains the running uniform records: what every club wore, in every game, updated through the season rather than written once.",
      "These pages are logs before they are articles. Combinations are recorded from broadcast and club sources as games finish, and grades are added by the editor.",
    ],
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

/** schema.org author node, reused by post pages and author pages. */
export function authorSchema(author: Author): Record<string, unknown> {
  const base: Record<string, unknown> = {
    "@type": author.type,
    name: author.name,
    url: authorUrl(author),
    description: author.shortBio,
    ...(author.sameAs && author.sameAs.length > 0 ? { sameAs: author.sameAs } : {}),
  };

  // jobTitle/worksFor only make sense for a human. An Organization author is
  // part of the publisher, not employed by it.
  if (author.type === "Person") {
    base.jobTitle = author.role;
    base.worksFor = {
      "@type": "Organization",
      name: "ColorWay Sports",
      url: "https://www.colorwaysports.com",
    };
  }

  return base;
}
