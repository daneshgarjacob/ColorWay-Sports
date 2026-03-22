import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="max-w-[800px] mx-auto px-5 py-12">
        <h1 className="text-3xl font-bold text-black mb-6">About ColorWay Sports</h1>
        <div className="prose text-foreground space-y-4">
          <p>
            ColorWay Sports covers the visual side of sports — the part you see but most outlets
            don&apos;t cover. Uniforms, scorebugs, stadiums, brand partnerships, helmet designs,
            network tickers, and everything in between.
          </p>
          <p>
            We believe the game has a look, and that look matters. From the Lakers&apos; gold
            jerseys to the NFL&apos;s latest scorebug redesign, we track, analyze, and rank it all.
          </p>
          <p>
            This is independent sports media for people who care about design as much as the game itself.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
