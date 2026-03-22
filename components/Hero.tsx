import Link from "next/link";

export default function Hero() {
  return (
    <section
      className="relative flex items-center justify-center text-center text-white py-28 sm:py-36"
      style={{
        background: "linear-gradient(135deg, #0a1628 0%, #002D72 40%, #1a3a5c 70%, #FF5910 100%)",
      }}
    >
      <div className="max-w-[700px] mx-auto px-5">
        <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-white/70 mb-5">
          All Things Sports, Besides The Game Itself
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
          The Game Has a Look.
          <br />
          We <span className="text-orange">Cover</span> It.
        </h1>
        <Link
          href="/stories"
          className="inline-block mt-8 bg-orange hover:bg-orange/90 text-white font-semibold text-sm uppercase tracking-wider px-8 py-4 rounded transition-colors"
        >
          Read Stories
        </Link>
      </div>
    </section>
  );
}
