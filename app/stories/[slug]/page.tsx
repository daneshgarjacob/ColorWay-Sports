import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

const articles: Record<string, { title: string; category: string; content: string }> = {
  "lakers-jersey-tracker-2025-26": {
    title: "The Lakers Have Only Worn Gold at Home 11 Times This Season. That's a Problem.",
    category: "Uniforms",
    content: `I've been tracking every Lakers uniform this season in a spreadsheet. 70 games in, the data tells the story I already knew: gold is no longer the default at home.

The Lakers have worn their iconic gold Association jersey at home just 11 times this season. That's not a typo. In a season where they've played 35 home games, their most recognizable uniform has appeared less than a third of the time.

Instead, we've seen a rotation of City Edition, Classic Edition, and Statement jerseys that prioritize marketing over identity. The purple Statement jersey has appeared 14 times at home. The black City Edition? 8 times.

This isn't just a Lakers problem — it's league-wide. The NBA's uniform calendar has become so cluttered with Nike's edition system that teams are losing their visual identity. But the Lakers, more than any franchise, should be immune to this. Gold at home, purple on the road. That's the look. That's the brand.

The data doesn't lie. When the Lakers wear gold at home, they're 8-3. When they wear anything else? 12-12. Coincidence? Maybe. But there's something to be said for looking like the Lakers when you play at home.`,
  },
  "coming-soon": {
    title: "More Stories on the Way",
    category: "Coming Soon",
    content: "Stadiums, score bugs, jersey patches, helmet designs, network tickers — we're covering it all. Stay tuned for more stories from ColorWay Sports.",
  },
};

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles[slug];

  if (!article) {
    return (
      <>
        <Header />
        <main className="max-w-[800px] mx-auto px-5 py-12 text-center">
          <h1 className="text-3xl font-bold text-black mb-4">Story Not Found</h1>
          <Link href="/stories" className="text-orange hover:underline">
            Back to Stories
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-[800px] mx-auto px-5 py-12">
        <span className="text-xs text-gray-medium uppercase tracking-wider">
          {article.category}
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-black mt-2 mb-6 leading-tight">
          {article.title}
        </h1>
        <div className="text-foreground leading-relaxed space-y-4">
          {article.content.split("\n\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
