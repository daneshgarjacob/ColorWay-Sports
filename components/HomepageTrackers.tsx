import Link from "next/link";

const trackers = [
  {
    slug: "nba-playoffs-2026-conference-finals-jersey-tracker",
    kicker: "NBA · Playoffs · Conference Finals",
    title: "2026 NBA Conference Finals Jersey Tracker",
    dek: "Spurs beat Thunder in WCF Game 4 at Frost Bank Center to tie the West 2-2. Knicks lead Cavs ECF 3-0 after Game 3 win in Cleveland. Every uniform matchup graded.",
    status: "Live · Conference Finals",
    grade: "A",
    image: "/images/posts/NBA-Playoffs-Jersey-Matchups/conference-finals-tracker-cover.png",
  },
  {
    slug: "nhl-conference-finals-2026-jersey-tracker",
    kicker: "NHL · Stanley Cup Playoffs · Conference Finals",
    title: "2026 NHL Conference Finals Jersey Tracker",
    dek: "Knights win WCF Game 3 at T-Mobile Arena to lead Avalanche 3-0. Canadiens host Hurricanes at Bell Centre for ECF Game 3 with the iconic red home debut. Every sweater matchup graded.",
    status: "Live · Conference Finals",
    grade: "B+",
    image: "/images/posts/NHL-Playoffs-Jersey-Matchups/conference-finals-tracker-cover.png",
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
