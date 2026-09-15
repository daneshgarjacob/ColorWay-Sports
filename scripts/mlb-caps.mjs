// Tonight's caps, straight from MLB's own uniform feed.
//
// /v1/uniforms/game lists a "Cap, hat, head-gear" asset for each side once a
// club files its uniforms (usually an hour or so before first pitch), e.g.
//   "Dodgers Primary Blue Hat"
//   "Orioles Alt 2 Black Front Orange Bill "B" Hat"
//   "Guardians Blue Top, Red Bill "C" Hat"
// We keep the description and drop the club name, the Primary/Alt tag and the
// trailing "Hat", so the card can read "Cap: Black Front, Orange Bill 'B'".
//
// Jake, 2026-09-14: "since we have all the team hats, maybe we should start
// building that in." People search "what hats are the <team> wearing today".

const CLUB = [
  "Red Sox", "White Sox", "Blue Jays", "D-backs", "Diamondbacks", "Orioles", "Yankees", "Rays",
  "Guardians", "Tigers", "Royals", "Twins", "Astros", "Angels", "Athletics", "Mariners", "Rangers",
  "Braves", "Marlins", "Mets", "Phillies", "Nationals", "Cubs", "Reds", "Brewers", "Pirates",
  "Cardinals", "Rockies", "Dodgers", "Padres", "Giants",
];

export function cleanCap(text, clubName) {
  let t = String(text || "").trim();
  const nick = CLUB.find((c) => t.startsWith(c + " ")) ?? clubName;
  if (nick && t.startsWith(nick + " ")) t = t.slice(nick.length + 1);
  t = t
    .replace(/^(Primary|Alternate|Alt\s*\d*|Home|Road|Away)\s+/i, "")
    .replace(/\s+Hat$/i, "")
    .replace(/\s+(Bill|Brim)\b/i, (m) => m) // keep as written
    .replace(/(Front|Top)\s+(\w+\s+(Bill|Brim))/i, "$1, $2")
    .replace(/"/g, "'")
    .trim();
  return t;
}

/**
 * slug -> cap description for every club whose cap is in the feed for `date`.
 * `slugOf` maps the feed's full club name ("Los Angeles Dodgers") to our slug.
 */
export async function fetchCaps(date, slugOf) {
  const sched = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}`).then((r) => r.json());
  const games = sched?.dates?.[0]?.games ?? [];
  if (!games.length) return {};
  const pks = games.map((g) => g.gamePk).join(",");
  const feed = await fetch(`https://statsapi.mlb.com/api/v1/uniforms/game?gamePks=${pks}`).then((r) => r.json()).catch(() => ({}));
  const byPk = new Map((feed?.uniforms ?? []).map((u) => [u.gamePk, u]));

  const caps = {};
  // Oldest game first so a doubleheader's opener wins; the file is keyed by team.
  for (const g of [...games].sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate))) {
    const u = byPk.get(g.gamePk);
    if (!u) continue;
    for (const side of ["away", "home"]) {
      const name = g.teams[side].team.name;
      const slug = slugOf[name];
      if (!slug || caps[slug]) continue;
      const assets = u[side]?.uniformAssets ?? [];
      const cap = assets.find((a) => /cap|hat|head/i.test(a?.uniformAssetType?.uniformAssetTypeDesc ?? ""));
      if (cap?.uniformAssetText) caps[slug] = cleanCap(cap.uniformAssetText, name.split(" ").pop());
    }
  }
  return caps;
}
