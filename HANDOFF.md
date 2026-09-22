# Handoff — as of 2026-09-21 (late night PT)

Working state for whoever picks this up. Delete the stale parts as they close out.

## Network note

The cloud environment (`env_012A6wJWJb5nGaBnhK4gQBYn`, "Default — trusted network access") lost
outbound access on 2026-09-21: 403 on statsapi.mlb.com, site.api.espn.com, syndication.twitter.com,
Mediavine, Search Console. GitHub still worked. Jake's Mac has full network, and the whole daily
workflow (`mlb-tracker-day.mjs`, `roof-status-day.mjs`, `refresh-ads-txt.mjs`, `nfl-club-gallery.py`)
runs fine from there. If a cloud session needs live sources, it needs a new environment with an
allowlist covering the hosts above.

## Open items

1. **MLB 9/22 day block.** `scripts/mlb-confirmed/2026-09-22.json` holds only `"rays|2": "Road Gray"`
   (the new gray debuts in game 2 of the Yankees doubleheader). The 9/22 wearing blocks, league block,
   slate file and roof blocks are already written as Expected. Owed: the uniform feed for the 16 games,
   the tracker day block, scores, and Jake's Clash of the Day pick.
2. **Clash of the Day for Monday 9/21 is Jake's pick.** Three candidates: Twins navy at Giants cream,
   Nationals gray at Tigers Navy City Connect, Blue Jays gray at Orioles orange.
4. **NFL Week 3 tracker cards**: build Wednesday 9/23 by inheriting from both teams' schedule posts.

## Closed 2026-09-21 night (Jake's Mac)

- MLB Monday 9/21: 3 of 3 confirmed off the feed, tracker section live with scores, wearing blocks,
  league block, roof-verify 9/20 (3/3), roof blocks for 9/22.
- MNF Giants at Rams: Rams 28, Giants 6 on the tracker card and prose; both schedule posts flipped to
  "what was actually worn".
- ads.txt refreshed to v20260904 (145 records).
- Rays post and wire item now carry the real reveal tweet (@RaysBaseball, 9/21, "This one's for Tampa Bay").

## Revenue note

Sunday 9/20: $79.05 on 4,329 sessions = **$18.26 session RPM**. Search Console the same day:
4,217 clicks on 46,284 impressions, 9.11% CTR. Clicks are 97% of sessions, so essentially all traffic
is Google search. The ad side is not the problem; the constraint is impression volume. The `/news`
pages lack the desktop sidebar rail `/stories` has (`StorySidebar` is only mounted in
`app/stories/[slug]/page.tsx`), worth a few percent, but not the explanation.
