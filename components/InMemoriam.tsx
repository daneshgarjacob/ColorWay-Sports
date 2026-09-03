import Link from "next/link";

// In Memoriam banner for the homepage, displayed above the Featured Trackers band.
// Solemn, full-width black band linking to the tribute post.
// To remove after the mourning period, delete the <InMemoriam /> usage from app/page.tsx.

export default function InMemoriam() {
  return (
    <section
      style={{
        background: "linear-gradient(180deg, #000000 0%, #0a0a0a 100%)",
        borderTop: "1px solid #1f1f1f",
        borderBottom: "1px solid #1f1f1f",
      }}
    >
      <Link prefetch={false}
        href="/stories/remembering-kyle-busch-tribute-2026"
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
        className="group"
      >
        <div
          className="max-w-[1200px] mx-auto px-5"
          style={{
            paddingTop: 36,
            paddingBottom: 36,
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "#8a8a8a",
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            }}
          >
            In Memoriam
          </p>
          <h2
            style={{
              margin: "14px 0 8px",
              fontFamily: "var(--font-serif)",
              fontSize: 38,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.5px",
              lineHeight: 1.15,
            }}
            className="transition-colors duration-200 group-hover:text-[#2f6bed]"
          >
            Kyle Busch · 1985 – 2026
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "#bbbbbb",
              fontStyle: "italic",
              maxWidth: 640,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.5,
            }}
          >
            Two-time NASCAR Cup Series champion. Forever the 18.
          </p>
          <p
            style={{
              margin: "16px 0 0",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#2f6bed",
            }}
            className="transition-opacity duration-200 group-hover:opacity-80"
          >
            Read our tribute →
          </p>
        </div>
      </Link>
    </section>
  );
}
