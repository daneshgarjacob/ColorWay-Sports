import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WorldSeriesLogoGrader from "@/components/WorldSeriesLogoGrader";
import { decodeGrades, topPick } from "@/lib/wsLogos";

const DEFAULT_TITLE = "Grade Every World Series Logo: Rate All 40 Fall Classic Logos, 1986-2025 | ColorWay Sports";
const DEFAULT_DESC =
  "Rate every World Series logo from 1986 to 2025. Tap any of the 40 Fall Classic marks, give it a grade from A to F, write your own note, see how it stacks up against our grade, and share your list.";

const CANONICAL = "https://www.colorwaysports.com/world-series-logo-grader";

type SP = Promise<{ [key: string]: string | string[] | undefined }>;

// A shared link (?g=) sets the preview title to the sharer's top-graded logo, so a
// text or a post shows "My best World Series logo is 1996" with a tap-through.
export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const g = typeof sp?.g === "string" ? sp.g : undefined;
  if (g) {
    const best = topPick(decodeGrades(g));
    if (best) {
      const title = `My best World Series logo is ${best}`;
      const description = "See how I graded all 40 World Series logos from 1986 to 2025, then grade them yourself.";
      return {
        title: `${title} | ColorWay Sports`,
        description,
        alternates: { canonical: CANONICAL },
        openGraph: { title, description },
        twitter: { card: "summary", title, description },
      };
    }
  }
  return { title: DEFAULT_TITLE, description: DEFAULT_DESC, alternates: { canonical: CANONICAL } };
}

const FAQ = [
  {
    q: "How do I rate the World Series logos?",
    a: "Tap any of the 40 logos in the grid, pick a grade from A to F, and write your own note about what you see. Your grades save automatically on your device, so you can come back and finish later. Tap the grade you already gave to clear it. When you are done, hit share to send your list to anyone.",
  },
  {
    q: "Are my grades and notes public?",
    a: "No. Everything saves in your own browser on your own device, and nothing is submitted to us. A shared link carries only your letter grades, never your notes, so your writing stays private to you.",
  },
  {
    q: "How many World Series logos are there?",
    a: "This tool covers the 40 World Series logos from 1986 through 2025, which is the modern uninterrupted run of year-specific Fall Classic marks. That includes the 1994 logo, which was designed and produced for a World Series that was cancelled by the players strike and never played.",
  },
  {
    q: "What is the best World Series logo?",
    a: "That is what the tool is for, but our answer is the 1992 to 1997 globe and bat era, which we graded an A. It paired a dimensional globe with a woodgrain bat across a diamond and kept the cursive World Series script. Our full era-by-era ranking breaks down all eight design eras from 1986 to 2025.",
  },
  {
    q: "Why is Capital One on the recent World Series logos?",
    a: "Capital One holds the presenting sponsorship of the World Series, so since 2022 its logo has been built into the official mark rather than kept to separate signage. We graded that era a D for it. Grade it yourself and see whether you are tougher on it than we were.",
  },
];

export default async function WorldSeriesLogoGraderPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const shared = typeof sp?.g === "string" ? sp.g : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main style={{ padding: "48px 0 72px", background: "#fff" }}>
        <div style={{ maxWidth: 760, margin: "0 auto 34px", padding: "0 20px" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#2f6bed" }}>
            Interactive · MLB
          </p>
          <h1 style={{ margin: "10px 0 0", fontSize: "clamp(30px, 5vw, 46px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#0a0a0a", lineHeight: 1.05 }}>
            Grade Every World Series Logo
          </h1>
          <p style={{ margin: "16px 0 0", fontSize: 17, lineHeight: 1.6, color: "#444" }}>
            All 40 World Series logos from 1986 through 2025, the whole modern run of the Fall Classic. Tap any logo, give it a grade from A to F, and write your own note on what you see. We show you our grade once you have made your call, so you can argue with us logo by logo. Your list saves on this device and you can share it when you are done.
          </p>
          <p style={{ margin: "14px 0 0", fontSize: 15, lineHeight: 1.6, color: "#666" }}>
            Want our full breakdown first? Read{" "}
            <a href="/stories/world-series-logo-history-1986-2025" style={{ color: "#2f6bed", fontWeight: 700 }}>
              our era-by-era World Series logo ranking
            </a>
            , where we grade all eight design eras from the green diamond years to the Capital One era.
          </p>
        </div>

        <WorldSeriesLogoGrader shared={shared} />

        <div style={{ maxWidth: 760, margin: "60px auto 0", padding: "0 20px" }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "#003087", letterSpacing: "-0.02em", marginBottom: 18 }}>
            Frequently asked questions
          </h2>
          {FAQ.map((f) => (
            <div key={f.q} style={{ marginBottom: 18 }}>
              <p style={{ fontWeight: 800, color: "#1a1a1a", margin: "0 0 5px", fontSize: 16 }}>{f.q}</p>
              <p style={{ color: "#555", lineHeight: 1.65, margin: 0, fontSize: 15 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
