import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WinterCalendarPage from "@/components/WinterCalendarPage";
import { winterTeamKeys, winterTeamByKey, shortDate } from "@/lib/winterTrackerIndex";

const LEAGUE = "nba" as const;

export const dynamic = "force-static";

export function generateStaticParams() {
  return winterTeamKeys(LEAGUE).map((team) => ({ team }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ team: string }>;
}): Promise<Metadata> {
  const { team } = await params;
  const entry = winterTeamByKey(LEAGUE, team);
  if (!entry) return {};
  const title = `${entry.name} 2026-27 Uniform Calendar: Every Game, Every Jersey`;
  const description = `A game-by-game ${entry.name} uniform calendar for 2026-27. All ${entry.games.length} games from ${shortDate(entry.games[0].date)}, home and road splits, and the jersey worn in each one as we log it.`;
  return {
    title,
    description,
    alternates: { canonical: `/nba-tracker/${team}` },
    openGraph: { title, description, url: `/nba-tracker/${team}`, type: "article" },
  };
}

export default async function Page({ params }: { params: Promise<{ team: string }> }) {
  const { team } = await params;
  if (!winterTeamByKey(LEAGUE, team)) notFound();
  return <WinterCalendarPage league={LEAGUE} teamKey={team} />;
}
