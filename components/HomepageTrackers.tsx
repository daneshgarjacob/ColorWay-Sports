import Link from "next/link";

const trackers = [
  {
    slug: "nba-finals-2026-jersey-tracker-knicks-spurs",
    kicker: "NBA · Finals · Knicks vs Spurs",
    title: "2026 NBA Finals Jersey Tracker",
    dek: "Knicks vs Spurs at the NBA Finals after 27 years. Knicks take Game 4 at the Garden in the Association whites to lead 3-1, with the Spurs' season on the line in white-vs-blue Friday at Frost Bank Center. Series average 9.4/10. Every matchup graded.",
    status: "Live · NBA Finals",
    grade: "A",
    image: "/images/posts/NBA-Playoffs-Jersey-Matchups/nba-finals-tracker-cover.jpg",
    centered: false,
  },
  {
    slug: "nhl-stanley-cup-final-2026-jersey-tracker-hurricanes-knights",
    kicker: "NHL · Stanley Cup Final · Hurricanes vs Knights",
    title: "2026 NHL Stanley Cup Final Jersey Tracker",
    dek: "Hurricanes win Game 5 in the black primary at Lenovo Center to lead 3-2, one win from Carolina's first Cup since 2006. The black-vs-white home pairing holds at 7/10; Knights gold lifted Games 3 and 4 at T-Mobile to 8/10. Series average 7.4/10.",
    status: "Live · Stanley Cup Final",
    grade: "B+",
    image: "/images/posts/NHL-Playoffs-Jersey-Matchups/nhl-finals-tracker-cover.jpg",
    centered: false,
  },
  {
    slug: "world-cup-2026-jersey-tracker",
    kicker: "Soccer · 2026 FIFA World Cup · 48 Teams, 104 Matches",
    title: "2026 FIFA World Cup Jersey Tracker",
    dek: "Every kit pairing of the tournament graded, from the opener through the July 19 Final at MetLife. Canada's first-ever home World Cup match lands a 7: maple leaf red vs Bosnia's pinstriped Kelme white at BMO Field. Azteca opener 7.5, Korea-Czechia 7. Tonight: the USMNT opens vs Paraguay at SoFi.",
    status: "Live · World Cup",
    grade: "A",
    image: "/images/posts/world-cup-2026-jersey-tracker/cover.jpg",
    centered: true,
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
                color: "#FF5910",
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
              borderBottom: "1.5px solid #FF5910",
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
                key={t.slug}
                href={`/stories/${t.slug}`}
                className={`group flex flex-col gap-3 ${t.centered ? "md:col-span-2 md:w-[calc(50%-12px)] md:mx-auto" : ""}`}
                style={{ textDecoration: "none", color: "#1a1a1a" }}
              >
                {/* Cover image */}
                <div
                  className="relative w-full overflow-hidden rounded-xl"
                  style={{ paddingBottom: "62.5%" }}
                >
                  <img
                    src={t.image}
                    alt={t.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

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
                        color: "#FF5910",
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
                    color: "#FF5910",
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
