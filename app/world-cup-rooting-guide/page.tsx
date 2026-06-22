import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RootingGuide from "@/components/RootingGuide";

export const metadata: Metadata = {
  title: "2026 World Cup: Who to Root For So Your Team Advances | ColorWay Sports",
  description:
    "Pick the team you want to advance at the 2026 World Cup and we'll tell you exactly who to root for in the other group-stage game on the final matchday — and whether it even matters.",
};

export default function WorldCupRootingGuidePage() {
  return (
    <>
      <Header />
      <main className="max-w-[760px] mx-auto px-5 py-12 sm:py-16">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#2f6bed] mb-3">2026 World Cup</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#003087] tracking-tight mb-4 leading-tight">
          Who should you root for so your team advances?
        </h1>
        <p className="text-gray-600 leading-relaxed mb-2">
          Pick the team you want to see go through, and we'll tell you exactly who to cheer for in the{" "}
          <strong>other</strong> group game on the final matchday — and whether it even matters.
        </p>
        <p className="text-gray-400 text-sm mb-9">
          All 12 groups are here. Ten of the twelve are at their final matchday now — pick your team for a live verdict on the last group game. Groups G and H switch on once they reach theirs (final games June 26). Standings as of June 22.
        </p>

        <RootingGuide />

        <p className="text-gray-400 text-xs leading-relaxed mt-12 border-t border-gray-100 pt-6">
          Tiebreakers are simplified for now (points → goal difference → goals for; goal difference modeled on 1–0
          results). Head-to-head and fair-play rankings aren't included yet, and two teams advance from each group.
          Built on an idea from Jonah.
        </p>
      </main>
      <Footer />
    </>
  );
}
