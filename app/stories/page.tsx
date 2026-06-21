import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAllPostsByDate } from "@/lib/posts";
import StoriesFilter from "@/components/StoriesFilter";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "All Stories – ColorWay Sports",
  alternates: {
    canonical: "https://www.colorwaysports.com/stories",
  },
};

// Hand-built card for the interactive Rooting Guide. It's a standalone page,
// not a markdown post, so we inject it here and pin it to the top of the grid
// during the World Cup. Links out to /world-cup-rooting-guide via `href`.
const rootingGuideCard = {
  slug: "world-cup-rooting-guide",
  href: "/world-cup-rooting-guide",
  title: "Who Should You Root For So Your Team Advances?",
  category: "Soccer",
  date: "2026-06-20",
  excerpt:
    "Pick the team you want to see advance at the 2026 World Cup and we'll tell you exactly who to root for in the other group-stage game on the final matchday — and whether it even matters.",
  gradient: "linear-gradient(135deg, #003087 0%, #2f6bed 100%)",
  coverImage: "/images/world-cup-rooting-guide-cover.jpg",
  league: "soccer",
  teams: [] as string[],
};

export default function StoriesPage() {
  const posts = getAllPostsByDate();
  const allCards = [rootingGuideCard, ...posts];

  return (
    <>
      <Header />
      <Suspense fallback={<div className="max-w-[1200px] mx-auto px-5 py-12">Loading...</div>}>
        <StoriesFilter posts={allCards} />
      </Suspense>
      <Footer />
    </>
  );
}
