// Adds past-tense and future-tense FAQ pairs to the MLB uniform-schedule posts.
//
// Why: GSC shows these /stories/<team>-uniform-schedule-2026 posts ranking #2 for
// BOTH "what are the <team> wearing today" and "what did the <team> wear last
// night", behind uniformlineup.com. But the words "last night", "yesterday" and
// "tomorrow" appeared in ZERO of the 41 schedule posts as of 2026-08-06 — we were
// ranking on topical relevance alone with none of the actual query phrasing on the
// page. The 2026-07-31 dual-tense work went onto /mlb-tracker/<team>, which is not
// the page type Google surfaces for these queries.
//
// ACCURACY RULE (carried over from the tracker work): never assert what a team
// actually wore. The tracker is logged the morning after, so these answers explain
// how to derive the look from the rotation and point at the tracker page for the
// specific logged game. That also feeds internal links to the tracker pages.
import fs from 'node:fs';
import path from 'node:path';

const POSTS = 'content/posts';

// Per team: display name used in questions, tracker slug, and the three answers.
// Answers are written from each post's own documented rotation, not templated.
const TEAMS = {
  angels: {
    name: 'Angels',
    lastNight: 'The Angels do not run a day-of-week script, so night games come down to probability rather than a rule: the red "Angels" jersey is comfortably their most-worn shirt and is the safest assumption for any evening game, home or away. The one exception is a Friday home night, which is the cream surf-themed City Connect.',
    tonight: 'Assume the red "Angels" alternate unless it is a Friday home game, which is the cream City Connect. On the road at night you will see either the red or the returning "Los Angeles" grays, and at home the white or the 1980s throwback white can also appear in unannounced bunches.',
    tomorrow: 'Check two things: whether the Angels are home or away, and whether it is a Friday. A Friday home game is the cream City Connect. Everything else is a coin flip weighted heavily toward the red jersey, with the whites and the 1980s throwback filling in at home and the "Los Angeles" grays on the road.',
  },
  astros: {
    name: 'Astros',
    lastNight: 'For a Monday home night at Daikin Park it was the white "Stros" City Connect, which is the one hard rule on the Houston calendar. A Friday night is usually the orange alternate, home or away, and a Sunday night is customarily the navy alternate. Any other home night is the home whites and any other road night is the gray "Houston" set.',
    tonight: 'Start with the day. Monday at home is the white "Stros" City Connect, Friday is the frequent orange-alternate night and it travels, and Sunday is the customary navy alternate. Outside those, the Astros wear the home whites at Daikin Park and the gray "Houston" set on the road.',
    tomorrow: 'Look at tomorrow\'s day of the week and whether Houston is home. A Monday home game is the City Connect, a Friday leans orange either way, and a Sunday leans navy. Any other date defaults to the home whites at home or the grays on the road.',
  },
  athletics: {
    name: 'Athletics',
    lastNight: 'A Friday home night was the kelly green alternate and a Saturday home night was the gold "Sacramento" alternate, which are the A\'s two reliable anchors. Any other home night was the home whites and any road night was the gray "Athletics" set, though the gold top can surface off-schedule when players pick it.',
    tonight: 'Friday at home is the kelly green, Saturday at home is the gold "Sacramento" alternate. Outside those two nights the A\'s default to home whites or road grays, with the gold jersey free to appear on other dates at the players\' choice.',
    tomorrow: 'Check whether tomorrow is a Friday or Saturday home game first: those are kelly green and gold "Sacramento" respectively. Anything else is home whites in Sacramento or the gray "Athletics" set on the road.',
  },
  'blue-jays': {
    name: 'Blue Jays',
    lastNight: 'Any home night game is the "Night Mode" City Connect, which is Toronto\'s one firm night rule. On the road at night, the Blue Jays lean hard on blue, so the royal-blue or powder-blue alternate is the most likely answer, with the grays appearing less often than for most clubs.',
    tonight: 'A home night game is the "Night Mode" City Connect, full stop. On the road expect some shade of blue, either the royal-blue or the powder-blue alternate. The only other locked date on the Toronto calendar is the red kit for the July 1 Canada Day home game.',
    tomorrow: 'If it is a home night game tomorrow, it is "Night Mode." If it is July 1 at home, it is the red Canada Day kit. Otherwise Toronto does not run a day-of-week script, so expect blue of some kind, with the home whites and road grays filling in around it.',
  },
  braves: {
    name: 'Braves',
    lastNight: 'A Friday home night was the powder blue City Connect, which is locked to that slot. Tuesday and Wednesday nights are where the red and navy alternates usually get pulled. Any other home night was the home whites, and every road game stays in the gray Atlanta set regardless of the hour.',
    tonight: 'Friday night at Truist Park is the powder blue City Connect. A Tuesday or Wednesday night is the most likely spot for the red or navy alternate. Any other home night is the home whites, and on the road it is the gray Atlanta set every time.',
    tomorrow: 'The Braves run one of the closest things to a scheduled rotation in baseball, so tomorrow\'s day tells you most of it. Friday night at home is the powder blue City Connect, select weeknights are the red or navy alternates, other home games are the whites, and all road games are the grays.',
  },
  brewers: {
    name: 'Brewers',
    lastNight: 'A Friday home night was the "Wisco" City Connect and a Sunday was the navy ball-in-glove alternate, home or away. Those are Milwaukee\'s two soft anchors. Any other road night was the powder blue set, since the gray road uniforms are retired, and any other home night was the cream or the white pinstripe.',
    tonight: 'Friday at home is the "Wisco" City Connect and Sunday is the navy ball-in-glove alternate either way. Otherwise the Brewers wear powder blue on the road, because the grays are gone, and trade off between the cream and the white pinstripe at home with no fixed rule.',
    tomorrow: 'Check for a Friday home game, which means the City Connect, or a Sunday, which means the navy ball-in-glove. Beyond those, the Brewers run on feel: powder blue on the road and cream or pinstripes at American Family Field.',
  },
  cardinals: {
    name: 'Cardinals',
    lastNight: 'The Cardinals run a strict day-of-week system, so the answer is exact. A Friday home night was "The Lou" red City Connect, a Saturday home night was the cream alternate, and any other home night was the home white. On the road, Saturday was the powder-blue "Victory Blue" alternate and every other night was the road gray.',
    tonight: 'Because St. Louis keeps a strict system, you can call it before the lineup card is posted. At home: Friday is the red City Connect, Saturday is the cream, everything else is the home white. On the road: Saturday is the powder-blue "Victory Blue," everything else is the road gray.',
    tomorrow: 'The Cardinals are one of the easiest teams in baseball to predict a day out. Home Friday is the red City Connect, home Saturday is the cream, other home games are the white. Away Saturday is the powder blue, other away games are the gray.',
  },
  cubs: {
    name: 'Cubs',
    lastNight: 'A summer Friday home night at Wrigley was the powder-blue "Blues" alternate, which is the Cubs\' only fixed slot. Any other home night was the white pinstripes and any road night was the grays, with the royal-blue alternate dropped in at the manager\'s discretion rather than on a schedule.',
    tonight: 'If it is a Friday at Wrigley during the summer months, it is the powder-blue "Blues." Outside that one hook the Cubs keep a loose closet: pinstripes at home, grays on the road, and the royal-blue alternate whenever the manager wants it.',
    tomorrow: 'The only date you can call with confidence is a summer Friday at Wrigley, which is the powder-blue alternate. Otherwise check whether the Cubs are home or away and assume the white pinstripes or the road grays.',
  },
  diamondbacks: {
    name: 'Diamondbacks',
    lastNight: 'A Friday home night at Chase Field was the purple-and-teal "Serpientes" City Connect, Arizona\'s one fixed slot. Any other home night was most likely the off-whites and any road night the grays, with the Sedona red and black alternates appearing at the team\'s choice, often on a Saturday or a giveaway night.',
    tonight: 'Friday at Chase Field is the "Serpientes" City Connect. Beyond that there is no day-of-week script, so expect the off-whites at home and the road grays on the trip, with the Sedona red or black alternate a game-time call.',
    tomorrow: 'Look for a Friday home game, which locks in the purple-and-teal City Connect. Any other date comes down to home or away, meaning the off-whites or the grays, with the red and black alternates as manager\'s choice.',
  },
  dodgers: {
    name: 'Dodgers',
    lastNight: 'A Saturday home night at Dodger Stadium was the cream City of Dreamers City Connect, which is locked to that slot. Any other home night was the home whites. Most road nights were the road grays, with the royal blue road alternate pulled only for select road series.',
    tonight: 'Saturday at Dodger Stadium is the cream City of Dreamers City Connect. Every other home game is the home whites. On the road it is the grays most nights, with the royal blue alternate reserved for select series.',
    tomorrow: 'Check whether the Dodgers are home and whether it is a Saturday. A Saturday at Chavez Ravine is the City Connect, any other home date is the whites, and the road is the grays apart from the occasional royal blue series.',
  },
  giants: {
    name: 'Giants',
    lastNight: 'The Giants lock three themed days at Oracle Park, so the day is decisive. A Tuesday home night was the music City Connect, a Friday was the Orange Friday alternate, and a Saturday was the Gigantes alternate. Any other home night was the cream home jersey, and every road night was the road gray, because the themed days do not travel.',
    tonight: 'At Oracle Park: Tuesday is the music City Connect, Friday is Orange Friday, Saturday is Gigantes. Any other home date is the cream home jersey, which functions as San Francisco\'s home white. On the road it is the gray every time.',
    tomorrow: 'The three Tuesday, Friday and Saturday hooks at home will usually give you tomorrow\'s look. Outside them it is the cream at home and the gray on the road, since none of the themed uniforms travel.',
  },
  guardians: {
    name: 'Guardians',
    lastNight: 'A Friday home night at Progressive Field was the navy "CLE" City Connect, Cleveland\'s one soft anchor. Any other home night was most likely the home whites and any road night the grays, with the red and navy alternates as manager\'s choice, red usually at home and navy usually on the road.',
    tonight: 'Friday at Progressive Field is the navy "CLE" City Connect. Beyond that Cleveland keeps a loose closet, so expect the home whites or the road grays, with red at home and navy on the road when an alternate gets pulled.',
    tomorrow: 'A Friday home game means the City Connect. Any other date comes down to home or away, meaning the whites or the grays, with the red and navy alternates a game-time decision.',
  },
  mariners: {
    name: 'Mariners',
    lastNight: 'Seattle stacks its anchors on the weekend at home: Friday night was the rush-blue City Connect, Saturday was the Northwest green alternate, and Sunday was the black-and-cream Steelheads throwback. Any other home night was the home whites. On the road the default is the navy "Seattle" jersey, with the Northwest green free to travel when the home team wears navy or black.',
    tonight: 'At T-Mobile Park: Friday is the rush-blue City Connect, Saturday is the Northwest green, Sunday is the Steelheads throwback, and the home whites cover the rest of the homestand. On the road expect the navy "Seattle" jersey, or the green if the home team is in navy or black.',
    tomorrow: 'The weekend anchors do most of the work: Friday City Connect, Saturday Northwest green, Sunday Steelheads. Weekday home games are the whites. On the road it is navy, since the Mariners no longer wear gray road uniforms.',
  },
  marlins: {
    name: 'Marlins',
    lastNight: 'A Friday home night at loanDepot Park was the Retro Wave City Connect and a Sunday was the teal throwback. Saturday home games are the home white. A Monday through Thursday home night was either the home white or the black alternate depending on the series and the promotional night, and every road game was the away grays.',
    tonight: 'Friday at home is the Retro Wave City Connect, Saturday is the home white, and Sunday is the teal throwback. Monday through Thursday at home is the home white or the black alternate depending on the promotion. On the road it is the away grays.',
    tomorrow: 'Miami\'s weekend is locked: Friday Retro Wave, Saturday home white, Sunday teal. Midweek home games come down to the series and the promotional schedule, and every road game is the grays.',
  },
  mets: {
    name: 'Mets',
    lastNight: 'A Friday home night at Citi Field was the black alternate and a Saturday was the gray "NYC" City Connect. Those are the Mets\' only two fixed days. Any other home night was most likely the white pinstripes and any road night the grays, with the blue alternate able to pop up on any date, usually on the road.',
    tonight: 'Friday at Citi Field is the black alternate, Saturday is the "NYC" City Connect. Everything else is manager\'s choice rather than a script, so expect the white pinstripes at home and the grays on the road, with the blue alternate a possibility either way.',
    tomorrow: 'If tomorrow is a Friday or Saturday home game, the anchor is reliable: black on Friday, City Connect on Saturday. Any other date is the pinstripes at home or the grays on the road, with the blue alternate turning up on no fixed schedule.',
  },
  nationals: {
    name: 'Nationals',
    lastNight: 'A Friday or Saturday home night was the denim-blue "District Blueprint" City Connect, which is the one fixed habit in Washington. Any other home night was most likely the script "Nationals" home white and any road night the "WASHINGTON" road gray, with the red curly W and navy alternates as manager\'s choice.',
    tonight: 'Friday and Saturday home games are the "District Blueprint" City Connect. Outside those, expect the script "Nationals" home white at Nationals Park or the "WASHINGTON" gray on the road, with the red or navy alternate a game-time call.',
    tomorrow: 'A Friday or Saturday home game means the City Connect. Any other date is the home white at home or the road gray on the trip, with the red curly W and navy alternates able to appear on any day.',
  },
  orioles: {
    name: 'Orioles',
    lastNight: 'A Friday home night at Camden Yards was the cream "BMORE" City Connect, which is Baltimore\'s one firm rule. Any other home night was the team\'s choice between the home whites, the orange alternate and the black alternate, and every road game was the gray "Baltimore" set.',
    tonight: 'Friday at Camden Yards is the cream "BMORE" City Connect. Any other home game is a game-time choice between the home whites, the orange alternate and the black alternate, with the whites the safest bet. On the road it is the gray "Baltimore" jerseys.',
    tomorrow: 'A Friday home game means the City Connect. Beyond that there is no day-by-day script, so the home whites are the safest call at home and the grays are automatic on the road, with the orange and black alternates a coin flip.',
  },
  padres: {
    name: 'Padres',
    lastNight: 'A Friday home night at Petco Park was the "Obsidian" City Connect. Sunday home games are the camouflage military jersey, though those are usually day games. Any other home night was most likely the home white pinstripe, with Saturday often flipping to the brown alternate, and road nights rotate between the brown "San Diego" set and the sand pinstripes.',
    tonight: 'Friday at Petco Park is the "Obsidian" City Connect and Sunday is the camo military jersey. Other home dates default to the white pinstripe, with Saturday often the brown alternate. On the road the Padres rotate between the brown "San Diego" set and the sand pinstripes with no fixed day.',
    tomorrow: 'Two home days are locked: Friday is the City Connect and Sunday is the camo. Other home dates are the white pinstripes or a team\'s-choice brown alternate, and the road is a rotation between brown and sand.',
  },
  phillies: {
    name: 'Phillies',
    lastNight: 'The Phillies run the strictest rotation in baseball, so a home night game is exact: red pinstripes, except Thursdays, which are always the powder blues, and Friday nights, which are always the City Connect. Every road game is the gray road uniform regardless of the day or the hour.',
    tonight: 'For a home night game it is the red pinstripes, unless it is a Thursday (powder blues) or a Friday night (City Connect). Home day games are the creams, again except Thursdays. On the road it is the gray road uniform every single game.',
    tomorrow: 'You can call it exactly. Work out three things: home or away, the day of the week, and day game or night game. Home nights are red pinstripes, home days are creams, Thursdays are always powder blues, Friday nights are the City Connect, and every road game is the grays.',
  },
  pirates: {
    name: 'Pirates',
    lastNight: 'A Friday home night at PNC Park was the all-black City Connect with the gold gothic "Pirates" lettering. Any other home night was most likely the home white pinstripes and any road night the gray "Pittsburgh" script set, with the black alternate a wild card that can turn up on any date.',
    tonight: 'Friday at PNC Park is the all-black City Connect. Any other home game is most likely the white pinstripes, and the road is the gray "Pittsburgh" script set. The black alternate has no fixed day and can appear either way.',
    tomorrow: 'Friday at home is your one reliable tell, and it means the City Connect. Otherwise check home or away and assume the white pinstripes or the gray script set.',
  },
  rangers: {
    name: 'Rangers',
    lastNight: 'A Friday home night at Globe Life Field was the red "Tejas" City Connect. Sunday home games are the powder blue, though those are usually day games. Any other home night was most likely the home whites and any road night the gray "TEXAS" set, with the royal-blue alternate showing up mostly on the road on no fixed day.',
    tonight: 'Friday at Globe Life Field is the red "Tejas" City Connect and Sunday is the powder blue. Any other home game is most likely the home whites, and the road default is the gray "TEXAS" set, with the royal blue as an occasional road jolt.',
    tomorrow: 'Two firm home habits do the work: Friday is the "Tejas" City Connect and Sunday is the powder blue. Everything else is home whites or road grays, with the royal-blue alternate unscheduled.',
  },
  rays: {
    name: 'Rays',
    lastNight: 'A Friday home night was most likely the 1998 Devil Rays "rainbow" throwback and a Saturday home night the black "Grit x Glow" City Connect. Those are Tampa Bay\'s only reliable tells. Outside them the home whites, the Columbia blue and the navy alternate all float, and the two blue tops also handle road games over gray pants.',
    tonight: 'Friday at home leans rainbow throwback, Saturday at home leans the black "Grit x Glow" City Connect. Any other night there is no system, so the home whites, Columbia blue and navy alternate are all live, with the blues also covering the road over gray pants.',
    tomorrow: 'Remember the two anchors: Friday rainbow and Saturday City Connect. Every other date is genuinely unpredictable, with the whites and the two blue tops all in play at home and the blues handling the road.',
  },
  'red-sox': {
    name: 'Red Sox',
    lastNight: 'Boston builds three hard anchors around Friday and Saturday. A Friday home night at Fenway was the Fenway Green City Connect, a Friday road night was the red alternate, and a Saturday home night was the yellow "Marathon" City Connect. Any other home night was the home whites and any other road night the gray "BOSTON" set.',
    tonight: 'Friday at Fenway is the Fenway Green City Connect. Friday on the road is the red alternate. Saturday at Fenway is the yellow "Marathon" City Connect. Every other home game is the home whites and the rest of the road trip is the gray "BOSTON" set.',
    tomorrow: 'Friday and Saturday are where the answer actually changes, so start there: Friday is green at home and red on the road, Saturday at home is the yellow Marathon kit. Any other date is the whites at Fenway or the grays on the trip.',
  },
  reds: {
    name: 'Reds',
    lastNight: 'A Friday home night at Great American Ball Park was the original black "C" City Connect and a Saturday home night the all-red City Connect 2.0. Any other home night was most likely the white pinstripes and any road night the gray "CINCINNATI" set, with the solid red alternate usually appearing at home, often on a Sunday.',
    tonight: 'Friday at home is the black "C" City Connect and Saturday is the all-red City Connect 2.0. Any other home game is most likely the white pinstripes, and the road is the gray "CINCINNATI" set. The solid red alternate has no fixed day and mostly shows up at home.',
    tomorrow: 'The two weekend hooks at home settle it: Friday is the black City Connect, Saturday is the red City Connect 2.0. Otherwise expect the white pinstripes at home or the grays on the road.',
  },
  rockies: {
    name: 'Rockies',
    lastNight: 'A Monday night was the purple alternate and a Friday home night at Coors Field the day-to-night City Connect. Those are Colorado\'s only two locks. Any other home night was most likely the white pinstripes and any road night the gray set, though the purple alternate can float onto other days.',
    tonight: 'Monday is the purple alternate and Friday at Coors Field is the day-to-night City Connect. Outside those two, expect the white pinstripes at home and the gray set on the road, with the purple free to appear on other dates.',
    tomorrow: 'Monday and Friday at home are your only locks, meaning purple and the City Connect respectively. Every other date comes down to home or away and the white pinstripes or the grays.',
  },
  royals: {
    name: 'Royals',
    lastNight: 'A Friday home night at Kauffman Stadium was the "Forever Fountains" City Connect and a Saturday home game the full powder blue set. Any other home night was most likely the white jersey and any road night the gray, with the royal blue alternate worn at the team\'s discretion.',
    tonight: 'Friday at Kauffman is the "Forever Fountains" City Connect and Saturday is the powder blue full set, which is also the Opening Day look. Any other home game defaults to the white and any road game to the gray, with the royal blue alternate a team decision.',
    tomorrow: 'If tomorrow is a Friday or Saturday home game you already know the look: City Connect or powder blue. Most other days come down to home white or road gray.',
  },
  tigers: {
    name: 'Tigers',
    lastNight: 'A Friday home night at Comerica Park was the orange home alternate, and a select Monday home night was the Motor City City Connect. Any other home night was most likely the home whites and any road night the gray set, with the navy alternate sprinkled into select road games at the team\'s discretion.',
    tonight: 'Friday at Comerica Park is the orange home alternate, and a Monday home night can mean the Motor City City Connect on select dates. Everything else comes down to the home whites at home or the gray set on the road, with the navy alternate an occasional road pick.',
    tomorrow: 'Friday at home means orange and a select Monday home night can mean the City Connect. Any other date is home white or road gray, with the navy alternate unscheduled.',
  },
  twins: {
    name: 'Twins',
    lastNight: 'A Friday home night at Target Field was most likely the blue "Ripple Effect" City Connect, which is the Twins\' one soft anchor. Any other night is manager\'s choice: the home default is the white jersey and the road default the pinstripe grays, with the navy alternate mostly on the road and the cream "Twin Cities" alternate mostly at home.',
    tonight: 'Lean City Connect on a Friday home night. Otherwise the Twins do not run a day-by-day system, so expect the white at Target Field or the pinstripe grays on the road, with the navy and cream "Twin Cities" alternates dropped in by feel.',
    tomorrow: 'A Friday home game leans "Ripple Effect" City Connect. Every other date is manager\'s choice around a home white and a road pinstripe gray default, with the cream alternate mostly at home and the navy mostly on the road.',
  },
  'white-sox': {
    name: 'White Sox',
    lastNight: 'A weekend home night at Rate Field was most likely the black alternate, which is where that jersey tends to surface. Any other home night was the white pinstripes and any road night the grays. The red Bulls-inspired City Connect is tied to specific promotional dates rather than a standing weekday, so it can land on almost any home game.',
    tonight: 'If it is a weekend home night, the black alternate is a good bet. Otherwise expect the home white pinstripes at Rate Field or the road grays on the trip. The red City Connect follows the promotional calendar rather than a day of the week.',
    tomorrow: 'There is no fixed day-of-week system, so check home or away first: pinstripes at home, grays on the road. A weekend home night leans black alternate, and the red City Connect depends entirely on the promotional schedule.',
  },
  yankees: {
    name: 'Yankees',
    lastNight: 'If the Yankees were at home it was the home pinstripes, and if they were on the road it was the road grays. That is the whole answer. New York does not run alternates, City Connects or day-of-week looks, so the hour and the day of the week make no difference.',
    tonight: 'Home means the home pinstripes and away means the road grays. The Yankees are the simplest team in baseball to predict, because they carry no alternates and no City Connect. A navy alternate road jersey exists in the closet but has never been worn in a regular season game.',
    tomorrow: 'Only one thing matters: whether the Yankees are home or away. Home is pinstripes, away is grays, every day of the week, day game or night game.',
  },
};

let changed = 0;

for (const [slug, t] of Object.entries(TEAMS)) {
  const file = path.join(POSTS, `${slug}-uniform-schedule-2026.md`);
  if (!fs.existsSync(file)) {
    console.log(`SKIP (no file) ${slug}`);
    continue;
  }
  let raw = fs.readFileSync(file, 'utf8');

  if (/\*\*What jersey did the .+ wear last night\?\*\*/.test(raw)) {
    console.log(`SKIP (already done) ${slug}`);
    continue;
  }

  // Anchor on the existing "wearing today" pair and insert directly after it, so
  // the tense variants sit together as a cluster at the top of the FAQ.
  const anchor = /(\*\*What jersey are the [^*\n]+wearing today\?\*\*\s*\n[^\n]*(?:\n(?!\s*\n)[^\n]*)*)/;
  const m = anchor.exec(raw);
  if (!m) {
    console.log(`SKIP (no today anchor) ${slug}`);
    continue;
  }

  const tracker = `\n\nFor the uniform we logged in their most recent game, see the [${t.name} uniform tracker](/mlb-tracker/${slug}), which we update every morning.`;

  const block = [
    '',
    '',
    `**What jersey did the ${t.name} wear last night?**`,
    '',
    t.lastNight + tracker,
    '',
    `**What uniform are the ${t.name} wearing tonight?**`,
    '',
    t.tonight,
    '',
    `**What are the ${t.name} wearing tomorrow?**`,
    '',
    t.tomorrow,
  ].join('\n');

  raw = raw.replace(anchor, m[1] + block);

  // Bump updatedDate so the change is dated honestly.
  if (/^updatedDate:/m.test(raw)) {
    raw = raw.replace(/^updatedDate:.*$/m, 'updatedDate: "2026-08-06"');
  } else {
    raw = raw.replace(/^(date:.*)$/m, '$1\nupdatedDate: "2026-08-06"');
  }

  fs.writeFileSync(file, raw);
  changed++;
  console.log(`updated ${slug}`);
}

console.log(`\n${changed} posts updated`);
