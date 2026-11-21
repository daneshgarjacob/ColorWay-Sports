"use client";

// A link to a team's hub page (/teams/<league>/<slug>) that reports the click
// to GA4 as team_hub_click (Jake 11/21: "it should always be easily
// accessible"), so we can see whether readers use it from stories or My Teams.
// Team id only, nothing personal.

import Link from "next/link";
import type { ReactNode } from "react";
import { trackEvent } from "@/lib/track";

export default function TeamHubLink({
  teamId,
  placement,
  className,
  children,
}: {
  /** "cfb:usc-trojans" */
  teamId: string;
  placement: "story" | "my_teams";
  className?: string;
  children: ReactNode;
}) {
  const [league, slug] = teamId.split(":");
  return (
    <Link
      prefetch={false}
      href={`/teams/${league}/${slug}`}
      className={className}
      onClick={() => trackEvent("team_hub_click", { team_id: teamId, league, placement })}
    >
      {children}
    </Link>
  );
}
