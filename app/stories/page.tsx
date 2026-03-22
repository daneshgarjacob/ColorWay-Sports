import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StoryCard from "@/components/StoryCard";

const stories = [
  {
    slug: "lakers-jersey-tracker-2025-26",
    title: "The Lakers Have Only Worn Gold at Home 11 Times This Season. That's a Problem.",
    category: "Uniforms",
    excerpt:
      "I've been tracking every Lakers uniform this season in a spreadsheet. 70 games in, the data tells the story I already knew: gold is no longer the default at home.",
    gradient: "linear-gradient(135deg, #552583 0%, #FDB927 100%)",
    overlayText: "LAKERS",
  },
  {
    slug: "coming-soon",
    title: "More Stories on the Way",
    category: "Coming Soon",
    excerpt:
      "Stadiums, score bugs, jersey patches, helmet designs, network tickers — we're covering it all. Stay tuned.",
    gradient: "linear-gradient(135deg, #1a3a5c 0%, #FF5910 100%)",
    overlayText: "COMING SOON",
  },
];

export default function StoriesPage() {
  return (
    <>
      <Header />
      <main className="max-w-[1200px] mx-auto px-5 py-12">
        <h1 className="text-3xl font-bold text-black mb-2">Stories</h1>
        <p className="text-gray-medium mb-8">
          All the latest on uniforms, scorebugs, stadiums, and the visual side of sports.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <StoryCard key={story.slug} {...story} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
