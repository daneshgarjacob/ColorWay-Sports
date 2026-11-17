import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MvSlot from "@/components/MvSlot";
import DailyLogo from "@/components/quiz/daily/DailyLogo";
import quiz from "@/components/quiz/quiz.module.css";
import styles from "@/components/quiz/daily/daily.module.css";
import { DAILY_LISTS, DAILY_POOL, dailyClientData, dailyForDate } from "@/lib/dailyLogo";

const SITE = "https://www.colorwaysports.com";
const CANONICAL = `${SITE}/quiz/daily`;
const TITLE = "Daily Logo: Guess The Team From A Tiny Piece";
const DESC =
  "A new tiny piece of a sports logo every day. Three guesses, and every miss shows you a bigger piece. Keep your streak going and share your result.";

export const metadata: Metadata = {
  title: `${TITLE} | ColorWay Sports`,
  description: DESC,
  alternates: { canonical: CANONICAL },
  openGraph: { title: TITLE, description: DESC, url: CANONICAL, type: "website" },
  twitter: { card: "summary", title: TITLE, description: DESC },
};

// The game works out "today" in the browser from the prebuilt schedule, so the
// page is the same HTML all day. The hourly refresh only keeps the no-JavaScript
// fallback (the <noscript> block) on the right day: 24 cheap renders a day, not
// one per reader.
export const revalidate = 3600;

export default function DailyLogoPage() {
  const data = dailyClientData();
  const today = dailyForDate(new Date());

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Quizzes", item: `${SITE}/quiz` },
      { "@type": "ListItem", position: 2, name: "Daily Logo", item: CANONICAL },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="bg-white pb-20">
        <div className="max-w-[720px] mx-auto px-5">
          <nav className="pt-8">
            <Link
              prefetch={false}
              href="/quiz"
              className="font-display text-[13px] font-extrabold tracking-[0.16em] uppercase text-orange no-underline"
            >
              &larr; All Quizzes
            </Link>
          </nav>

          <header className="pt-5 pb-6">
            <p className="m-0 font-display text-[14px] font-extrabold tracking-[0.16em] uppercase text-orange">
              Play · New Every Day
            </p>
            <h1 className="mt-3 mb-0 font-display font-black text-[34px] sm:text-[46px] leading-[1.04] tracking-[-0.03em] text-blue-dark">
              {TITLE}
            </h1>
            <p className="mt-4 mb-0 text-[19px] leading-[1.6] text-[#333]">
              One tiny piece of a team logo, the same for everyone, new at midnight Eastern. You get three guesses.
              Every miss shows you a bigger piece.
            </p>
          </header>

          <noscript>
            <style>{`.cw-daily-slot{min-height:0!important}`}</style>
            <div className={styles.fallback}>
              <p className={styles.num}>
                Daily Logo <b>#{today.n}</b>
              </p>
              <p className={styles.league}>Today&apos;s league: {today.league}</p>
              <div className={quiz.lens} style={{ marginTop: 22 }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- public/ is served raw by design */}
                <img src={`/quiz/daily/${today.key}-1.webp`} alt={`Daily Logo #${today.n}`} width={320} height={320} />
              </div>
              <p className={styles.status}>Make your guess, then open the answer.</p>
              <details className={quiz.details}>
                <summary className={quiz.summary}>Show The Answer</summary>
                <div className={quiz.answer}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- public/ is served raw by design */}
                  <img src={today.logo} alt={`${today.team} logo`} width={220} height={220} style={{ margin: "0 auto" }} />
                  <p className={quiz.team}>{today.team}</p>
                  <p className={quiz.piece}>
                    <strong>The piece:</strong> {today.piece}
                  </p>
                  <p className={quiz.fact}>{today.fact}</p>
                  <p>
                    <a href={today.teamHref}>All {today.team} Stories</a>
                  </p>
                </div>
              </details>
            </div>
          </noscript>

          <div className="cw-daily-slot min-h-[720px]">
            <DailyLogo epoch={data.epoch} salt={data.salt} days={data.days} lists={DAILY_LISTS} />
          </div>

          <MvSlot className="my-10" />

          <section>
            <h2 className="font-display font-black text-[28px] tracking-[-0.02em] text-blue-dark m-0">How The Daily Logo Works</h2>
            <p className="mt-3 mb-0 text-[18px] leading-[1.6] text-[#333]">
              Every day at midnight Eastern there is a new piece: a small square cut from a current NFL, NBA, NHL,
              MLB, SEC or Big Ten team logo, about 2% of the whole mark. The page tells you the league. Type or pick
              a team from that league&apos;s full list. Miss, and the piece grows; miss three times and the answer is
              yours anyway, with the full logo, what the piece was and a fact about it.
            </p>
            <p className="mt-4 mb-0 text-[18px] leading-[1.6] text-[#333]">
              Win on consecutive days to build a streak. Your streak, best streak, games played and win percentage
              are saved in this browser only, so play on the same phone or computer to keep it. When you finish,
              tap Share Your Result to send your score without giving away the answer. There are {DAILY_POOL} pieces
              in the rotation, and none repeats until every one has had its day.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="font-display font-black text-[28px] tracking-[-0.02em] text-blue-dark m-0">Want More Than One A Day?</h2>
            <ul className="mt-4 mb-0 p-0 list-none">
              <li className="border-b border-border">
                <Link prefetch={false} href="/quiz" className="block py-4 text-[19px] font-bold text-orange no-underline hover:underline">
                  Every Logo Quiz, Eight Pieces Each →
                </Link>
              </li>
              <li className="border-b border-border">
                <Link
                  prefetch={false}
                  href="/stories/hidden-details-sports-logos"
                  className="block py-4 text-[19px] font-bold text-orange no-underline hover:underline"
                >
                  Hidden Details In Sports Logos
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/stories/how-every-nfl-team-got-its-colors"
                  className="block py-4 text-[19px] font-bold text-orange no-underline hover:underline"
                >
                  How Every NFL Team Got Its Colors
                </Link>
              </li>
            </ul>
          </section>

          <MvSlot className="my-8" />
        </div>
      </main>
      <Footer />
    </>
  );
}
