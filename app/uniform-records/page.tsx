import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MvSlot from "@/components/MvSlot";
import { ComboChips, RecordBadge, toneOf } from "@/components/UniformRecordBits";
import {
  allRecordTeams,
  leaderboards,
  fmtRecord,
  fmtPct,
  games,
  possessive,
  colorWord,
  RECORDS_THROUGH_WEEK,
  RECORDS_TOTALS,
  NBA_RECORDS_SEASON,
  NBA_RECORDS_THROUGH,
  NBA_RECORDS_TOTALS,
  fmtDate,
  type LeagueCombo,
} from "@/lib/uniformRecords";

// /uniform-records (site plan 11/16, item 6): the league hub. Every list is
// rendered on the server from content/data/uniform-records-2026.json, so Google
// and Mediavine see all of it. Records live here and on the team pages, never on
// the tracker's game cards (Jake's rule).

export const dynamic = "force-static";

const TITLE = "NFL And NBA Uniform Records: Every Team's Win-Loss In Every Uniform";
const DESCRIPTION = `Which uniforms win? Every NFL team's 2026 record in each helmet, jersey and pants combination through Week ${RECORDS_THROUGH_WEEK}, and every NBA team's record in each jersey, from ColorWay Sports' own game-by-game uniform logs.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/uniform-records" },
  openGraph: { title: "NFL And NBA Uniform Records", description: DESCRIPTION, url: "/uniform-records", type: "website" },
};

function ComboRow({ c, rank, showPct }: { c: LeagueCombo; rank?: number; showPct?: boolean }) {
  return (
    <li>
      <Link
        prefetch={false}
        href={`/uniform-records/${c.team.slug}#${c.id}`}
        className="group flex items-center gap-3 sm:gap-4 rounded-xl border border-black/10 bg-white px-3.5 sm:px-5 py-3.5 no-underline hover:border-[#0025CC] transition-colors"
      >
        {rank !== undefined && (
          <span className="w-7 flex-shrink-0 text-center text-[18px] font-extrabold text-[#5b6474] tabular-nums">{rank}</span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-[18px] sm:text-[19px] font-extrabold text-black leading-tight group-hover:text-[#0025CC]">
            {c.team.nickname}: {c.jerseyName} Jersey
          </span>
          <span className="mt-1.5 flex items-center gap-2.5">
            {c.team.league === "nba" ? (
              <span aria-hidden className="block w-4 h-5 rounded-[4px] flex-shrink-0" style={{ background: c.hexes[1], border: "1px solid rgba(0,0,0,0.2)" }} />
            ) : (
              <ComboChips hexes={c.hexes} labels={[c.helmet, c.jerseyName, c.pants]} size={16} />
            )}
            <span className="text-[16px] text-[#3c4250] leading-snug">
              {c.team.league === "nba"
                ? `${c.edition} · ${games(c)} ${games(c) === 1 ? "game" : "games"}`
                : `${c.helmet} helmet, ${c.pants} pants · ${games(c)} ${games(c) === 1 ? "game" : "games"}`}
            </span>
          </span>
        </span>
        <span className="flex flex-col items-end flex-shrink-0">
          <RecordBadge text={fmtRecord(c)} tone={toneOf(c)} />
          {showPct && <span className="text-[14px] font-bold text-[#5b6474] mt-1 tabular-nums">{fmtPct(c)}</span>}
        </span>
      </Link>
    </li>
  );
}

function Board({
  id,
  title,
  intro,
  rows,
  ranked,
  showPct,
}: {
  id: string;
  title: string;
  intro: string;
  rows: LeagueCombo[];
  ranked?: boolean;
  showPct?: boolean;
}) {
  return (
    <section id={id} aria-labelledby={`h-${id}`} className="mt-12 scroll-mt-28">
      <h2 id={`h-${id}`} className="text-[28px] sm:text-[32px] leading-tight font-extrabold text-black tracking-tight border-b-4 border-[#0025CC] pb-2 mb-3">
        {title}
      </h2>
      <p className="text-[18px] leading-relaxed text-[#2b303b] mb-5 max-w-[760px]">{intro}</p>
      {rows.length ? (
        <ol className="flex flex-col gap-2.5 list-none p-0 m-0">
          {rows.map((c, i) => (
            <ComboRow key={`${c.team.slug}-${c.id}`} c={c} rank={ranked ? i + 1 : undefined} showPct={showPct} />
          ))}
        </ol>
      ) : (
        <p className="text-[18px] text-[#3c4250]">None yet.</p>
      )}
    </section>
  );
}

const sentenceList = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
const describe = (c: LeagueCombo) =>
  `the ${possessive(c.team.nickname)} ${colorWord(c.jerseyName)} jersey with the ${colorWord(c.helmet)} helmet and ${colorWord(c.pants)} pants (${fmtRecord(c)})`;

export default function UniformRecordsPage() {
  const teams = allRecordTeams();
  const b = leaderboards();
  const nbaTeams = allRecordTeams("nba");
  const nb = leaderboards("nba");
  const top = b.best[0];
  const worn = b.mostWorn[0];

  const faq = [
    {
      q: "Which NFL uniform has the best record in 2026?",
      a: top
        ? `Through Week ${RECORDS_THROUGH_WEEK}, the best record in any NFL uniform combination worn at least twice belongs to ${describe(top)}. ${
            b.unbeaten.length > 1 ? `${b.unbeaten.length} combinations worn two or more times are still unbeaten.` : ""
          }`.trim()
        : "No combination has been worn twice yet.",
    },
    {
      q: "Which NFL uniforms are unbeaten this season?",
      a: b.unbeaten.length
        ? `Worn at least twice and never lost in: ${sentenceList(b.unbeaten.slice(0, 8).map(describe))}${b.unbeaten.length > 8 ? `, plus ${b.unbeaten.length - 8} more listed on this page` : ""}.`
        : "No combination worn twice or more is unbeaten.",
    },
    {
      q: "Which NFL uniforms have never won this season?",
      a: b.winless.length
        ? `Worn at least twice without a win: ${sentenceList(b.winless.slice(0, 8).map(describe))}${b.winless.length > 8 ? `, plus ${b.winless.length - 8} more listed on this page` : ""}.`
        : "Every combination worn twice or more has at least one win.",
    },
    {
      q: "What is the most-worn NFL uniform combination in 2026?",
      a: worn
        ? `${describe(worn).replace(/^the/, "The")}, worn ${games(worn)} times through Week ${RECORDS_THROUGH_WEEK}.`
        : "",
    },
    {
      q: "Where do these uniform records come from?",
      a: `From the ColorWay Sports NFL uniform tracker. We log the helmet, jersey and pants each team actually wore in every game, from game photos, never from projections, and pair each game with its final score. That is ${RECORDS_TOTALS.teamGamesCounted} team-games across all ${teams.length} teams through Week ${RECORDS_THROUGH_WEEK}.`,
    },
    {
      q: "Which NBA jersey has the best record this season?",
      a: nb.best[0]
        ? `Through ${fmtDate(NBA_RECORDS_THROUGH)}, among jerseys worn at least twice, the ${possessive(nb.best[0].team.nickname)} ${colorWord(nb.best[0].jerseyName)} jersey (${nb.best[0].edition}) leads at ${fmtRecord(nb.best[0])}.`
        : "",
    },
  ].filter((f) => f.a);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "NFL And NBA Uniform Records",
      url: "https://www.colorwaysports.com/uniform-records",
      hasPart: teams.map((t) => ({
        "@type": "WebPage",
        name: `${t.name} Record In Every Uniform`,
        url: `https://www.colorwaysports.com/uniform-records/${t.slug}`,
      })).concat(
        nbaTeams.map((t) => ({
          "@type": "WebPage",
          name: `${t.name} Record In Every Jersey`,
          url: `https://www.colorwaysports.com/uniform-records/${t.slug}`,
        })),
      ),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  const chips = [
    ["best", "Best Records"],
    ["unbeaten", "Unbeaten"],
    ["winless", "Winless"],
    ["most-worn", "Most Worn"],
    ["teams", "All 32 NFL Teams"],
    ["nba", "NBA"],
  ];

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="max-w-[1000px] mx-auto px-4 sm:px-5 pt-8 pb-14">
        <p className="text-[13px] font-black tracking-[0.18em] uppercase text-[#0025CC]">From Our Own Game Logs</p>
        <h1 className="font-display font-black text-[36px] sm:text-[52px] leading-[1.04] mt-1 tracking-tight">
          NFL And NBA Uniform Records
        </h1>
        <div className="mt-4 max-w-[760px] space-y-4 text-[18px] sm:text-[19px] leading-relaxed text-[#2b303b]">
          <p>
            Every NFL team&apos;s win-loss record in every helmet, jersey and pants combination it has worn this season,
            through Week {RECORDS_THROUGH_WEEK}. We log every game&apos;s uniforms from game photos in our{" "}
            <Link prefetch={false} href="/stories/nfl-uniform-tracker-2026" className="text-[#0025CC] font-semibold hover:underline">
              NFL uniform tracker
            </Link>
            , so these records come from {RECORDS_TOTALS.teamGamesCounted} team-games you will not find tallied anywhere else.
          </p>
          <p>
            {`${b.comboCount} different combinations so far. `}The leaderboards count combinations worn at least twice; tap any row
            for that team&apos;s full breakdown, game by game. NBA records, jersey by jersey, are{" "}
            <a href="#nba" className="text-[#0025CC] font-semibold hover:underline">
              further down
            </a>
            .
          </p>
        </div>

        <nav aria-label="Sections" className="mt-6 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto pb-1">
          {chips.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="shrink-0 rounded-full border border-black/15 bg-white px-4 py-2 text-[16px] font-bold text-black hover:border-[#0025CC] hover:text-[#0025CC] transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        <Board
          id="best"
          title="Best Records By Uniform"
          intro="The highest winning percentage in any combination worn two or more times. Ties go to the look worn most."
          rows={b.best}
          ranked
          showPct
        />

        <MvSlot className="my-10" />

        <Board
          id="unbeaten"
          title="Unbeaten Uniforms"
          intro={`${b.unbeaten.length} combinations worn at least twice have not lost yet.`}
          rows={b.unbeaten}
        />

        <Board
          id="winless"
          title="Winless Uniforms"
          intro={`${b.winless.length} combinations worn at least twice are still looking for a win.`}
          rows={b.winless}
        />

        <MvSlot className="my-10" />

        <Board
          id="most-worn"
          title="Most-Worn Uniforms"
          intro="The combinations teams keep coming back to, and how they have done in them."
          rows={b.mostWorn}
          ranked
        />

        <section id="teams" aria-labelledby="h-teams" className="mt-12 scroll-mt-28">
          <h2 id="h-teams" className="text-[28px] sm:text-[32px] leading-tight font-extrabold text-black tracking-tight border-b-4 border-[#0025CC] pb-2 mb-5">
            Every NFL Team&apos;s Uniform Record
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 list-none p-0 m-0">
            {teams.map((t) => (
              <li key={t.slug}>
                <Link
                  prefetch={false}
                  href={`/uniform-records/${t.slug}`}
                  className="group flex items-center gap-3.5 rounded-xl border border-black/10 bg-white px-4 py-3.5 no-underline hover:border-[#0025CC] transition-colors"
                >
                  {t.logo && (
                    // eslint-disable-next-line @next/next/no-img-element -- public/ images are served raw site-wide
                    <img src={t.logo} alt="" width={40} height={40} loading="lazy" decoding="async" className="w-10 h-10 object-contain flex-shrink-0" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[18px] font-extrabold text-black leading-tight group-hover:text-[#0025CC]">{t.name}</span>
                    <span className="block text-[16px] text-[#3c4250] mt-0.5">
                      {t.combos.length} {t.combos.length === 1 ? "uniform" : "uniforms"} · {t.gamesCounted} games
                    </span>
                  </span>
                  <span aria-hidden className="text-[#0025CC] font-bold text-xl">&rarr;</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <MvSlot className="my-10" />

        <section id="nba" aria-labelledby="h-nba" className="mt-12 scroll-mt-28">
          <p className="text-[13px] font-black tracking-[0.18em] uppercase text-[#0025CC]">{`NBA ${NBA_RECORDS_SEASON}`}</p>
          <h2 id="h-nba" className="font-display font-black text-[32px] sm:text-[42px] leading-[1.06] mt-1 tracking-tight">
            NBA Uniform Records
          </h2>
          <p className="mt-3 max-w-[760px] text-[18px] sm:text-[19px] leading-relaxed text-[#2b303b]">
            {`Every NBA team's record in each jersey it has worn this season, through ${fmtDate(NBA_RECORDS_THROUGH)}: ${NBA_RECORDS_TOTALS.teamGamesCounted} team-games, every one checked against game photos in our `}
            <Link prefetch={false} href="/stories/nba-uniform-tracker-2026-27" className="text-[#0025CC] font-semibold hover:underline">
              NBA uniform tracker
            </Link>
            . We name each jersey by its color; the league&apos;s edition name sits underneath.
          </p>
        </section>

        <Board
          id="nba-best"
          title="Best NBA Records By Jersey"
          intro="The highest winning percentage in any jersey worn two or more times."
          rows={nb.best}
          ranked
          showPct
        />

        <Board
          id="nba-winless"
          title="Winless NBA Jerseys"
          intro={`${nb.winless.length} jerseys worn at least twice are still looking for a win.`}
          rows={nb.winless}
        />

        <MvSlot className="my-10" />

        <Board
          id="nba-most-worn"
          title="Most-Worn NBA Jerseys"
          intro="The jerseys teams keep coming back to, and how they have done in them."
          rows={nb.mostWorn}
          ranked
        />

        <section id="nba-teams" aria-labelledby="h-nba-teams" className="mt-12 scroll-mt-28">
          <h2 id="h-nba-teams" className="text-[28px] sm:text-[32px] leading-tight font-extrabold text-black tracking-tight border-b-4 border-[#0025CC] pb-2 mb-5">
            Every NBA Team&apos;s Jersey Record
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 list-none p-0 m-0">
            {nbaTeams.map((t) => (
              <li key={t.slug}>
                <Link
                  prefetch={false}
                  href={`/uniform-records/${t.slug}`}
                  className="group flex items-center gap-3.5 rounded-xl border border-black/10 bg-white px-4 py-3.5 no-underline hover:border-[#0025CC] transition-colors"
                >
                  {t.logo && (
                    // eslint-disable-next-line @next/next/no-img-element -- public/ images are served raw site-wide
                    <img src={t.logo} alt="" width={40} height={40} loading="lazy" decoding="async" className="w-10 h-10 object-contain flex-shrink-0" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[18px] font-extrabold text-black leading-tight group-hover:text-[#0025CC]">{t.name}</span>
                    <span className="block text-[16px] text-[#3c4250] mt-0.5">
                      {`${t.combos.length} ${t.combos.length === 1 ? "jersey" : "jerseys"} · ${t.gamesCounted} games`}
                    </span>
                  </span>
                  <span aria-hidden className="text-[#0025CC] font-bold text-xl">&rarr;</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

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
          <p className="text-[16px] text-[#5b6474] mt-8">
            NFL combinations count the helmet, jersey and pants exactly as worn: the same jersey with different pants is a
            different combination. NBA records are by jersey. Records update after each round of games is logged.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
