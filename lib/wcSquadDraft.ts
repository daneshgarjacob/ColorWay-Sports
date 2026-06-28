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

// A fun tier label for the final squad rating.
export function ratingTier(ovr: number): string {
  if (ovr >= 89) return "World Beaters";
  if (ovr >= 86) return "Title Contenders";
  if (ovr >= 83) return "Knockout Quality";
  if (ovr >= 80) return "Solid Squad";
  return "Plucky Underdogs";
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
