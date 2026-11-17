# Team Alerts: Plan For The Per-Game Email

Status 11/16: **signup only.** Nothing is sent, scheduled or automated. The signup box is built and switched OFF (`lib/teamAlerts.ts`, `NEXT_PUBLIC_TEAM_ALERTS`). This file is the plan for the email itself, to be approved by Jake before anything is built or sent.

## The Product Rule

Jake's worry: will emails make people visit the site less? So the alert is a **teaser**, never the full answer:

- **Subject**: team, opponent, day, and the uniform headline.
- **One line**: the look in a sentence, and whether it is confirmed or our expected call.
- **One button**: "See The Full Uniform", to the team's page on the site with UTM tags.
- **No images in the email.** The photos of both uniforms, the matchup, our grade and the rest of the schedule live only on the site. That is the reason to click.

## Where The Teaser Comes From

Everything already exists in the data the site builds from. No new data source.

| Field | Source |
| --- | --- |
| Next game, opponent, home/away, kickoff | `lib/myTeams.ts` `getTeamCard(id)` (NFL: `content/data/nfl-kickoffs-2026.json` + schedule grids; NBA/NHL: `buildWinterIndex`; CFB: schedule post grid) |
| The look ("Black alternate") | `card.next.look` (same field the homepage My Teams cards show) |
| Confirmed or expected | `card.next.confirmed` (NFL); NBA/NHL league-published schedules count as confirmed |
| Link | `card.href` (the schedule post, which earns the most) with UTM tags below |
| Anything special (debut, throwback, Thanksgiving) | the schedule post's grid label, e.g. "Blue · Thanksgiving" |

Generation (to build later, after Jake approves): a script, `scripts/team-alerts-draft.mjs`, that for a given date lists every game, groups subscribers by the "Team Alerts" custom field, and writes one draft per team per game. Drafts go to Jake for review first. Sending would go through beehiiv (a segment per team, see below); nothing automatic until Jake says so.

## Sample: Lions, Week 11

Game: Buccaneers at Lions, Sunday, November 22, 2026, 1:00 p.m. ET, Ford Field. Our schedule post has Detroit in the black alternate (not yet confirmed by the team; second of three black games: Week 7 Green Bay, Week 11 Tampa Bay, Week 16 Giants).

> **Subject:** Lions vs. Bucs Sunday: The Black Alternates Are Expected
>
> Detroit is expected in the black alternate at Ford Field, the second of three black games this season.
>
> **[See The Full Uniform →]**
> `https://www.colorwaysports.com/stories/lions-uniform-schedule-2026?utm_source=beehiiv&utm_medium=email&utm_campaign=team-alert&utm_content=nfl-detroit-lions-2026-11-22`
>
> Mute Lions alerts · Unsubscribe

If the team confirms the look before the send, "are expected" becomes "confirmed" and the line says where it was confirmed ("Detroit confirmed it on X this morning"). Plain voice, no puns, no emoji, Title Case subject.

## Frequency Rules

1. **One email per team per game, maximum.** No "reminder" or "results" follow-up.
2. **Send time**: the morning of the game (about 9 a.m. in the team's time zone); the evening before for games that start before 1 p.m. local. Thursday NFL games: Thursday morning.
3. **Several teams playing the same day** go in one email, one line each, so a reader never gets more than one alert a day.
4. **No game, no email** (bye weeks, off days, offseason).
5. **Mute anytime**: every alert carries "Mute [Team] alerts" (removes that team from the reader's "Team Alerts" field) and the normal beehiiv unsubscribe. The Sunday newsletter is separate and unaffected by muting.
6. **Never send a guess as a fact**: if we have no expected look, skip the email rather than invent one.

## How We Measure Whether Alerts ADD Site Visits

Every alert link carries `utm_source=beehiiv&utm_medium=email&utm_campaign=team-alert&utm_content=<league>-<team>-<date>`. Signup source is tagged too (`utm_medium=team-alerts` on the beehiiv subscriber record).

Per send, in GA4 (Traffic acquisition, filter campaign = team-alert):
- **Clicks per send** = sessions from that send / recipients. Target: 15%+ (beehiiv click rate as a cross-check).
- **Pages per alert session** vs. the site average (about 1.45). Alert readers should go deeper, not shallower.

Against a baseline, which is how we answer Jake's worry:
- **Returning readers per team.** Before launch, record for 4 weeks the returning-user sessions on each team's schedule post and team page. After launch, compare the alerted teams' returning sessions (all channels, not just email) with the same teams before and with similar teams that have no subscribers. If alerts replaced visits, organic returning visits on alerted teams would fall while email sessions rose; if they add, total returning sessions go up.
- **Game-day sessions per subscriber.** For each subscriber's team, sessions on game days from email + direct. Up = adding.
- **Unsubscribe and mute rate per send** (beehiiv). Above 1% per send means the email is not worth it; look at the copy.

Review after 4 weeks of sends with Jake. Kill or change it if alert sessions do not beat the baseline.

## What Jake Must Set Up In beehiiv (before switching on)

1. **Settings → Custom Fields → New**: name `Team Alerts`, type Text. Signups save team ids there, comma separated, e.g. `nfl:detroit-lions,nba:detroit-pistons`. (Another name works if `BEEHIIV_TEAM_FIELD` is set to it in Vercel.)
2. Confirm `BEEHIIV_API_KEY` and `BEEHIIV_PUBLICATION_ID` are set in Vercel (signups already depend on them).
3. Segments (later, when sending): one per team, rule "Team Alerts contains nfl:detroit-lions".
4. Turn the boxes on: Vercel → Settings → Environment Variables → `NEXT_PUBLIC_TEAM_ALERTS` = `on` (Production), then redeploy. Only after the first alert email is approved and ready to send, so the site never promises an email that does not exist.

Check beehiiv's current plan for custom fields, segments and API limits before relying on them; nothing here should need a paid upgrade, and if it does, stop and ask Jake.
