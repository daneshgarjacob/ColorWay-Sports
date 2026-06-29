// 2026 World Cup "Draft Your XI" — player pool + draft helpers.
//
// Interactive tool: fill a 4-3-3 by drafting one of five random players for each
// position slot, drawn from the stars whose nations are still in the knockouts.
// Pool is curated marquee names (recognizable > exhaustive). Flags reuse
// /flags/<code>.png. `rating` is a FIFA-style overall (EA FC ~24/25 ballpark),
// hand-assigned (no live EA link is available) — used to score the drafted XI.
// Math.random is fine here (client only).

export type Pos = "GK" | "DEF" | "MID" | "FWD";

export type Player = {
  id: string;    // unique slug
  name: string;
  pos: Pos;
  flag: string;  // /flags/<flag>.png
  team: string;  // nation, for display
  rating: number; // FIFA-style overall
};

const p = (name: string, pos: Pos, flag: string, team: string, rating: number): Player => ({
  id: name.toLowerCase().normalize("NFD").replace(/[^a-z ]/g, "").trim().replace(/ +/g, "-"),
  name,
  pos,
  flag,
  team,
  rating,
});

export const pool: Player[] = [
  // Goalkeepers
  p("Thibaut Courtois", "GK", "be", "Belgium", 90),
  p("Alisson", "GK", "br", "Brazil", 89),
  p("Emiliano Martínez", "GK", "ar", "Argentina", 86),
  p("Unai Simón", "GK", "es", "Spain", 85),
  p("Yann Sommer", "GK", "ch", "Switzerland", 85),
  p("Jordan Pickford", "GK", "gb-eng", "England", 84),
  p("Yassine Bounou", "GK", "ma", "Morocco", 84),
  p("Bart Verbruggen", "GK", "nl", "Netherlands", 81),
  // Defenders
  p("Virgil van Dijk", "DEF", "nl", "Netherlands", 89),
  p("Rúben Dias", "DEF", "pt", "Portugal", 88),
  p("Antonio Rüdiger", "DEF", "de", "Germany", 87),
  p("Marquinhos", "DEF", "br", "Brazil", 86),
  p("Dani Carvajal", "DEF", "es", "Spain", 86),
  p("Achraf Hakimi", "DEF", "ma", "Morocco", 85),
  p("William Saliba", "DEF", "fr", "France", 85),
  p("Theo Hernández", "DEF", "fr", "France", 85),
  p("Cristian Romero", "DEF", "ar", "Argentina", 85),
  p("Jules Koundé", "DEF", "fr", "France", 84),
  p("John Stones", "DEF", "gb-eng", "England", 84),
  p("Trent Alexander-Arnold", "DEF", "gb-eng", "England", 84),
  p("Manuel Akanji", "DEF", "ch", "Switzerland", 84),
  p("Joško Gvardiol", "DEF", "hr", "Croatia", 84),
  p("Alphonso Davies", "DEF", "ca", "Canada", 84),
  p("Dayot Upamecano", "DEF", "de", "Germany", 84),
  p("Nicolás Otamendi", "DEF", "ar", "Argentina", 83),
  p("Denzel Dumfries", "DEF", "nl", "Netherlands", 83),
  p("Nathan Aké", "DEF", "nl", "Netherlands", 83),
  p("Noussair Mazraoui", "DEF", "ma", "Morocco", 81),
  p("Pau Cubarsí", "DEF", "es", "Spain", 81),
  // Midfielders
  p("Rodri", "MID", "es", "Spain", 91),
  p("Jude Bellingham", "MID", "gb-eng", "England", 90),
  p("Kevin De Bruyne", "MID", "be", "Belgium", 88),
  p("Pedri", "MID", "es", "Spain", 88),
  p("Joshua Kimmich", "MID", "de", "Germany", 88),
  p("Bruno Fernandes", "MID", "pt", "Portugal", 88),
  p("Bernardo Silva", "MID", "pt", "Portugal", 88),
  p("Frenkie de Jong", "MID", "nl", "Netherlands", 87),
  p("Florian Wirtz", "MID", "de", "Germany", 87),
  p("Declan Rice", "MID", "gb-eng", "England", 87),
  p("Jamal Musiala", "MID", "de", "Germany", 86),
  p("Luka Modrić", "MID", "hr", "Croatia", 85),
  p("Aurélien Tchouaméni", "MID", "fr", "France", 85),
  p("Moisés Caicedo", "MID", "ec", "Ecuador", 85),
  p("Alexis Mac Allister", "MID", "ar", "Argentina", 85),
  p("Vitinha", "MID", "pt", "Portugal", 85),
  p("Eduardo Camavinga", "MID", "fr", "France", 84),
  p("Granit Xhaka", "MID", "ch", "Switzerland", 84),
  p("Enzo Fernández", "MID", "ar", "Argentina", 84),
  p("Rodrigo De Paul", "MID", "ar", "Argentina", 83),
  p("Sofyan Amrabat", "MID", "ma", "Morocco", 81),
  p("James Rodríguez", "MID", "co", "Colombia", 80),
  p("Weston McKennie", "MID", "us", "United States", 79),
  p("Tyler Adams", "MID", "us", "United States", 79),
  // Forwards
  p("Kylian Mbappé", "FWD", "fr", "France", 91),
  p("Erling Haaland", "FWD", "no", "Norway", 91),
  p("Vinícius Júnior", "FWD", "br", "Brazil", 90),
  p("Harry Kane", "FWD", "gb-eng", "England", 90),
  p("Mohamed Salah", "FWD", "eg", "Egypt", 89),
  p("Antoine Griezmann", "FWD", "fr", "France", 87),
  p("Lautaro Martínez", "FWD", "ar", "Argentina", 87),
  p("Bukayo Saka", "FWD", "gb-eng", "England", 87),
  p("Lionel Messi", "FWD", "ar", "Argentina", 88),
  p("Rodrygo", "FWD", "br", "Brazil", 86),
  p("Raphinha", "FWD", "br", "Brazil", 86),
  p("Rafael Leão", "FWD", "pt", "Portugal", 86),
  p("Cristiano Ronaldo", "FWD", "pt", "Portugal", 86),
  p("Ousmane Dembélé", "FWD", "fr", "France", 86),
  p("Lamine Yamal", "FWD", "es", "Spain", 86),
  p("Julián Álvarez", "FWD", "ar", "Argentina", 85),
  p("Alexander Isak", "FWD", "se", "Sweden", 85),
  p("Luis Díaz", "FWD", "co", "Colombia", 85),
  p("Nico Williams", "FWD", "es", "Spain", 84),
  p("Marcus Thuram", "FWD", "fr", "France", 84),
  p("Cody Gakpo", "FWD", "nl", "Netherlands", 84),
  p("Romelu Lukaku", "FWD", "be", "Belgium", 84),
  p("Jeremy Doku", "FWD", "be", "Belgium", 83),
  p("Riyad Mahrez", "FWD", "dz", "Algeria", 83),
  p("Sadio Mané", "FWD", "sn", "Senegal", 83),
  p("Memphis Depay", "FWD", "nl", "Netherlands", 82),
  p("Kaoru Mitoma", "FWD", "jp", "Japan", 82),
  p("Christian Pulisic", "FWD", "us", "United States", 82),
  p("Dejan Kulusevski", "FWD", "se", "Sweden", 82),
  p("Mohammed Kudus", "FWD", "gh", "Ghana", 82),
  p("Takefusa Kubo", "FWD", "jp", "Japan", 81),
  p("Brahim Díaz", "FWD", "ma", "Morocco", 81),
  p("Nicolas Jackson", "FWD", "sn", "Senegal", 80),
  p("Santiago Giménez", "FWD", "mx", "Mexico", 80),
];

export const playerById: Record<string, Player> = Object.fromEntries(pool.map((x) => [x.id, x]));

// 4-3-3 formation, drawn bottom (GK) to top (FWD) on a vertical pitch.
export type SlotDef = { id: string; pos: Pos; row: number; col: number; cols: number };
export const formation: SlotDef[] = [
  { id: "gk", pos: "GK", row: 0, col: 0, cols: 1 },
  { id: "d1", pos: "DEF", row: 1, col: 0, cols: 4 },
  { id: "d2", pos: "DEF", row: 1, col: 1, cols: 4 },
  { id: "d3", pos: "DEF", row: 1, col: 2, cols: 4 },
  { id: "d4", pos: "DEF", row: 1, col: 3, cols: 4 },
  { id: "m1", pos: "MID", row: 2, col: 0, cols: 3 },
  { id: "m2", pos: "MID", row: 2, col: 1, cols: 3 },
  { id: "m3", pos: "MID", row: 2, col: 2, cols: 3 },
  { id: "f1", pos: "FWD", row: 3, col: 0, cols: 3 },
  { id: "f2", pos: "FWD", row: 3, col: 1, cols: 3 },
  { id: "f3", pos: "FWD", row: 3, col: 2, cols: 3 },
];

export const TOTAL_SLOTS = formation.length; // 11

export const posLabel: Record<Pos, string> = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  FWD: "Forward",
};

export type Squad = Record<string, string>; // slotId -> playerId

// Average FIFA-style overall of the drafted players (rounded). Null if none drafted.
export function squadOverall(squad: Squad): number | null {
  const ids = Object.values(squad);
  if (ids.length === 0) return null;
  const sum = ids.reduce((s, id) => s + (playerById[id]?.rating ?? 0), 0);
  return Math.round(sum / ids.length);
}

// How far your XI would go in the World Cup, by overall rating. Deliberately steep:
// "World Cup Winner" needs a near-perfect side, so people keep re-drafting to chase it.
export type Verdict = { label: string; emoji: string; blurb: string; champion: boolean };
export function verdict(ovr: number): Verdict {
  if (ovr >= 90) return { label: "World Cup Winner", emoji: "🏆", blurb: "A legendary XI. You'd lift the trophy. Almost nobody gets here.", champion: true };
  if (ovr >= 88) return { label: "Final", emoji: "🥈", blurb: "So close. This team reaches the Final and just falls short.", champion: false };
  if (ovr >= 86) return { label: "Semifinals", emoji: "🔥", blurb: "A genuine contender — semifinal quality.", champion: false };
  if (ovr >= 84) return { label: "Quarterfinals", emoji: "💪", blurb: "A strong side that reaches the last eight.", champion: false };
  if (ovr >= 82) return { label: "Round of 16", emoji: "👏", blurb: "Solid. Out of the group and one knockout round more.", champion: false };
  if (ovr >= 80) return { label: "Round of 32", emoji: "🙂", blurb: "You sneak into the knockouts, then bow out.", champion: false };
  return { label: "Group Stage Exit", emoji: "😬", blurb: "Tough draw. Out in the group. Reset and re-draft to climb.", champion: false };
}

// ---- random-position drafting (the strategy layer) ----
const NEED: Record<Pos, number> = { GK: 1, DEF: 4, MID: 3, FWD: 3 };

export function filledByPos(squad: Squad): Record<Pos, number> {
  const c: Record<Pos, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const id of Object.values(squad)) {
    const pl = playerById[id];
    if (pl) c[pl.pos]++;
  }
  return c;
}

// Positions that still have an open slot in the 4-3-3.
export function openPositions(squad: Squad): Pos[] {
  const c = filledByPos(squad);
  return (["GK", "DEF", "MID", "FWD"] as Pos[]).filter((p) => c[p] < NEED[p]);
}

export function needSummary(squad: Squad): { pos: Pos; left: number }[] {
  const c = filledByPos(squad);
  return (["GK", "DEF", "MID", "FWD"] as Pos[]).map((p) => ({ pos: p, left: NEED[p] - c[p] })).filter((x) => x.left > 0);
}

export const nextOpenSlotForPos = (squad: Squad, pos: Pos): string | null =>
  formation.find((s) => s.pos === pos && !squad[s.id])?.id ?? null;

// Deal `n` random players across the positions that still have open slots (mixed positions
// each turn) — so you must weigh the best player vs. the spots you still need.
export function dealMixed(squad: Squad, excludeIds: Set<string>, n = 5): Player[] {
  const open = new Set(openPositions(squad));
  const avail = pool.filter((pl) => open.has(pl.pos) && !excludeIds.has(pl.id));
  return shuffle(avail).slice(0, n);
}

// Last name for compact display ("Kylian Mbappé" -> "Mbappé", "van Dijk" kept).
export function lastName(name: string): string {
  const parts = name.split(" ");
  if (parts.length === 1) return name;
  const lower = new Set(["van", "de", "der", "dos", "da"]);
  if (parts.length >= 2 && lower.has(parts[parts.length - 2].toLowerCase())) {
    return parts.slice(-2).join(" ");
  }
  return parts[parts.length - 1];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Deal up to `n` random players of a position, excluding ids already used elsewhere.
export function dealOptions(pos: Pos, excludeIds: Set<string>, n = 5): Player[] {
  const avail = pool.filter((pl) => pl.pos === pos && !excludeIds.has(pl.id));
  return shuffle(avail).slice(0, n);
}

export const firstEmptySlot = (squad: Squad): string | null =>
  formation.find((s) => !squad[s.id])?.id ?? null;

// ---- share encode/decode: URL-safe base64 of the squad JSON (works client + server) ----
function b64encode(s: string): string {
  const b = typeof btoa !== "undefined" ? btoa(s) : Buffer.from(s, "binary").toString("base64");
  return b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64decode(s: string): string {
  const t = s.replace(/-/g, "+").replace(/_/g, "/");
  return typeof atob !== "undefined" ? atob(t) : Buffer.from(t, "base64").toString("binary");
}
export function encodeSquad(squad: Squad): string {
  try { return b64encode(JSON.stringify(squad)); } catch { return ""; }
}
export function decodeSquad(s: string): Squad {
  try {
    const obj = JSON.parse(b64decode(s));
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      // keep only valid slot->player entries
      const out: Squad = {};
      for (const slot of formation) {
        const id = obj[slot.id];
        if (typeof id === "string" && playerById[id]?.pos === slot.pos) out[slot.id] = id;
      }
      return out;
    }
  } catch {}
  return {};
}
