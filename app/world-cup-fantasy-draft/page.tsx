import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WorldCupSquadDraft from "@/components/WorldCupSquadDraft";

export const metadata: Metadata = {
  title: "2026 World Cup Fantasy Draft: Draft Your Dream XI From the Stars Still Standing | ColorWay Sports",
  description:
    "Play the interactive 2026 World Cup fantasy draft. Pick one of five random players for every spot in a 4-3-3 and build your dream XI from the stars still alive in the knockouts, then share your team.",
};

export default function WorldCupFantasyDraftPage() {
  return (
    <>
      <Header />
      <main className="max-w-[820px] mx-auto px-5 py-12 sm:py-16">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#2f6bed] mb-3">2026 World Cup · Interactive Fantasy Draft</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#003087] tracking-tight mb-4 leading-tight">
          Draft your 2026 World Cup dream XI
        </h1>
        <p className="text-gray-600 leading-relaxed mb-2">
          The group stage is over and the stars are still standing. Build your ultimate 4-3-3 from the players whose teams
          are still alive in the knockouts. For every position we deal you <strong>five random players</strong> &mdash; pick the
          one you want, fill all 11 spots, and crown your dream team.
        </p>
        <p className="text-gray-400 text-sm mb-9">
          Tap any spot on the pitch to redraft it, hit Shuffle for five new options, and your XI saves automatically on this
          device. When you are done, share your team.
        </p>

        <WorldCupSquadDraft />

        <div className="mt-16">
          <h2 className="text-2xl font-extrabold text-[#003087] tracking-tight mb-4">How the 2026 World Cup fantasy draft works</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            This is a free, interactive 2026 World Cup fantasy draft. You build a full 4-3-3 starting XI &mdash; one goalkeeper,
            four defenders, three midfielders, and three forwards. For each position, the draft deals you five random players
            from the stars whose nations are still alive in the knockout stage. Pick the one you want and the next spot opens up.
            Do not like your five options? Hit Shuffle for a new set, or tap any filled spot on the pitch to redraft it.
          </p>
          <p className="text-gray-600 leading-relaxed mb-8">
            Your team saves on your device, so you can come back and tweak it. When the XI is complete, use the share button to
            save an image of your dream team for your group chat or social. Want to predict how the tournament actually plays out?
            Fill out our <a href="/world-cup-rooting-guide" className="text-[#2f6bed] font-semibold">interactive 2026 World Cup bracket</a> next.
          </p>
          <p className="text-gray-400 text-xs leading-relaxed border-t border-gray-100 pt-6">
            Player pool is a curated set of marquee names from the nations still in the 2026 FIFA World Cup knockout stage.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
