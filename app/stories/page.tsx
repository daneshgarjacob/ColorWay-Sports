import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAllPostsByDate } from "@/lib/posts";
import StoriesFilter from "@/components/StoriesFilter";
import { storiesMetadata } from "@/lib/storyFilters";
import TeamQuickLinks from "@/components/TeamQuickLinks";
import { buildTeamQuickLinks, resolveTeamQuickLinks } from "@/lib/teamQuickLinks";
import { Suspense } from "react";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

// Reading searchParams here makes the route dynamic, which is the point: each
// ?league= / ?team= view needs its own title and its own canonical instead of
// inheriting one that pointed every filtered URL back at /stories. It also means
// the filtered list is server-rendered, so the story links are in the HTML.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const sp = await searchParams;
  return storiesMetadata({
    league: first(sp.league),
    team: first(sp.team),
    query: first(sp.q),
  });
}

// Hand-built cards for the interactive World Cup tools. They're standalone pages,
// not markdown posts, so we inject them here and pin them to the top of the grid
// during the World Cup. They link out via `href`.
const fantasyDraftCard = {
  slug: "world-cup-fantasy-draft",
  href: "/world-cup-fantasy-draft",
  title: "2026 World Cup Fantasy Draft: Build Your Dream XI",
  category: "Soccer",
  date: "2026-06-28",
  excerpt:
    "Get dealt five random stars for every spot in a 4-3-3 and draft your dream XI from every nation that made the Round of 32 — eliminated teams stay in the pool. Get your squad's overall rating, then send it to your friends.",
  gradient: "linear-gradient(135deg, #0b3b2e 0%, #2f6bed 100%)",
  coverImage: "/images/posts/world-cup-2026-fantasy-draft/cover.jpg",
  league: "soccer",
  teams: [] as string[],
};

const rootingGuideCard = {
  slug: "world-cup-rooting-guide",
  href: "/world-cup-rooting-guide",
  title: "2026 World Cup Bracket Predictor: Fill Out Your Knockout Bracket",
  category: "Soccer",
  date: "2026-06-25",
  excerpt:
    "Tap to pick every knockout winner from the Round of 32 to the Final, watch real results lock in as games finish, see who your team could play next, and share your bracket. All 32 teams.",
  gradient: "linear-gradient(135deg, #003087 0%, #2f6bed 100%)",
  coverImage: "/images/world-cup-rooting-guide-cover.jpg",
  league: "soccer",
  teams: [] as string[],
};

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const posts = getAllPostsByDate();
  // Resolved on the server so the schedule/calendar links land in the HTML for
  // crawlers, and so the 124-club index never ships to the browser.
  const sp = await searchParams;
  const quickLinkTeams = resolveTeamQuickLinks(buildTeamQuickLinks(), {
    team: first(sp.team),
    query: first(sp.q),
  });
  // Merge the hand-built tool cards in by date like everything else, so the grid stays
  // in true reverse-chronological order (by updatedDate, falling back to date) instead
  // of force-pinning the tools to the top.
  const effectiveDate = (p: { date: string; updatedDate?: string }) =>
    p.updatedDate || p.date;
  const allCards = [fantasyDraftCard, rootingGuideCard, ...posts].sort((a, b) =>
    effectiveDate(a) > effectiveDate(b) ? -1 : 1
  );

  return (
    <>
      <Header />
      <Suspense fallback={<div className="max-w-[1200px] mx-auto px-5 py-12">Loading...</div>}>
        <StoriesFilter
          posts={allCards}
          quickLinks={<TeamQuickLinks teams={quickLinkTeams} />}
        />
      </Suspense>
      <Footer />
    </>
  );
}
