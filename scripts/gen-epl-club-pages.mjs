#!/usr/bin/env node
// Builds the non-big-six Premier League club kit pages in the "what kit are they
// wearing today" format, which out-earns the old review format ~277x.
//
// These pages deliberately carry NO letter grade. We have the official design
// descriptions but have not seen the shirts properly, and a grade off a press
// release is not a grade. Jake's grades drop in later the same way the college
// ones do.
//
// Usage: node scripts/gen-epl-club-pages.mjs
import { writeFileSync } from 'node:fs';

// The hub link leads the pill row on every club page; the big six follow.
const SIX = [
  ['arsenal-kits-2026-27', 'Arsenal'],
  ['chelsea-kits-2026-27', 'Chelsea'],
  ['liverpool-kits-2026-27', 'Liverpool'],
  ['manchester-city-kits-2026-27', 'Manchester City'],
  ['manchester-united-kits-2026-27', 'Manchester United'],
  ['tottenham-kits-2026-27', 'Tottenham'],
];

const pills = () =>
  '<a href="/stories/premier-league-kit-schedule-2026-27" style="display: inline-block; padding: 5px 12px; margin: 0 6px 6px 0; background: #3D195B; border: 1px solid #3D195B; border-radius: 999px; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none;">Full matchweek kit schedule</a>' +
  SIX.map(([s, n]) =>
    `<a href="/stories/${s}" style="display: inline-block; padding: 5px 12px; margin: 0 6px 6px 0; background: #ffffff; border: 1px solid #e3e6ec; border-radius: 999px; color: #2f6bed; font-size: 13px; font-weight: 700; text-decoration: none;">${n}</a>`
  ).join('');

const matchday = (c) =>
  `<div data-epl-matchday style="margin: 1.75em 0; border: 2px solid ${c.hex}; border-radius: 16px; overflow: hidden;"><div style="background: ${c.hex}; padding: 9px 16px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;"><span style="font-size: 0.7em; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #ffffff;">What ${c.short} Are Wearing</span><span style="font-size: 0.7em; font-weight: 700; color: rgba(255,255,255,0.9);">Matchweek 1</span></div><div style="padding: 1.5em; text-align: center; background: #ffffff;"><div style="font-size: 2.4em; font-weight: 900; color: ${c.kitColor}; line-height: 1;">${c.kitLabel}</div><div style="font-size: 0.8em; color: #777; margin-top: 5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${c.status}</div><div style="margin-top: 14px; font-size: 1em; color: #1c1c1c; font-weight: 600;">${c.fixture}</div><div style="margin-top: 4px; font-size: 0.9em; color: #555;">${c.when}</div><div style="margin-top: 10px; font-size: 0.95em; color: #444; line-height: 1.55;">${c.why}</div><a href="https://x.com/${c.handle}" style="display: inline-block; margin-top: 16px; padding: 10px 22px; background: ${c.hex}; color: #ffffff; border-radius: 999px; font-weight: 800; font-size: 0.85em; text-decoration: none;">Confirm on @${c.handle} &rarr;</a><div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid #eef0f4;"><p style="font-size: 0.7em; font-weight: 800; letter-spacing: 1.6px; text-transform: uppercase; color: #8892a0; margin: 0 0 8px;">What the rest of the league is wearing</p>${pills()}</div></div></div>`;

const CLUBS = [
  {
    slug: 'newcastle-kits-2026-27',
    name: 'Newcastle United',
    short: 'Newcastle',
    handle: 'NUFC',
    hex: '#241F20',
    gradient: 'linear-gradient(135deg, #241F20 0%, #0d0b0b 55%, #41B6E6 130%)',
    maker: 'adidas',
    kitLabel: 'HOME KIT',
    kitColor: '#1a7f37',
    status: 'Expected &middot; clubs confirm on matchday',
    fixture: 'Newcastle United vs Liverpool',
    when: 'Sunday, August 23 &middot; 11:30 a.m. ET',
    why: "Black-and-white stripes against Liverpool's all-red is one of the cleanest contrasts in the league, so both clubs wear home and nobody has to think about it.",
    lead: "Newcastle have one of the two or three most recognisable home uniforms in world football, which means every season is a question of how much adidas is allowed to touch it. The answer in 2026/27 is: more than usual, and it works.",
    kits: [
      ['The Home Shirt', "The stripes are still stripes, but adidas has broken them up with a disrupted pattern rather than running them straight down the shirt. The detail that changes the character is blue, which turns up around the crew collar and in the three stripes on the sleeve. Newcastle's home shirt is usually black, white and nothing else, so a third colour is a real decision."],
      ['The Away Shirt', "A Night Navy base with white and Vista Blue detailing, and the two things that make it are historical. adidas has used the Trefoil logo instead of the modern performance mark, and the crest is the 1976 to 1983 NUFC badge rather than the current one. The all-over graphic is a brickwork pattern taken from St James' Park itself. Released July 24, 2026."],
      ['The Third Shirt', "Fresh Lilac, which is a pastel purple, with deeper purple on the V-neck collar, the cuffs and the three stripes, and a monochrome crest. It went on sale August 13. This is the shirt in the wardrobe with no Newcastle precedent behind it at all, which is exactly what a third kit is for."],
    ],
    faq: [
      ['What kit are Newcastle wearing today?', "Newcastle open at home to Liverpool on Sunday, August 23, and the home black-and-white stripes are the expected shirt. Liverpool's red contrasts cleanly, so neither club needs to change. We update this page as each matchweek is confirmed."],
      ['What do Newcastle’s 2026/27 kits look like?', 'Home is the black-and-white stripes with a disrupted pattern and blue collar and sleeve detailing. Away is Night Navy with a St James’ Park brickwork graphic, the adidas Trefoil and the 1976-83 crest. Third is Fresh Lilac, a pastel purple with deep purple trim.'],
      ['Who makes Newcastle’s kits?', 'adidas.'],
      ['Why is there blue on the Newcastle home shirt?', 'It is a deliberate accent adidas added at the crew collar and in the three stripes. Newcastle home shirts are normally black and white only, so the blue is the clearest change from last season.'],
    ],
    bottom: "Newcastle's 2026/27 wardrobe is the rare case of a club with an untouchable home shirt letting its supplier take a real swing anyway. The stripes survive, the blue accent earns its place, and the away shirt's Trefoil-and-1976-crest combination is the most tasteful archive work any Premier League club did this summer. Matchweek 1 is the simplest fixture on the card: home stripes against Liverpool red.",
  },
  {
    slug: 'aston-villa-kits-2026-27',
    name: 'Aston Villa',
    short: 'Villa',
    handle: 'AVFCOfficial',
    hex: '#670E36',
    gradient: 'linear-gradient(135deg, #670E36 0%, #3a0620 55%, #95BFE5 130%)',
    maker: 'adidas',
    kitLabel: 'CHANGE KIT',
    kitColor: '#b8641a',
    status: 'Expected &middot; clubs confirm on matchday',
    fixture: 'Brighton and Hove Albion vs Aston Villa',
    when: 'Sunday, August 23 &middot; 9:00 a.m. ET',
    why: "Brighton play in blue and white stripes and Villa's home shirt carries blue sleeves and blue trim. That is usually enough to tip this fixture into a change, most likely the black away shirt.",
    lead: "Claret and blue is one of the most protected colour combinations in English football, so the interesting thing about Villa's 2026/27 home shirt is what adidas left out.",
    kits: [
      ['The Home Shirt', "Claret and blue, but without the claret sleeves, and finished with a polo collar. Villa have spent the modern era in raglan-sleeved home shirts, and this one reaches back to the less conventional claret and blue designs the club wore in the 1960s instead. It is the cleanest Villa home shirt in years, and the polo collar is doing most of the work."],
      ['The Away Shirt', "All black, with yellow logos and a claret, sky blue and yellow tricolour running through the detailing, plus a standalone lion crest rather than the full badge. The graphic is a gas lamp motif, drawn from the lamps around Villa Park. A black away shirt is the safest thing a club can make, and the gas lamps are what stop this one being anonymous."],
      ['The Third Shirt', "An icy light blue base with claret and yellow, carrying an all-over graphic built from tiny dots that resolve into swirls. The reference is Villa Park again: the brickwork and the ornate gates, and the mosaic at the Holte End. Three shirts, three separate references to the same stadium, which is more coherent than most wardrobes manage."],
    ],
    faq: [
      ['What kit are Aston Villa wearing today?', 'Villa travel to Brighton on Sunday, August 23. Brighton wear blue and white stripes at home and Villa’s home shirt carries blue, so a change kit is expected, most likely the black away shirt. We update this page as each matchweek is confirmed.'],
      ['What do Aston Villa’s 2026/27 kits look like?', 'Home is claret and blue with a polo collar and no claret sleeves, referencing the 1960s. Away is black with a Villa Park gas lamp motif and a standalone lion crest. Third is icy blue with claret and yellow and a dotted swirl graphic taken from Villa Park’s brickwork and gates.'],
      ['Who makes Aston Villa’s kits?', 'adidas.'],
      ['Why does the Aston Villa home shirt not have claret sleeves?', 'It is a deliberate throwback. Villa wore several claret and blue configurations in the 1960s before the raglan claret sleeve became standard, and the 2026/27 home shirt goes back to one of those.'],
    ],
    bottom: "All three Villa shirts point at Villa Park, which is the most disciplined idea any Premier League club built a wardrobe around this season. The home shirt is the pick, mostly for the polo collar and the nerve to drop the claret sleeves. Matchweek 1 sends them to Brighton, where the blue on both shirts should force Villa into the black.",
  },
  {
    slug: 'everton-kits-2026-27',
    name: 'Everton',
    short: 'Everton',
    handle: 'Everton',
    hex: '#003399',
    gradient: 'linear-gradient(135deg, #003399 0%, #001b52 55%, #F5C518 130%)',
    maker: 'Castore',
    kitLabel: 'HOME KIT',
    kitColor: '#1a7f37',
    status: 'Expected &middot; clubs confirm on matchday',
    fixture: 'Everton vs Crystal Palace',
    when: 'Saturday, August 22 &middot; 10:00 a.m. ET',
    why: "Crystal Palace's home shirt is red and blue stripes, and half of it is the same colour as Everton's entire home kit. Palace change, Everton stay in royal blue.",
    lead: "Everton have leaned into Liverpool's dockside for this wardrobe rather than into their own trophy cabinet, and it gives all three shirts something to say.",
    kits: [
      ['The Home Shirt', "Royal blue with white logos and yellow on the collar and cuffs, finished with white shorts and blue socks. The reference is maritime signal flags, the ones flown along the city's historic docks, which is a more specific idea than most home shirts bother with. The yellow is the piece worth watching. Everton home kits usually sit in blue and white alone."],
      ['The Away Shirt', "The best shirt in the wardrobe. A crisp white base with fine navy vertical pinstripes, a navy V-neck and thick navy cuffs, each trimmed in a thin yellow line. It revives a rare 1950s Everton design worn by Dave Hickson, the centre-forward known as the Cannonball Kid. Pinstripes on a white away shirt is a hard thing to get right and this one is right. Out July 17, 2026."],
      ['The Third Shirt', "Teal green with a dark green crew collar and cuffs, both edged in a thin gold trim, with gold Castore branding and a gold crest. Teal has no Everton history behind it, which is fine for a third shirt, and the gold keeps it from reading as a training top."],
    ],
    faq: [
      ['What kit are Everton wearing today?', 'Everton host Crystal Palace on Saturday, August 22, and the royal blue home shirt is expected. Palace’s red and blue stripes clash with Everton’s blue, so Palace are the club that changes. We update this page as each matchweek is confirmed.'],
      ['What do Everton’s 2026/27 kits look like?', 'Home is royal blue with yellow collar and cuff detailing, inspired by maritime signal flags on the Liverpool docks. Away is white with navy pinstripes and yellow trim, based on a 1950s shirt worn by Dave Hickson. Third is teal green with gold trim.'],
      ['Who makes Everton’s kits?', 'Castore.'],
      ['What is the Everton away shirt based on?', 'A rare 1950s Everton design worn by Dave Hickson, the striker nicknamed the Cannonball Kid. The navy pinstriping and yellow trim come from that shirt.'],
    ],
    bottom: "Everton's away shirt is the one to own this season, and it is not close. The Hickson pinstripes are the kind of archive reference that works even if you have never heard of the player. Home stays royal blue with a new yellow accent, third goes teal, and Matchweek 1 is straightforward: Palace change at Goodison, Everton do not.",
  },
  {
    slug: 'leeds-united-kits-2026-27',
    name: 'Leeds United',
    short: 'Leeds',
    handle: 'LUFC',
    hex: '#1D428A',
    gradient: 'linear-gradient(135deg, #1D428A 0%, #0f2450 55%, #FFCD00 130%)',
    maker: 'adidas',
    kitLabel: 'HOME KIT',
    kitColor: '#1a7f37',
    status: 'Expected &middot; clubs confirm on matchday',
    fixture: 'Nottingham Forest vs Leeds United',
    when: 'Saturday, August 22 &middot; 10:00 a.m. ET',
    why: "Forest wear red at the City Ground and Leeds play in all white, which is about as clean a contrast as the league produces. Both clubs wear home.",
    lead: "Leeds built an entire wardrobe around the city rather than the club this season, tied to the 400th anniversary of the Leeds Royal Charter, and it produced two genuine firsts in the club's history.",
    kits: [
      ['The Home Shirt', "All white, as it must be, but with horizontal pinstripes, which Leeds have never worn before. The 2005/06 Admiral shirt had vertical pinstripes and gets cited constantly, so running them the other way is a real choice rather than a reissue. Unveiled July 28, 2026, and built around the 400th anniversary of the city's Royal Charter."],
      ['The Away Shirt', "The Yorkshire rose shirt, and the second club first: it carries the classic adidas Trefoil, which Leeds have never worn. An all-over rose pattern, and an old Leeds crest with a large Yorkshire rose on it instead of the current badge. Released early, on June 4, 2026, and it is the shirt that got the most attention of the three."],
      ['The Third Shirt', "Dark grey and black with a tonal geometric graphic referencing the city's urban architecture and landmarks. On sale from Friday, August 21, 2026, which makes it the newest shirt in the Premier League as this season opens. Grey thirds are common. Grey thirds with a real local reference are not."],
    ],
    faq: [
      ['What kit are Leeds wearing today?', 'Leeds travel to Nottingham Forest on Saturday, August 22, and the white home shirt is expected. Forest’s red contrasts cleanly with white, so neither club needs to change. We update this page as each matchweek is confirmed.'],
      ['What do Leeds United’s 2026/27 kits look like?', 'Home is all white with horizontal pinstripes, a first for the club, marking the city’s 400th anniversary. Away carries an all-over Yorkshire rose pattern, an old crest and the adidas Trefoil. Third is dark grey and black with a geometric graphic drawn from Leeds architecture.'],
      ['Who makes Leeds United’s kits?', 'adidas.'],
      ['Why does the Leeds away shirt have the adidas Trefoil on it?', 'It is the first time in Leeds United’s history that the club has worn the Trefoil rather than the modern adidas performance logo. It pairs with the retro crest and the Yorkshire rose pattern.'],
      ['When did the Leeds 2026/27 third kit come out?', 'Friday, August 21, 2026, through the club’s official retail channels and online store.'],
    ],
    bottom: "Two firsts in one wardrobe is more than most clubs manage in a decade: horizontal pinstripes on the home shirt and the adidas Trefoil on the away. Tying all three to the city's 400th anniversary rather than to a past Leeds team is the smarter version of a heritage season. Matchweek 1 at Forest is a straight white-against-red fixture with no change needed.",
  },
  {
    slug: 'coventry-city-kits-2026-27',
    name: 'Coventry City',
    short: 'Coventry',
    handle: 'Coventry_City',
    hex: '#4a9bd4',
    gradient: 'linear-gradient(135deg, #4a9bd4 0%, #12284B 55%, #78D2F5 130%)',
    maker: 'hummel',
    kitLabel: 'HOME KIT',
    kitColor: '#1a7f37',
    status: 'Expected &middot; final: Arsenal 3, Coventry 0',
    fixture: 'Arsenal vs Coventry City',
    when: 'Friday, August 21 &middot; 3:00 p.m. ET',
    why: "Sky blue against Arsenal red is a clean contrast, so Coventry had no reason to change for their first Premier League fixture since 2001.",
    lead: "Coventry are back in the Premier League after twenty-five years, and hummel handed them a home shirt that goes straight to the most famous day in the club's history.",
    kits: [
      ['The Home Shirt', "Coventry's first Premier League home kit in twenty-five years, and it takes its cue from the 1987 FA Cup-winning side. A deeper sky blue base than recent seasons, white vertical stripes, and fine navy pinstripes running between the panels as the specific 1987 reference. A promoted club's first top-flight shirt in a generation is a moment, and reaching for 1987 is the correct instinct."],
      ['The Away Shirt', "An off-white base with navy and Hot Coral detailing. Coral is an unusual accent on an English away shirt and it is what keeps this from being a generic cream change kit."],
      ['The Third Shirt', "Purple, with a dotted graphic extending across the front and shoulders, dark purple elements and orange detailing through the lower section of the pattern. It completes the matchday wardrobe and it is the loudest of the three by a distance."],
    ],
    faq: [
      ['What kit are Coventry wearing today?', 'Coventry opened the season at Arsenal on Friday, August 21 in the sky blue home shirt. Arsenal’s red contrasts cleanly, so no change was required. Arsenal won 3-0. We update this page as each matchweek is confirmed.'],
      ['What do Coventry City’s 2026/27 kits look like?', 'Home is a deeper sky blue with white vertical stripes and fine navy pinstripes, referencing the 1987 FA Cup-winning shirt. Away is off-white with navy and Hot Coral. Third is purple with a dotted graphic and orange detailing.'],
      ['Who makes Coventry City’s kits?', 'hummel, who extended their kit deal with the club ahead of the Premier League season.'],
      ['How long have Coventry been out of the Premier League?', 'Twenty-five years. Coventry were relegated in 2001 and won the Championship last season under Frank Lampard to come back up.'],
      ['What is the Coventry home shirt based on?', 'The 1987 FA Cup-winning shirt. The navy pinstripes between the white stripes are the specific reference.'],
    ],
    bottom: "Coventry's return to the Premier League comes with the right shirt: a deeper sky blue, white stripes, and 1987 pinstripes that mean something to anyone who was there. The away shirt's coral accent is the surprise of the three, and the purple third is the swing. Matchweek 1 sent them to the Emirates in home sky blue, and Arsenal won 3-0.",
  },
];

for (const c of CLUBS) {
  const body = [
    '---',
    `title: "What Kit Are ${c.short} Wearing Today? Every 2026/27 ${c.name} Kit Explained"`,
    'author: "colorway-sports-staff"',
    'category: "Soccer"',
    'date: "2026-08-21"',
    'updatedDate: "2026-08-21"',
    `excerpt: "What kit are ${c.short} wearing today? The expected shirt for their next match, plus every ${c.name} jersey in the 2026/27 uniform wardrobe."`,
    `gradient: "${c.gradient}"`,
    'cardStyle: words',
    'kicker: Kits',
    'league: "soccer"',
    'teams: []',
    'resurfaceOnUpdate: true',
    '---',
    '',
    matchday(c),
    '',
    c.lead,
    '',
    ...c.kits.flatMap(([h, p]) => [`## ${h}`, '', p, '']),
    `## Who Makes ${c.name}'s Kits`,
    '',
    `${c.maker}. Every shirt above is part of the ${c.maker} ${c.name} 2026/27 range.`,
    '',
    '## Frequently Asked Questions',
    '',
    ...c.faq.flatMap(([q, a]) => [`**${q}**`, '', a, '']),
    '## The Bottom Line',
    '',
    c.bottom,
    '',
  ].join('\n');

  writeFileSync(`content/posts/${c.slug}.md`, body);
  console.log(`wrote content/posts/${c.slug}.md`);
}
