// 2026 World Cup "Draft Your XI" — player pool + draft helpers.
//
// Interactive tool: fill a 4-3-3 by drafting one of five random players for each
// position slot, drawn from the stars whose nations are still in the knockouts.
// Pool is curated marquee names (recognizable > exhaustive). Flags reuse
// /flags/<code>.png from the bracket. Math.random is fine here (client only).

export type Pos = "GK" | "DEF" | "MID" | "FWD";

export type Player = {
  id: string;   // unique slug
  name: string;
  pos: Pos;
  flag: string; // /flags/<flag>.png
  team: string; // nation, for display
};

const p = (name: string, pos: Pos, flag: string, team: string): Player => ({
  id: name.toLowerCase().normalize("NFD").replace(/[^a-z ]/g, "").trim().replace(/ +/g, "-"),
  name,
  pos,
  flag,
  team,
});

export const pool: Player[] = [
  // Goalkeepers
  p("Thibaut Courtois", "GK", "be", "Belgium"),
  p("Emiliano Martínez", "GK", "ar", "Argentina"),
  p("Yann Sommer", "GK", "ch", "Switzerland"),
  p("Jordan Pickford", "GK", "gb-eng", "England"),
  p("Unai Simón", "GK", "es", "Spain"),
  p("Alisson", "GK", "br", "Brazil"),
  p("Yassine Bounou", "GK", "ma", "Morocco"),
  p("Bart Verbruggen", "GK", "nl", "Netherlands"),
  // Defenders
  p("Virgil van Dijk", "DEF", "nl", "Netherlands"),
  p("Achraf Hakimi", "DEF", "ma", "Morocco"),
  p("Rúben Dias", "DEF", "pt", "Portugal"),
  p("William Saliba", "DEF", "fr", "France"),
  p("Theo Hernández", "DEF", "fr", "France"),
  p("Jules Koundé", "DEF", "fr", "France"),
  p("Antonio Rüdiger", "DEF", "de", "Germany"),
  p("Joško Gvardiol", "DEF", "hr", "Croatia"),
  p("Cristian Romero", "DEF", "ar", "Argentina"),
  p("Nicolás Otamendi", "DEF", "ar", "Argentina"),
  p("Marquinhos", "DEF", "br", "Brazil"),
  p("John Stones", "DEF", "gb-eng", "England"),
  p("Trent Alexander-Arnold", "DEF", "gb-eng", "England"),
  p("Pau Cubarsí", "DEF", "es", "Spain"),
  p("Dani Carvajal", "DEF", "es", "Spain"),
  p("Manuel Akanji", "DEF", "ch", "Switzerland"),
  p("Denzel Dumfries", "DEF", "nl", "Netherlands"),
  p("Nathan Aké", "DEF", "nl", "Netherlands"),
  p("Alphonso Davies", "DEF", "ca", "Canada"),
  p("Noussair Mazraoui", "DEF", "ma", "Morocco"),
  p("Dayot Upamecano", "DEF", "de", "Germany"),
  // Midfielders
  p("Jude Bellingham", "MID", "gb-eng", "England"),
  p("Rodri", "MID", "es", "Spain"),
  p("Pedri", "MID", "es", "Spain"),
  p("Kevin De Bruyne", "MID", "be", "Belgium"),
  p("Jamal Musiala", "MID", "de", "Germany"),
  p("Florian Wirtz", "MID", "de", "Germany"),
  p("Joshua Kimmich", "MID", "de", "Germany"),
  p("Declan Rice", "MID", "gb-eng", "England"),
  p("Aurélien Tchouaméni", "MID", "fr", "France"),
  p("Eduardo Camavinga", "MID", "fr", "France"),
  p("Luka Modrić", "MID", "hr", "Croatia"),
  p("Frenkie de Jong", "MID", "nl", "Netherlands"),
  p("Moisés Caicedo", "MID", "ec", "Ecuador"),
  p("Enzo Fernández", "MID", "ar", "Argentina"),
  p("Alexis Mac Allister", "MID", "ar", "Argentina"),
  p("Rodrigo De Paul", "MID", "ar", "Argentina"),
  p("Bruno Fernandes", "MID", "pt", "Portugal"),
  p("Vitinha", "MID", "pt", "Portugal"),
  p("Bernardo Silva", "MID", "pt", "Portugal"),
  p("Weston McKennie", "MID", "us", "United States"),
  p("Tyler Adams", "MID", "us", "United States"),
  p("Granit Xhaka", "MID", "ch", "Switzerland"),
  p("Sofyan Amrabat", "MID", "ma", "Morocco"),
  p("James Rodríguez", "MID", "co", "Colombia"),
  // Forwards
  p("Kylian Mbappé", "FWD", "fr", "France"),
  p("Erling Haaland", "FWD", "no", "Norway"),
  p("Mohamed Salah", "FWD", "eg", "Egypt"),
  p("Lamine Yamal", "FWD", "es", "Spain"),
  p("Vinícius Júnior", "FWD", "br", "Brazil"),
  p("Rodrygo", "FWD", "br", "Brazil"),
  p("Raphinha", "FWD", "br", "Brazil"),
  p("Harry Kane", "FWD", "gb-eng", "England"),
  p("Bukayo Saka", "FWD", "gb-eng", "England"),
  p("Lionel Messi", "FWD", "ar", "Argentina"),
  p("Lautaro Martínez", "FWD", "ar", "Argentina"),
  p("Julián Álvarez", "FWD", "ar", "Argentina"),
  p("Cristiano Ronaldo", "FWD", "pt", "Portugal"),
  p("Rafael Leão", "FWD", "pt", "Portugal"),
  p("Nico Williams", "FWD", "es", "Spain"),
  p("Antoine Griezmann", "FWD", "fr", "France"),
  p("Ousmane Dembélé", "FWD", "fr", "France"),
  p("Marcus Thuram", "FWD", "fr", "France"),
  p("Cody Gakpo", "FWD", "nl", "Netherlands"),
  p("Memphis Depay", "FWD", "nl", "Netherlands"),
  p("Romelu Lukaku", "FWD", "be", "Belgium"),
  p("Jeremy Doku", "FWD", "be", "Belgium"),
  p("Kaoru Mitoma", "FWD", "jp", "Japan"),
  p("Takefusa Kubo", "FWD", "jp", "Japan"),
  p("Christian Pulisic", "FWD", "us", "United States"),
  p("Luis Díaz", "FWD", "co", "Colombia"),
  p("Sadio Mané", "FWD", "sn", "Senegal"),
  p("Nicolas Jackson", "FWD", "sn", "Senegal"),
  p("Alexander Isak", "FWD", "se", "Sweden"),
  p("Dejan Kulusevski", "FWD", "se", "Sweden"),
  p("Mohammed Kudus", "FWD", "gh", "Ghana"),
  p("Riyad Mahrez", "FWD", "dz", "Algeria"),
  p("Santiago Giménez", "FWD", "mx", "Mexico"),
  p("Brahim Díaz", "FWD", "ma", "Morocco"),
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

// Last name for compact display ("Kylian Mbappé" -> "Mbappé", "van Dijk" kept).
export function lastName(name: string): string {
  const parts = name.split(" ");
  if (parts.length === 1) return name;
  const lower = new Set(["van", "de", "der", "dos", "da"]);
  // keep particle if it directly precedes the final word
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
