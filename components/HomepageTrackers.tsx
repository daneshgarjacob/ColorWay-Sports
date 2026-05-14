import Link from "next/link";

const trackers = [
  {
    slug: "nba-playoffs-2026-round-2-jersey-tracker",
    kicker: "NBA · Playoffs · Round 2",
    title: "2026 NBA Playoffs Round 2 Jersey Tracker",
    dek: "Thunder swept the Lakers. Knicks swept the Sixers. Pistons-Cavs went seven. Every matchup graded.",
    status: "Live · Round 2",
    grade: "A",
    image: "/images/posts/NBA-Playoffs-Jersey-Matchups/round2-tracker-cover.png",
  },
  {
    slug: "nhl-playoffs-2026-round-2-jersey-tracker",
    kicker: "NHL · Stanley Cup Playoffs · Round 2",
    title: "2026 NHL Playoffs Round 2 Jersey Tracker",
    dek: "Hurricanes swept Flyers 4-0. Avalanche, Canadiens, and Golden Knights still alive. Every sweater graded.",
    status: "Live · Round 2",
    grade: "A",
    image: "/images/posts/nhl-stanley-cup-logo-on-ice-2026/round2-tracker-cover.png",
  },
  {
    slug: "nba-playoffs-crowd-giveaway-tracker-2026",
    kicker: "NBA · Playoffs · All Rounds",
    title: "2026 NBA Playoffs Crowd Giveaway Tracker",
    dek: "Every t-shirt and towel giveaway graded. Pistons ALL DAWG blue shirts at Little Caesars earn an A.",
    status: "Updated Daily",
    grade: "A",
    image: "/images/posts/nba-playoffs-crowd-giveaway-2026/cavs-white-shirts-cover.jpg",
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

        {/* 3-up grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trackers.map((t) => {
            const bg = gradeColor[t.grade] ?? "#6B6B6B";
            return (
              <Link
                key={t.slug}
                href={`/stories/${t.slug}`}
                className="group flex flex-col gap-3"
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

                  {/* Grade badge — top right */}
                  <div
                    className="absolute top-3 right-3 flex items-center justify-center text-white font-bold text-sm"
                    style={{
                      background: bg,
                      width: 36,
                      height: 36,
                      borderRadius: 4,
                    }}
                  >
                    {t.grade}
                  </div>

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
