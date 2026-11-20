import LeaguePage, { leagueMetadata } from "@/components/browse/LeaguePage";

// League page (11/19, browse by team / division / conference). See components/browse.
export const revalidate = 3600;
export const metadata = leagueMetadata("nfl");

export default function Page() {
  return <LeaguePage league="nfl" />;
}
