#!/usr/bin/env node
// Builds the last nine Premier League club kit pages, completing the vertical
// at 20 of 20. Same "what kit are they wearing today" format as the other
// eleven, which out-earns the old review format by roughly 277x.
//
// Matchday blocks point at MATCHWEEK 2 (Aug 28-31), because Matchweek 1 is
// already played. Kit calls are Expected and reasoned from the league's clash
// rules; the club confirms on matchday.
//
// The pill row is written by scripts/sync-epl-pills.mjs afterwards so all 20
// pages stay consistent. Usage: node scripts/gen-epl-remaining-clubs.mjs
import { writeFileSync } from 'node:fs';

const matchday = (c) =>
  `<div data-epl-matchday style="margin: 1.75em 0; border: 2px solid ${c.hex}; border-radius: 16px; overflow: hidden;"><div style="background: ${c.hex}; padding: 9px 16px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;"><span style="font-size: 0.7em; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #ffffff;">What ${c.short} Are Wearing</span><span style="font-size: 0.7em; font-weight: 700; color: rgba(255,255,255,0.9);">Matchweek 2</span></div><div style="padding: 1.5em; text-align: center; background: #ffffff;"><div style="font-size: 2.4em; font-weight: 900; color: ${c.kitColor}; line-height: 1;">${c.kitLabel}</div><div style="font-size: 0.8em; color: #777; margin-top: 5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Expected &middot; clubs confirm on matchday</div><div style="margin-top: 14px; font-size: 1em; color: #1c1c1c; font-weight: 600;">${c.fixture}</div><div style="margin-top: 4px; font-size: 0.9em; color: #555;">${c.when}</div><div style="margin-top: 10px; font-size: 0.95em; color: #444; line-height: 1.55;">${c.why}</div><a href="https://x.com/${c.handle}" style="display: inline-block; margin-top: 16px; padding: 10px 22px; background: ${c.hex}; color: #ffffff; border-radius: 999px; font-weight: 800; font-size: 0.85em; text-decoration: none;">Confirm on @${c.handle} &rarr;</a><div data-epl-pills style="margin-top: 18px; padding-top: 14px; border-top: 1px solid #eef0f4;"></div></div></div>`;

const wardrobe = (c) => {
  const parts = c.kits.map(k => `${k[0].replace('The ', '').replace(' Shirt', '')}: ${k[2]}`).join(' &nbsp;·&nbsp; ');
  return `<div style="margin: 2em 0; padding: 1.5em 2em; background: linear-gradient(135deg, ${c.hex} 0%, ${c.hex2} 100%); border-radius: 16px; text-align: center;">
  <p style="margin: 0 0 6px; font-size: 0.7em; font-weight: 700; color: rgba(255,255,255,0.75); text-transform: uppercase; letter-spacing: 3px;">ColorWay Sports Wardrobe Grade</p>
  <p style="margin: 0; font-size: 2.75em; font-weight: 900; color: #ffffff; line-height: 1; letter-spacing: -1px;">${c.wardrobe}</p>
  <p style="font-size: 0.9em; color: #ffffff; margin: 0.9em 0 0; letter-spacing: 1px;">${parts}</p>
</div>`;
};

const page = (c) => `---
title: "What Kit Are ${c.short} Wearing Today? 2026/27 Kits Graded"
author: "colorway-sports-staff"
category: "Soccer"
date: "2026-08-22"
updatedDate: "2026-08-22"
excerpt: "What kit are ${c.short} wearing today? The expected shirt for their next match, plus every 2026/27 ${c.name} kit and jersey graded."
gradient: "${c.gradient}"
cardStyle: words
kicker: Graded
league: "soccer"
teams: []
resurfaceOnUpdate: true
---

${matchday(c)}

${c.lead}

${c.kits.map(k => `## ${k[0]}: ${k[2]}\n\n${k[1]}\n\n**Grade: ${k[2]}**`).join('\n\n')}

## ${c.short}'s 2026/27 Wardrobe Grade

${wardrobe(c)}

## Who Makes ${c.name}'s Kits

${c.maker}. Every shirt above is part of the ${c.maker} ${c.name} 2026/27 range.

## Frequently Asked Questions

${c.faq.map(f => `**${f[0]}**\n\n${f[1]}`).join('\n\n')}

## The Bottom Line

${c.bottom}
`;

const CLUBS = [
  {
    slug: 'crystal-palace-kits-2026-27', name: 'Crystal Palace', short: 'Crystal Palace', handle: 'CPFC',
    hex: '#1B458F', hex2: '#C4122E', gradient: 'linear-gradient(135deg, #1B458F 0%, #121f3d 55%, #C4122E 130%)', maker: 'Macron',
    kitLabel: 'HOME KIT', kitColor: '#1a7f37', fixture: 'Crystal Palace vs Manchester City', when: 'Friday, August 28 &middot; 4:00 p.m. ET',
    why: "Palace's new white home shirt sits comfortably against Manchester City sky blue, so there is no reason for either club to change and Palace stay in the sash.",
    wardrobe: 'A-',
    lead: "Crystal Palace have done the most interesting thing any Premier League club did this summer, and most people have not noticed yet: they swapped their colours. The white sash shirt that used to be an occasional throwback is now the home kit, and the famous red and blue stripes have been pushed out to the third. It is a real decision, not a marketing one, and it is already changing what Palace look like on a Saturday.",
    kits: [
      ['The Home Shirt', "Predominantly white with a large blue and red sash running across the chest, reviving the 1976 design for the first time in fifty years, and finished with a circular old badge in place of the modern crest. The sash is one of the great English football graphics and it has been off the home shirt for two generations. Bringing it back, committing to white as the base, and pairing it with the retro roundel instead of the current badge is the most confident thing Macron have done for this club. It also has a practical effect: white clashes with almost nothing, so Palace will wear their home shirt away from home far more often than most clubs do.", 'A'],
      ['The Away Shirt', "The 'Eagle Black' kit. A sleek black base with red and blue trim on the collar, cuffs, shoulders and sides, a tone-on-tone eagle plumage graphic, and an eagle silhouette on the front. It is well made and the plumage texture is genuinely nice up close, but a black away shirt with team-colour trim is the most common template in the league, and the eagle silhouette on the chest is doing a lot of work to make it distinct. Solid rather than special.", 'B'],
      ['The Third Shirt', "The 'Eagle Wings' kit, and the shirt that used to be the home. Palace's traditional red and blue vertical stripes are reimagined as diagonal lightning-bolt shapes with sublimated eagle-wing patterns, framed in dark navy with red on the collar and cuffs. Taking the stripes and skewing them into something angular is a bolder idea than most thirds attempt, and it keeps the club's core identity in the wardrobe rather than abandoning it. Loses a step because the diagonal treatment makes the stripes read as pattern rather than as Palace.", 'B+'],
    ],
    faq: [
      ['What kit are Crystal Palace wearing today?', 'Palace host Manchester City on Friday, August 28, and the white home shirt with the blue and red sash is the expected kit. White does not clash with City sky blue, so neither club needs to change. We update this page as each matchweek is confirmed.'],
      ['Why are Crystal Palace wearing white at home in 2026/27?', 'Because they swapped their home and third designs. The white sash shirt, a revival of the 1976 kit, is now the home kit, and the traditional red and blue stripes have moved to the third. It is the first time the sash has been the primary home shirt in fifty years.'],
      ['What happened to the Crystal Palace stripes?', 'They are still in the wardrobe, but on the third shirt, and reworked as diagonal lightning-bolt shapes rather than straight vertical stripes.'],
      ['Who makes Crystal Palace kits?', 'Macron.'],
    ],
    bottom: "Palace have the most interesting wardrobe in the Premier League this season, and it is because they were willing to move their own furniture. The white sash home shirt is a genuine A, a fifty-year revival executed with the confidence to also swap the crest, and the practical bonus is that white travels almost everywhere without a clash. The black away is the weakest of the three and the reworked stripes on the third are a good idea a half-step short. If you only look at one club's kits this season, look at this one.",
  },
  {
    slug: 'sunderland-kits-2026-27', name: 'Sunderland', short: 'Sunderland', handle: 'SunderlandAFC',
    hex: '#EB172B', hex2: '#211E1F', gradient: 'linear-gradient(135deg, #EB172B 0%, #8a0d19 55%, #211E1F 130%)', maker: 'hummel',
    kitLabel: 'HOME KIT', kitColor: '#1a7f37', fixture: 'Sunderland vs Fulham', when: 'Sunday, August 30 &middot; 10:00 a.m. ET',
    why: "Sunderland are at home in the red and white stripes. Fulham's white home shirt is the problem here, not Sunderland's, so it is the visitors who will be asked to change.",
    wardrobe: 'A-',
    lead: "Sunderland's 2026/27 wardrobe is three shirts with three completely different ideas behind them, and remarkably all three land. One is a museum piece, one is a pink Elvis Presley collaboration, and one is about medieval glassmaking. No other club in the league is operating like this.",
    kits: [
      ['The Home Shirt', "The red and white stripes, built as a tribute to the 1936-37 FA Cup winning side, with a white polo collar and a buttoned placket. Inside the white stripes hummel have set a tonal jacquard pattern taken from the filigree engraving on the FA Cup trophy itself. The outer back of the neck carries the 1937 city crest with a 1936-37 inscription, and the inside collar lists the starting eleven from that Wembley win. This is how heritage detailing should be done: the shirt reads as a clean classic from ten yards and rewards you for looking closer. Nothing about it is loud and everything about it means something.", 'A'],
      ['The Away Shirt', "A first-ever collaboration with the Elvis Presley Estate, and it is pink. The base draws on Presley's Cadillac and his wardrobe, a black panel cuts sharply across the top, hummel's chevrons run down the sleeves, and the neck tape carries 'Can't Help Falling in Love With You'. It is the most divisive shirt in the Premier League this season and it is genuinely well executed, but a licensing collaboration with a musician is a different thing from a football kit, and the black panel is doing more design work than the Elvis connection is. Fun, memorable, and a little bit rented.", 'B'],
      ['The Third Shirt', "Deep blue with a repeating tonal stained-glass graphic that works the football emblem from Sunderland's ship badge into the pattern, finished with metallic copper for the retro crest and the hummel branding. The outer back neck reads 'Glass Making Since The 7th Century' in the same copper. Sunderland's glassmaking history is a genuinely local idea nobody else could use, the stained-glass motif is the right visual for it, and copper on deep blue is a combination you rarely see on a football shirt. Excellent third kit.", 'A-'],
    ],
    faq: [
      ['What kit are Sunderland wearing today?', 'Sunderland host Fulham on Sunday, August 30, and the red and white striped home shirt is the expected kit. Fulham play in white, so it is the visitors who are likely to change. We update this page as each matchweek is confirmed.'],
      ['Why is the Sunderland away kit pink?', 'It is a first-ever collaboration with the Elvis Presley Estate. The pink is drawn from Presley’s Cadillac and his wardrobe, and the neck tape carries a lyric from "Can’t Help Falling in Love With You".'],
      ['What is the pattern on the Sunderland home shirt?', 'A tonal jacquard inside the white stripes, taken from the filigree engraving on the FA Cup trophy. The shirt commemorates the 1936-37 FA Cup winning side, and the inside collar lists that final’s starting eleven.'],
      ['Who makes Sunderland kits?', 'hummel.'],
    ],
    bottom: "Sunderland have the most ambitious wardrobe in the league and the highest hit rate to go with it. The home shirt is a masterclass in heritage detailing that stays quiet until you look closely, the third turns local glassmaking history into the best-looking third kit in the division, and even the Elvis away, which will divide people permanently, is properly made. Three shirts, three separate ideas, no filler.",
  },
  {
    slug: 'fulham-kits-2026-27', name: 'Fulham', short: 'Fulham', handle: 'FulhamFC',
    hex: '#000000', hex2: '#CC0000', gradient: 'linear-gradient(135deg, #1a1a1a 0%, #000000 55%, #CC0000 130%)', maker: 'adidas',
    kitLabel: 'CHANGE KIT', kitColor: '#b8860b', fixture: 'Sunderland vs Fulham', when: 'Sunday, August 30 &middot; 10:00 a.m. ET',
    why: "Fulham's white home shirt cannot be worn against Sunderland's red and white stripes, so the visitors change. The red and black away clashes with Sunderland red too, which points at the sky blue third.",
    wardrobe: 'B+',
    lead: "Fulham's 2026/27 wardrobe is a study in how much a club can get out of its own back catalogue. The home shirt looks at the river, the away shirt looks at 1996, and the third looks at nothing in particular, which is exactly the pattern you would expect.",
    kits: [
      ['The Home Shirt', "The usual clean white base with red trim at the collar and framing black sleeve cuffs, lifted by a tonal embossed chevron pattern that mimics the ripples of the River Thames. Fulham's home shirt is one of the hardest in the league to make interesting, because white with black shorts is the entire identity and there is nowhere to hide. The Thames emboss is the right kind of solution: invisible at distance, satisfying up close, and it does not compromise the plainness that makes the shirt what it is.", 'B+'],
      ['The Away Shirt', "A red and black checkerboard, modernising the Le Coq Sportif shirt of 1996-97, and the big move is the return of the minimalist 'FFC' monogram used between 1972 and 1977 and worn on the run to the 1975 FA Cup Final. Red shorts and socks complete it. Checkerboard is a hard pattern to wear and this one holds together because the scale is right and the monogram gives it a period anchor rather than leaving it as a novelty. The boldest thing Fulham have put out in years.", 'A-'],
      ['The Third Shirt', "A bright sky blue base with neon pink details and a horizontal line graphic that creates a wave effect across the front and lower back, on sale from August 10. It is a perfectly competent modern third kit and it has nothing whatsoever to do with Fulham. Sky blue and neon pink is a colour pairing chosen for the shelf rather than the club, and after a home shirt about the Thames and an away shirt about 1975, it is the one that arrives with no story attached.", 'B-'],
    ],
    faq: [
      ['What kit are Fulham wearing today?', 'Fulham travel to Sunderland on Sunday, August 30, and they will have to change. Their white home shirt clashes with Sunderland’s red and white stripes, and the red and black away clashes with Sunderland red, so the sky blue third is the likely call. We update this page as each matchweek is confirmed.'],
      ['What is the pattern on the Fulham home shirt?', 'A tonal embossed chevron structure that mimics the ripples and flow of the River Thames, which runs alongside Craven Cottage.'],
      ['What is the Fulham away kit based on?', 'The 1996-97 Le Coq Sportif away shirt. The red and black checkerboard is a modernised version of it, and it brings back the minimalist FFC monogram used from 1972 to 1977.'],
      ['Who makes Fulham kits?', 'adidas.'],
    ],
    bottom: "Fulham's home shirt solves an unsolvable brief with a Thames emboss you only notice up close, and the checkerboard away is the most confident thing the club has produced in a decade, carried by the returning FFC monogram. The sky blue and neon pink third is the outlier, a good-looking shirt with no connection to the club attached to it. Two out of three with real ideas is a strong season.",
  },
  {
    slug: 'brighton-kits-2026-27', name: 'Brighton and Hove Albion', short: 'Brighton', handle: 'OfficialBHAFC',
    hex: '#0057B8', hex2: '#00B7C8', gradient: 'linear-gradient(135deg, #0057B8 0%, #003a7a 55%, #00B7C8 130%)', maker: 'Nike',
    kitLabel: 'CHANGE KIT', kitColor: '#b8860b', fixture: 'Chelsea vs Brighton', when: 'Sunday, August 30 &middot; 10:00 a.m. ET',
    why: "Brighton's royal blue against Chelsea's royal blue is the clearest clash of the matchweek, so Brighton change. Their away is the same pinstripe design inverted to white, which separates cleanly.",
    wardrobe: 'B+',
    lead: "Brighton turn 125 this season and the wardrobe is built around it, with the anniversary worked into the collar of both the home and away shirts. The genuine news, though, is the third: for the first time in ten years the club has a brand-new third kit design instead of last season's away shirt with the badge moved.",
    kits: [
      ['The Home Shirt', "Royal blue with white vertical pinstripes, and a 'We are Brighton 1901 - 2026' inscription inside the collar for the 125th anniversary. Brighton's identity is blue and white stripes, and narrowing them to pinstripes is a meaningful change rather than a cosmetic one: the shirt reads as a blue shirt with detailing rather than a striped shirt, which is a different thing to look at on a pitch. It works, and the anniversary detailing is handled with restraint, but it does give up some of the club's most recognisable feature.", 'B+'],
      ['The Away Shirt', "The same pinstripe design with the colours inverted, a white base with blue vertical pinstripes, carrying the same 125th anniversary graphic. Inverting the home shirt is the oldest trick in kit design and it is efficient here, giving Brighton a change option that separates from almost everything and clearly belongs to the same family. It is also the least imaginative shirt in the wardrobe by a distance, and in an anniversary season that is a missed opportunity.", 'B'],
      ['The Third Shirt', "Deep teal, inspired by the sea and the Downs around the city, with hyper turq accents lifted from the promenade railings and applied to the mesh side panels, shoulder piping, neckline and cuffs. This is the first genuinely new Brighton third kit in ten years and it justifies the wait. Teal is a colour almost nobody in the league owns, the sea-and-Downs idea is specific to this club in a way that a generic black or gold third never would be, and the promenade railing detail is the kind of thing that only works if someone actually went and looked.", 'A-'],
    ],
    faq: [
      ['What kit are Brighton wearing today?', 'Brighton travel to Chelsea on Sunday, August 30, and they will change. Royal blue against royal blue is a clear clash, so the white away shirt with blue pinstripes is the expected kit. We update this page as each matchweek is confirmed.'],
      ['Why does the Brighton home shirt have pinstripes instead of stripes?', 'Nike narrowed the traditional blue and white stripes to pinstripes for 2026/27. The shirt now reads as royal blue with white detailing rather than as an evenly striped shirt.'],
      ['What is the Brighton 125th anniversary detail?', 'A "We are Brighton 1901 - 2026" inscription inside the collar, carried on both the home and away shirts.'],
      ['Who makes Brighton kits?', 'Nike.'],
    ],
    bottom: "Brighton's anniversary season leans on the third kit, and fairly, because it is the first new one in a decade and the deep teal with promenade turquoise is the best-looking thing the club has worn in years. The home pinstripes are a defensible reinterpretation that costs Brighton a little of what makes them recognisable, and the inverted away is efficient rather than interesting. Good wardrobe, carried by the shirt nobody expected to be the highlight.",
  },
  {
    slug: 'nottingham-forest-kits-2026-27', name: 'Nottingham Forest', short: 'Nottingham Forest', handle: 'NFFC',
    hex: '#DD0000', hex2: '#1f4d2e', gradient: 'linear-gradient(135deg, #DD0000 0%, #8a0000 55%, #1f4d2e 130%)', maker: 'adidas',
    kitLabel: 'AWAY KIT', kitColor: '#b8860b', fixture: 'Liverpool vs Nottingham Forest', when: 'Saturday, August 29 &middot; 8:30 a.m. ET',
    why: "Forest red against Liverpool red is the most straightforward clash in the league, so Forest go to the Collegiate Green away shirt at Anfield.",
    wardrobe: 'B+',
    lead: "Forest's 2026/27 shirts are both about place, one literally and one through the archive, and the away kit brings back a piece of adidas branding the club has not worn in decades.",
    kits: [
      ['The Home Shirt', "The traditional red base with white adidas branding, crest and shoulder stripes, a red v-neck collar, white shorts and red socks, lifted by a tonal pattern inspired by the mist rising off the River Trent. Forest's home shirt is close to untouchable and adidas have sensibly not tried to touch it. The Trent mist graphic is the entire intervention and it is a good one, tonal enough to leave the shirt looking plain on television and specific enough to mean something. Available from July 17.", 'B+'],
      ['The Away Shirt', "A Collegiate Green base with a subtle all-over graphic across the body and sleeves, red detailing at the collar and cuffs, matching red three stripes over the shoulders, and the adidas Trefoil returning to a Forest shirt, embroidered in white on the right of the chest. Green is a genuinely unusual choice for this club and it works because the red trim keeps it tethered to the identity, but the Trefoil is what makes the shirt. Available from August 14.", 'A-'],
    ],
    faq: [
      ['What kit are Nottingham Forest wearing today?', 'Forest travel to Liverpool on Saturday, August 29, and they will change. Forest red against Liverpool red is a direct clash, so the Collegiate Green away shirt is the expected kit. We update this page as each matchweek is confirmed.'],
      ['What is the pattern on the Nottingham Forest home shirt?', 'A tonal graphic inspired by the mist rising from the River Trent, which runs past the City Ground.'],
      ['Does the Nottingham Forest away kit have the adidas Trefoil?', 'Yes. The Trefoil returns to a Forest shirt on the 2026/27 Collegiate Green away kit, embroidered in white on the right side of the chest.'],
      ['Has Nottingham Forest released a third kit for 2026/27?', 'Not as of late August 2026. Forest have launched the home and away shirts, and we will add the third here as soon as it is released.'],
    ],
    bottom: "Forest have kept a great home shirt great by barely touching it, and the River Trent mist graphic is the right size of idea for a kit that does not need rescuing. The Collegiate Green away is the more interesting shirt, carried by an adidas Trefoil the club has not worn in a very long time. The third has not launched yet, so this is a two-shirt wardrobe for now and we will update it when the third lands.",
  },
  {
    slug: 'brentford-kits-2026-27', name: 'Brentford', short: 'Brentford', handle: 'BrentfordFC',
    hex: '#e30613', hex2: '#0f1a3c', gradient: 'linear-gradient(135deg, #e30613 0%, #8f0009 55%, #0f1a3c 130%)', maker: 'Joma',
    kitLabel: 'AWAY KIT', kitColor: '#b8860b', fixture: 'Leeds United vs Brentford', when: 'Sunday, August 30 &middot; 10:00 a.m. ET',
    why: "The white in Brentford's red and white stripes sits too close to Leeds' all-white home shirt, so Brentford are likely to go to the navy away at Elland Road.",
    wardrobe: 'B+',
    lead: "Brentford's second season with Joma produces the most unusual away shirt in the Premier League, and it is unusual for a reason nobody saw coming: it is about tailoring.",
    kits: [
      ['The Home Shirt', "The red and white stripes, worn with black shorts and black socks. Brentford's home shirt is one of the league's genuine classics and there is very little to say about it beyond that it has been left alone, which is the correct decision. Bold, legible, instantly identifiable at any distance, and the black shorts and socks are what stop it reading as a Sunderland or Southampton shirt on television.", 'B+'],
      ['The Away Shirt', "A deep navy base with cream vertical pinstripes, a thick cream crew-neck collar and cuffs, and colour-matched Joma branding, crest and sponsor, all built around Savile Row tailoring and the Kingsman films. This is a football shirt designed to look like a suit and it pulls it off, which almost never happens. The cream against navy is warm rather than stark, the thick collar does the tailoring work, and matching the sponsor to the pinstripes rather than fighting them is the detail that holds the whole idea together. Out July 28.", 'A-'],
      ['The Third Shirt', "A vibrant yellow base with subtle tonal vertical pinstripes, a solid black crew-neck collar and cuffs, black branding throughout, and matching yellow shorts and socks, with the founding year '1889' printed in black below the collar on the upper back. Yellow and black is a clean, high-visibility combination and the tonal pinstripes tie it back to the away shirt's family. It is the least distinctive of the three and it does not need to be more than that. On sale August 7.", 'B'],
    ],
    faq: [
      ['What kit are Brentford wearing today?', 'Brentford travel to Leeds United on Sunday, August 30. The white in their red and white stripes sits close to Leeds’ all-white home shirt, so the navy away kit is the expected call. We update this page as each matchweek is confirmed.'],
      ['What is the Brentford away kit based on?', 'Savile Row tailoring and the Kingsman films. The navy base with cream pinstripes and a thick cream collar is designed to read like a bespoke suit.'],
      ['What colour shorts do Brentford wear at home?', 'Black, with black socks, worn with the red and white striped shirt.'],
      ['Who makes Brentford kits?', 'Joma.'],
    ],
    bottom: "Brentford left a classic home shirt alone, which was right, and then produced the most conceptually interesting away kit in the division. A navy and cream pinstripe shirt built on Savile Row tailoring should not work on a football pitch and it does, largely because Joma matched the sponsor into the pinstripes instead of stamping it over them. The yellow third is competent filler behind two shirts that both know exactly what they are.",
  },
  {
    slug: 'bournemouth-kits-2026-27', name: 'AFC Bournemouth', short: 'Bournemouth', handle: 'afcbournemouth',
    hex: '#DA291C', hex2: '#000000', gradient: 'linear-gradient(135deg, #DA291C 0%, #7a1710 55%, #000000 130%)', maker: 'hummel',
    kitLabel: 'HOME KIT', kitColor: '#1a7f37', fixture: 'Bournemouth vs Everton', when: 'Saturday, August 29 &middot; 11:00 a.m. ET',
    why: "Bournemouth's red and black stripes separate cleanly from Everton's royal blue, so both clubs wear home and nobody has to change.",
    wardrobe: 'B+',
    lead: "Bournemouth changed supplier for 2026/27, moving from Umbro to hummel, and the first set under the new deal is noticeably more considered than the last few. All three shirts have a reason to exist.",
    kits: [
      ['The Home Shirt', "The red and black stripes, widened for a more classic proportion, with gold detailing on the collar, cuffs and hummel's chevrons, and a tonal pattern inside the red stripes built from the original 1936 Bournemouth crest. Widening the stripes is the right call, because the narrow versions of recent seasons turned into a muddy blur on television, and gold is a genuinely smart accent against red and black. The 1936 crest hidden in the stripe is the kind of detail that costs nothing and rewards the people who care.", 'B+'],
      ['The Away Shirt', "A purple base with a bold retro geometric pattern of zig-zags and diagonal lines, drawn straight from early nineties shirt design, on sale from July 30. Purple has no particular Bournemouth history and the nineties revival is the most crowded trend in kit design right now, so this could easily have been generic. It survives because the pattern is committed rather than half-hearted; a timid version of this shirt would have been worse than a loud one.", 'B'],
      ['The Third Shirt', "An off-white base with navy applications and gold details, a navy polo collar, an embossed 'The Cherries' crest treatment and a subtle repeating cherry pattern, unveiled August 12. This is the best shirt in the wardrobe. Off-white with navy and gold is a restrained, expensive-looking combination that almost nobody in the league is using, the polo collar suits it, and building the graphic from the club's own nickname is a far better idea than another abstract print.", 'A-'],
    ],
    faq: [
      ['What kit are Bournemouth wearing today?', 'Bournemouth host Everton on Saturday, August 29, and the red and black striped home shirt is the expected kit. Everton’s royal blue contrasts cleanly, so neither club needs to change. We update this page as each matchweek is confirmed.'],
      ['Who makes Bournemouth kits in 2026/27?', 'hummel. The club moved from Umbro to hummel for the 2026/27 season.'],
      ['What is the pattern in the Bournemouth home shirt stripes?', 'A tonal graphic built from the original 1936 Bournemouth crest, set inside the red stripes.'],
      ['What is the Bournemouth third kit?', 'An off-white shirt with navy and gold detailing, a navy polo collar, an embossed "The Cherries" crest treatment and a repeating cherry pattern.'],
    ],
    bottom: "The move to hummel has been good for Bournemouth. The home stripes are wider and read properly on television again, the gold accent is a smart addition to red and black, and the off-white third with navy, gold and a cherry motif is quietly one of the better third kits in the division. The purple nineties away is the weakest of the three but it commits, and committing is what saves that kind of shirt.",
  },
  {
    slug: 'ipswich-town-kits-2026-27', name: 'Ipswich Town', short: 'Ipswich Town', handle: 'IpswichTown',
    hex: '#0044a9', hex2: '#7a1230', gradient: 'linear-gradient(135deg, #0044a9 0%, #002d6e 55%, #7a1230 130%)', maker: 'Umbro',
    kitLabel: 'HOME KIT', kitColor: '#1a7f37', fixture: 'Manchester United vs Ipswich Town', when: 'Sunday, August 30 &middot; 12:30 p.m. ET',
    why: "Ipswich blue against Manchester United red is a clean contrast, so Ipswich can wear the home shirt at Old Trafford without a change.",
    wardrobe: 'B+',
    lead: "Ipswich are straight back up after one season down, and Umbro have marked it with a home shirt about Portman Road itself and an away shirt that goes back to the late nineties.",
    kits: [
      ['The Home Shirt', "Blue with a tonal embossed graphic across the front, sleeves and back, based on the structure between the floodlights on the Sir Bobby Robson and Sir Alf Ramsey Stands, and inspired by evening matches under those lights. A navy crew-neck collar with white detailing at the rear is matched by navy cuffs finished with a narrow white stripe. Ipswich blue is a plain canvas and Umbro have resisted the urge to complicate it, putting the whole idea into an emboss you cannot see from the stands. Taking the pattern from the specific ironwork between two stands named after two managers is a better piece of thinking than most home shirts get.", 'B+'],
      ['The Away Shirt', "A modern reinterpretation of the 1996-98 away shirt: a cream yellow base with black and red horizontal pinstripes, black collar and cuffs with red detailing, and black shorts and socks. Horizontal pinstripes in three colours should be a mess and this is not, because the cream base is warm enough to hold the black and red without the shirt turning into a test pattern. It is the boldest thing Ipswich have worn in years and the period reference earns it.", 'A-'],
      ['The Third Shirt', "Light blue with claret detailing on the round collar, sleeve cuffs and shoulder stripes. Light blue and claret is a pleasant combination and there is nothing wrong with the shirt, but it arrives with no stated idea behind it, which stands out badly in a wardrobe where the home shirt is about floodlight ironwork and the away is about 1996. Perfectly good, entirely anonymous.", 'B-'],
    ],
    faq: [
      ['What kit are Ipswich Town wearing today?', 'Ipswich travel to Manchester United on Sunday, August 30, and the blue home shirt is the expected kit. Blue against United red contrasts cleanly, so neither club needs to change. We update this page as each matchweek is confirmed.'],
      ['What is the pattern on the Ipswich Town home shirt?', 'A tonal emboss based on the structure between the floodlights on the Sir Bobby Robson and Sir Alf Ramsey Stands at Portman Road, inspired by evening matches under the lights.'],
      ['What is the Ipswich Town away kit based on?', 'The 1996-98 away shirt. It uses a cream yellow base with black and red horizontal pinstripes, worn with black shorts and socks.'],
      ['Who makes Ipswich Town kits?', 'Umbro.'],
    ],
    bottom: "Ipswich have come back up with a wardrobe that knows where it is from. The home shirt hides its idea in an emboss taken from the ironwork between the Robson and Ramsey stands, and the cream yellow away with black and red horizontal pinstripes is the boldest and best thing here. The light blue and claret third is the one shirt with nothing to say, which is a shame in a set this thoughtful.",
  },
  {
    slug: 'hull-city-kits-2026-27', name: 'Hull City', short: 'Hull City', handle: 'HullCity',
    hex: '#F5A12D', hex2: '#000000', gradient: 'linear-gradient(135deg, #F5A12D 0%, #a86a12 55%, #000000 130%)', maker: 'Oxen Sports',
    kitLabel: 'HOME KIT', kitColor: '#1a7f37', fixture: 'Coventry City vs Hull City', when: 'Saturday, August 29 &middot; 11:00 a.m. ET',
    why: "Coventry's sky blue and Hull's amber and black are about as far apart as two kits get, so Hull can travel in the home stripes.",
    wardrobe: 'B+',
    lead: "Hull are back in the Premier League for the first time in a decade, with a new supplier in Oxen Sports and a home shirt that reaches all the way back to 1978.",
    kits: [
      ['The Home Shirt', "Amber and black vertical stripes across the front, sleeves and back, a white fold-over collar with a black v-neck insert, and white cuffs on the long-sleeve version. The reference is the 1978-79 home shirt, and it brings back the lettered HCAFC logo for the first time in forty-seven years. Amber and black is one of the few genuinely distinctive colour combinations in English football and this is the most confident version Hull have worn in years. The white fold-over collar is what lifts it out of being a plain striped shirt, and reviving the lettered badge rather than the modern tiger crest is a real choice.", 'A-'],
      ['The Away Shirt', "Predominantly white, revisiting a colour Hull used for away kits between 1988 and 1990, with black and amber panels across the shoulders, the club colours repeated at the crew-neck collar and cuffs, and the current crest positioned centrally on the chest as a nod to where it sat on those earlier shirts. The centred crest is the detail that makes it, because it is the kind of period reference most clubs would not bother with, and the shoulder panels give a white shirt some structure without turning it into a graphic.", 'B+'],
    ],
    faq: [
      ['What kit are Hull City wearing today?', 'Hull travel to Coventry City on Saturday, August 29, and the amber and black striped home shirt is the expected kit. Coventry’s sky blue contrasts cleanly, so neither club needs to change. We update this page as each matchweek is confirmed.'],
      ['What is the Hull City home kit based on?', 'The 1978-79 home shirt. It uses amber and black vertical stripes with a white fold-over collar, and brings back the lettered HCAFC logo for the first time in forty-seven years.'],
      ['Who makes Hull City kits in 2026/27?', 'Oxen Sports. The club moved from Kappa for their return to the Premier League.'],
      ['Has Hull City released a third kit for 2026/27?', 'Not as of late August 2026. Hull have launched the home and away shirts, and we will add the third here as soon as it is released.'],
    ],
    bottom: "Hull's return to the Premier League comes with the best home shirt they have had in a decade: amber and black stripes done confidently, a white fold-over collar doing the heavy lifting, and the lettered HCAFC badge back after forty-seven years. The white away is a smart, period-aware companion with the crest deliberately centred the way it sat in 1988. No third kit yet, so this is a two-shirt wardrobe for now.",
  },
];

let n = 0;
for (const c of CLUBS) {
  writeFileSync(`content/posts/${c.slug}.md`, page(c));
  console.log(`  wrote ${c.slug}  (wardrobe ${c.wardrobe}, ${c.kits.length} shirts)`);
  n++;
}
console.log(`\n${n} club pages written.`);
