import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="max-w-[800px] mx-auto px-5 py-16 animate-fade-in-up">
        {/* Hero section */}
        <div className="text-center mb-12">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#8A8F98] font-medium mb-3">
            About Us
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-black tracking-[-0.02em] mb-4">
            Every Uniform. Every Logo.{" "}
            <span className="text-orange">Every Detail.</span>
          </h1>
          <p className="text-lg text-gray-medium max-w-[600px] mx-auto leading-relaxed">
            The sports media outlet dedicated to the visual side of the game.
          </p>
        </div>

        {/* Divider */}
        <div className="w-12 h-[3px] bg-orange mx-auto mb-12 rounded-full" />

        {/* Body */}
        <div className="space-y-6 text-[0.95rem] leading-[1.8] text-foreground">
          <p>
            ColorWay Sports covers what most outlets skip: the look of the game. Uniforms,
            scorebugs, stadiums, brand partnerships, helmet designs, network tickers, court
            designs, liveries, and everything in between.
          </p>
          <p>
            We live and breathe sports, but not just the scores and the highlights. We obsess
            over the details that most people walk right past. The stitching on a jersey. The
            font on a scoreboard. The way a stadium lights up at night. We geek out over this
            stuff because we believe the game has a look, and that look matters.
          </p>
          <p>
            This is independent sports media run by people who are genuinely obsessed with
            every visual layer of the sports world. If it can be seen, we&apos;re covering it,
            and we&apos;re covering it better than anyone else.
          </p>
        </div>

        {/* What We Cover */}
        <div className="mt-14">
          <h2 className="text-xl font-extrabold text-black mb-6 tracking-[-0.01em]">What We Cover</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              "Uniforms & Jerseys",
              "Scorebugs & Tickers",
              "Stadiums & Arenas",
              "Logos & Rebrands",
              "F1 Liveries",
              "Court & Field Design",
              "Helmet Design",
              "Brand Partnerships",
              "Leaked Gear",
            ].map((topic) => (
              <div
                key={topic}
                className="border border-border rounded-lg px-4 py-3 text-sm font-medium text-black bg-white"
              >
                {topic}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 border-t border-border pt-10 text-center">
          <p className="text-gray-medium text-sm mb-4">
            Got a tip, a leaked jersey, or just want to talk design?
          </p>
          <Link
            href="/contact"
            className="inline-block bg-orange hover:bg-orange/90 text-white font-semibold text-sm uppercase tracking-wider px-8 py-3 rounded transition-colors"
          >
            Get In Touch
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
