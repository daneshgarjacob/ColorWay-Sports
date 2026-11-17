import Link from "next/link";
import MvSlot from "@/components/MvSlot";
import { ComboChips } from "@/components/UniformRecordBits";
import {
  allRecordTeams,
  colorWord,
  fmtDate,
  fmtPct,
  fmtRecord,
  games,
  jerseySplits,
  possessive,
  winPct,
  RECORDS_THROUGH_WEEK,
  NBA_RECORDS_SEASON,
  NBA_RECORDS_THROUGH,
  NHL_RECORDS_SEASON,
  NHL_RECORDS_THROUGH,
  type RecordCombo,
  type RecordGame,
  type RecordLeague,
  type RecordTeam,
} from "@/lib/uniformRecords";

// "Record In Each Uniform" for the /nfl-tracker, /nba-tracker and /nhl-tracker
// team pages (11/17): the team's win-loss in every look it has worn, a written
// summary, and a game-by-game paragraph per look. Every sentence is built from
// content/data/*uniform-records*.json, nothing typed by hand. The written part
// sits in a .prose <article> like a story body, plus two MvSlot targets, so
// Mediavine's in-content ads have room on what used to be a short page.

type Rec = { w: number; l: number; t: number; otl?: number };
export type TrackerFaqItem = { q: string; a: string; link?: { href: string; label: string } };

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const lc = colorWord;

/** The team's record row, or null when the league has no records file yet. */
export function trackerRecordTeam(league: RecordLeague, name: string): RecordTeam | null {
  const t = allRecordTeams(league).find((x) => x.name === name);
  return t && t.combos.length > 0 ? t : null;
}

const isWinter = (t: RecordTeam) => t.league !== "nfl";
const throughOf = (t: RecordTeam) =>
  t.league === "nhl"
    ? fmtDate(NHL_RECORDS_THROUGH)
    : t.league === "nba"
      ? fmtDate(NBA_RECORDS_THROUGH)
      : `Week ${RECORDS_THROUGH_WEEK}`;
const seasonOf = (t: RecordTeam) =>
  t.league === "nhl" ? NHL_RECORDS_SEASON : t.league === "nba" ? NBA_RECORDS_SEASON : "2026";
const garmentOf = (t: RecordTeam) => (t.league === "nhl" ? "sweater" : t.league === "nba" ? "jersey" : "uniform");

/** Sorted the way readers scan: most worn first, then best record. */
const byWorn = (cs: RecordCombo[]) => [...cs].sort((a, b) => games(b) - games(a) || winPct(b) - winPct(a));

/** "the white jersey with the white helmet and white pants" / "the gold jersey (Icon Edition)". */
function lookName(t: RecordTeam, c: RecordCombo) {
  if (isWinter(t)) {
    // Skip the official name when it only repeats the jersey name ("White Road" / "Road Sweater").
    const have = new Set(c.jerseyName.toLowerCase().split(/\s+/));
    const adds = (c.edition ?? "")
      .toLowerCase()
      .split(/\s+/)
      .some((w) => w && w !== "jersey" && w !== "sweater" && !have.has(w));
    return `the ${lc(c.jerseyName)} jersey${c.edition && adds ? ` (${c.edition})` : ""}`;
  }
  return `the ${lc(c.jerseyName)} jersey with the ${lc(c.helmet)} helmet and ${lc(c.pants)} pants`;
}
/** Table / heading form: "White Jersey, White Helmet, White Pants" / "Gold Jersey". */
function lookTitle(t: RecordTeam, c: RecordCombo) {
  if (isWinter(t)) return `${c.jerseyName} Jersey`;
  return `${c.jerseyName} Jersey, ${c.helmet} Helmet, ${c.pants} Pants`;
}

const recIn = (r: Rec) => `${fmtRecord(r)} in ${plural(games(r), "game", "games")}`;

/** Home / road record from a combo's game list. NHL past-regulation losses count as OTL. */
function sideRecord(t: RecordTeam, gs: RecordGame[]): Rec {
  const r: Rec = { w: 0, l: 0, t: 0, ...(t.league === "nhl" ? { otl: 0 } : {}) };
  for (const g of gs) {
    if (g.result === "W") r.w++;
    else if (g.result === "T") r.t++;
    else if (t.league === "nhl" && (g.ot === "OT" || g.ot === "SO")) r.otl = (r.otl ?? 0) + 1;
    else r.l++;
  }
  return r;
}

const whenOf = (t: RecordTeam, g: RecordGame) =>
  t.league === "nfl" && g.week ? `Week ${g.week} (${fmtDate(g.date)})` : fmtDate(g.date);
const resultOf = (g: RecordGame) => {
  const extra = g.ot === "SO" ? " in a shootout" : g.ot === "OT" || g.ot === true ? " in overtime" : "";
  const verb = g.result === "W" ? "won" : g.result === "T" ? "tied" : "lost";
  // Winner's score first, the way results are written ("lost 29-26").
  const hi = Math.max(g.teamScore, g.oppScore);
  const lo = Math.min(g.teamScore, g.oppScore);
  return `${verb} ${hi}-${lo}${extra}`;
};
function gameText(t: RecordTeam, g: RecordGame) {
  return `${whenOf(t, g)} ${g.home ? "vs." : "at"} the ${g.opponent}, ${resultOf(g)}`;
}

function latestGame(t: RecordTeam) {
  let best: { c: RecordCombo; g: RecordGame } | null = null;
  for (const c of t.combos) for (const g of c.games) if (!best || g.date > best.g.date) best = { c, g };
  return best;
}

/** The plain-English summary paragraphs. Only statements the data supports. */
function summary(t: RecordTeam): string[] {
  const nick = t.nickname;
  const overall: Rec = { w: t.w, l: t.l, t: t.t, otl: t.otl };
  const combos = byWorn(t.combos);
  const most = combos[0];
  const twoPlus = combos.filter((c) => games(c) >= 2);
  const best = [...twoPlus].sort((a, b) => winPct(b) - winPct(a) || games(b) - games(a))[0];
  const worst = [...twoPlus].sort((a, b) => winPct(a) - winPct(b) || games(b) - games(a))[0];
  const kind = isWinter(t) ? "different jerseys" : "different helmet, jersey and pants combinations";
  const out: string[] = [];

  let p1 = `Through ${throughOf(t)}, the ${nick} are ${fmtRecord(overall)}${t.league === "nhl" ? " (wins, regulation losses, overtime and shootout losses)" : ""} in the ${plural(t.gamesCounted, "game", "games")} we have logged, and they have worn ${t.combos.length === 1 ? "one look in all of them" : `${t.combos.length} ${kind}`}.`;
  if (t.missing.length > 0) p1 += ` ${plural(t.missing.length, "game is", "games are")} not logged yet, so ${t.missing.length === 1 ? "it is" : "they are"} not counted here.`;
  if (most) p1 += ` Their most-worn look is ${lookName(t, most)}: ${recIn(most)}.`;
  out.push(p1);

  const p2: string[] = [];
  if (best && best !== most) p2.push(`Among looks worn at least twice, they have done best in ${lookName(t, best)}, going ${recIn(best)}.`);
  else if (best && best === most) p2.push(`That is also their best record among looks worn at least twice.`);
  const unbeaten = twoPlus.filter((c) => c.l === 0 && !c.otl && c.t === 0);
  const winless = twoPlus.filter((c) => c.w === 0);
  if (unbeaten.length > 0)
    p2.push(`They are unbeaten in ${unbeaten.map((c) => `${lookName(t, c)}, at ${fmtRecord(c)}`).join(", and ")}.`);
  if (winless.length > 0)
    p2.push(`They have yet to win in ${winless.map((c) => `${lookName(t, c)}, at ${fmtRecord(c)}`).join(", and ")}.`);
  else if (worst && worst !== best && winPct(worst) < winPct(overall))
    p2.push(`Their weakest record in a look worn at least twice is ${lookName(t, worst)}, at ${fmtRecord(worst)}.`);
  if (t.league === "nfl") {
    const js = jerseySplits(t);
    if (js.length > 1)
      p2.push(`Counting the jersey alone, whatever the helmet and pants: ${js.map((j) => `${fmtRecord(j)} in ${lc(j.label)}`).join(", ")}.`);
  }
  if (p2.length) out.push(p2.join(" "));

  const last = latestGame(t);
  if (last)
    out.push(
      `Most recently, ${t.league === "nfl" && last.g.week ? "in" : "on"} ${whenOf(t, last.g)} ${last.g.home ? "against" : "at"} the ${last.g.opponent}, the ${nick} wore ${lookName(t, last.c)} and ${resultOf(last.g)}. That look is now ${fmtRecord(last.c)}.`
    );
  return out;
}

/** One paragraph per look: record, home and road split, every game. */
function lookParagraph(t: RecordTeam, c: RecordCombo) {
  const nick = t.nickname;
  const home = c.games.filter((g) => g.home);
  const road = c.games.filter((g) => !g.home);
  const sorted = [...c.games].sort((a, b) => a.date.localeCompare(b.date));
  let s = `The ${nick} are ${recIn(c)} in ${lookName(t, c)}`;
  if (home.length && road.length) s += `: ${fmtRecord(sideRecord(t, home))} at home and ${fmtRecord(sideRecord(t, road))} on the road`;
  else if (home.length) s += home.length === 1 ? ", at home" : ", all of them at home";
  else s += road.length === 1 ? ", on the road" : ", all of them on the road";
  s += ".";
  if (sorted.length === 1) s += ` They wore it once: ${gameText(t, sorted[0])}.`;
  else s += ` Game by game: ${sorted.map((g) => gameText(t, g)).join("; ")}.`;
  return s;
}

/** Extra FAQ items, appended to the page's own FAQ so it keeps one FAQPage block. */
export function trackerRecordFaq(t: RecordTeam, scheduleSlug: string | undefined): TrackerFaqItem[] {
  const nick = t.nickname;
  const pos = possessive(nick);
  const combos = byWorn(t.combos);
  const most = combos[0];
  const twoPlus = combos.filter((c) => games(c) >= 2);
  const best = [...(twoPlus.length ? twoPlus : combos)].sort((a, b) => winPct(b) - winPct(a) || games(b) - games(a))[0];
  const out: TrackerFaqItem[] = [];
  if (most) {
    out.push({
      q: `What is the ${pos} record in ${isWinter(t) ? `the ${lc(most.jerseyName)} jersey` : `their most-worn uniform`}?`,
      a: `${recIn(most)} in ${lookName(t, most)}, through ${throughOf(t)}. It is the look they have worn most this season.`,
    });
  }
  if (best) {
    out.push({
      q: `Which ${nick} ${garmentOf(t)} has the best record this season?`,
      a: twoPlus.length
        ? `Among looks worn at least twice, ${lookName(t, best)}: ${recIn(best)} (a ${fmtPct(best)} ${t.league === "nhl" ? "points percentage" : "winning percentage"}).`
        : `No look has been worn twice yet. The best so far is ${lookName(t, best)}, ${recIn(best)}.`,
    });
  }
  out.push({
    q: isWinter(t)
      ? `How many different jerseys have the ${nick} worn this season?`
      : `How many different uniform combinations have the ${nick} actually worn so far?`,
    a: `${t.combos.length} through ${throughOf(t)}: ${byWorn(t.combos)
      .map((c) => `${lookName(t, c).replace(/^the /, "")} (${plural(games(c), "game", "games")}, ${fmtRecord(c)})`)
      .join("; ")}.`,
  });
  out.push({
    q: `What is the ${pos} overall record in the games we have logged?`,
    a: `${fmtRecord({ w: t.w, l: t.l, t: t.t, otl: t.otl })} in ${plural(t.gamesCounted, "game", "games")} through ${throughOf(t)}, counting only games where we confirmed the ${garmentOf(t)} from game photos.`,
    link: { href: `/uniform-records/${t.slug}`, label: `${nick} record in every ${garmentOf(t)}` },
  });
  if (scheduleSlug) {
    out.push({
      q: `Where is the full game-by-game ${nick} uniform schedule?`,
      a: `In the ${t.name} ${seasonOf(t)} uniform schedule, which lists every game and the ${garmentOf(t)} for each one, with why each look lands where it does.`,
      link: { href: `/stories/${scheduleSlug}`, label: "Full game-by-game schedule" },
    });
  }
  return out;
}

export default function TrackerRecordsSection({ team: t }: { team: RecordTeam }) {
  const nick = t.nickname;
  const combos = byWorn(t.combos);
  const nhl = t.league === "nhl";
  const unit = isWinter(t) ? "Jersey" : "Uniform";
  // Color chips, not photos: the calendar and uniform list above already show
  // these jersey photos, and a page never repeats a photo (Jake 11/14).

  return (
    <section id="records" className="max-w-[980px] mx-auto px-5 pt-12 scroll-mt-28">
      <h2 className="text-[26px] font-extrabold text-blue-dark mb-1">
        {possessive(nick)} Record In Each {unit}
      </h2>
      <p className="text-[15px] text-gray-medium mb-5">
        {seasonOf(t)} season through {throughOf(t)}, from our own game-photo logs.
        {nhl ? " Records read wins, regulation losses, then overtime and shootout losses." : ""}
      </p>

      <article className="prose prose-continued max-w-none">
        {summary(t).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </article>

      <div className="overflow-x-auto rounded-xl border border-black/[0.08] bg-white mt-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#5b6474] border-b border-black/[0.08]">
              <th scope="col" className="px-4 py-3">{unit}</th>
              <th scope="col" className="px-3 py-3 text-right">Games</th>
              <th scope="col" className="px-4 py-3 text-right">{nhl ? "W-L-OTL" : "Record"}</th>
            </tr>
          </thead>
          <tbody>
            {combos.map((c) => (
              <tr key={c.id} className="border-b border-black/[0.06] last:border-b-0">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-3">
                    {isWinter(t) ? (
                      <span
                        aria-hidden
                        className="w-3 h-10 rounded-full shrink-0 border border-black/10"
                        style={{ background: c.hexes[1] }}
                      />
                    ) : (
                      <ComboChips hexes={c.hexes} labels={[c.helmet, c.jerseyName, c.pants]} size={18} />
                    )}
                    <span className="min-w-0">
                      <span className="block text-[16px] font-bold text-blue-dark leading-tight">{lookTitle(t, c)}</span>
                      {isWinter(t) && c.edition ? (
                        <span className="block text-[15px] text-black/60 leading-tight mt-0.5">{c.edition}</span>
                      ) : null}
                    </span>
                  </span>
                </td>
                <td className="px-3 py-3 text-right text-[16px] font-semibold text-black/70 tabular-nums">{games(c)}</td>
                <td className="px-4 py-3 text-right text-[20px] font-extrabold text-blue-dark tabular-nums whitespace-nowrap">
                  {fmtRecord(c)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[15px] text-black/60 mt-3">
        Every game, every look and every score:{" "}
        <Link prefetch={false} href={`/uniform-records/${t.slug}`} className="text-[#0025CC] font-semibold hover:underline">
          {possessive(nick)} full uniform record
        </Link>
        . All teams are on the{" "}
        <Link prefetch={false} href="/uniform-records" className="text-[#0025CC] font-semibold hover:underline">
          Uniform Records
        </Link>{" "}
        page.
      </p>

      <MvSlot className="my-10" />

      <h2 className="text-[26px] font-extrabold text-blue-dark mb-1">
        How Every {nick} {unit} Has Done, Game By Game
      </h2>
      <p className="text-[15px] text-gray-medium mb-5">Most-worn first. Home and road splits, then each result in order.</p>
      <article className="prose prose-continued max-w-none">
        {combos.map((c, i) => (
          <div key={c.id}>
            <h3>{lookTitle(t, c)}</h3>
            <p>{lookParagraph(t, c)}</p>
            {i === 2 && combos.length > 4 ? <MvSlot className="my-8" /> : null}
          </div>
        ))}
      </article>
    </section>
  );
}
