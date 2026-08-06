// CTR rewrite pass, 2026-08-06.
//
// GSC (28d to Aug 4) sorted by impressions shows a clear split. The uniform-schedule
// posts run 7-11% CTR at position ~4. The World Cup explainer and tracker pages run
// 0.3-2.1% on far more impressions:
//
//   world-cup-jersey-stars-meaning-2026        973 / 78,757  1.2%  pos 5.5
//   world-cup-2026-jersey-tracker              579 / 36,987  1.6%  pos 7.9
//   how-world-cup-kits-are-chosen-2026         389 / 18,160  2.1%  pos 6.4
//   why-goalkeepers-wear-different-colors      121 / 17,265  0.7%  pos 6.1
//   usmnt-crest-us-soccer-badge-explained       73 / 10,519  0.7%  pos 5.8
//   france-polo-collar-2026-world-cup-jersey    95 / 10,323  0.9%  pos 6.6
//   world-cup-logo-history-ranked                81 / 5,503  1.5%  pos 7.9
//   world-cup-final-2026-kits-spain-argentina    11 / 3,508  0.3%  pos 7.8
//
// Two fixable causes (verified on a live SERP for the stars query, where we sit #2
// behind Wikipedia):
//   1. Titles run 77-136 chars. Google truncates the displayed title around 55-60,
//      so the differentiating hook was invisible in results. The healthy schedule
//      posts are all 64-66 chars.
//   2. Several excerpts blow past the ~155-char meta-description limit. The tracker's
//      was roughly 400 WORDS, so Google had nothing usable to show.
// Also strips em dashes from the affected excerpts, per the house voice rules.
//
// NOT fixable here: these queries carry an AI Overview plus People Also Ask, which
// answers the basic question in-SERP. Expect improvement, not schedule-post numbers.
//
// Deliberately NOT touched: the roof-status pages (rangers/daikin/american-family,
// 0.9-1.7% page CTR). Their money queries already convert around 12% ("will daikin
// park roof be open today"). The low page-level CTR is dilution from broad stadium
// impressions we were never going to win, so retitling would risk what works.
import fs from 'node:fs';

const EDITS = {
  'world-cup-jersey-stars-meaning-2026': {
    title: "World Cup Jersey Stars: Every Count, and Uruguay's Extra Two",
    excerpt:
      "Each star above a World Cup crest is one title. Every 2026 team's count, plus why Uruguay wears four stars for only two World Cups.",
  },
  'world-cup-2026-jersey-tracker': {
    title: '2026 World Cup Jersey Tracker: All 48 Teams, Every Kit Graded',
    excerpt:
      'Every 2026 World Cup kit matchup graded, all 48 teams across 104 matches, from the opener through Spain beating Argentina 1-0 in the final.',
  },
  'how-world-cup-kits-are-chosen-2026': {
    title: 'How World Cup Kits Are Chosen: Who Decides Who Wears Home',
    excerpt:
      'The home team does not pick its own kit. FIFA does, before kickoff. How every 2026 World Cup match kit gets decided, and the clash rules behind it.',
  },
  'why-goalkeepers-wear-different-colors-world-cup': {
    title: 'Why Do Goalkeepers Wear Different Colors? The Actual Rule',
  },
  'usmnt-crest-us-soccer-badge-explained': {
    title: 'The USMNT Crest, Explained: Why the US Badge Has No Stars',
  },
  'france-polo-collar-2026-world-cup-jersey': {
    title: "Why France's 2026 World Cup Jersey Has a Polo Collar",
    excerpt:
      'France wears a white polo collar on its 2026 World Cup home jersey, a Nike heritage callback. Uruguay is the only other nation with one.',
  },
  'world-cup-logo-history-ranked': {
    title: 'Every World Cup Logo, Ranked: Best and Worst, 1930 to 2026',
    excerpt:
      "We ranked all 23 official World Cup emblems, from Uruguay's 1930 art-deco poster to the trophy hidden inside the 2026 mark.",
  },
  'world-cup-final-2026-kits-spain-argentina': {
    title: 'World Cup Final 2026 Kits: What Spain and Argentina Wore',
    excerpt:
      'Spain beat Argentina 1-0 in their red home jersey against the light blue and white stripes. What both teams wore in the all-adidas final.',
  },
};

// Frontmatter values may be quoted, unquoted, or YAML folded scalars (">-" plus an
// indented block), so replace from the key up to the next top-level key.
function setField(raw, key, value) {
  const fm = /^---\n([\s\S]*?)\n---/.exec(raw);
  if (!fm) throw new Error('no frontmatter');
  const body = fm[1];
  const re = new RegExp(`^${key}:[\\s\\S]*?(?=\\n[a-zA-Z_]+:|$)`, 'm');
  if (!re.test(body)) throw new Error(`no ${key} field`);
  const quoted = `${key}: ${JSON.stringify(value)}`;
  const newBody = body.replace(re, quoted);
  return raw.replace(fm[1], newBody);
}

let n = 0;
for (const [slug, edit] of Object.entries(EDITS)) {
  const file = `content/posts/${slug}.md`;
  let raw = fs.readFileSync(file, 'utf8');

  for (const [key, value] of Object.entries(edit)) {
    raw = setField(raw, key, value);
    if (key === 'title') {
      console.log(`${slug}\n  title (${value.length} chars): ${value}`);
    }
  }

  if (/^updatedDate:/m.test(raw)) {
    raw = setField(raw, 'updatedDate', '2026-08-06');
  } else {
    raw = raw.replace(/^(date:.*)$/m, '$1\nupdatedDate: "2026-08-06"');
  }

  fs.writeFileSync(file, raw);
  n++;
}
console.log(`\n${n} posts rewritten`);
