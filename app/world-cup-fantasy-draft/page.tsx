import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WorldCupSquadDraft from "@/components/WorldCupSquadDraft";

export const metadata: Metadata = {
  title: "2026 World Cup Fantasy Draft Game: Build Your Dream XI From the Random Deal | ColorWay Sports",
  description:
    "Play the free, interactive 2026 World Cup fantasy draft game. Get dealt five random stars for every spot in a 4-3-3, draft your dream XI from the players still alive in the knockouts, and send your team to your friends.",
};

export default function WorldCupFantasyDraftPage() {
  return (
    <>
      <Header />
      <main className="max-w-[820px] mx-auto px-5 py-12 sm:py-16">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#2f6bed] mb-3">2026 World Cup · Interactive Fantasy Draft Game</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#003087] tracking-tight mb-4 leading-tight">
          Draft your 2026 World Cup dream XI
        </h1>
        <p className="text-gray-600 leading-relaxed mb-2">
          The group stage is over and the superstars are still standing. Can you build the best 4-3-3 from the players whose
          teams are still alive in the knockouts? For every position we <strong>deal you five random stars</strong> &mdash; you
          pick one, fill all 11 spots, and crown your dream team. Everyone gets a different deal, so no two XIs are the same.
        </p>
        <p className="text-gray-400 text-sm mb-9">
          Watch the deck shuffle for each spot, use your one re-roll wisely, and tap any spot on the pitch to redraft it.
          Your XI saves automatically on this device. When you are done, send your team to your friends and dare them to beat it.
        </p>

        <WorldCupSquadDraft />

        <div className="mt-16">
          <h2 className="text-2xl font-extrabold text-[#003087] tracking-tight mb-4">How the 2026 World Cup fantasy draft game works</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            This is a free, interactive 2026 World Cup fantasy draft game. You build a full 4-3-3 starting XI &mdash; one
            goalkeeper, four defenders, three midfielders, and three forwards. For each position the deck shuffles and deals
            you five random players from the superstars whose nations are still alive in the knockout stage. Pick the one you
            want and the next spot opens up. The deal is random, so everyone ends up with a different team.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Do not love your five options? You get <strong>one re-roll for the whole draft</strong>, so spend it wisely. You can
            also tap any filled spot on the pitch to redraft it. Your team saves on your device, so you can come back and tweak it.
          </p>
          <p className="text-gray-600 leading-relaxed mb-8">
            When your XI is complete, hit share to save an image of your dream team and send it to your friends to see who drafted
            the best lineup. Want to predict how the tournament actually plays out? Fill out our{" "}
            <a href="/world-cup-rooting-guide" className="text-[#2f6bed] font-semibold">interactive 2026 World Cup bracket</a> next.
          </p>

          <h2 className="text-2xl font-extrabold text-[#003087] tracking-tight mb-4">Frequently asked questions</h2>
          <div className="space-y-5 mb-8">
            <div>
              <p className="font-bold text-gray-800 mb-1">How do you play the 2026 World Cup fantasy draft?</p>
              <p className="text-gray-600 leading-relaxed">Build a 4-3-3 dream XI. For each of the 11 spots you are dealt five random players from the stars still in the World Cup, and you draft one. Fill every position, then share your team. You get one re-roll for the whole draft if you do not like a hand.</p>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">Which players can I draft?</p>
              <p className="text-gray-600 leading-relaxed">The pool is the marquee names from the nations still alive in the 2026 World Cup knockout stage &mdash; players like Kylian Mbappé, Erling Haaland, Mohamed Salah, Lionel Messi, Lamine Yamal, and Jude Bellingham, sorted by position so your XI always makes sense.</p>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">Is the draft really random?</p>
              <p className="text-gray-600 leading-relaxed">Yes. The five options for every position are shuffled and dealt at random, which is why no two drafts are the same. That is the fun of it: you have to build the best team you can from the hand you are dealt.</p>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">Can I share my World Cup XI?</p>
              <p className="text-gray-600 leading-relaxed">Yes. When your XI is complete, the share button saves an image of your full team that you can send straight to your friends or post on social, then challenge them to draft a better one.</p>
            </div>
          </div>
          <p className="text-gray-400 text-xs leading-relaxed border-t border-gray-100 pt-6">
            Player pool is a curated set of marquee names from the nations still in the 2026 FIFA World Cup knockout stage.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
