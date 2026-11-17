import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getExplainedPosts } from "@/lib/explained";
import AskForm from "./AskForm";

// Ask ColorWay: readers send uniform questions; we answer the best one each
// week as an Explained story. Server page (metadata + answered list); only the
// form is a client component, because it reads ?sent=true.

export const metadata: Metadata = {
  title: "Ask ColorWay: Send Us Your Sports Uniform Questions",
  description:
    "Why do the Bears wear GSH? Why doesn't Penn State put names on its jerseys? Send us your sports uniform question and we'll answer the best one each week.",
  alternates: { canonical: "/ask" },
  openGraph: {
    title: "Ask ColorWay",
    description: "Send us your sports uniform question. We answer the best one each week.",
    url: "/ask",
    type: "website",
  },
};

export default function AskPage() {
  const answered = getExplainedPosts().slice(0, 8);

  return (
    <>
      <Header />
      <main
        className="max-w-[760px] mx-auto px-4 sm:px-5 pt-8 pb-14"
        style={{ fontFamily: "var(--font-hanken), system-ui, sans-serif" }}
      >
        <p className="text-[13px] font-black tracking-[0.18em] uppercase text-[#0025CC]">Ask ColorWay</p>
        <h1 className="font-display font-black text-[36px] sm:text-[48px] leading-[1.04] mt-1 tracking-tight">
          Send Us Your Uniform Question
        </h1>
        <div className="mt-4 space-y-3 text-[18px] sm:text-[19px] leading-relaxed text-[#2b303b]">
          <p>
            Why do the Bears wear GSH? Why doesn&apos;t Penn State put names on its jerseys? Why are the Lions in Honolulu
            blue?
          </p>
          <p>Ask us anything about uniforms, logos or colors. Every week we pick the best question and answer it in a story.</p>
        </div>

        <div className="mt-8 rounded-2xl border border-black/10 bg-white p-5 sm:p-7 shadow-sm">
          <Suspense fallback={null}>
            <AskForm />
          </Suspense>
        </div>

        {answered.length > 0 && (
          <section aria-labelledby="answered" className="mt-12">
            <h2
              id="answered"
              className="text-[26px] sm:text-[30px] font-extrabold text-black tracking-tight border-b-4 border-[#0025CC] pb-2 mb-4"
            >
              Questions We&apos;ve Answered
            </h2>
            <ul className="divide-y divide-black/10">
              {answered.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={p.href ?? `/stories/${p.slug}`}
                    className="block py-3.5 text-[18px] font-bold leading-snug text-black hover:text-[#0025CC] transition-colors"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[17px]">
              <Link href="/explained" className="font-bold text-[#0025CC] hover:underline">
                See Every Explained Story &rarr;
              </Link>
            </p>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
