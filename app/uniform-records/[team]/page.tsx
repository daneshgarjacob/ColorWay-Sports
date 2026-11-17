import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MvSlot from "@/components/MvSlot";
import TeamMoreBlock from "@/components/TeamMoreBlock";
import { ComboChips, RecordBadge, toneOf } from "@/components/UniformRecordBits";
import { buildTeamMoreLinks } from "@/lib/teamMoreLinks";
import { teamSlug } from "@/lib/teamLogos";
import {
  allRecordTeamSlugs,
  recordTeamBySlug,
  jerseySplits,
  pantsSplits,
  helmetSplits,
  fmtRecord,
  fmtDate,
  games,
  winPct,
  possessive,
  colorWord,
  RECORDS_THROUGH_WEEK,
  NBA_RECORDS_SEASON,
  NBA_RECORDS_THROUGH,
  NHL_RECORDS_SEASON,
  NHL_RECORDS_THROUGH,
  type RecordTeam,
  type RecordCombo,
  type Split,
} from "@/lib/uniformRecords";

// /uniform-records/<team>: one club's record in every combination it has worn,
// game by game, plus the jersey / pants / helmet splits fans actually ask about
// ("what are the Lions in silver pants?"). Static, built from
// content/data/uniform-records-2026.json.

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return allRecordTeamSlugs().map((team) => ({ team }));
}

export async function generateMetadata({ params }: { params: Promise<{ team: string }> }): Promise<Metadata> {
  const { team } = await params;
  const t = recordTeamBySlug(team);
  if (!t) return {};
  const nba = t.league === "nba";
  const nhl = t.league === "nhl";
  const title = nhl
    ? `${t.name} Record In Every Jersey: ${NHL_RECORDS_SEASON} Win-Loss By Sweater`
    : nba
      ? `${t.name} Record In Every Jersey: ${NBA_RECORDS_SEASON} Win-Loss By Uniform`
      : `${t.name} Record In Every Uniform: 2026 Win-Loss By Jersey, Helmet And Pants`;
  const description = nhl
    ? `The ${possessive(t.nickname)} ${NHL_RECORDS_SEASON} record in each of the ${t.combos.length} jerseys they have worn through ${fmtDate(NHL_RECORDS_THROUGH)}, W-L-OTL, game by game, from ColorWay Sports' own sweater logs.`
    : nba
      ? `The ${possessive(t.nickname)} ${NBA_RECORDS_SEASON} record in each of the ${t.combos.length} jerseys they have worn through ${fmtDate(NBA_RECORDS_THROUGH)}, game by game, from ColorWay Sports' own uniform logs.`
      : `The ${possessive(t.nickname)} 2026 record in each of the ${t.combos.length} uniform combinations they have worn through Week ${RECORDS_THROUGH_WEEK}, game by game, from ColorWay Sports' own uniform logs.`;
  return {
    title,
    description,
    alternates: { canonical: `/uniform-records/${t.slug}` },
    openGraph: { title: `${t.name} Uniform Records ${seasonOf(t)}`, description, url: `/uniform-records/${t.slug}`, type: "article" },
  };
}

const lc = colorWord;
/** NBA and NHL records are by jersey; the NFL's are by helmet, jersey and pants. */
const isNba = (t: RecordTeam) => t.league === "nba" || t.league === "nhl";
const seasonOf = (t: RecordTeam) =>
  t.league === "nhl" ? NHL_RECORDS_SEASON : t.league === "nba" ? NBA_RECORDS_SEASON : "2026";
const throughOf = (t: RecordTeam) =>
  t.league === "nhl"
    ? fmtDate(NHL_RECORDS_THROUGH)
    : t.league === "nba"
      ? fmtDate(NBA_RECORDS_THROUGH)
      : `Week ${RECORDS_THROUGH_WEEK}`;
const trackerOf = (t: RecordTeam) =>
  t.league === "nhl"
    ? { href: "/stories/nhl-uniform-tracker-2026-27", label: "NHL Uniform Tracker" }
    : t.league === "nba"
      ? { href: "/stories/nba-uniform-tracker-2026-27", label: "NBA Uniform Tracker" }
      : { href: "/stories/nfl-uniform-tracker-2026", label: "NFL Uniform Tracker" };
/** "OT" / "SO" after an NHL score, "OT" after an NBA one. */
const extraOf = (ot: boolean | "OT" | "SO" | undefined) => (ot === true ? " OT" : ot ? ` ${ot}` : "");
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function buildNbaFaq(t: RecordTeam) {
  const nick = t.nickname;
  const pos = possessive(nick);
  const through = throughOf(t);
  const recWord = (s: { w: number; l: number; t: number; otl?: number }) => `${fmtRecord(s)} (${plural(games(s), "game", "games")})`;
  const out: { q: string; a: string }[] = [
    {
      q: `What is the ${pos} record in each jersey this season?`,
      a: `Through ${through}, the ${nick} have worn ${plural(t.combos.length, "jersey", "different jerseys")}. ${t.combos
        .map((c) => `In the ${lc(c.jerseyName)} jersey (${c.edition}) they are ${fmtRecord(c)}.`)
        .join(" ")}`,
    },
  ];
  for (const c of t.combos) {
    out.push({
      q: `What is the ${pos} record in the ${lc(c.jerseyName)} jersey?`,
      a: `The ${nick} are ${recWord(c)} in the ${lc(c.jerseyName)} jersey, the ${c.edition}, this season through ${through}.`,
    });
  }
  if (t.league === "nhl") {
    out.push({
      q: "How are these NHL records counted?",
      a: `Wins, regulation losses, then overtime and shootout losses (W-L-OTL), the way NHL standings count them. Only regular-season games count, and only games where we confirmed the ${possessive(nick)} sweater from game photos. Scores are ESPN finals.`,
    });
  }
  const best = [...t.combos].filter((c) => games(c) >= 2).sort((a, b) => winPct(b) - winPct(a) || games(b) - games(a))[0];
  if (best) {
    out.push({
      q: `Which jersey have the ${nick} played best in?`,
      a: `Among jerseys worn at least twice, the ${lc(best.jerseyName)} ${best.edition}: ${recWord(best)}.`,
    });
  }
  return out;
}

function buildFaq(t: RecordTeam) {
  if (isNba(t)) return buildNbaFaq(t);
  const nick = t.nickname;
  const pos = possessive(nick);
  const out: { q: string; a: string }[] = [];
  const recWord = (s: { w: number; l: number; t: number }) => `${fmtRecord(s)} (${plural(games(s), "game", "games")})`;

  const best = [...t.combos].filter((c) => games(c) >= 2).sort((a, b) => winPct(b) - winPct(a) || games(b) - games(a))[0];
  const mostWorn = t.combos[0];
  out.push({
    q: `What is the ${pos} record in each uniform in 2026?`,
    a: `Through Week ${RECORDS_THROUGH_WEEK}, the ${nick} have worn ${plural(t.combos.length, "helmet, jersey and pants combination", "different helmet, jersey and pants combinations")}. ${t.combos
      .slice(0, 4)
      .map((c) => `In the ${lc(c.jerseyName)} jersey with the ${lc(c.helmet)} helmet and ${lc(c.pants)} pants they are ${fmtRecord(c)}.`)
      .join(" ")}${t.combos.length > 4 ? " Every other combination is listed on this page." : ""}`,
  });

  for (const p of pantsSplits(t)) {
    out.push({ q: `What is the ${pos} record in ${lc(p.label)} pants?`, a: `The ${nick} are ${recWord(p)} in ${lc(p.label)} pants this season, through Week ${RECORDS_THROUGH_WEEK}.` });
  }
  for (const j of jerseySplits(t).slice(0, 4)) {
    out.push({
      q: `What is the ${pos} record in the ${lc(j.label)} jersey?`,
      a: `The ${nick} are ${recWord(j)} in the ${lc(j.label)} jersey this season, counting every helmet and pants pairing.`,
    });
  }
  if (best) {
    out.push({
      q: `Which uniform have the ${nick} played best in?`,
      a: `Among combinations worn at least twice, the ${nick} have done best in the ${lc(best.jerseyName)} jersey with the ${lc(best.helmet)} helmet and ${lc(best.pants)} pants: ${recWord(best)}.`,
    });
  }
  if (mostWorn) {
    out.push({
      q: `What uniform have the ${nick} worn the most this season?`,
      a: `The ${lc(mostWorn.jerseyName)} jersey with the ${lc(mostWorn.helmet)} helmet and ${lc(mostWorn.pants)} pants, ${plural(games(mostWorn), "time", "times")}. They are ${fmtRecord(mostWorn)} in it.`,
    });
  }
  return out;
}

function SplitTable({ title, rows, unit }: { title: string; rows: Split[]; unit: string }) {
  return (
    <div>
      <h3 className="text-[20px] sm:text-[22px] font-extrabold text-black mb-3">{title}</h3>
      <ul className="flex flex-col gap-2 list-none p-0 m-0">
        {rows.map((s) => (
          <li key={s.label} className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-3">
            <span
              aria-hidden
              className="w-6 h-6 rounded-md flex-shrink-0"
              style={{ background: s.hex, border: "1px solid rgba(0,0,0,0.18)" }}
            />
            <span className="min-w-0 flex-1 text-[18px] font-bold text-black leading-tight">
              {s.label} {unit}
              <span className="block text-[15px] font-semibold text-[#5b6474] mt-0.5">{plural(s.games, "game", "games")}</span>
            </span>
            <RecordBadge text={fmtRecord(s)} tone={toneOf(s)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ComboCard({ c, team, showImg }: { c: RecordCombo; team: RecordTeam; showImg: boolean }) {
  return (
    <article id={c.id} className="scroll-mt-28 rounded-2xl border border-black/10 bg-white p-4 sm:p-5">
      <div className="flex items-start gap-4">
        {showImg && c.img ? (
          <div className="w-[84px] h-[96px] sm:w-[100px] sm:h-[114px] flex-shrink-0 rounded-xl bg-[#f3f5fa] flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element -- public/ images are served raw site-wide */}
            <img
              src={c.img}
              alt={`${team.name} ${c.jerseyName} jersey`}
              loading="lazy"
              decoding="async"
              className="max-w-[92%] max-h-[92%] object-contain"
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[21px] sm:text-[24px] font-extrabold text-black leading-tight m-0">{c.jerseyName} Jersey</h3>
            <RecordBadge text={fmtRecord(c)} tone={toneOf(c)} />
          </div>
          {isNba(team) ? (
            <p className="mt-2 text-[17px] text-[#3c4250] leading-snug m-0">{c.edition}</p>
          ) : (
            <div className="mt-2 flex items-center gap-2.5">
              <ComboChips hexes={c.hexes} labels={[c.helmet, c.jerseyName, c.pants]} size={18} />
              <p className="text-[17px] text-[#3c4250] leading-snug m-0">
                {c.helmet} helmet, {c.pants} pants
              </p>
            </div>
          )}
        </div>
      </div>
      <ul className="mt-4 flex flex-col divide-y divide-black/[0.07] list-none p-0 m-0 border-t border-black/[0.07]">
        {c.games.map((g) => (
          <li key={g.date} className="flex items-center gap-3 py-2.5 text-[17px]">
            <span className="flex-shrink-0 whitespace-nowrap text-[#5b6474] font-semibold tabular-nums">
              {g.week ? <span className="hidden sm:inline">{`Wk ${g.week} · `}</span> : null}
              {fmtDate(g.date)}
            </span>
            <span className="min-w-0 flex-1 font-bold text-black truncate">
              {g.home ? "vs" : "at"}{" "}
              <Link prefetch={false} href={`/uniform-records/${teamSlug(g.opponent)}`} className="text-black hover:text-[#0025CC] hover:underline">
                {g.opponent.split(" ").slice(-1)[0]}
              </Link>
            </span>
            <Link
              prefetch={false}
              href={g.link}
              className="flex-shrink-0 font-extrabold tabular-nums hover:underline"
              style={{ color: g.result === "W" ? "#0025CC" : g.result === "L" ? "#b42318" : "#0b0b0f" }}
              title={`See the game in the ${trackerOf(team).label}`}
            >
              {`${g.result} ${g.teamScore}-${g.oppScore}${extraOf(g.ot)}`}
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default async function TeamUniformRecordsPage({ params }: { params: Promise<{ team: string }> }) {
  const { team } = await params;
  const t = recordTeamBySlug(team);
  if (!t) notFound();

  const faq = buildFaq(t);
  const jerseys = jerseySplits(t);
  const pants = pantsSplits(t);
  const helmets = helmetSplits(t);

  // One photo per jersey, on the first card that wears it: never the same photo twice.
  const seen = new Set<string>();
  const showImg = t.combos.map((c) => {
    if (!c.img || seen.has(c.img)) return false;
    seen.add(c.img);
    return true;
  });

  const nba = isNba(t);
  const tracker = trackerOf(t);
  const bestPants = nba ? undefined : pants.filter((p) => p.games >= 2).sort((a, b) => winPct(b) - winPct(a))[0];
  const overall = { w: t.w, l: t.l, t: t.t, otl: t.otl };
  const leagueWord = t.league === "nhl" ? "NHL" : t.league === "nba" ? "NBA" : "NFL";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="pb-16">
        <section className="px-4 sm:px-5 pt-10 pb-9" style={{ background: `linear-gradient(135deg, ${t.color} 0%, ${t.color}dd 100%)` }}>
          <div className="max-w-[980px] mx-auto">
            <Link prefetch={false} href={nba ? `/uniform-records#${t.league}` : "/uniform-records"} className="text-[14px] font-bold uppercase tracking-[0.14em] text-white/80 hover:text-white">
              &larr; {leagueWord} Uniform Records
            </Link>
            {t.logo && (
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm mt-5">
                {/* eslint-disable-next-line @next/next/no-img-element -- public/ images are served raw site-wide */}
                <img src={t.logo} alt="" width={44} height={44} className="w-11 h-11 object-contain" />
              </div>
            )}
            <h1 className="text-white font-display font-black text-[34px] sm:text-[46px] leading-[1.06] mt-4 mb-3 tracking-tight">
              {t.name} Record In Every {nba ? "Jersey" : "Uniform"}
            </h1>
            <p className="text-white/90 text-[18px] sm:text-[19px] leading-relaxed max-w-[680px] m-0">
              {nba
                ? `Every jersey the ${t.nickname} have worn in ${seasonOf(t)}, with the result of every game in it, through ${throughOf(t)}. Logged from game photos in our ${leagueWord} uniform tracker.${t.league === "nhl" ? " Records read wins, regulation losses, then overtime and shootout losses." : ""}`
                : `Every helmet, jersey and pants combination the ${t.nickname} have worn in 2026, with the result of every game in it, through ${throughOf(t)}. Logged from game photos in our NFL uniform tracker.`}
            </p>
            <div className="flex flex-wrap gap-x-9 gap-y-4 mt-7">
              {(nba
                ? [
                    [t.league === "nhl" ? "Record (W-L-OTL)" : "Record", fmtRecord(overall)],
                    ["Jerseys", String(t.combos.length)],
                    ["Games Logged", String(t.gamesCounted)],
                  ]
                : [
                    ["Record", fmtRecord(overall)],
                    ["Combinations", String(t.combos.length)],
                    ["Jerseys", String(jerseys.length)],
                    ["Games Logged", String(t.gamesCounted)],
                  ]
              ).map(([label, value]) => (
                <div key={label}>
                  <div className="text-white text-[30px] font-extrabold leading-none tabular-nums">{value}</div>
                  <div className="text-white/75 text-[13px] font-bold uppercase tracking-[0.12em] mt-1.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-[980px] mx-auto px-4 sm:px-5">
          {nba && t.combos[0] && (
            <p className="mt-8 text-[19px] leading-relaxed text-[#2b303b] max-w-[760px]">
              {`Quick answer: the ${t.nickname} are `}
              <strong>{fmtRecord(t.combos[0])}</strong>
              {` in the ${lc(t.combos[0].jerseyName)} jersey, their most-worn this season.`}
            </p>
          )}
          {bestPants && (
            <p className="mt-8 text-[19px] leading-relaxed text-[#2b303b] max-w-[760px]">
              Quick answer: the {t.nickname} are <strong>{fmtRecord(bestPants)}</strong> in {lc(bestPants.label)} pants
              {jerseys[0] ? (
                <>
                  {" "}and <strong>{fmtRecord(jerseys[0])}</strong> in the {lc(jerseys[0].label)} jersey, their most-worn jersey
                </>
              ) : null}
              .
            </p>
          )}

          <section id="combinations" className="mt-8 scroll-mt-28">
            <h2 className="text-[28px] sm:text-[32px] leading-tight font-extrabold text-black tracking-tight border-b-4 border-[#0025CC] pb-2 mb-5">
              {nba ? `Every ${t.nickname} Jersey` : `Every ${t.nickname} Uniform Combination`}
            </h2>
            <div className="flex flex-col gap-4">
              {t.combos.map((c, i) => (
                <div key={c.id}>
                  <ComboCard c={c} team={t} showImg={showImg[i]} />
                  {i === 2 && t.combos.length > 4 && <MvSlot className="mt-8 mb-4" />}
                </div>
              ))}
            </div>
            {t.missing.length > 0 && (
              <p className="text-[16px] text-[#5b6474] mt-4">
                Not yet logged: {t.missing.map((m) => `${m.week ? `Week ${m.week}` : fmtDate(m.date)} ${m.home ? "vs" : "at"} ${m.opponent.split(" ").slice(-1)[0]}`).join(", ")}.
              </p>
            )}
          </section>

          {!nba && (
          <section id="splits" className="mt-12 scroll-mt-28">
            <h2 className="text-[28px] sm:text-[32px] leading-tight font-extrabold text-black tracking-tight border-b-4 border-[#0025CC] pb-2 mb-5">
              {possessive(t.nickname)} Record By Jersey, Pants And Helmet
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SplitTable title="By Jersey" rows={jerseys} unit="Jersey" />
              <SplitTable title="By Pants" rows={pants} unit="Pants" />
              <SplitTable title="By Helmet" rows={helmets} unit="Helmet" />
            </div>
          </section>
          )}

          <MvSlot className="my-10" />

          <nav className="flex gap-3 flex-wrap">
            {t.scheduleSlug && (
              <Link
                prefetch={false}
                href={`/stories/${t.scheduleSlug}`}
                className="flex-1 min-w-[240px] text-center bg-[#0025CC] text-white text-[17px] font-bold px-5 py-3.5 rounded-xl hover:opacity-90"
              >
                {`${t.nickname} ${seasonOf(t)} Uniform Schedule`} &rarr;
              </Link>
            )}
            <Link
              prefetch={false}
              href={tracker.href}
              className="flex-1 min-w-[240px] text-center border-2 border-[#0025CC] text-[#0025CC] text-[17px] font-bold px-5 py-3.5 rounded-xl hover:bg-[#0025CC]/5"
            >
              {tracker.label} &rarr;
            </Link>
          </nav>

          <section className="mt-12">
            <h2 className="text-[28px] sm:text-[32px] font-extrabold text-black tracking-tight mb-5">Frequently Asked Questions</h2>
            <div className="flex flex-col gap-5">
              {faq.map((f) => (
                <div key={f.q}>
                  <h3 className="text-[19px] font-bold text-black mb-1.5">{f.q}</h3>
                  <p className="text-[18px] text-[#2b303b] leading-relaxed m-0">{f.a}</p>
                </div>
              ))}
            </div>
          </section>

          <TeamMoreBlock data={buildTeamMoreLinks(t.slug, { exclude: [`/uniform-records/${t.slug}`] })} />
        </div>
      </main>
      <Footer />
    </>
  );
}
