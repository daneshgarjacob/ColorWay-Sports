import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InlineNewsletter from "@/components/InlineNewsletter";

export const metadata: Metadata = {
  title: "Newsletter | ColorWay Sports",
  description:
    "Sign up for the free ColorWay Sports newsletter: the week's uniform news, jersey debuts and tracker highlights, sent every Friday.",
  alternates: { canonical: "https://www.colorwaysports.com/newsletter" },
  openGraph: {
    title: "The ColorWay Sports Newsletter",
    description:
      "The week's uniform news, jersey debuts and tracker highlights, sent every Friday. Free.",
    url: "https://www.colorwaysports.com/newsletter",
    type: "website",
  },
};

const WHAT_YOU_GET = [
  {
    title: "Every jersey debut",
    body: "New uniforms, throwbacks and City Connects, with what the team actually wore and where it ranks.",
  },
  {
    title: "The week in the trackers",
    body: "The best matchups we logged across the NFL, MLB, college football, the NBA, the NHL and the Premier League.",
  },
  {
    title: "What is coming next",
    body: "The alternates on the schedule, so you know what your team is wearing before kickoff or first pitch.",
  },
];

export default function NewsletterPage() {
  return (
    <>
      <Header />
      <main className="max-w-[860px] mx-auto px-5 py-12 sm:py-16">
      <p
        className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#2f6bed] mb-3 text-center"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        Free, every Friday
      </p>
      <h1
        className="text-3xl sm:text-5xl font-extrabold text-black leading-[1.05] tracking-tight text-center"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        The ColorWay Sports Newsletter
      </h1>
      <p className="text-[17px] sm:text-[19px] text-black/60 leading-relaxed text-center mt-4 max-w-[600px] mx-auto">
        One email a week with the uniforms that mattered: the debuts, the
        throwbacks, the matchups worth watching, and what your team is wearing
        next. No spam, and you can unsubscribe from any issue.
      </p>

      <InlineNewsletter
        eyebrow="Sign up"
        heading="Get every uniform drop in your inbox."
        body="Enter your email and you are on the list. It takes one click."
      />

      <section className="grid gap-5 sm:grid-cols-3 mt-2">
        {WHAT_YOU_GET.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-black/5 bg-[#f7f8fa] px-5 py-6"
          >
            <h2
              className="text-[15px] font-extrabold text-black mb-2"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {item.title}
            </h2>
            <p className="text-[14px] text-black/60 leading-relaxed">
              {item.body}
            </p>
          </div>
        ))}
      </section>

      <p className="text-[14px] text-black/55 leading-relaxed text-center mt-10">
        Trouble signing up? Email{" "}
        <a
          className="text-[#2f6bed] font-semibold"
          href="mailto:contact@colorwaysports.com"
        >
          contact@colorwaysports.com
        </a>{" "}
        and we will add you by hand. You can read what we send in the{" "}
        <Link prefetch={false} href="/stories" className="text-[#2f6bed] font-semibold">
          story archive
        </Link>{" "}
        any time.
      </p>
      </main>
      <Footer />
    </>
  );
}
