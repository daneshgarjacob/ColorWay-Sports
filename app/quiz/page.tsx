import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MvSlot from "@/components/MvSlot";
import { getAllQuizzes } from "@/lib/quiz";

const CANONICAL = "https://www.colorwaysports.com/quiz";
const TITLE = "Logo Quizzes: Name The Team From A Tiny Piece Of Its Logo";
const DESC =
  "Hard sports logo quizzes for the NFL and NBA. Eight tiny pieces of team logos per quiz: guess the team, reveal the answer, keep score and share your result.";

export const metadata: Metadata = {
  title: `${TITLE} | ColorWay Sports`,
  description: DESC,
  alternates: { canonical: CANONICAL },
  openGraph: { title: TITLE, description: DESC, url: CANONICAL, type: "website" },
};

export default function QuizHub() {
  const quizzes = getAllQuizzes();

  return (
    <>
      <Header />
      <main className="bg-white pb-20">
        <div className="max-w-[760px] mx-auto px-5">
          <header className="pt-10 pb-8">
            <p className="m-0 font-display text-[14px] font-extrabold tracking-[0.16em] uppercase text-orange">
              Play · Hard Mode
            </p>
            <h1 className="mt-3 mb-0 font-display font-black text-[38px] sm:text-[52px] leading-[1.02] tracking-[-0.03em] text-blue-dark">
              Logo Quizzes
            </h1>
            <p className="mt-4 mb-0 text-[19px] leading-[1.6] text-[#333]">
              Name the team from a tiny piece of its logo. Each quiz is eight pieces, each about 2% of the full logo,
              chosen to stay away from the obvious part of the mark while keeping one real detail you can recognize.
              Guess, reveal the answer, keep score, then send your score to a friend.
            </p>
          </header>

          <ul className="m-0 p-0 list-none grid gap-4 sm:grid-cols-2">
            {quizzes.map((q) => (
              <li key={q.slug}>
                <Link
                  prefetch={false}
                  href={`/quiz/${q.slug}`}
                  className="group flex items-center gap-4 h-full rounded-2xl border-2 border-blue-dark p-4 no-underline hover:bg-[#f1f4ff] transition-colors"
                >
                  <span className="relative flex-none w-[92px] h-[92px] rounded-full overflow-hidden bg-white border-[5px] border-blue-dark shadow-[0_0_0_3px_#fff,0_0_0_6px_#0025CC] transition-transform group-hover:scale-105">
                    {/* eslint-disable-next-line @next/next/no-img-element -- public/ is served raw by design */}
                    <img src={q.items[0].pieceSrc} alt="" width={92} height={92} className="w-full h-full block" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      {q.leagueLogo && (
                        // eslint-disable-next-line @next/next/no-img-element -- public/ is served raw by design
                        <img src={q.leagueLogo} alt="" width={22} height={22} className="w-[22px] h-[22px] object-contain" />
                      )}
                      <span className="font-display text-[13px] font-extrabold tracking-[0.14em] uppercase text-orange">
                        {q.leagueName} · 8 Pieces
                      </span>
                    </span>
                    <span className="block mt-1 font-display font-black text-[24px] leading-[1.1] text-blue-dark">{q.title}</span>
                    <span className="block mt-1 text-[16px] font-bold text-orange">Play Now →</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <MvSlot className="my-10" />

          <section>
            <h2 className="font-display font-black text-[28px] tracking-[-0.02em] text-blue-dark m-0">How The Logo Quizzes Work</h2>
            <p className="mt-3 mb-0 text-[18px] leading-[1.6] text-[#333]">
              Every quiz shows one piece at a time. Make your guess, tap Show The Answer to see the full logo and what
              the piece was, then mark whether you got it. Your score adds up at the bottom of the page, with a line
              you can copy and send. Each answer also links to that team&apos;s uniform schedule and stories.
            </p>
            <p className="mt-4 mb-0 text-[18px] leading-[1.6] text-[#333]">
              These are the same quizzes we post on TikTok at @colorway.sports. Want the stories behind the logos? Start
              with{" "}
              <Link prefetch={false} href="/stories/how-every-nfl-team-got-its-colors" className="font-bold text-orange">
                how every NFL team got its colors
              </Link>{" "}
              or{" "}
              <Link prefetch={false} href="/stories/hidden-details-sports-logos" className="font-bold text-orange">
                the hidden details in sports logos
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
