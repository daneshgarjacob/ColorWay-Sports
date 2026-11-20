import { getAllPostsByDate, type PostMeta } from "@/lib/posts";
import { getAllNews, newsThumb, uniquePhotos, type NewsItem, type NewsThumb } from "@/lib/news";

// The /more-sports hub (11/19): minor league baseball, the G League, women's
// pro hockey, lacrosse, junior hockey, volleyball and whatever comes next.
//
// Opt-in, not slug matching:
//   - a story joins with frontmatter `hub: "more-sports"` and `hubGroup:`
//     one of the group ids below ("milb", "women", "gleague", "more");
//   - a Wire item joins by its `league:` (milb, gleague, pwhl, nll, whl, ...)
//     or by `tag: "More Sports"`; `hubGroup:` in its frontmatter overrides.

export type MoreSportsGroupId = "milb" | "women" | "gleague" | "more";

export const MORE_SPORTS_GROUPS: { id: MoreSportsGroupId; title: string; blurb: string }[] = [
  { id: "milb", title: "Minor League Baseball", blurb: "Triple-A to Single-A: new names, City Connects, alternates and caps." },
  { id: "women", title: "Women's Sports", blurb: "The PWHL and the rest of women's pro sports." },
  { id: "gleague", title: "G League", blurb: "The NBA's minor league, where the wildest jerseys in basketball live." },
  { id: "more", title: "More", blurb: "Lacrosse, junior hockey, volleyball and the rest." },
];

// Wire `league:` values and the group each one files under.
const WIRE_LEAGUE_GROUP: Record<string, MoreSportsGroupId> = {
  milb: "milb",
  pwhl: "women",
  nwsl: "women",
  lovb: "women",
  gleague: "gleague",
  nll: "more",
  pll: "more",
  whl: "more",
  ohl: "more",
  qmjhl: "more",
  chl: "more",
  ushl: "more",
  ahl: "more",
  echl: "more",
  volleyball: "more",
};

const isGroup = (g: unknown): g is MoreSportsGroupId => MORE_SPORTS_GROUPS.some((x) => x.id === g);

export type MoreSportsWire = NewsItem & { thumb: NewsThumb };

export interface MoreSportsSection {
  id: MoreSportsGroupId;
  title: string;
  blurb: string;
  stories: PostMeta[];
  wire: MoreSportsWire[];
}

export function moreSportsStories(): PostMeta[] {
  return getAllPostsByDate().filter((p) => p.hub === "more-sports");
}

function wireGroup(n: NewsItem): MoreSportsGroupId | null {
  if (isGroup(n.hubGroup)) return n.hubGroup;
  const byLeague = n.league ? WIRE_LEAGUE_GROUP[n.league.toLowerCase()] : undefined;
  if (byLeague) return byLeague;
  return n.tag === "More Sports" ? "more" : null;
}

/** Every group that has something in it, stories and Wire items newest first. */
export async function moreSportsSections(): Promise<MoreSportsSection[]> {
  const stories = moreSportsStories();
  // Never the same photo twice on the page (Jake 11/14): a Wire item whose
  // photo is already a story cover here shows its team logo instead, and the
  // older of two Wire items with one photo does the same.
  const covers = new Set(stories.map((p) => p.coverImage).filter(Boolean));
  const wireAll = uniquePhotos(
    (await getAllNews())
      .filter((n) => wireGroup(n))
      .map((n) => {
        const thumb = newsThumb(n);
        return { ...n, thumb: thumb.kind === "cover" && thumb.src && covers.has(thumb.src) ? newsThumb(n, true) : thumb };
      }),
    true,
  );

  return MORE_SPORTS_GROUPS.map((g) => ({
    ...g,
    stories: stories.filter((p) => (isGroup(p.hubGroup) ? p.hubGroup : "more") === g.id),
    wire: wireAll.filter((n) => wireGroup(n) === g.id),
  })).filter((s) => s.stories.length + s.wire.length > 0);
}
