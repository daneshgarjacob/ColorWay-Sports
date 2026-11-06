// Most-searched team uniform schedule posts, most clicks first, from Google
// Search Console (last 7 days, pulled 2026-11-05). The homepage's "Most-Searched
// Uniform Schedules This Week" block ranks the teams playing in the next few
// days by this list, so the posts people already look for get the homepage
// links. Refresh it with the Monday diagnostic, like lib/mostRead.ts.
// Shorthand: "~" = -uniform-schedule-2026, "~N" = -uniform-schedule-2026-27.
const RAW =
  "bears~,bengals~,lions~,76ers~N,buccaneers~,seahawks~,dolphins~,steelers~,ohio-state~,miami-hurricanes~," +
  "patriots~,ole-miss~,sharks~N,utah~,byu~,notre-dame~,jaguars~,jets~,ravens~,kentucky~,celtics~N,browns~," +
  "georgia~,bills~,seattle-kraken~N,blackhawks~N,penguins~N,warriors~N,golden-knights~N,rockets~N,colorado~," +
  "minnesota-wild~N,nuggets~N,boise-state~,rams~,knicks~N,south-carolina~,avalanche~N,lakers~N,colts~,titans~," +
  "oregon-state~,chiefs~,duke~,oklahoma~,mavericks~N,minnesota-gophers~,north-carolina~,red-wings~N,florida~," +
  "canucks~N,missouri~,arizona-state~,new-york-rangers~N,eagles~,lsu~,oklahoma-city-thunder~N,maple-leafs~N," +
  "texas-tech~,army~,senators~N,vikings~,bruins~N,raiders~,louisville~,lightning~N,oregon~,arizona~," +
  "florida-state~,iowa~,virginia-tech~,los-angeles-kings~N,hurricanes~N,timberwolves~N,blue-jackets~N,texans~," +
  "flyers~N,navy~,texas~,stars~N,illinois~,tennessee~,devils~N,canadiens~N,maryland~,wizards~N,ucf~," +
  "oklahoma-state~,nc-state~,baylor~";

const RANK = new Map(
  RAW.split(",").map((s, i) => [
    s.replace(/~N$/, "-uniform-schedule-2026-27").replace(/~$/, "-uniform-schedule-2026"),
    i,
  ]),
);

/** Search rank of a schedule post slug (lower is more searched). Unlisted posts sort last. */
export function scheduleSearchRank(slug: string): number {
  return RANK.get(slug) ?? 999;
}

/**
 * The clubs that play within `days`, most-searched schedule post first
 * (homepage + /stories "Most-Searched Uniform Schedules This Week" block).
 * MLB is out until spring; clubs with no ranked post are left out.
 */
export function popularScheduleCards<T extends { league: string; href: string; next?: { at: number } }>(
  cards: T[],
  now = Date.now(),
  limit = 8,
  days = 4,
): T[] {
  const slugOf = (href: string) => href.replace(/^\/stories\//, "");
  return cards
    .filter((c) => c.league !== "MLB" && c.next && c.next.at - now < days * 86_400_000)
    .filter((c) => scheduleSearchRank(slugOf(c.href)) < 999)
    .sort((a, b) => scheduleSearchRank(slugOf(a.href)) - scheduleSearchRank(slugOf(b.href)))
    .slice(0, limit);
}
