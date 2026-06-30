import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WorldCupBracket from "@/components/WorldCupBracket";
import { teams, decodePicks, flagEmoji } from "@/lib/wcBracket";

const DEFAULT_TITLE = "2026 World Cup Bracket Predictor: Fill Out Your Interactive Knockout Bracket | ColorWay Sports";
const DEFAULT_DESC =
  "Fill out your interactive 2026 FIFA World Cup bracket. Predict every knockout winner from the Round of 32 to the Final, watch real results lock in as games finish, and share your bracket. All 32 teams.";

type SP = Promise<{ [key: string]: string | string[] | undefined }>;

// When a shared bracket link (?b=) is opened, set the preview title to the sharer's
// champion pick + flag, so texts/social show "My pick to win is X 🏴" with a tap-through link.
export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const b = typeof sp?.b === "string" ? sp.b : undefined;
  if (b) {
    const champ = decodePicks(b)["final"];
    if (champ && teams[champ]) {
      const t = teams[champ];
      const title = `My pick to win the 2026 World Cup is ${t.name} ${flagEmoji(t.flag)}`;
      const description = "See my full 2026 World Cup bracket from the Round of 32 to the Final, then fill out your own predictor.";
      return {
        title: `${title} | ColorWay Sports`,
        description,
        openGraph: { title, description },
        twitter: { card: "summary", title, description },
      };
    }
  }
  return { title: DEFAULT_TITLE, description: DEFAULT_DESC };
}

export default function WorldCupBracketPage() {
  return (
    <>
      <Header />
      <main className="max-w-[1100px] mx-auto px-5 py-12 sm:py-16">
        <div className="max-w-[760px] mx-auto">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#2f6bed] mb-3">2026 World Cup · Interactive Bracket Predictor</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#003087] tracking-tight mb-4 leading-tight">
            Fill out your 2026 World Cup bracket predictor
          </h1>
          <div className="rounded-2xl bg-[#eef3ff] border border-[#cfdcff] px-5 py-4 mb-5 text-[15px] leading-relaxed text-[#14223f]">
            <strong>New here? Here is the idea.</strong> This is a free game, with no sign-up and nothing to download. The World Cup
            knockout stage is down to 32 teams. You guess who wins each game by tapping that team, and we automatically move them into
            the next round, all the way until you crown a champion. Tap a team again to undo that pick. Any game that has already been
            played is locked to the real result, so those you cannot change.
          </div>
          <p className="text-gray-600 leading-relaxed mb-2">
            The full interactive 2026 FIFA World Cup bracket is here. Tap the team you think wins each knockout game and they
            advance automatically, from the <strong>Round of 32</strong> all the way to the Final on July 19. Empty slots show
            exactly who your team could play next, so you can see who you <em>want</em> them to draw.
          </p>
          <p className="text-gray-400 text-sm mb-9">
            Real results lock in as games finish, so your bracket updates with the actual winners while you predict the rest.
            On your phone, swipe between rounds. Your picks save automatically, and you can share a link to your bracket so friends can
            see your champion and fill out their own. Round of 32 runs June 28 to July 3.
          </p>
        </div>

        <WorldCupBracket />

        <div className="max-w-[760px] mx-auto mt-16">
          <h2 className="text-2xl font-extrabold text-[#003087] tracking-tight mb-4">How the 2026 World Cup bracket predictor works</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            This is a free, interactive 2026 World Cup bracket you fill out yourself. Start in the Round of 32, tap a winner in
            every matchup, and each pick auto-advances to the next round so the bracket builds itself all the way to the Final.
            Change your mind on an earlier round and everything downstream re-routes instantly. On phones you swipe between the
            Round of 32, Round of 16, quarterfinals, semifinals, and Final; on desktop you see the full knockout bracket at once.
          </p>
          <p className="text-gray-600 leading-relaxed mb-8">
            As each World Cup knockout game is played, the real result locks into the bracket and marks that matchup Final, so the
            tool doubles as a live 2026 World Cup bracket and your own predictor at the same time. Crown your champion, then hit
            share to send a link to your bracket. Anyone who opens it can see your picks and start their own with one tap.
          </p>

          <h2 className="text-2xl font-extrabold text-[#003087] tracking-tight mb-4">Frequently asked questions</h2>
          <div className="space-y-5 mb-4">
            <div>
              <p className="font-bold text-gray-800 mb-1">How do I fill out a 2026 World Cup bracket?</p>
              <p className="text-gray-600 leading-relaxed">Tap the team you think wins in each Round of 32 matchup. Your pick advances to the next round automatically. Keep picking through the Round of 16, quarterfinals, semifinals, and Final to crown your champion. Your bracket saves on your device, so you can come back and edit it anytime.</p>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">Which 32 teams are in the 2026 World Cup knockout bracket?</p>
              <p className="text-gray-600 leading-relaxed">The Round of 32 features the 12 group winners, 12 runners-up, and the eight best third-place teams from the 2026 FIFA World Cup group stage. All 32 are locked into the bracket above in their official knockout positions.</p>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">How do I share my World Cup bracket with friends?</p>
              <p className="text-gray-600 leading-relaxed">Tap the share button and we create a link to your exact bracket. Send it in a text or post it, and the preview shows your pick to win the tournament. When a friend opens the link they see your full bracket and can start their own with one tap, so you can compare predictions.</p>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">Does the bracket update with real World Cup results?</p>
              <p className="text-gray-600 leading-relaxed">Yes. As each knockout game finishes, the actual winner locks into the bracket and the matchup is marked Final, while every game that has not been played stays open for you to predict.</p>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">Can I change my picks after I fill out the bracket?</p>
              <p className="text-gray-600 leading-relaxed">Anytime. Tap a different team in any round and the bracket re-routes everything downstream from that game. Use the reset button to clear it and start over from the Round of 32.</p>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">When is the 2026 World Cup knockout stage?</p>
              <p className="text-gray-600 leading-relaxed">The Round of 32 runs June 28 to July 3, 2026, followed by the Round of 16, the quarterfinals, the semifinals, and the Final on July 19 at MetLife Stadium. The bracket above covers every knockout round.</p>
            </div>
          </div>
          <p className="text-gray-400 text-xs leading-relaxed mt-10 border-t border-gray-100 pt-6">
            Round of 32 matchups and bracket order follow the official 2026 FIFA World Cup knockout draw. Built on an idea from Jonah.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
