"use client";

// A link into a Rooting Guide page that reports the click to GA4 (lib/track),
// so we can see which surfaces send readers to the guide. Team id only.

import Link from "next/link";
import type { ReactNode } from "react";
import { trackEvent } from "@/lib/track";

/** "nfl:los-angeles-chargers" -> "/rooting-guide/nfl/los-angeles-chargers" */
export const rootingGuidePath = (teamId: string) => {
  const [league, slug] = teamId.split(":");
  return `/rooting-guide/${league === "cfb" ? "college-football" : league}/${slug}`;
};

const where = (p: string) => (p === "/" ? "home" : p.startsWith("/my-teams") ? "my_teams_page" : p.startsWith("/teams/") ? "team_page" : "other");

export default function RootingGuideLink({
  teamId,
  placement,
  className,
  children,
}: {
  teamId: string;
  /** Where the link sits; defaults to the page it is on (home, my_teams_page, team_page). */
  placement?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      prefetch={false}
      href={rootingGuidePath(teamId)}
      className={className}
      onClick={() => trackEvent("rooting_guide_click", { team_id: teamId, league: teamId.split(":")[0], placement: placement ?? where(window.location.pathname) })}
    >
      {children}
    </Link>
  );
}
