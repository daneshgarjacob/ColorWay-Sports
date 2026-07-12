import Link from "next/link";

// Marquee strip for the site's biggest access piece. Sits flush under the navy
// header so it reads as part of the masthead. Swap the fields below when the
// next flagship interview or exclusive lands.
const exclusive = {
  slug: "how-nba-uniforms-are-made-orlando-magic-rebrand",
  kicker: "ColorWay Exclusive",
  title: "Interview with the Orlando Magic Chief Marketing Officer: Who Really Designs NBA Uniforms",
};

export default function ExclusiveBanner() {
  return (
    <Link
      href={`/stories/${exclusive.slug}`}
      className="block group"
      style={{ background: "#003087", borderBottom: "3px solid #2f6bed", textDecoration: "none" }}
    >
      <div className="max-w-[1200px] mx-auto px-5 py-3 flex items-center gap-3 sm:gap-4">
        <span
          className="shrink-0"
          style={{
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#0a1733",
            background: "#F5C518",
            borderRadius: 999,
            padding: "4px 10px",
          }}
        >
          ★ Exclusive
        </span>
        <span
          className="min-w-0 line-clamp-2 sm:truncate text-[13px] sm:text-[14px] font-bold leading-snug"
          style={{ color: "#ffffff" }}
        >
          {exclusive.title}
        </span>
        <span
          aria-hidden
          className="ml-auto shrink-0 text-[13px] font-bold transition-transform duration-200 group-hover:translate-x-1 hidden sm:inline"
          style={{ color: "#9FB6D6" }}
        >
          Read the interview →
        </span>
        <span aria-hidden className="ml-auto shrink-0 text-[15px] font-bold sm:hidden" style={{ color: "#9FB6D6" }}>
          →
        </span>
      </div>
    </Link>
  );
}
