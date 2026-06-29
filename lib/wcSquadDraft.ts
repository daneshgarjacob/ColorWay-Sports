// 2026 World Cup "Draft Your XI" — player pool + draft helpers.
//
// 4-3-3 with REAL positions: GK; LB, CB, CB, RB; CM, CM, CM; LW, ST, RW. Each player
// carries the position(s) they actually play, and can only be drafted into a slot they
// fit — so placement matters. `rating` is a FIFA-style overall (hand-assigned; no live
// EA link). Math.random is fine here (client only).

export type SlotPos = "GK" | "LB" | "CB" | "RB" | "CM" | "LW" | "ST" | "RW";

export type Player = {
  id: string;
  name: string;
  positions: SlotPos[]; // every slot this player can fill
  flag: string;
  team: string;
  rating: number;
};

const p = (name: string, positions: SlotPos[], flag: string, team: string, rating: number): Player => ({
  id: name.toLowerCase().normalize("NFD").replace(/[^a-z ]/g, "").trim().replace(/ +/g, "-"),
  name,
  positions,
  flag,
  team,
  rating,
});

export const pool: Player[] = [
  // Goalkeepers
  p("Thibaut Courtois", ["GK"], "be", "Belgium", 90),
  p("Alisson", ["GK"], "br", "Brazil", 89),
  p("Emiliano Martínez", ["GK"], "ar", "Argentina", 86),
  p("Unai Simón", ["GK"], "es", "Spain", 85),
  p("Yann Sommer", ["GK"], "ch", "Switzerland", 85),
  p("Jordan Pickford", ["GK"], "gb-eng", "England", 84),
  p("Yassine Bounou", ["GK"], "ma", "Morocco", 84),
  p("Bart Verbruggen", ["GK"], "nl", "Netherlands", 81),
  // Defenders
  p("Virgil van Dijk", ["CB"], "nl", "Netherlands", 89),
  p("Rúben Dias", ["CB"], "pt", "Portugal", 88),
  p("Antonio Rüdiger", ["CB"], "de", "Germany", 87),
  p("Marquinhos", ["CB"], "br", "Brazil", 86),
  p("William Saliba", ["CB"], "fr", "France", 85),
  p("Cristian Romero", ["CB"], "ar", "Argentina", 85),
  p("Dayot Upamecano", ["CB"], "de", "Germany", 84),
  p("Nicolás Otamendi", ["CB"], "ar", "Argentina", 83),
  p("Pau Cubarsí", ["CB"], "es", "Spain", 81),
  p("Achraf Hakimi", ["RB"], "ma", "Morocco", 85),
  p("Dani Carvajal", ["RB"], "es", "Spain", 86),
  p("Trent Alexander-Arnold", ["RB"], "gb-eng", "England", 84),
  p("Denzel Dumfries", ["RB"], "nl", "Netherlands", 83),
  p("Jules Koundé", ["RB", "CB"], "fr", "France", 84),
  p("John Stones", ["CB", "RB"], "gb-eng", "England", 84),
  p("Manuel Akanji", ["CB", "RB"], "ch", "Switzerland", 84),
  p("Theo Hernández", ["LB"], "fr", "France", 85),
  p("Alphonso Davies", ["LB"], "ca", "Canada", 84),
  p("Joško Gvardiol", ["LB", "CB"], "hr", "Croatia", 84),
  p("Nathan Aké", ["CB", "LB"], "nl", "Netherlands", 83),
  p("Noussair Mazraoui", ["RB", "LB"], "ma", "Morocco", 81),
  // Midfielders (all central)
  p("Rodri", ["CM"], "es", "Spain", 91),
  p("Jude Bellingham", ["CM"], "gb-eng", "England", 90),
  p("Kevin De Bruyne", ["CM"], "be", "Belgium", 88),
  p("Pedri", ["CM"], "es", "Spain", 88),
  p("Joshua Kimmich", ["CM"], "de", "Germany", 88),
  p("Bruno Fernandes", ["CM"], "pt", "Portugal", 88),
  p("Bernardo Silva", ["CM"], "pt", "Portugal", 88),
  p("Frenkie de Jong", ["CM"], "nl", "Netherlands", 87),
  p("Florian Wirtz", ["CM"], "de", "Germany", 87),
  p("Declan Rice", ["CM"], "gb-eng", "England", 87),
  p("Jamal Musiala", ["CM"], "de", "Germany", 86),
  p("Luka Modrić", ["CM"], "hr", "Croatia", 85),
  p("Aurélien Tchouaméni", ["CM"], "fr", "France", 85),
  p("Moisés Caicedo", ["CM"], "ec", "Ecuador", 85),
  p("Alexis Mac Allister", ["CM"], "ar", "Argentina", 85),
  p("Vitinha", ["CM"], "pt", "Portugal", 85),
  p("Eduardo Camavinga", ["CM"], "fr", "France", 84),
  p("Granit Xhaka", ["CM"], "ch", "Switzerland", 84),
  p("Enzo Fernández", ["CM"], "ar", "Argentina", 84),
  p("Rodrigo De Paul", ["CM"], "ar", "Argentina", 83),
  p("Sofyan Amrabat", ["CM"], "ma", "Morocco", 81),
  p("James Rodríguez", ["CM"], "co", "Colombia", 80),
  p("Weston McKennie", ["CM"], "us", "United States", 79),
  p("Tyler Adams", ["CM"], "us", "United States", 79),
  // Forwards
  p("Kylian Mbappé", ["LW", "ST"], "fr", "France", 91),
  p("Erling Haaland", ["ST"], "no", "Norway", 91),
  p("Vinícius Júnior", ["LW"], "br", "Brazil", 90),
  p("Harry Kane", ["ST"], "gb-eng", "England", 90),
  p("Mohamed Salah", ["RW"], "eg", "Egypt", 89),
  p("Lionel Messi", ["RW", "ST"], "ar", "Argentina", 88),
  p("Antoine Griezmann", ["ST", "RW"], "fr", "France", 87),
  p("Lautaro Martínez", ["ST"], "ar", "Argentina", 87),
  p("Bukayo Saka", ["RW"], "gb-eng", "England", 87),
  p("Rodrygo", ["RW", "LW"], "br", "Brazil", 86),
  p("Raphinha", ["LW", "RW"], "br", "Brazil", 86),
  p("Rafael Leão", ["LW"], "pt", "Portugal", 86),
  p("Cristiano Ronaldo", ["ST", "LW"], "pt", "Portugal", 86),
  p("Ousmane Dembélé", ["RW", "LW"], "fr", "France", 86),
  p("Lamine Yamal", ["RW"], "es", "Spain", 86),
  p("Julián Álvarez", ["ST"], "ar", "Argentina", 85),
  p("Alexander Isak", ["ST"], "se", "Sweden", 85),
  p("Luis Díaz", ["LW"], "co", "Colombia", 85),
  p("Nico Williams", ["LW", "RW"], "es", "Spain", 84),
  p("Marcus Thuram", ["ST"], "fr", "France", 84),
  p("Cody Gakpo", ["LW", "ST"], "nl", "Netherlands", 84),
  p("Romelu Lukaku", ["ST"], "be", "Belgium", 84),
  p("Jeremy Doku", ["LW", "RW"], "be", "Belgium", 83),
  p("Riyad Mahrez", ["RW"], "dz", "Algeria", 83),
  p("Sadio Mané", ["LW", "ST"], "sn", "Senegal", 83),
  p("Memphis Depay", ["ST"], "nl", "Netherlands", 82),
  p("Kaoru Mitoma", ["LW"], "jp", "Japan", 82),
  p("Christian Pulisic", ["LW", "RW"], "us", "United States", 82),
  p("Dejan Kulusevski", ["RW"], "se", "Sweden", 82),
  p("Mohammed Kudus", ["RW", "ST"], "gh", "Ghana", 82),
  p("Takefusa Kubo", ["RW", "LW"], "jp", "Japan", 81),
  p("Brahim Díaz", ["RW", "LW"], "ma", "Morocco", 81),
  p("Nicolas Jackson", ["ST"], "sn", "Senegal", 80),
  p("Santiago Giménez", ["ST"], "mx", "Mexico", 80),
];

export const playerById: Record<string, Player> = Object.fromEntries(pool.map((x) => [x.id, x]));

// 4-3-3 formation with real roles. row: 0 GK (bottom) … 3 forwards (top).
export type SlotDef = { id: string; pos: SlotPos; row: number };
export const formation: SlotDef[] = [
  { id: "gk", pos: "GK", row: 0 },
  { id: "lb", pos: "LB", row: 1 },
  { id: "cb1", pos: "CB", row: 1 },
  { id: "cb2", pos: "CB", row: 1 },
  { id: "rb", pos: "RB", row: 1 },
  { id: "cm1", pos: "CM", row: 2 },
  { id: "cm2", pos: "CM", row: 2 },
  { id: "cm3", pos: "CM", row: 2 },
  { id: "lw", pos: "LW", row: 3 },
  { id: "st", pos: "ST", row: 3 },
  { id: "rw", pos: "RW", row: 3 },
];

export const TOTAL_SLOTS = formation.length; // 11

export const posLabel: Record<SlotPos, string> = {
  GK: "Goalkeeper", LB: "Left Back", CB: "Center Back", RB: "Right Back",
  CM: "Midfielder", LW: "Left Wing", ST: "Striker", RW: "Right Wing",
};

export type Squad = Record<string, string>; // slotId -> playerId

export function squadOverall(squad: Squad): number | null {
  const ids = Object.values(squad);
  if (ids.length === 0) return null;
  const sum = ids.reduce((s, id) => s + (playerById[id]?.rating ?? 0), 0);
  return Math.round(sum / ids.length);
}

// How far your XI would go, by overall rating. Deliberately steep — "World Cup Winner"
// needs a near-perfect side, so people keep re-drafting to chase it.
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

// ---- random-position drafting (you must fill real positions) ----
const slotsByPos = (sq: Squad) => formation.filter((s) => !sq[s.id]);

// Positions that still have an open slot.
export function openSlotPositions(squad: Squad): Set<SlotPos> {
  return new Set(slotsByPos(squad).map((s) => s.pos));
}

// Open spots grouped by position, e.g. [{pos:"CB",left:2}, …], in formation order.
export function needSummary(squad: Squad): { pos: SlotPos; left: number }[] {
  const order: SlotPos[] = ["GK", "LB", "CB", "RB", "CM", "LW", "ST", "RW"];
  const counts: Partial<Record<SlotPos, number>> = {};
  for (const s of slotsByPos(squad)) counts[s.pos] = (counts[s.pos] ?? 0) + 1;
  return order.filter((p2) => counts[p2]).map((p2) => ({ pos: p2, left: counts[p2]! }));
}

// First open slot this player can fill (by formation order).
export const slotForPlayer = (squad: Squad, pl: Player): string | null =>
  formation.find((s) => !squad[s.id] && pl.positions.includes(s.pos))?.id ?? null;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Deal `n` random players who fit at least one still-open position (mixed positions
// each turn) — so you weigh the best player vs. the spots you still need.
export function dealMixed(squad: Squad, excludeIds: Set<string>, n = 5): Player[] {
  const open = openSlotPositions(squad);
  const avail = pool.filter((pl) => !excludeIds.has(pl.id) && pl.positions.some((p2) => open.has(p2)));
  return shuffle(avail).slice(0, n);
}

export function lastName(name: string): string {
  const parts = name.split(" ");
  if (parts.length === 1) return name;
  const lower = new Set(["van", "de", "der", "dos", "da"]);
  if (parts.length >= 2 && lower.has(parts[parts.length - 2].toLowerCase())) return parts.slice(-2).join(" ");
  return parts[parts.length - 1];
}

export const firstEmptySlot = (squad: Squad): string | null =>
  formation.find((s) => !squad[s.id])?.id ?? null;

// ---- share encode/decode: URL-safe base64 of the squad JSON (client + server) ----
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
      const out: Squad = {};
      for (const slot of formation) {
        const id = obj[slot.id];
        if (typeof id === "string" && playerById[id]?.positions.includes(slot.pos)) out[slot.id] = id;
      }
      return out;
    }
  } catch {}
  return {};
}
