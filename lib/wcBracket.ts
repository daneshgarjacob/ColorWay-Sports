// 2026 World Cup Round of 32 interactive bracket — data + engine.
//
// Powers /world-cup-rooting-guide (URL kept for SEO equity; repurposed from the
// group-stage rooting guide once all 12 groups finished on 2026-06-27).
//
// The 32 are the 12 group winners, 12 runners-up, and 8 best third-place teams.
// Matchups + bracket order verified 2026-06-28 against the official Round of 32
// draw (Yahoo Sports / FOX / CBS). Group J resolved: Argentina 1st, Austria 2nd,
// Algeria through as a best third.
//
// Bracket tree per the official FotMob knockout bracket (corrected 2026-06-28 — the
// earlier Yahoo-listed pairing was wrong). R16 feeders: r16-1 GER/PAR·FRA/SWE,
// r16-2 RSA/CAN·NED/MAR, r16-3 POR/CRO·ESP/AUT, r16-4 USA/BIH·BEL/SEN (left half);
// r16-5 BRA/JPN·CIV/NOR, r16-6 MEX/ECU·ENG/COD, r16-7 ARG/CPV·AUS/EGY,
// r16-8 SUI/ALG·COL/GHA (right half). QF pairs r16 1·2 / 3·4 / 5·6 / 7·8; SF pairs
// qf 1·2 (left) and 3·4 (right); Final = the two SF winners.

export type BracketTeam = {
  key: string;   // 3-letter code, also the flag-independent id
  name: string;  // display name
  flag: string;  // /flags/<flag>.png stem
  color: string; // brand-identity color for chips + the share image
};

export const teams: Record<string, BracketTeam> = {
  RSA: { key: "RSA", name: "South Africa", flag: "za", color: "#007A4D" },
  CAN: { key: "CAN", name: "Canada", flag: "ca", color: "#D52B1E" },
  BRA: { key: "BRA", name: "Brazil", flag: "br", color: "#FFD400" },
  JPN: { key: "JPN", name: "Japan", flag: "jp", color: "#2A41B8" },
  GER: { key: "GER", name: "Germany", flag: "de", color: "#2B2B2B" },
  PAR: { key: "PAR", name: "Paraguay", flag: "py", color: "#D52B1E" },
  NED: { key: "NED", name: "Netherlands", flag: "nl", color: "#EC6A1E" },
  MAR: { key: "MAR", name: "Morocco", flag: "ma", color: "#C1272D" },
  CIV: { key: "CIV", name: "Ivory Coast", flag: "ci", color: "#F77F00" },
  NOR: { key: "NOR", name: "Norway", flag: "no", color: "#BA0C2F" },
  FRA: { key: "FRA", name: "France", flag: "fr", color: "#002395" },
  SWE: { key: "SWE", name: "Sweden", flag: "se", color: "#FFCD00" },
  MEX: { key: "MEX", name: "Mexico", flag: "mx", color: "#006847" },
  ECU: { key: "ECU", name: "Ecuador", flag: "ec", color: "#FFD400" },
  ENG: { key: "ENG", name: "England", flag: "gb-eng", color: "#C8102E" },
  COD: { key: "COD", name: "Congo DR", flag: "cd", color: "#2E7DE0" },
  BEL: { key: "BEL", name: "Belgium", flag: "be", color: "#E30613" },
  SEN: { key: "SEN", name: "Senegal", flag: "sn", color: "#00853F" },
  USA: { key: "USA", name: "United States", flag: "us", color: "#1A3A8F" },
  BIH: { key: "BIH", name: "Bosnia", flag: "ba", color: "#1F4FA8" },
  ESP: { key: "ESP", name: "Spain", flag: "es", color: "#C60B1E" },
  AUT: { key: "AUT", name: "Austria", flag: "at", color: "#ED2939" },
  POR: { key: "POR", name: "Portugal", flag: "pt", color: "#DA291C" },
  CRO: { key: "CRO", name: "Croatia", flag: "hr", color: "#C8102E" },
  SUI: { key: "SUI", name: "Switzerland", flag: "ch", color: "#D52B1E" },
  ALG: { key: "ALG", name: "Algeria", flag: "dz", color: "#0B7A3B" },
  AUS: { key: "AUS", name: "Australia", flag: "au", color: "#00843D" },
  EGY: { key: "EGY", name: "Egypt", flag: "eg", color: "#CE1126" },
  ARG: { key: "ARG", name: "Argentina", flag: "ar", color: "#75AADB" },
  CPV: { key: "CPV", name: "Cape Verde", flag: "cv", color: "#003893" },
  COL: { key: "COL", name: "Colombia", flag: "co", color: "#0033A0" },
  GHA: { key: "GHA", name: "Ghana", flag: "gh", color: "#006B3F" },
};

export type RoundId = "r32" | "r16" | "qf" | "sf" | "final";

export const rounds: { id: RoundId; name: string; short: string }[] = [
  { id: "r32", name: "Round of 32", short: "R32" },
  { id: "r16", name: "Round of 16", short: "R16" },
  { id: "qf", name: "Quarterfinals", short: "QF" },
  { id: "sf", name: "Semifinals", short: "SF" },
  { id: "final", name: "Final", short: "Final" },
];

// A tie participant is either a fixed team (Round of 32) or the winner of a feeder tie.
export type Slot = { team: string } | { from: string };

export type Tie = {
  id: string;
  round: RoundId;
  a: Slot;
  b: Slot;
  date?: string; // Round of 32 only
};

// ---- DATA: the 16 Round of 32 matchups, in bracket order ----
const t = (team: string): Slot => ({ team });
const w = (from: string): Slot => ({ from });

export const ties: Tie[] = [
  // Round of 32
  { id: "r32-1", round: "r32", a: t("RSA"), b: t("CAN"), date: "June 28" },
  { id: "r32-2", round: "r32", a: t("BRA"), b: t("JPN"), date: "June 29" },
  { id: "r32-3", round: "r32", a: t("GER"), b: t("PAR"), date: "June 29" },
  { id: "r32-4", round: "r32", a: t("NED"), b: t("MAR"), date: "June 29" },
  { id: "r32-5", round: "r32", a: t("CIV"), b: t("NOR"), date: "June 30" },
  { id: "r32-6", round: "r32", a: t("FRA"), b: t("SWE"), date: "June 30" },
  { id: "r32-7", round: "r32", a: t("MEX"), b: t("ECU"), date: "June 30" },
  { id: "r32-8", round: "r32", a: t("ENG"), b: t("COD"), date: "July 1" },
  { id: "r32-9", round: "r32", a: t("BEL"), b: t("SEN"), date: "July 1" },
  { id: "r32-10", round: "r32", a: t("USA"), b: t("BIH"), date: "July 1" },
  { id: "r32-11", round: "r32", a: t("ESP"), b: t("AUT"), date: "July 2" },
  { id: "r32-12", round: "r32", a: t("POR"), b: t("CRO"), date: "July 2" },
  { id: "r32-13", round: "r32", a: t("SUI"), b: t("ALG"), date: "July 2" },
  { id: "r32-14", round: "r32", a: t("AUS"), b: t("EGY"), date: "July 3" },
  { id: "r32-15", round: "r32", a: t("ARG"), b: t("CPV"), date: "July 3" },
  { id: "r32-16", round: "r32", a: t("COL"), b: t("GHA"), date: "July 3" },
  // Round of 16 — pairings per the official FotMob knockout bracket.
  { id: "r16-1", round: "r16", a: w("r32-3"), b: w("r32-6") },   // GER/PAR vs FRA/SWE
  { id: "r16-2", round: "r16", a: w("r32-1"), b: w("r32-4") },   // RSA/CAN vs NED/MAR
  { id: "r16-3", round: "r16", a: w("r32-12"), b: w("r32-11") }, // POR/CRO vs ESP/AUT
  { id: "r16-4", round: "r16", a: w("r32-10"), b: w("r32-9") },  // USA/BIH vs BEL/SEN
  { id: "r16-5", round: "r16", a: w("r32-2"), b: w("r32-5") },   // BRA/JPN vs CIV/NOR
  { id: "r16-6", round: "r16", a: w("r32-7"), b: w("r32-8") },   // MEX/ECU vs ENG/COD
  { id: "r16-7", round: "r16", a: w("r32-15"), b: w("r32-14") }, // ARG/CPV vs AUS/EGY
  { id: "r16-8", round: "r16", a: w("r32-13"), b: w("r32-16") }, // SUI/ALG vs COL/GHA
  // Quarterfinals
  { id: "qf-1", round: "qf", a: w("r16-1"), b: w("r16-2") },
  { id: "qf-2", round: "qf", a: w("r16-3"), b: w("r16-4") },
  { id: "qf-3", round: "qf", a: w("r16-5"), b: w("r16-6") },
  { id: "qf-4", round: "qf", a: w("r16-7"), b: w("r16-8") },
  // Semifinals
  { id: "sf-1", round: "sf", a: w("qf-1"), b: w("qf-2") },
  { id: "sf-2", round: "sf", a: w("qf-3"), b: w("qf-4") },
  // Final
  { id: "final", round: "final", a: w("sf-1"), b: w("sf-2") },
];

export const tieById: Record<string, Tie> = Object.fromEntries(ties.map((x) => [x.id, x]));
export const tiesByRound = (r: RoundId) => ties.filter((x) => x.round === r);

export type Picks = Record<string, string>;

// Resolve a slot to a concrete team key, or null if not yet decided.
export function resolveSlot(slot: Slot, picks: Picks): string | null {
  if ("team" in slot) return slot.team;
  return picks[slot.from] ?? null;
}

// The two participants of a tie, given current picks (either may be null).
export function participants(tieId: string, picks: Picks): [string | null, string | null] {
  const tie = tieById[tieId];
  return [resolveSlot(tie.a, picks), resolveSlot(tie.b, picks)];
}

// Every leaf team that could possibly arrive in this slot (ignores picks) — used
// for the "Winner of ..." preview on empty future slots.
export function slotLeaves(slot: Slot): string[] {
  if ("team" in slot) return [slot.team];
  const tie = tieById[slot.from];
  return [...slotLeaves(tie.a), ...slotLeaves(tie.b)];
}

// After a pick changes, drop any downstream pick whose chosen team is no longer a
// valid participant of its tie. Process rounds in order so cascades settle in one pass.
export function prune(picks: Picks): Picks {
  const next: Picks = { ...picks };
  for (const r of ["r16", "qf", "sf", "final"] as RoundId[]) {
    for (const tie of tiesByRound(r)) {
      const chosen = next[tie.id];
      if (!chosen) continue;
      const [pa, pb] = participants(tie.id, next);
      if (chosen !== pa && chosen !== pb) delete next[tie.id];
    }
  }
  return next;
}

export function pickWinner(picks: Picks, tieId: string, teamKey: string): Picks {
  return prune({ ...picks, [tieId]: teamKey });
}

export const champion = (picks: Picks): string | null => picks["final"] ?? null;

// ---- ACTUAL RESULTS (games already played) ----
// Locked, real outcomes. These override the user's prediction for that tie and
// cascade downstream. Add each game here as it finishes.
export type Result = { winner: string; score?: string };
export const results: Record<string, Result> = {
  "r32-1": { winner: "CAN", score: "1-0" },      // June 28 — Canada beat South Africa
  "r32-2": { winner: "BRA", score: "2-1" },      // June 29 — Brazil beat Japan
  "r32-3": { winner: "PAR", score: "1-1 (P)" },  // June 29 — Paraguay beat Germany on penalties after 1-1
  "r32-4": { winner: "MAR", score: "1-1 (P)" },  // June 29 — Morocco beat Netherlands on penalties after 1-1
  "r32-5": { winner: "NOR", score: "2-1" },      // June 30 — Norway beat Ivory Coast 2-1
  "r32-6": { winner: "FRA", score: "3-0" },      // June 30 — France beat Sweden 3-0
  "r32-7": { winner: "MEX" },                    // June 30 — Mexico beat Ecuador (score TBC)
  "r32-8": { winner: "ENG", score: "2-1" },      // July 1 — England beat Congo DR 2-1
  "r32-9": { winner: "BEL", score: "3-2" },      // July 1 — Belgium beat Senegal 3-2
  "r32-10": { winner: "USA", score: "2-0" },     // July 1 — USA beat Bosnia 2-0
  "r32-11": { winner: "ESP", score: "3-0" },     // July 2 — Spain beat Austria 3-0
  "r32-12": { winner: "POR", score: "2-1" },     // July 2 — Portugal beat Croatia 2-1
  "r32-13": { winner: "SUI", score: "2-0" },     // July 2 — Switzerland beat Algeria 2-0
  "r32-14": { winner: "EGY", score: "1-1 (P 4-2)" }, // July 3 — Egypt beat Australia on penalties (4-2) after 1-1
};

// Merge the locked results over the user's predictions (results win) and prune.
export function effectivePicks(userPicks: Picks): Picks {
  const merged: Picks = { ...userPicks };
  for (const [tieId, r] of Object.entries(results)) merged[tieId] = r.winner;
  return prune(merged);
}

// ---- flag emoji (for share text + link previews) ----
export function flagEmoji(code: string): string {
  if (code === "gb-eng") return "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}"; // England
  const cc = code.toUpperCase();
  if (cc.length !== 2) return "\u{1F3F3}\u{FE0F}";
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

// ---- share encode/decode: compact URL-safe base64 of the picks JSON (works client + server) ----
function b64encode(s: string): string {
  const b = typeof btoa !== "undefined" ? btoa(s) : Buffer.from(s, "binary").toString("base64");
  return b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64decode(s: string): string {
  const t = s.replace(/-/g, "+").replace(/_/g, "/");
  return typeof atob !== "undefined" ? atob(t) : Buffer.from(t, "base64").toString("binary");
}
export function encodePicks(picks: Picks): string {
  try { return b64encode(JSON.stringify(picks)); } catch { return ""; }
}
export function decodePicks(s: string): Picks {
  try {
    const obj = JSON.parse(b64decode(s));
    if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj as Picks;
  } catch {}
  return {};
}
