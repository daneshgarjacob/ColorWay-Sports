import Link from "next/link";

type TrackerCard = {
  slug?: string;
  href?: string;
  kicker: string;
  title: string;
  dek: string;
  status: string;
  grade: string;
  image?: string;
  gradient?: string;
  centered?: boolean;
};

const trackers: TrackerCard[] = [
  {
    slug: "world-cup-2026-jersey-tracker",
    kicker: "Soccer · 2026 FIFA World Cup · 48 Teams, 104 Matches",
    title: "2026 FIFA World Cup Jersey & Uniform Tracker",
    dek: "Every kit pairing of the tournament graded, from the opener through the July 19 Final at MetLife. Nine perfect 10s now lead the board — Norway's red vs France's mint is the newest — with Portugal's red vs Congo DR's blue, Ecuador's yellow vs Germany's navy, Colombia's yellow vs Congo DR's blue, South Africa's yellow vs Korea's red, and Sweden's yellow vs Japan's blue all at 9.5. The Round of 32 is complete — Portugal's green vs Croatia's blue led the knockout round at 9.5 — and the Round of 16 is complete. Through 94 matches the average is 8.0/10. Every matchup graded.",
    status: "Live · World Cup",
    grade: "A",
    image: "/images/posts/world-cup-2026-jersey-tracker/cover-branded.jpg",
    centered: false,
  },
  {
    slug: "nba-free-agency-tracker-2026",
    kicker: "NBA · 2026 Free Agency",
    title: "2026 NBA Free Agency Tracker: Every Signing in Their New Jersey",
    dek: "Every 2026 NBA free agency signing in their new team jersey, led by the official reveal photos. Paul George, Mike Conley, and Mitchell Robinson in Celtics green; Jaylen Brown's shocking move to the Sixers' red, white, and blue. Updated all summer as the moves keep coming.",
    status: "Live · NBA",
    grade: "A",
    image: "/images/posts/nba-free-agency-tracker-2026/cover.jpg",
    centered: false,
  },
  {
    slug: "world-cup-round-of-32-kit-matchups-ranked",
    kicker: "Soccer · 2026 FIFA World Cup · Round of 32",
    title: "Every Round of 32 Kit Matchup, Ranked: All 16 Knockout Clashes Graded",
    dek: "The knockout round is in the books and every jersey pairing is ranked, counting down from worst to first. The round averaged 8.1 — above the tournament-wide 8.0 — and the lesson from the board is clear: the federations that reached for their boldest alternates won the round, and every red-vs-white pairing sank to the bottom third. Two alternate kits took the top spot at 9.5.",
    status: "New · Rankings",
    grade: "A",
    image: "/images/posts/wc-r32-kit-matchups-ranked-cover.jpg",
    centered: false,
  },
];

const gradeColor: Record<string, string> = {
  "A+": "#1F6B4E",
  "A":  "#1F6B4E",
  "A-": "#1F6B4E",
  "B+": "#3A5896",
  "B":  "#3A5896",
  "B-": "#3A5896",
  "C+": "#A35E12",
  "C":  "#A35E12",
  "C-": "#A35E12",
  "D":  "#9A3A2A",
  "F":  "#6B6B6B",
};

export default function HomepageTrackers() {
  return (
    <section
      style={{ borderTop: "1px solid #e5e5e5", borderBottom: "1px solid #e5e5e5" }}
      className="bg-white"
    >
      <div className="max-w-[1200px] mx-auto px-5 py-10">

        {/* Section header */}
        <div className="flex items-baseline justify-between mb-8">
          <div className="flex items-baseline gap-4 flex-wrap">
            <span
              style={{
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#2f6bed",
              }}
            >
              ● Live Trackers
            </span>
            <h2 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>
              Jersey &amp; Uniform Trackers
            </h2>
          </div>
          <Link
            href="/stories"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#003087",
              textDecoration: "none",
              borderBottom: "1.5px solid #2f6bed",
              paddingBottom: 2,
              whiteSpace: "nowrap",
            }}
            className="hover:text-orange transition-colors ml-4 shrink-0"
          >
            All trackers →
          </Link>
        </div>

        {/* Trackers grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trackers.map((t) => {
            return (
              <Link
                key={t.href ?? t.slug}
                href={t.href ?? `/stories/${t.slug}`}
                className={`group flex flex-col gap-3 ${t.centered ? "md:col-span-2 md:w-[calc(50%-12px)] md:mx-auto" : ""}`}
                style={{ textDecoration: "none", color: "#1a1a1a" }}
              >
                {/* Cover image */}
                <div
                  className="relative w-full overflow-hidden rounded-xl"
                  style={{ paddingBottom: "62.5%" }}
                >
                  {t.image ? (
                    <img
                      src={t.image}
                      alt={t.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 w-full h-full flex items-center justify-center px-6 transition-transform duration-500 group-hover:scale-105"
                      style={{ background: t.gradient }}
                    >
                      <span style={{ color: "#ffffff", fontSize: 26, fontWeight: 800, lineHeight: 1.15, textAlign: "center", letterSpacing: "-0.01em" }}>
                        Fill out your bracket
                      </span>
                    </div>
                  )}

                  {/* Status pill — bottom left */}
                  <div
                    className="absolute bottom-3 left-3"
                    style={{
                      background: "rgba(255,255,255,0.93)",
                      padding: "5px 10px",
                      borderRadius: 4,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#2f6bed",
                      }}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>

                {/* Kicker */}
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#2f6bed",
                  }}
                >
                  {t.kicker}
                </span>

                {/* Title */}
                <h3
                  className="transition-colors duration-200 group-hover:text-[#003087]"
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    lineHeight: 1.25,
                    color: "#1a1a1a",
                    margin: 0,
                  }}
                >
                  {t.title}
                </h3>

                {/* Dek */}
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.55,
                    color: "#666666",
                    margin: 0,
                  }}
                >
                  {t.dek}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
