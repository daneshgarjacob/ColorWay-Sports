// Logos for clubs outside the big-league maps in lib/teamLogos.ts (minor league
// baseball, G League, junior hockey, lacrosse). Wire items for these clubs have
// no linked story team to pull a logo from, so newsThumb() matches the club name
// in the item's source or headline. Add a club here once and every future Wire
// item about it gets the logo.
//
// Every file is the club's own primary mark, downloaded from the club's or its
// league's official site (never drawn). Sources:
//   milb-*: mlbstatic.com/team-logos/<id>.svg, the logo milb.com team pages use
//   gleague-maine-celtics: maine.gleague.nba.com (ak-static.cms.nba.com .../1612709915/primary/L/logo.svg)
//   whl-red-deer-rebels: chl.ca/whl-rebels (Red-Deer-Rebels-Logo-LG-1.png)
//   nll-las-vegas-desert-dogs: nll.com (Las-Vegas-Desert-Dogs_Icon_RGB.svg); the club site only ships a white-text lockup
export const CLUB_LOGOS: Record<string, string> = {
  "Lehigh Valley IronPigs": "/logos/teams/milb-lehigh-valley-ironpigs.svg",
  "Louisville Bats": "/logos/teams/milb-louisville-bats.svg",
  "Jersey Shore BlueClaws": "/logos/teams/milb-jersey-shore-blueclaws.svg",
  "Hudson Valley Renegades": "/logos/teams/milb-hudson-valley-renegades.svg",
  "Maine Celtics": "/logos/teams/gleague-maine-celtics.svg",
  "Red Deer Rebels": "/logos/teams/whl-red-deer-rebels.png",
  "Las Vegas Desert Dogs": "/logos/teams/nll-las-vegas-desert-dogs.svg",
};

// League marks, keyed by a Wire item's `league` frontmatter, for a club we have
// no logo for yet. Sources: milb from mlbstatic.com (league-on-light), nll from
// nll.com, whl from chl.ca/whl, pwhl from thepwhl.com, gleague from
// stats.gleague.nba.com.
export const LEAGUE_MARKS: Record<string, string> = {
  milb: "/logos/leagues/milb.svg",
  nll: "/logos/leagues/nll.svg",
  whl: "/logos/leagues/whl.png",
  pwhl: "/logos/leagues/pwhl.png",
  gleague: "/logos/leagues/gleague.svg",
};

/** The first club whose full name appears in any of `texts`. */
export function clubLogoFor(...texts: (string | undefined)[]): string | undefined {
  const hay = texts.filter(Boolean).join(" \n ");
  if (!hay) return undefined;
  for (const [club, src] of Object.entries(CLUB_LOGOS)) {
    if (hay.includes(club)) return src;
  }
  return undefined;
}
