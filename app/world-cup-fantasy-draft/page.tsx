import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WorldCupSquadDraft from "@/components/WorldCupSquadDraft";
import { decodeSquad, squadOverall, verdict, TOTAL_SLOTS } from "@/lib/wcSquadDraft";

const DEFAULT_TITLE = "2026 World Cup Fantasy Draft Game: Build Your Dream Team Starting XI | ColorWay Sports";
const DEFAULT_DESC =
  "Play the free, interactive 2026 World Cup fantasy draft game. Get dealt five random stars across the positions you need, build your dream team starting XI, get an overall rating, and see how far your team would go in the World Cup.";

const CANONICAL = "https://www.colorwaysports.com/world-cup-fantasy-draft";

type SP = Promise<{ [key: string]: string | string[] | undefined }>;

// A shared XI link (?xi=) sets the preview to the sharer's rating + how far their team goes.
export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const xi = typeof sp?.xi === "string" ? sp.xi : undefined;
  if (xi) {
    const squad = decodeSquad(xi);
    const ovr = Object.keys(squad).length === TOTAL_SLOTS ? squadOverall(squad) : null;
    if (ovr != null) {
      const v = verdict(ovr);
      const title = `My 2026 World Cup XI: ${v.label} ${v.emoji} — ${ovr} OVR`;
      const description = "See my 2026 World Cup fantasy draft XI, then draft your own and see if you can build a better-rated team.";
      return {
        title: `${title} | ColorWay Sports`,
        description,
        alternates: { canonical: CANONICAL },
        openGraph: { title, description },
        twitter: { card: "summary", title, description },
      };
    }
  }
  return { title: DEFAULT_TITLE, description: DEFAULT_DESC, alternates: { canonical: CANONICAL } };
}

export default function WorldCupFantasyDraftPage() {
  return (
    <>
      <Header />
      <main className="max-w-[820px] mx-auto px-5 py-12 sm:py-16">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#2f6bed] mb-3">2026 World Cup · Interactive Fantasy Draft Game</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#003087] tracking-tight mb-4 leading-tight">
          Draft Your 2026 World Cup Dream Team: Build a Starting XI
        </h1>
        <div className="rounded-2xl bg-[#eef3ff] border border-[#cfdcff] px-5 py-4 mb-5 text-[15px] leading-relaxed text-[#14223f]">
          <strong>New here? Here is the idea.</strong> This is a free game, with no sign-up and nothing to download. We deal you five
          random World Cup stars at a time, and you pick one to add to your team. Keep going until you have filled all eleven spots
          on the field, then we give your squad an overall rating and tell you how far it would go in the tournament. Try to build
          the best team you can.
        </div>
        <p className="text-gray-600 leading-relaxed mb-2">
          The group stage is over and the superstars are in. Build a 4-3-3 from the marquee names across every nation that
          made the Round of 32. <strong>Eliminated teams stay in the pool</strong>, so a Japan, a Germany, or a Netherlands
          star is still draftable even after their country goes out. Each turn we <strong>deal you five random stars across the
          positions you still need</strong> &mdash; take the best player or fill a need, your call. When your XI is complete
          you get an overall rating and we tell you <strong>how far your team would go in the World Cup</strong>.
        </p>
        <p className="text-gray-400 text-sm mb-9">
          Watch the deck shuffle, spend your one re-roll wisely, and chase the holy grail: a team good enough to be crowned
          World Cup Winner. It is brutally hard to get. Share a link to your XI and dare your friends to draft a higher rating.
        </p>

        <WorldCupSquadDraft />

        <div className="mt-16">
          <h2 className="text-2xl font-extrabold text-[#003087] tracking-tight mb-4">How the 2026 World Cup fantasy draft game works</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            This is a free, interactive 2026 World Cup fantasy draft game. You build a full 4-3-3 starting XI &mdash; one
            goalkeeper, four defenders, three midfielders, and three forwards. Each turn the deck shuffles and deals you five
            random players from across the positions you still need to fill. That is where the strategy lives: do you grab the
            91-rated forward in front of you, or hold out because you still need a goalkeeper and defenders?
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Every player carries a FIFA-style overall rating, and your squad rating is the average of your XI. When all 11 spots
            are full, we rate how far your team would go: Group Stage, Round of 32, Round of 16, Quarterfinals, Semifinals, Final,
            or, if you build something special, <strong>World Cup Winner</strong>. That top tier is deliberately brutal to reach,
            so most teams fall short and you will want to re-draft and chase it.
          </p>
          <p className="text-gray-600 leading-relaxed mb-8">
            You get <strong>one re-roll for the whole draft</strong>, so use it wisely. When your XI is done, hit share to send a
            link to your team. Friends who open it see your rating and how far your team goes, then draft their own to try to beat
            you. Want to predict the tournament itself? Fill out our{" "}
            <a href="/world-cup-rooting-guide" className="text-[#2f6bed] font-semibold">interactive 2026 World Cup bracket</a> next.
          </p>

          <h2 className="text-2xl font-extrabold text-[#003087] tracking-tight mb-4">Frequently asked questions</h2>
          <div className="space-y-5 mb-8">
            <div>
              <p className="font-bold text-gray-800 mb-1">How do you play the 2026 World Cup fantasy draft?</p>
              <p className="text-gray-600 leading-relaxed">Build a 4-3-3 dream XI. Each turn you are dealt five random players across the positions you still need, and you draft one. Fill all 11 spots and we rate your team. You get one re-roll for the whole draft if you do not like a hand.</p>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">How is my World Cup team rated?</p>
              <p className="text-gray-600 leading-relaxed">Every player has a FIFA-style overall rating, and your squad rating is the average across your XI. We then map that rating to how far your team would go in the World Cup, from a Group Stage exit all the way up to World Cup Winner.</p>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">How hard is it to draft a World Cup Winner?</p>
              <p className="text-gray-600 leading-relaxed">Very. Because the deal is random and you only get one re-roll, you rarely get elite options at every position. Reaching the World Cup Winner tier takes a near-perfect XI, which is exactly why people keep re-drafting to chase it.</p>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">What is the strategy in the draft?</p>
              <p className="text-gray-600 leading-relaxed">Each hand of five mixes positions, so you balance taking the highest-rated player against filling the spots you still need. Grabbing every big name early can leave you forced into weak goalkeepers or defenders late, which drags your overall rating down.</p>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">Which players can I draft?</p>
              <p className="text-gray-600 leading-relaxed">The pool is the marquee names from every nation that reached the 2026 World Cup Round of 32 &mdash; players like Kylian Mbappé, Erling Haaland, Mohamed Salah, Lionel Messi, Lamine Yamal, and Jude Bellingham, sorted by position so your XI always makes sense. Eliminated teams stay in the pool, so you can still draft a Japan, a Germany, or a Netherlands star even after their country goes out.</p>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">How do I share my World Cup XI with friends?</p>
              <p className="text-gray-600 leading-relaxed">When your XI is complete, tap share and we create a link to your exact team. The preview shows your rating and how far your team goes. When a friend opens it they see your XI and can draft their own with one tap, so you can compare ratings.</p>
            </div>
          </div>
          <p className="text-gray-400 text-xs leading-relaxed border-t border-gray-100 pt-6">
            Player ratings are FIFA-style overalls for a fun rating game and are not official. Player pool is a curated set of
            marquee names from the nations still in the 2026 FIFA World Cup knockout stage.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
