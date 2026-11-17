import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MvSlot from "@/components/MvSlot";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import QuizScore from "@/components/quiz/QuizScore";
import styles from "@/components/quiz/quiz.module.css";
import { getAllQuizzes, getQuiz, nextQuiz } from "@/lib/quiz";

const SITE = "https://www.colorwaysports.com";

// Every quiz is a real, prebuilt page (ads and search need real pages, not a
// single-page app). Unknown slugs 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllQuizzes().map((q) => ({ slug: q.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const quiz = getQuiz(slug);
  if (!quiz) return { title: "Not found" };
  const url = `${SITE}/quiz/${slug}`;
  const title = `${quiz.title}: Name The Team From A Tiny Piece Of Its Logo`;
  return {
    title: `${title} | ColorWay Sports`,
    description: quiz.description,
    alternates: { canonical: url },
    openGraph: {
      title: quiz.headline,
      description: quiz.description,
      url,
      type: "website",
      images: [`${SITE}/quiz/${slug}/q1.webp`],
    },
    twitter: { card: "summary", title: quiz.headline, description: quiz.description },
  };
}

// Ad slots go after these questions (between sections, server markup only).
const AD_AFTER = new Set([2, 4, 6]);

export default async function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const quiz = getQuiz(slug);
  if (!quiz) notFound();
  const next = nextQuiz(slug);
  const total = quiz.items.length;
  const url = `${SITE}/quiz/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Logo Quizzes", item: `${SITE}/quiz` },
      { "@type": "ListItem", position: 2, name: quiz.title, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="bg-white pb-20">
        <div className="max-w-[720px] mx-auto px-5" data-quiz={quiz.slug}>
          <nav className="pt-8">
            <Link
              prefetch={false}
              href="/quiz"
              className="font-display text-[13px] font-extrabold tracking-[0.16em] uppercase text-orange no-underline"
            >
              &larr; All Logo Quizzes
            </Link>
          </nav>

          <header className="pt-5 pb-8">
            <p className="m-0 font-display text-[14px] font-extrabold tracking-[0.16em] uppercase text-orange">
              {quiz.leagueName} Logo Quiz · Hard Mode
            </p>
            <h1 className="mt-3 mb-0 font-display font-black text-[34px] sm:text-[46px] leading-[1.04] tracking-[-0.03em] text-blue-dark">
              {quiz.headline}
            </h1>
            {quiz.intro.map((p) => (
              <p key={p.slice(0, 24)} className="mt-4 mb-0 text-[19px] leading-[1.6] text-[#333]">
                {p}
              </p>
            ))}
          </header>

          {quiz.items.map((item, i) => (
            <div key={item.n}>
              <QuizQuestion
                slug={quiz.slug}
                index={i}
                total={total}
                leagueName={quiz.leagueName}
                pieceSrc={item.pieceSrc}
                hint={item.hint}
              >
                <div className={styles.pair}>
                  <div className={styles.mini}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- public/ is served raw by design */}
                    <img src={item.pieceSrc} alt="" width={92} height={92} loading="lazy" />
                  </div>
                  <span className={styles.arrow} aria-hidden>
                    →
                  </span>
                  <div className={styles.full}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- public/ is served raw by design */}
                    <img src={item.logoSrc} alt={`${item.team} logo`} width={220} height={220} loading="lazy" />
                  </div>
                </div>
                <p className={styles.team}>{item.team}</p>
                <p className={styles.piece}>
                  <strong>The piece:</strong> {item.piece}
                </p>
                <p className={styles.fact}>{item.fact}</p>
                <ul className={styles.links}>
                  {item.links.map((l) => (
                    <li key={l.href}>
                      <Link prefetch={false} href={l.href}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </QuizQuestion>
              {AD_AFTER.has(item.n) && item.n < total && <MvSlot className="my-6" />}
            </div>
          ))}

          <QuizScore slug={quiz.slug} total={total} leagueName={quiz.leagueName} url={url} />

          <section className="mt-12">
            <p className="m-0 font-display text-[14px] font-extrabold tracking-[0.16em] uppercase text-orange">Next Quiz</p>
            <Link
              prefetch={false}
              href={`/quiz/${next.slug}`}
              className="mt-3 flex items-center gap-4 rounded-2xl border-2 border-blue-dark p-4 no-underline hover:bg-[#f1f4ff] transition-colors"
            >
              {next.leagueLogo && (
                // eslint-disable-next-line @next/next/no-img-element -- public/ is served raw by design
                <img src={next.leagueLogo} alt="" width={56} height={56} className="w-14 h-14 object-contain flex-none" />
              )}
              <span>
                <span className="block font-display font-black text-[24px] leading-tight text-blue-dark">{next.title}</span>
                <span className="block mt-1 text-[16px] text-[#555]">8 more pieces. Same rules.</span>
              </span>
            </Link>
          </section>

          <MvSlot className="my-8" />

          <section className="mt-4">
            <h2 className="font-display font-black text-[28px] tracking-[-0.02em] text-blue-dark m-0">
              More {quiz.leagueName} Logo Stories
            </h2>
            <ul className="mt-4 mb-0 p-0 list-none">
              {quiz.readMore.map((l) => (
                <li key={l.href} className="border-b border-border">
                  <Link prefetch={false} href={l.href} className="block py-4 text-[19px] font-bold text-orange no-underline hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  prefetch={false}
                  href={`/stories?league=${quiz.league}`}
                  className="block py-4 text-[19px] font-bold text-orange no-underline hover:underline"
                >
                  All {quiz.leagueName} Stories →
                </Link>
              </li>
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="font-display font-black text-[28px] tracking-[-0.02em] text-blue-dark m-0">How This Quiz Works</h2>
            <p className="mt-3 mb-0 text-[18px] leading-[1.6] text-[#333]">
              Each piece is a square about 13% as wide as the full logo, roughly 2% of its area, cut from the
              team&apos;s logo. We pick pieces that stay away from each logo&apos;s signature shape, but every one keeps
              a real detail: a color pair, a curve or an edge you can only find on that team&apos;s logo. We post logo quizzes on
              TikTok too, at @colorway.sports.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
