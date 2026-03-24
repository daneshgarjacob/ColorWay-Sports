export default function Hero() {
  return (
    <section
      className="text-center text-white py-5 sm:py-6"
      style={{
        background: "linear-gradient(135deg, #001845 0%, #003087 50%, #FF5910 100%)",
      }}
    >
      <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-white/80 font-medium">
        The Game Has a Look. We <span className="text-orange font-bold">Cover</span> It.
      </p>
    </section>
  );
}
