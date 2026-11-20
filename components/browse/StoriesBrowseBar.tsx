import Link from "next/link";
import {
  CFB_CONFERENCE_SCHOOLS,
  LEAGUE_HUBS,
  findGroup,
  groupPath,
  groupsOf,
  hubByStoriesLeague,
  locateTag,
  storyTeamSlug,
  type TeamGroup,
} from "@/lib/teamGroups";
import { DISPLAY_NAME_BY_SLUG, TEAM_LOGO_BY_SLUG, teamSlug as teamSlugOf } from "@/lib/teamLogos";

// The /stories filter bar (11/19): League -> Division/Conference -> Team, as
// rows of chips. Plain links built on the existing ?league= / ?team= URLs
// (plus ?group= for a division), so every view is a shareable URL and the bar
// needs no JavaScript. Each level also links to its static page (/nfl/afc-west,
// the team page), which loads faster than a filtered list.

const CHIP =
  "shrink-0 inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 font-display text-[14px] font-extrabold whitespace-nowrap transition-colors";
const on = "bg-navy-deep border-navy-deep text-white";
const off = "bg-white border-border text-black hover:border-black/30";

/** Team chip label: the nickname for pro clubs, the school for college. */
function teamLabel(group: TeamGroup, slug: string): string {
  if (group.league === "cfb") {
    // Full school name: nicknames run one to three words, so no safe trim.
    return CFB_CONFERENCE_SCHOOLS[group.name]?.find((n) => teamSlugOf(n) === slug) ?? DISPLAY_NAME_BY_SLUG[slug] ?? slug;
  }
  const full = DISPLAY_NAME_BY_SLUG[storyTeamSlug(slug)] ?? slug;
  // "Boston Red Sox" -> "Red Sox", "Toronto Blue Jays" -> "Blue Jays", "Athletics" stays.
  const words = full.split(" ");
  const two = ["Red Sox", "White Sox", "Blue Jays", "Maple Leafs", "Red Wings", "Blue Jackets", "Golden Knights", "Trail Blazers"];
  const last2 = words.slice(-2).join(" ");
  return two.includes(last2) ? last2 : words[words.length - 1];
}

// League and division rows wrap so the chosen chip is always on screen; on
// phones the team row (up to 18 schools) swipes. Labels sit above the chips on
// phones and to their left on wider screens.
function Row({ label, children, swipe }: { label: string; children: React.ReactNode; swipe?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
      <span className="shrink-0 sm:w-[118px] sm:min-h-[44px] flex items-center text-[12px] font-black tracking-[0.14em] uppercase text-steel">{label}</span>
      {/* Phones swipe the team row; wider screens wrap it, since a mouse cannot swipe. */}
      <div className={`flex gap-2 ${swipe ? "-mx-5 px-5 overflow-x-auto chip-scroll sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap" : "flex-wrap"}`}>{children}</div>
    </div>
  );
}

export default function StoriesBrowseBar({ league, group, team }: { league?: string; group?: string; team?: string }) {
  // Work out where the view sits: a ?team= of a club or a conference fills in
  // its league and group, so the bar always shows the path to it.
  const at = team ? locateTag(team) : undefined;
  const hub = (at && LEAGUE_HUBS.find((h) => h.key === at.league)) || (league ? hubByStoriesLeague(league) : undefined);
  const grp = at?.group ?? (hub && group ? findGroup(hub.key, group) : undefined);
  const teamSlug = at?.team;

  const hubOf = (x: TeamGroup) => LEAGUE_HUBS.find((h) => h.key === x.league)!;
  // Conferences use their existing ?team= view (posts carry the conference tag).
  const groupHref = (x: TeamGroup) =>
    x.storyTag ? `/stories?team=${x.storyTag}` : `/stories?league=${hubOf(x).storiesLeague}&group=${x.slug}`;

  return (
    <nav aria-label="Filter stories by league, division and team" className="flex flex-col gap-2 mb-6">
      <Row label="League">
        <Link prefetch={false} href="/stories" className={`${CHIP} ${!hub ? on : off}`}>
          All
        </Link>
        {LEAGUE_HUBS.map((h) => (
          <Link prefetch={false} key={h.key} href={`/stories?league=${h.storiesLeague}`} className={`${CHIP} ${hub?.key === h.key ? on : off}`}>
            {h.name}
          </Link>
        ))}
      </Row>
      {hub && (
        <Row label={hub.groupWord}>
          <Link prefetch={false} href={`/stories?league=${hub.storiesLeague}`} className={`${CHIP} ${!grp ? on : off}`}>
            All {hub.navLabel}
          </Link>
          {groupsOf(hub.key).map((x) => (
            <Link prefetch={false} key={x.slug} href={groupHref(x)} className={`${CHIP} ${grp?.slug === x.slug ? on : off}`}>
              {x.name}
            </Link>
          ))}
        </Row>
      )}
      {grp && (
        <Row label="Team" swipe>
          <Link prefetch={false} href={groupHref(grp)} className={`${CHIP} ${!teamSlug ? on : off}`}>
            All {grp.name}
          </Link>
          {grp.teams.map((slug) => {
            const tag = storyTeamSlug(slug);
            const logo = TEAM_LOGO_BY_SLUG[tag];
            return (
              <Link prefetch={false} key={slug} href={`/stories?team=${tag}`} className={`${CHIP} ${teamSlug === slug ? on : off}`}>
                {logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="" width={20} height={20} loading="lazy" className="w-5 h-5 object-contain" />
                )}
                {teamLabel(grp, slug)}
              </Link>
            );
          })}
        </Row>
      )}
      {(grp || hub) && (
        <p className="text-[15px] m-0 mt-1">
          {teamSlug && hub ? (
            <Link prefetch={false} href={`/teams/${hub.key}/${teamSlug}`} className="inline-flex min-h-[44px] items-center font-display font-extrabold text-orange hover:underline">
              {`${DISPLAY_NAME_BY_SLUG[storyTeamSlug(teamSlug)] ?? "Team"} News, Jerseys And Stories →`}
            </Link>
          ) : grp ? (
            <Link prefetch={false} href={groupPath(grp)} className="inline-flex min-h-[44px] items-center font-display font-extrabold text-orange hover:underline">
              {`${grp.name}: This Week's Looks For Every Team →`}
            </Link>
          ) : hub ? (
            <Link prefetch={false} href={hub.path} className="inline-flex min-h-[44px] items-center font-display font-extrabold text-orange hover:underline">
              {`Every ${hub.name} Team And ${hub.groupWord} →`}
            </Link>
          ) : null}
        </p>
      )}
    </nav>
  );
}
