// The uniform wire: reads team X/Twitter timelines without an account and surfaces
// anything that looks like uniform news, so we stop finding out second.
//
// Why: Uni Watch's following came from catching things first. Jake cannot sit on X all
// day and nobody DMs him the reveals, so this watches the accounts for us. It is the
// sourcing layer under the news section, not a publisher: it prints candidates, a human
// picks and writes.
//
// Two sources, because neither is reliable alone:
//   1. X timelines. syndication.twitter.com serves each public profile's recent tweets as
//      JSON inside a __NEXT_DATA__ blob, no login and no API key. This is the primary:
//      it is the team's own words and it carries the combo graphic. It rate limits hard
//      (HTTP 429) if you sweep every account at once, so we crawl slowly and remember
//      where we stopped.
//   2. Google News RSS. No limit worth worrying about, and it catches what beat writers
//      and ESPN post, including things teams never tweet. Headlines only, so it points
//      you at a story rather than handing you the picture.
//
// Usage:
//   node scripts/uniform-wire.mjs                 both sources, last 12 hours
//   node scripts/uniform-wire.mjs --league nfl    one league (nfl, mlb, cfb, nba, nhl, media)
//   node scripts/uniform-wire.mjs --hours 36      widen the window
//   node scripts/uniform-wire.mjs --all           ignore the keyword filter, show everything
//   node scripts/uniform-wire.mjs --news          skip X, news only (use when rate limited)
//   node scripts/uniform-wire.mjs --x             skip news, X only
//   node scripts/uniform-wire.mjs --limit 40      how many X accounts to sweep this run
//   node scripts/uniform-wire.mjs --json          machine readable, for a future feed build
//
// ⚠️ X rate limiting is the whole operational constraint. A full 150-account sweep in one
// go returns 429 for every account and poisons the next several minutes. Run it on a
// rotation instead: --limit 30 every few hours walks the whole list across a day, and the
// cursor in the state file remembers where it left off.
//
// State: scripts/data/uniform-wire-seen.json holds ids we have already printed, so a
// second run in the same day is quiet. Delete it to replay.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STATE = join(root, "scripts", "data", "uniform-wire-seen.json");

const ACCOUNTS = {
  nfl: ["Commanders", "dallascowboys", "Eagles", "Giants", "BuffaloBills", "MiamiDolphins", "Patriots", "nyjets", "RavensNFL", "Bengals", "Browns", "steelers", "HoustonTexans", "Colts", "Jaguars", "Titans", "Broncos", "Chiefs", "Raiders", "chargers", "ChicagoBears", "Lions", "packers", "Vikings", "AtlantaFalcons", "Panthers", "Saints", "Buccaneers", "AZCardinals", "RamsNFL", "49ers", "Seahawks", "NFL", "NFLFashion"],
  mlb: ["Dodgers", "Yankees", "RedSox", "Mets", "Cubs", "Cardinals", "SFGiants", "Padres", "Phillies", "Braves", "Astros", "Mariners", "Rangers", "Angels", "Athletics", "BlueJays", "Orioles", "RaysBaseball", "whitesox", "CleGuardians", "tigers", "Royals", "Twins", "Brewers", "Reds", "Pirates", "Nationals", "Marlins", "Rockies", "Dbacks", "MLB"],
  cfb: ["OhioStateFB", "AlabamaFTBL", "LSUfootball", "GeorgiaFootball", "TexasFootball", "MichiganFootball", "OregonFootball", "CanesFootball", "FSUFootball", "OleMissFB", "TennesseeFB", "ClemsonFB", "NotreDameFB", "PennStateFball", "TexasAMFootball", "AuburnFootball", "UWFootball", "USC_FB", "UCLAFootball", "UtahFootball", "WVUfootball", "ASUFootball", "BoilerFootball", "IlliniFootball", "RFootball", "GopherFootball", "Pitt_FB", "CuseFootball", "DukeFOOTBALL", "PackFootball", "NebraskaFootball", "BaylorFootball", "TCUFootball", "UHCougarFB", "UKFootball", "LouisvilleFB", "WakeFB", "UVAFootball"],
  nba: ["NBA", "Lakers", "celtics", "warriors", "nyknicks", "chicagobulls", "MiamiHEAT", "sixers", "Bucks", "nuggets", "SacramentoKings", "utahjazz", "okcthunder", "Timberwolves", "trailblazers"],
  nhl: ["NHL", "MapleLeafs", "CanadiensMTL", "NYRangers", "BostonBruins", "DetroitRedWings", "Blackhawks", "penguins", "Avalanche", "EdmontonOilers", "SeattleKraken", "GoldenKnights"],
  media: ["UniWatch", "SportsLogosNet", "UniSwag", "Nike", "NFL_Journal"],
};

// Vocabulary that actually signals uniform news. Kept tight on purpose: a wire that
// prints every hype video is a wire nobody reads.
const HIT = /\b(uniform|uni|jersey|jerseys|kit|threads|helmet|helmets|pants|socks|cleats|throwback|alternate|alt|city connect|color rush|colour rush|combo|combination|dress|wearing|wear|rocking|fit|fits|unveil|unveils|unveiled|reveal|reveals|revealed|debut|debuts|new look|blackout|white out|whiteout|stripe out|patch|decal|nameplate|number font|wordmark|rebrand|redesign|logo)\b/i;

// Phrases that are almost always merch or ticket promos wearing uniform words.
const NOISE = /\b(shop|store|sale|giveaway|sweepstakes|presented by|promo code|buy|tickets|available now at|drop a|caption this|jersey giveaway)\b/i;

// Headlines need a stricter gate than tweets. Google News reads "jersey" as New Jersey,
// "kit" as a hockey kit bag, and hands back obituaries, auctions and game previews all
// day. Two rules: the headline must contain a real uniform phrase, and must not look
// like one of the recurring false positives.
const NEWS_HIT = /\b(uniform|uniforms|jersey|jerseys|helmet|helmets|throwback|alternate|city connect|city edition|statement edition|reverse retro|color rush|colour rush|kit|sweater|uni|unis)\b/i;
const NEWS_NOISE = /\b(new jersey|jersey city|jersey shore|preview|prediction|picks|odds|betting|injury|injured|trade|traded|signs|signing|contract|waivers|demoted|promoted|passes away|died|death|obituary|remembering|auction|memorabilia|autograph|sells for|lawsuit|arrested|charged|fantasy|start 'em|power rankings|mock draft|recap|highlights|how to watch|live stream|score prediction|throwback thursday|jersey history|jersey retirement|hall of fame)\b/i;

const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const has = (name) => args.includes(`--${name}`);

const league = flag("league");
const hours = Number(flag("hours", 12));
const showAll = has("all");
const asJson = has("json");

const handles = league
  ? (ACCOUNTS[league] ?? (() => { console.error(`unknown league "${league}". known: ${Object.keys(ACCOUNTS).join(", ")}`); process.exit(1); })())
  : Object.values(ACCOUNTS).flat();

const rawState = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : { ids: [], cursor: 0 };
// Older runs wrote a bare array; keep reading those.
const state = Array.isArray(rawState) ? { ids: rawState, cursor: 0 } : rawState;
const seen = new Set(state.ids ?? []);
const cutoff = Date.now() - hours * 3600 * 1000;

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

async function timeline(handle) {
  const url = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${handle}`;
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
  if (!m) throw new Error("no __NEXT_DATA__ (profile private, renamed or rate limited)");
  const data = JSON.parse(m[1]);
  const entries = data?.props?.pageProps?.timeline?.entries ?? [];
  return entries.map((e) => e?.content?.tweet).filter(Boolean);
}

// Google News RSS, one query per league. Headlines are already written by someone, so
// they are a tip sheet: they tell you what to go confirm, never what to publish.
const NEWS_QUERIES = {
  nfl: '("uniform combo" OR "uniform combination" OR "throwback" OR "color rush" OR "alternate helmet") NFL',
  mlb: '("City Connect" OR "uniform" OR "throwback jersey") MLB',
  cfb: '("uniform combination" OR "uniforms" OR "throwback" OR "alternate helmet") "college football"',
  nba: '("City Edition" OR "Statement Edition" OR "uniform" OR "jersey") NBA',
  nhl: '("Reverse Retro" OR "third jersey" OR "uniform" OR "sweater") NHL',
  media: '"uniform" ("malfunction" OR "wrong jersey" OR "mismatch" OR "nameplate" OR "misspelled")',
};

async function news(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:2d`)}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const items = [...xml.matchAll(/<item>(.*?)<\/item>/gs)].map((m) => m[1]);
  return items.map((it) => {
    const grab = (tag) => (it.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`, "s")) ?? [])[1] ?? "";
    const title = decode(grab("title"));
    const source = decode(grab("source"));
    return { title, source, link: grab("link"), at: new Date(grab("pubDate")).toISOString() };
  });
}

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

const found = [];
const headlines = [];
const failed = [];

if (!has("x")) {
  const leagues = league ? [league] : Object.keys(NEWS_QUERIES);
  for (const lg of leagues) {
    const q = NEWS_QUERIES[lg];
    if (!q) continue;
    try {
      for (const item of await news(q)) {
        if (!item.at || new Date(item.at).getTime() < cutoff) continue;
        const key = `news:${item.link}`;
        if (seen.has(key)) continue;
        if (!showAll && (!NEWS_HIT.test(item.title) || NEWS_NOISE.test(item.title) || NOISE.test(item.title))) continue;
        // The same story shows up under several league queries and in five aggregators.
        const title = item.title.replace(/\s+-\s+[^-]+$/, "").toLowerCase();
        if (headlines.some((h) => h.dedupe === title)) continue;
        headlines.push({ ...item, league: lg, key, dedupe: title });
      }
    } catch (err) {
      failed.push(`news/${lg}: ${err.message}`);
    }
  }
}

// Serial with a gap, and only `limit` accounts per run: sweeping all 150 at once returns
// 429 for every one of them. The cursor walks the list across runs.
const limit = Number(flag("limit", handles.length));
const start = handles.length ? (state.cursor ?? 0) % handles.length : 0;
const sweep = has("news") ? [] : Array.from({ length: Math.min(limit, handles.length) }, (_, i) => handles[(start + i) % handles.length]);

for (const handle of sweep) {
  try {
    const tweets = await timeline(handle);
    for (const tw of tweets) {
      const id = tw.id_str;
      const when = new Date(tw.created_at).getTime();
      if (!id || Number.isNaN(when) || when < cutoff) continue;
      if (seen.has(id)) continue;
      const text = (tw.full_text ?? tw.text ?? "").replace(/https:\/\/t\.co\/\w+/g, "").trim();
      const isHit = HIT.test(text);
      const isNoise = NOISE.test(text);
      if (!showAll && (!isHit || isNoise)) continue;
      const photos = (tw.mediaDetails ?? []).filter((m) => m.type === "photo").map((m) => m.media_url_https);
      const videos = (tw.mediaDetails ?? []).filter((m) => m.type !== "photo").length;
      found.push({
        id,
        handle: tw.user?.screen_name ?? handle,
        at: new Date(when).toISOString(),
        text,
        url: `https://x.com/${tw.user?.screen_name ?? handle}/status/${id}`,
        photos,
        videos,
        noisy: isNoise,
      });
    }
  } catch (err) {
    failed.push(`${handle}: ${err.message}`);
  }
  // 1.5s between accounts keeps a 30-account sweep under the limit in practice.
  await new Promise((r) => setTimeout(r, 1500));
}

found.sort((a, b) => b.at.localeCompare(a.at));
headlines.sort((a, b) => b.at.localeCompare(a.at));

const rateLimited = failed.filter((f) => f.includes("429")).length;

if (asJson) {
  console.log(JSON.stringify({ generated: new Date().toISOString(), hours, found, headlines, failed }, null, 2));
} else {
  const pad = (s, n) => String(s).padEnd(n);
  console.log(`\nUNIFORM WIRE  ${found.length} post${found.length === 1 ? "" : "s"} from ${sweep.length} accounts, ${headlines.length} headline${headlines.length === 1 ? "" : "s"}, last ${hours}h`);
  if (found.length) console.log(`\n--- TEAM POSTS (their own words, their own images) ---\n`);
  for (const f of found) {
    const clock = f.at.slice(11, 16);
    const media = f.photos.length ? `${f.photos.length} photo` : f.videos ? "video" : "no media";
    console.log(`${clock}  ${pad("@" + f.handle, 18)} ${f.text.replace(/\s+/g, " ").slice(0, 96)}`);
    console.log(`       ${f.url}  [${media}]`);
    for (const p of f.photos.slice(0, 2)) console.log(`       ${p}`);
    console.log("");
  }
  if (headlines.length) console.log(`--- HEADLINES (tips to confirm, never to copy) ---\n`);
  for (const h of headlines) {
    console.log(`${h.at.slice(5, 16).replace("T", " ")}  ${pad(h.league, 5)} ${h.title.slice(0, 104)}`);
    console.log(`             ${h.source}`);
    console.log("");
  }
  if (rateLimited) console.log(`⚠️  ${rateLimited} account${rateLimited === 1 ? "" : "s"} rate limited by X. Wait a few minutes, or rerun with --news.`);
  const otherFails = failed.filter((f) => !f.includes("429"));
  if (otherFails.length) console.log(`(${otherFails.length} unreadable: ${otherFails.slice(0, 5).join("; ")}${otherFails.length > 5 ? " ..." : ""})`);
}

mkdirSync(dirname(STATE), { recursive: true });
// Only advance the cursor over accounts we actually read; a rate limited sweep should
// retry the same names next time rather than skipping past them.
const readOk = sweep.length - rateLimited;
writeFileSync(
  STATE,
  JSON.stringify({
    cursor: handles.length ? (start + Math.max(readOk, 0)) % handles.length : 0,
    ids: [...seen, ...found.map((f) => f.id), ...headlines.map((h) => h.key)].slice(-4000),
  }),
);
