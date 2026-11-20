// Server-side data for the browse layer (11/19): league pages (/nfl), division
// and conference pages (/nfl/afc-west), the team pages' "around the division"
// row and My Teams' newest story per club. Everything here is built from data
// the site already has: the My Teams cards (this week's look, same source as
// the team pages), the posts' `teams:` tags and The Wire.

import { getAllPostsByDate, type PostMeta } from "@/lib/posts";
import { getAllNewsMeta, newsForTeam, newsThumb, uniquePhotos, type NewsMeta, type NewsThumb } from "@/lib/news";
import type { MyTeamCard } from "@/lib/myTeams";
import {
  LEAGUE_HUBS,
  TEAM_GROUPS,
  groupsOf,
  storyTeamSlug,
  locateTag,
  type HubLeague,
  type LeagueHub,
  type TeamGroup,
} from "@/lib/teamGroups";

export type WireCard = NewsMeta & { thumb: NewsThumb };

/** The cards for a group's clubs, in the map's order. */
export function groupCards(group: TeamGroup, cards: MyTeamCard[]): MyTeamCard[] {
  return group.teams
    .map((slug) => cards.find((c) => c.id === `${group.league}:${slug}`))
    .filter((c): c is MyTeamCard => Boolean(c));
}

/** Clubs with a team page that the map has not placed yet (shown as "More Teams"). */
export function ungroupedCards(league: HubLeague, cards: MyTeamCard[]): MyTeamCard[] {
  const placed = new Set(groupsOf(league).flatMap((x) => x.teams));
  const code = LEAGUE_HUBS.find((h) => h.key === league)!.code;
  return cards.filter((c) => c.league === code && !placed.has(c.id.split(":")[1]));
}

const isSchedulePost = (p: PostMeta) => /-uniform-schedule-/.test(p.slug);
// A post tagged with most of a league ("How Every NFL Team Got Its Colors")
// is a league story, not a division story.
const MAX_TEAMS_FOR_GROUP = 12;

/**
 * A group's newest stories: anything tagged with the conference itself, or
 * with one of its clubs when the post is about a handful of teams. Team
 * schedule posts are left out, since every club's tile already links to its own.
 */
export function groupStories(group: TeamGroup, limit = 12): PostMeta[] {
  const tags = new Set(group.teams.map(storyTeamSlug));
  return getAllPostsByDate()
    .filter((p) => !isSchedulePost(p))
    .filter((p) => {
      const t = p.teams ?? [];
      if (group.storyTag && t.includes(group.storyTag)) return true;
      return t.length <= MAX_TEAMS_FOR_GROUP && t.some((x) => tags.has(x));
    })
    .slice(0, limit);
}

/** A league's newest stories (by the post's `league:`). */
export function leagueStories(hub: LeagueHub, limit = 12): PostMeta[] {
  return getAllPostsByDate()
    .filter((p) => p.league === hub.storiesLeague && !isSchedulePost(p))
    .slice(0, limit);
}

/**
 * The Wire items for a set of clubs, newest first, one per photo (Jake 11/14),
 * and never a photo that a story card on the same page already shows: those
 * items fall back to the team logo, as on the homepage.
 */
export function wireForCards(cards: MyTeamCard[], photosOnPage: Set<string>, limit = 8): WireCard[] {
  const bySlug = new Map<string, WireCard>();
  for (const c of cards) {
    for (const item of newsForTeam(storyTeamSlug(c.id.split(":")[1]), c.name, 12)) bySlug.set(item.slug, item);
  }
  return finishWire([...bySlug.values()], photosOnPage, limit);
}

/** The Wire items for a whole league (by the item's tag). */
export function wireForLeague(hub: LeagueHub, photosOnPage: Set<string>, limit = 8): WireCard[] {
  const items = getAllNewsMeta()
    .filter((n) => n.tag === hub.wireTag)
    .slice(0, limit * 3)
    .map((n) => ({ ...n, thumb: newsThumb(n) }));
  return finishWire(items, photosOnPage, limit);
}

function finishWire(items: WireCard[], photosOnPage: Set<string>, limit: number): WireCard[] {
  const sorted = items
    .sort((a, b) => (a.at > b.at ? -1 : 1))
    .map((i) => (i.thumb.kind === "cover" && i.thumb.src && photosOnPage.has(i.thumb.src) ? { ...i, thumb: newsThumb(i, true) } : i));
  return uniquePhotos(sorted).slice(0, limit);
}

export const coversOf = (posts: { coverImage?: string }[]) =>
  new Set(posts.map((p) => p.coverImage).filter((s): s is string => Boolean(s)));

/**
 * My Teams (11/19): the newest story for each club, by card id, from the last
 * `days` days. Schedule posts are skipped (the card already links there), and so
 * are roundups tagged with more than four teams, so the line is about that club.
 * Only clubs with a recent story are listed, which keeps the payload small.
 */
export function newestStoryByTeam(days = 30, now = new Date()): Record<string, { slug: string; title: string }> {
  const since = new Date(now.getTime() - days * 86_400_000).toISOString().slice(0, 10);
  const out: Record<string, { slug: string; title: string }> = {};
  for (const p of getAllPostsByDate()) {
    if (p.date < since) continue;
    if (isSchedulePost(p) || !p.teams?.length || p.teams.length > 4) continue;
    for (const tag of p.teams) {
      const where = locateTag(tag);
      if (!where?.team) continue;
      const id = `${where.league}:${where.team}`;
      // The headline before the colon reads fine on its own and halves the bytes.
      if (!out[id]) out[id] = { slug: p.slug, title: p.title.split(": ")[0] };
    }
  }
  return out;
}

/** Every browse page path, for the sitemap. */
export function browsePaths(): string[] {
  return [
    ...LEAGUE_HUBS.map((h) => h.path),
    ...TEAM_GROUPS.map((x) => `${LEAGUE_HUBS.find((h) => h.key === x.league)!.path}/${x.slug}`),
  ];
}
