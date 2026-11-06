import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MvSlot from "@/components/MvSlot";
import type { Metadata } from "next";
import { MyTeamsRow, TeamPicker } from "@/components/home/MyTeams";
import { getMyTeamCards } from "@/lib/myTeams";
import { revalidatePageWithin } from "@/lib/gameDayTitle";

// My Teams on its own page (Jake 11/4): the clubs a reader follows, each with
// its next uniform, plus the picker to add more. Same browser-stored list as
// the homepage row; nothing is stored on our side.

export const metadata: Metadata = {
  title: "My Teams: Your Teams' Next Uniforms",
  description: "Follow your teams and see what each one wears next, across the NFL, NBA, NHL, MLB and college football.",
  alternates: { canonical: "/my-teams" },
  robots: { index: false },
};

export default async function MyTeamsPage() {
  const etNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  await revalidatePageWithin(Math.max(300, 24 * 3600 - (etNow.getHours() * 3600 + etNow.getMinutes() * 60) + 120));
  const cards = getMyTeamCards();
  return (
    <>
      <Header />
      <main className="pb-10">
        <div className="max-w-[1200px] mx-auto px-5 pt-6">
          <h1 className="font-display font-black text-[28px] sm:text-[38px] leading-tight">My Teams</h1>
          <p className="text-[15px] mt-1">Tap ☆ on any team below to follow it. Your teams stay on this device.</p>
        </div>
        <MyTeamsRow teams={cards} teamPages />
        {/* Mediavine in-feed spot (11/6) between the followed teams and the picker. */}
        <div className="max-w-[1200px] mx-auto px-5 pt-6"><MvSlot /></div>
        <TeamPicker teams={cards} />
      </main>
      <Footer />
    </>
  );
}
