# Handoff — as of 2026-09-22

Working state for whoever picks this up. Delete the stale parts as they close out.

## Blocked: no outbound network except GitHub

The environment's egress proxy returns 403 on every live source. Confirmed blocked:
`statsapi.mlb.com`, `site.api.espn.com`, `www.mlb.com`, `syndication.twitter.com`,
`news.google.com`, `adstxt.mediavine.com`, `dashboard.mediavine.com`, `search.google.com`.
GitHub and the package registries work.

WebFetch is blocked too — it uses the same egress proxy, so there is no tool-level way around it.

This broke the normal daily workflow, which assumes live network:
`scripts/mlb-tracker-day.mjs` (statsapi), `scripts/uniform-wire.mjs` (X + Google News),
`scripts/refresh-ads-txt.mjs` (Mediavine), `scripts/nfl-club-gallery.py` (photo pulls).

The account has one environment, `env_012A6wJWJb5nGaBnhK4gQBYn` ("Default — trusted network
access"). It worked until 2026-09-21; what "trusted" allows appears to have narrowed. The fix
is a new environment with a custom allowlist covering the hosts above.

Until then, everything live has to be pasted in by hand.

## Open items

1. **MNF Giants at Rams (9/21) has no score.** The card is logged, converted to the jersey-card
   format and graded B, but the pill reads a bare `Final` and the prose never names a winner.
   One-line patch to both once the score is known. Also unconfirmed: that the Rams actually wore
   the Classic Sol they announced. Jake watched the game and graded it, so the risk is small.
2. **MLB 9/22 day block does not exist.** `scripts/mlb-confirmed/2026-09-22.json` is seeded with
   the one known entry, `"rays|2": "Road Gray"`. Needs the slate, the rest of the uniforms and
   the scores. Jake has the Clash of the Day pick ready and is waiting on this.
3. **ads.txt is stale.** `public/ads.txt` is `v20260825` and Mediavine's dashboard is flagging it.
   This costs revenue silently — an unlisted partner cannot bid and nothing reports an error.
   `scripts/refresh-ads-txt.mjs` needs network; alternatively Jake can download the file from
   the Mediavine settings page and paste the contents in.
4. **Rays post has no tweet embed** — no announcement URL was ever supplied.
5. **Google indexing** for the two new posts has not been requested. Sitemap and the on-site
   search index carry them automatically; only the Search Console submission is outstanding,
   and that needs Jake.

## Shipped 2026-09-22 (all merged to main, PRs #49 #50 #51)

- `/stories/rays-new-gray-road-uniform` — Tampa Bay's first road gray since 2023, graded **A**,
  debuts in game 2 of the 9/22 doubleheader vs the Yankees. Wire item alongside it.
- `/stories/miami-2001-throwback-uniforms` — both halves of the 2001 national championship set,
  road whites **A-**, orange home **B+**. Wire item carries the real `@CanesFootball` embed.
- Swept five posts for the now-false claim that the Rays carry no road gray: the ranked post,
  the Rays schedule post, the league schedule post, and `mlb-postseason-uniforms-2026`, which
  had told readers a Rays road game in October "will be a color jersey no matter what."
- Homepage Latest grid is Rays / NFL tracker / Miami. The Rivalries ranking and the Texans
  schedule post gave up their slots; `app/page.tsx` comments say why and when to restore them.
- `scripts/mlb-tracker-day.mjs`: optional `"<slug>|<gameNumber>"` keys in the confirmed file, so
  a club wearing two different uniforms across a doubleheader is expressible. Without this both
  halves get whichever uniform was filed. Verified offline with a stubbed `fetch`.
- `rays|Road Gray` seeded in that script's `SEED` with swatch `#C4CED4`, plus a tracker tile at
  `public/images/posts/mlb-daily-tracker/rays-road-gray.jpg`. The tile is cropped from the reveal
  graphic, not a laydown like every neighbouring tile — swap it for a product shot or game photo
  when one exists.
- `scripts/nfl-tracker-card.py`: `#FFD100` now reads **Gold**, not "Yellow". It is the Rams' Sol.

## Revenue note

Sunday 9/20: $79.05 on 4,329 sessions = **$18.26 session RPM**, which is strong. Search Console
the same day: 4,217 clicks on 46,284 impressions, a 9.11% CTR. Clicks are 97% of sessions, so
essentially all traffic is Google search — almost no Discover, social or direct.

The ad side is not the problem. The constraint is impression volume, not RPM and not CTR.
An earlier theory in this session — that the thin `/news` template was suppressing RPM — is
wrong, and the blended RPM disproves it. The `/news` pages do lack the desktop sidebar rail that
`/stories` has (`StorySidebar` is only mounted in `app/stories/[slug]/page.tsx`), which is worth
a few percent, but it is not the explanation.
