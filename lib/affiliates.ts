// Affiliate links, the tasteful version (Jake 11/5).
//
// History: every affiliate link came off the site on 2026-09-10 because the
// big "Shop" buttons and cards looked cringy. They come back here as small
// plain-text lines only, built at render time so nothing is baked into the
// markdown. To turn a placement off, flip its switch below (or AFFILIATES.on
// for all of them) and redeploy. The markdown never changes.
//
// Rules: at most one link per jersey, at most one HOMAGE line per post, never
// inside the game tables, weekly "what are they wearing" boxes or trackers.
// Every link is rel="sponsored nofollow noopener" target="_blank", and every
// page that carries one shows AFFILIATE_DISCLOSURE.

export const AFFILIATES = {
  /** Master switch. false = no affiliate link anywhere on the site. */
  on: true,
  /** "Get this jersey at Fanatics" under the Jersey of the Day (page + homepage card). */
  jotd: true,
  /** One "Shop the ..." line per jersey on NFL, MLB, NBA and NHL team schedule posts. */
  schedulePosts: true,
  /** One HOMAGE vintage tee line on the throwback/history posts in HOMAGE_POSTS. */
  // Off until Jake signs in to Impact and the HOMAGE tracking link goes in HOMAGE_IMPACT below (11/5).
  homage: false,
};

export const on = (k: Exclude<keyof typeof AFFILIATES, "on">) => AFFILIATES.on && AFFILIATES[k];

export const AFFILIATE_REL = "sponsored nofollow noopener";
export const AFFILIATE_DISCLOSURE = "We may earn a commission if you buy through links on this page.";

// ── Fanatics (Impact) ─────────────────────────────────────────────────────
// The same deep-link format the site used before 9/10 (and scripts/affiliate-link.mjs):
// subId1 names the page so Impact's "Performance by Sub ID" report can say
// which pages sell.
const FANATICS_IMPACT = "https://fanatics.93n6tx.net/5kZn3j";

const subId = (s: string) => s.replace(/[^a-z0-9-]/gi, "").slice(0, 60);

export const fanaticsSearchUrl = (query: string) =>
  `https://www.fanatics.com/search?query=${encodeURIComponent(query.toLowerCase())}`;

/** Impact deep link to a fanatics.com URL, or to a Fanatics search for `target`. */
export function fanaticsHref(page: string, target: string): string {
  const dest = /^https?:\/\//i.test(target) ? target : fanaticsSearchUrl(target);
  return `${FANATICS_IMPACT}?subId1=${subId(page)}&u=${encodeURIComponent(dest)}`;
}

// ── HOMAGE (Impact, 8%) ───────────────────────────────────────────────────
// PLACEHOLDER: paste the HOMAGE Impact tracking link here (impact.com >
// Brands > HOMAGE > Create link; it looks like https://<something>.net/<code>).
// Until it is set, HOMAGE lines point straight at homage.com, earn nothing,
// and carry data-affiliate="homage-pending" so they are easy to find.
const HOMAGE_IMPACT = "";

export function homageHref(page: string, collection: string): string {
  const dest = `https://www.homage.com/collections/${collection}`;
  return HOMAGE_IMPACT ? `${HOMAGE_IMPACT}?subId1=${subId(page)}&u=${encodeURIComponent(dest)}` : dest;
}

/** Throwback/history posts where a HOMAGE line genuinely fits. Collection
 *  slugs are homage.com/collections/<slug>, each checked live on 11/5. */
export const HOMAGE_POSTS: Record<string, { team: string; collection: string }> = {
  "phillies-throwback-uniform-history-2026": { team: "Phillies", collection: "philadelphia-phillies" },
  "ravens-uniform-history-every-jersey": { team: "Ravens", collection: "baltimore-ravens" },
  "giants-vintage-white-eagles-commanders-2026": { team: "Giants", collection: "new-york-giants" },
  "jets-classic-throwback-uniform-field-week-7-2026": { team: "Jets", collection: "new-york-jets" },
  "seahawks-white-throwback-uniforms-2027": { team: "Seahawks", collection: "seattle-seahawks" },
  "saints-60th-anniversary-logo-2026": { team: "Saints", collection: "new-orleans-saints" },
  "cavs-throwback-jerseys-game-6-pistons-2026-playoffs": { team: "Cavaliers", collection: "cleveland-cavaliers" },
  "timberwolves-new-uniforms-june-7-2026-throwback-prediction": { team: "Timberwolves", collection: "minnesota-timberwolves" },
  "athletics-125th-anniversary-patch-elephant-logo-2026": { team: "A's", collection: "athletics" },
  "49ers-80th-anniversary-patch-2026": { team: "49ers", collection: "san-francisco-49ers" },
  "knicks-1973-vs-2026-championship-uniforms-compared": { team: "Knicks", collection: "new-york-knicks" },
  "houston-texans-25th-anniversary-patch": { team: "Texans", collection: "houston-texans" },
};

const LINK_STYLE = "color: inherit; text-decoration: underline; text-underline-offset: 2px;";

/** One HOMAGE line, placed just before the FAQ (or the "More ... Coverage"
 *  links, or the end of the post). Returns the html unchanged for any post
 *  not in HOMAGE_POSTS. */
export function addHomageLine(html: string, slug: string): { html: string; added: number } {
  const p = HOMAGE_POSTS[slug];
  if (!on("homage") || !p) return { html, added: 0 };
  const pending = HOMAGE_IMPACT ? "" : ' data-affiliate="homage-pending"';
  const line =
    `<p class="cw-aff" style="font-size: 0.85em; color: #57607a; margin: 1.6em 0;">` +
    `HOMAGE makes <a href="${homageHref(slug, p.collection)}" rel="${AFFILIATE_REL}" target="_blank"${pending} style="${LINK_STYLE}">licensed vintage-style ${p.team} tees</a>. ` +
    `First order there? Code AFF15 works for new customers (not on HOMAGE x Starter).</p>`;
  const at = html.search(/<h2[^>]*>\s*(Frequently Asked Questions|More [^<]*Coverage)/);
  return { html: at > 0 ? html.slice(0, at) + line + html.slice(at) : html + line, added: 1 };
}

// ── Team schedule posts ───────────────────────────────────────────────────

const shopLine = (href: string, text: string, extraStyle = "") =>
  `<a href="${href}" rel="${AFFILIATE_REL}" target="_blank" style="${LINK_STYLE}${extraStyle}">${text}</a>`;

const strip = (s: string) =>
  s.replace(/<[^>]+>/g, "").replace(/&#x26;|&amp;/g, "&").replace(/&#x27;|&#39;|&rsquo;/g, "'").trim();

// NBA/NHL Uniform Closet cards that are real, buyable jerseys this season.
// Event cards (Winter Classic, a dated game) and "None Announced"/"Retired"
// thirds get no link.
function closetJersey(label: string, league: string): string | null {
  if (/none|not |retired|dormant|status open|last season/i.test(label)) return null;
  if (league === "nba") {
    const m = label.match(/^(Association|Icon|Statement|City|Classic|Specter) Edition$/);
    return m ? `${m[1]} Edition` : null;
  }
  if (label === "Home" || label === "Away") return label.toLowerCase();
  if (/^Hometown Remix/.test(label)) return "Hometown Remix";
  if (/(Third|Alternate)/.test(label) && !/ and /.test(label)) return label.replace(/\s*\(.*\)\s*$/, "");
  return null;
}

// NFL/MLB jersey sections: one h2 per jersey ("Navy at Soldier Field (7 Games)",
// "Kelly Green (Weeks 9 and 16, Confirmed)", "Home Pinstripes"). Anything that
// is the schedule grid, the FAQ, an explainer or a question gets no link.
const SKIP_H2 =
  /schedule|week by week|frequently|coverage|bottom line|^(the )?(how|why|what|is|will|every)\b|\?|question|wrinkle|helmet|fans get|sample week|postseason|glance|rotation|works|road team|home team|does not|only real|count|sitting in the closet|retired|dormant|playbook|explained|closet|cap\b/i;
// Checked in this order, so "Home White Pinstripes" is the pinstripe jersey
// and "Royal-Blue Alternate" is royal blue, not blue.
const COLORS = [
  "pinstripe", "kelly green", "midnight green", "powder blue", "royal blue", "columbia blue", "honolulu blue",
  "vegas gold", "royal", "white", "navy", "black", "red", "green", "blue", "gold", "gray", "grey", "orange", "teal",
  "purple", "silver", "cream", "maroon", "burgundy", "brown", "yellow", "aqua",
];

function sectionJersey(heading: string): string | null {
  const h = heading.replace(/^the\s+/i, "");
  if (SKIP_H2.test(h)) return null;
  const l = h.toLowerCase().replace(/-/g, " ");
  if (/rivalries/.test(l)) return "Rivalries jersey";
  if (/city connect/.test(l)) return "City Connect jersey";
  if (/color rush/.test(l)) return "Color Rush jersey";
  const year = l.match(/\b(19\d\d|20[01]\d)\b/);
  if (/throwback/.test(l)) return `${year ? year[1] + " " : ""}throwback jersey`;
  const color = COLORS.find((c) => new RegExp(`\\b${c}s?\\b`).test(l));
  const alt = /alternate/.test(l) ? " alternate" : "";
  if (color === "pinstripe") return "pinstripe jersey";
  if (!color) return null; // "On the Road", "Two Home Games in London": no single jersey to name
  const name = color === "grey" ? "gray" : color === "honolulu blue" ? "Honolulu Blue" : color;
  return `${name}${alt} jersey`;
}

/**
 * Adds one small "Shop the <team> <jersey>" text line per jersey to a team
 * schedule post. NBA/NHL: inside each Uniform Closet card. NFL/MLB: at the end
 * of each jersey's own section. Duplicate jerseys (navy at home, navy in
 * Miami) get one link, on the first section.
 */
export function addScheduleShopLinks(
  html: string,
  o: { slug: string; league: string; team: string; nickname: string },
): { html: string; added: number } {
  // League hubs (nfl-uniform-schedule-2026 etc.) are not one team's closet.
  if (!on("schedulePosts") || /^(nfl|mlb|nba|nhl)-uniform-schedule/.test(o.slug)) return { html, added: 0 };
  let added = 0;
  const seen = new Set<string>();

  if (o.league === "nba" || o.league === "nhl") {
    const start = html.indexOf("Uniform Closet for");
    if (start < 0) return { html, added };
    const end = html.indexOf("<h2", start);
    const closet = html.slice(start, end < 0 ? undefined : end);
    const out = closet.replace(
      /(<div style="[^"]*letter-spacing: 1\.5px; opacity: 0\.85;">)([^<]*)(<\/div><div [^>]*>)([\s\S]*?)(<\/div><\/div>)/g,
      (all, a: string, label: string, b: string, body: string, close: string) => {
        // "Penguins Gold Third" reads "Shop the Penguins Gold Third jersey", not "Penguins Penguins".
        const j = closetJersey(strip(label).replace(new RegExp(`^${o.nickname}\\s+`), ""), o.league);
        if (!j || seen.has(j)) return all;
        seen.add(j);
        added++;
        const href = fanaticsHref(o.slug, `${o.team} ${j} jersey`);
        const link = `<div style="margin-top: 10px; font-size: 0.8em; font-weight: 700;">${shopLine(href, `Shop the ${o.nickname} ${j} jersey`)}</div>`;
        return a + label + b + body + "</div>" + link + close.slice("</div>".length);
      },
    );
    return { html: html.slice(0, start) + out + (end < 0 ? "" : html.slice(end)), added };
  }

  // NFL / MLB: split on h2 and append a line to each jersey section.
  const parts = html.split(/(?=<h2\b)/);
  const out = parts.map((sec) => {
    const m = sec.match(/^<h2\b[^>]*>([\s\S]*?)<\/h2>/);
    if (!m) return sec;
    const j = sectionJersey(strip(m[1]));
    // One link per jersey: "orange alternate" and "orange" are the same shirt to a shopper.
    const key = j?.replace(/ alternate/, "");
    if (!j || !key || seen.has(key)) return sec;
    seen.add(key);
    added++;
    const href = fanaticsHref(o.slug, `${o.team} ${j}`);
    return (
      sec.replace(/\s+$/, "") +
      `\n<p class="cw-aff" style="font-size: 0.85em; font-weight: 600; color: #3a4a68; margin: 0.8em 0 1.6em;">${shopLine(href, `Shop the ${o.nickname} ${j} at Fanatics`)}</p>\n`
    );
  });
  return { html: out.join(""), added };
}

/** Jersey of the Day link target: the entry's own product URL when set,
 *  else a Fanatics search for the team and jersey name. */
export function jotdShopHref(
  e: { date: string; team: string; jerseyName: string; shopUrl?: string; shopQuery?: string },
  placement: "jotd" | "home",
): string {
  const page = placement === "home" ? `home-jotd-${e.date}` : `jotd-${e.date}`;
  const query = e.shopQuery ?? `${e.team} ${e.jerseyName.replace(/\s*\(.*?\)\s*/g, " ").trim()} jersey`;
  return fanaticsHref(page, e.shopUrl ?? query);
}

/** MLB schedule posts: team and nickname from the title ("New York Yankees Jerseys & Uniforms 2026"). */
export function teamFromTitle(title: string): { team: string; nickname: string } | null {
  const team = title.match(/^(.+?) (Jerseys|Uniforms?)\b/)?.[1];
  if (!team) return null;
  const two = ["Red Sox", "White Sox", "Blue Jays"].find((n) => team.endsWith(n));
  return { team, nickname: two ?? team.split(" ").slice(-1)[0] };
}
