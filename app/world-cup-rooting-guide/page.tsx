import type { Metadata } from "next";
import RootingGuide from "@/components/RootingGuide";

export const metadata: Metadata = {
  title: "World Cup Rooting Guide: Who Should I Root For? | ColorWay Sports",
  description:
    "Pick the team you want to advance at the 2026 World Cup and we'll tell you exactly who to root for in the other group-stage game on the final matchday — and whether it even matters.",
};

export default function WorldCupRootingGuidePage() {
  return (
    <main className="max-w-[760px] mx-auto px-5 py-12 sm:py-16">
      <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#2f6bed] mb-3">2026 World Cup</p>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#003087] tracking-tight mb-4 leading-tight">
        Who should I root for?
      </h1>
      <p className="text-gray-600 leading-relaxed mb-2">
        Pick the team you want to see go through, and we'll tell you exactly who to cheer for in the{" "}
        <strong>other</strong> group game on the final matchday — and whether it even matters.
      </p>
      <p className="text-gray-400 text-sm mb-9">
        Live standings as of June 20. Groups A–D are at their final matchday right now — pick your team below. Groups E–L reach their final games June 25–27, and we'll switch them on as they do.
      </p>

      <RootingGuide />

      <p className="text-gray-400 text-xs leading-relaxed mt-12 border-t border-gray-100 pt-6">
        Tiebreakers are simplified for now (points → goal difference → goals for; goal difference modeled on 1–0
        results). Head-to-head and fair-play rankings aren't included yet, and two teams advance from each group.
        Built on an idea from Jonah.
      </p>
    </main>
  );
}
