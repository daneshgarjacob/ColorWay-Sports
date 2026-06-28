import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WorldCupBracket from "@/components/WorldCupBracket";

export const metadata: Metadata = {
  title: "2026 World Cup Bracket Predictor: Fill Out Your Round of 32 Bracket | ColorWay Sports",
  description:
    "Fill out your interactive 2026 FIFA World Cup bracket. Tap to pick winners from the Round of 32 through the Final, see who your team could play next, and share your predictions. All 32 knockout teams locked in.",
};

export default function WorldCupBracketPage() {
  return (
    <>
      <Header />
      <main className="max-w-[1100px] mx-auto px-5 py-12 sm:py-16">
        <div className="max-w-[760px] mx-auto">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#2f6bed] mb-3">2026 World Cup · Knockout Stage</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#003087] tracking-tight mb-4 leading-tight">
            Fill out your 2026 World Cup bracket
          </h1>
          <p className="text-gray-600 leading-relaxed mb-2">
            All 32 knockout teams are locked in. Tap the team you think wins each game and they advance automatically,
            from the <strong>Round of 32</strong> all the way to the Final on July 19. Empty slots show exactly who your
            team could play next, so you can see who you <em>want</em> them to draw.
          </p>
          <p className="text-gray-400 text-sm mb-9">
            Your picks save automatically on this device. Crown a champion, then share your bracket. Round of 32 runs June 28 to July 3.
          </p>
        </div>

        <WorldCupBracket />

        <div className="max-w-[760px] mx-auto">
          <p className="text-gray-400 text-xs leading-relaxed mt-12 border-t border-gray-100 pt-6">
            Round of 32 matchups and bracket order follow the official 2026 FIFA World Cup knockout draw. This is a
            pick-your-winner predictor, not a live score feed. Built on an idea from Jonah.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
