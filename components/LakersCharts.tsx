"use client";

const COLORS: Record<string, string> = {
  Gold: "#FDB927",
  White: "#F0F0F0",
  Purple: "#552583",
  Black: "#000000",
};

const TEXT_COLOR: Record<string, string> = {
  Gold: "#1a1a1a",
  White: "#1a1a1a",
  Purple: "#ffffff",
  Black: "#ffffff",
};

const BORDER_FOR_WHITE = "1px solid #ccc";

// Chart 1 data
const homeBreakdown = [
  { label: "Gold", count: 13 },
  { label: "White", count: 12 },
  { label: "Purple", count: 9 },
  { label: "Black", count: 9 },
];

const awayBreakdown = [
  { label: "Gold", count: 16 },
  { label: "White", count: 10 },
  { label: "Purple", count: 10 },
  { label: "Black", count: 3 },
];

// Chart 2 data
const homeGames = [
  { num: 1, color: "Gold", day: "Tue" },
  { num: 2, color: "Gold", day: "Fri" },
  { num: 3, color: "Gold", day: "Mon" },
  { num: 4, color: "White", day: "Sun" },
  { num: 5, color: "Purple", day: "Wed" },
  { num: 6, color: "Black", day: "Tue" },
  { num: 7, color: "Purple", day: "Tue" },
  { num: 8, color: "Purple", day: "Fri" },
  { num: 9, color: "White", day: "Sun" },
  { num: 10, color: "Gold", day: "Mon" },
  { num: 11, color: "Purple", day: "Wed" },
  { num: 12, color: "Gold", day: "Tue" },
  { num: 13, color: "White", day: "Thu" },
  { num: 14, color: "White", day: "Sun" },
  { num: 15, color: "Black", day: "Tue" },
  { num: 16, color: "Black", day: "Fri" },
  { num: 17, color: "White", day: "Sun" },
  { num: 18, color: "Purple", day: "Fri" },
  { num: 19, color: "Black", day: "Tue" },
  { num: 20, color: "Gold", day: "Thu" },
  { num: 21, color: "White", day: "Sun" },
  { num: 22, color: "Gold", day: "Tue" },
  { num: 23, color: "Purple", day: "Thu" },
  { num: 24, color: "Gold", day: "Sat" },
  { num: 25, color: "Purple", day: "Mon" },
  { num: 26, color: "Gold", day: "Tue" },
  { num: 27, color: "Purple", day: "Thu" },
  { num: 28, color: "Gold", day: "Fri" },
  { num: 29, color: "White", day: "Sun" },
  { num: 30, color: "Black", day: "Tue" },
  { num: 31, color: "White", day: "Sun" },
  { num: 32, color: "Black", day: "Tue" },
  { num: 33, color: "Gold", day: "Fri" },
  { num: 34, color: "White", day: "Sun" },
  { num: 35, color: "Black", day: "Tue" },
  { num: 36, color: "Gold", day: "Thu" },
  { num: 37, color: "Gold", day: "Sat" },
  { num: 38, color: "Purple", day: "Fri" },
  { num: 39, color: "Gold", day: "Mon" },
  { num: 40, color: "Black", day: "Tue" },
  { num: 41, color: "White", day: "Sun" },
];

// Chart 3 data
const allGames = [
  { g: 1, ha: "H", c: "Gold" },
  { g: 2, ha: "H", c: "Gold" },
  { g: 3, ha: "A", c: "White" },
  { g: 4, ha: "H", c: "Gold" },
  { g: 5, ha: "A", c: "Gold" },
  { g: 6, ha: "A", c: "White" },
  { g: 7, ha: "H", c: "White" },
  { g: 8, ha: "A", c: "Purple" },
  { g: 9, ha: "H", c: "Purple" },
  { g: 10, ha: "A", c: "White" },
  { g: 11, ha: "A", c: "Gold" },
  { g: 12, ha: "A", c: "Purple" },
  { g: 13, ha: "A", c: "White" },
  { g: 14, ha: "A", c: "Purple" },
  { g: 15, ha: "H", c: "Black" },
  { g: 16, ha: "H", c: "Purple" },
  { g: 17, ha: "H", c: "Purple" },
  { g: 18, ha: "H", c: "White" },
  { g: 19, ha: "H", c: "Gold" },
  { g: 20, ha: "A", c: "Gold" },
  { g: 21, ha: "A", c: "Gold" },
  { g: 22, ha: "A", c: "White" },
  { g: 23, ha: "H", c: "Purple" },
  { g: 24, ha: "A", c: "White" },
  { g: 25, ha: "A", c: "Purple" },
  { g: 26, ha: "A", c: "White" },
  { g: 27, ha: "H", c: "Gold" },
  { g: 28, ha: "H", c: "White" },
  { g: 29, ha: "H", c: "White" },
  { g: 30, ha: "H", c: "Black" },
  { g: 31, ha: "H", c: "Black" },
  { g: 32, ha: "H", c: "White" },
  { g: 33, ha: "A", c: "Gold" },
  { g: 34, ha: "A", c: "Gold" },
  { g: 35, ha: "H", c: "Purple" },
  { g: 36, ha: "A", c: "Gold" },
  { g: 37, ha: "H", c: "Black" },
  { g: 38, ha: "H", c: "Gold" },
  { g: 39, ha: "A", c: "White" },
  { g: 40, ha: "H", c: "White" },
  { g: 41, ha: "A", c: "Gold" },
  { g: 42, ha: "A", c: "Black" },
  { g: 43, ha: "A", c: "White" },
  { g: 44, ha: "A", c: "Purple" },
  { g: 45, ha: "A", c: "Gold" },
  { g: 46, ha: "A", c: "Black" },
  { g: 47, ha: "A", c: "Purple" },
  { g: 48, ha: "H", c: "Gold" },
  { g: 49, ha: "H", c: "Purple" },
  { g: 50, ha: "H", c: "Gold" },
  { g: 51, ha: "H", c: "Purple" },
  { g: 52, ha: "H", c: "Gold" },
  { g: 53, ha: "H", c: "Purple" },
  { g: 54, ha: "H", c: "Gold" },
  { g: 55, ha: "H", c: "White" },
  { g: 56, ha: "H", c: "Black" },
  { g: 57, ha: "A", c: "Gold" },
  { g: 58, ha: "A", c: "White" },
  { g: 59, ha: "H", c: "White" },
  { g: 60, ha: "H", c: "Black" },
  { g: 61, ha: "A", c: "Gold" },
  { g: 62, ha: "H", c: "Gold" },
  { g: 63, ha: "H", c: "White" },
  { g: 64, ha: "H", c: "Black" },
  { g: 65, ha: "H", c: "Gold" },
  { g: 66, ha: "H", c: "Gold" },
  { g: 67, ha: "A", c: "Gold" },
  { g: 68, ha: "A", c: "Purple" },
  { g: 69, ha: "A", c: "Gold" },
  { g: 70, ha: "A", c: "Purple" },
  { g: 71, ha: "A", c: "Gold" },
  { g: 72, ha: "A", c: "Purple" },
  { g: 73, ha: "H", c: "Purple" },
  { g: 74, ha: "H", c: "Gold" },
  { g: 75, ha: "H", c: "Black" },
  { g: 76, ha: "A", c: "Black" },
  { g: 77, ha: "A", c: "White" },
  { g: 78, ha: "H", c: "Gold" },
  { g: 79, ha: "A", c: "Purple" },
  { g: 80, ha: "H", c: "Black" },
  { g: 81, ha: "H", c: "White" },
  { g: 82, ha: "A", c: "Purple" },
];

// Chart 4 data
const totalAppearances = [
  { label: "Gold", count: 29 },
  { label: "White", count: 22 },
  { label: "Purple", count: 19 },
  { label: "Black", count: 12 },
];

function isTraditional(color: string, day: string): boolean {
  if (color === "Gold" && day !== "Sun") return true;
  if (color === "White" && (day === "Sat" || day === "Sun")) return true;
  return false;
}

function HorizontalBar({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const pct = (count / max) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <span
        style={{
          width: 52,
          fontSize: 13,
          fontWeight: 600,
          color: "#e5e5e5",
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, position: "relative", height: 28 }}>
        <div
          style={{
            width: `${pct}%`,
            minWidth: 2,
            height: "100%",
            backgroundColor: COLORS[label],
            borderRadius: 4,
            border: label === "White" ? BORDER_FOR_WHITE : "none",
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <span
        style={{
          width: 28,
          fontSize: 14,
          fontWeight: 700,
          color: "#e5e5e5",
          textAlign: "left",
          flexShrink: 0,
        }}
      >
        {count}
      </span>
    </div>
  );
}

function GameBox({
  num,
  color,
  borderColor,
  subLabel,
  size = 44,
}: {
  num: number;
  color: string;
  borderColor?: string;
  subLabel?: string;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: COLORS[color],
        border: borderColor
          ? `3px solid ${borderColor}`
          : color === "White"
          ? "1px solid #bbb"
          : "1px solid rgba(255,255,255,0.08)",
        borderRadius: 6,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontSize: subLabel ? 11 : 13,
        fontWeight: 700,
        color: TEXT_COLOR[color],
        lineHeight: 1.1,
        flexShrink: 0,
      }}
    >
      <span>{num}</span>
      {subLabel && (
        <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.8 }}>
          {subLabel}
        </span>
      )}
    </div>
  );
}

function SectionCard({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      style={{
        backgroundColor: "#1a1a2e",
        borderRadius: 12,
        padding: "28px 24px",
        marginBottom: 32,
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
      }}
    >
      {children}
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: 18,
        fontWeight: 700,
        color: "#ffffff",
        margin: "0 0 4px 0",
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </h3>
  );
}

function SectionSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 13,
        color: "#a0a0b8",
        margin: "0 0 20px 0",
        lineHeight: 1.5,
      }}
    >
      {children}
    </p>
  );
}

export function HomeAwayChart() {
  const homeMax = Math.max(...homeBreakdown.map((d) => d.count));
  const awayMax = Math.max(...awayBreakdown.map((d) => d.count));
  const barMax = Math.max(homeMax, awayMax);
  return (
    <SectionCard id="home-away-breakdown">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <SectionTitle>Home &middot; 41 games</SectionTitle>
          <div style={{ marginTop: 16 }}>
            {homeBreakdown.map((d) => (
              <HorizontalBar key={d.label} label={d.label} count={d.count} max={barMax} />
            ))}
          </div>
        </div>
        <div>
          <SectionTitle>Away &middot; 41 games</SectionTitle>
          <div style={{ marginTop: 16 }}>
            {awayBreakdown.map((d) => (
              <HorizontalBar key={d.label} label={d.label} count={d.count} max={barMax} />
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export function HomeRatioChart() {
  const traditional = homeGames.filter((g) => isTraditional(g.color, g.day)).length;
  const nonTraditional = 41 - traditional;
  const traditionalPct = ((traditional / 41) * 100).toFixed(1);
  const nonTraditionalPct = ((nonTraditional / 41) * 100).toFixed(1);
  return (
    <SectionCard id="home-ratio">
      <SectionTitle>Home Ratio &middot; {traditional} : {nonTraditional} &middot; {traditionalPct}% in the Right Jersey</SectionTitle>
      <SectionSubtitle>Each Home Game: Gold or White = Traditional (Green Border) &middot; Purple or Black = Non-Traditional (Red Border)</SectionSubtitle>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        {homeGames.map((g) => {
          const trad = isTraditional(g.color, g.day);
          return <GameBox key={g.num} num={g.num} color={g.color} borderColor={trad ? "#22c55e" : "#ef4444"} />;
        })}
      </div>
      <div style={{ borderRadius: 8, overflow: "hidden", height: 28, display: "flex", marginBottom: 8 }}>
        <div style={{ width: `${(traditional / 41) * 100}%`, backgroundColor: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{traditional}</div>
        <div style={{ width: `${(nonTraditional / 41) * 100}%`, backgroundColor: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{nonTraditional}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#a0a0b8" }}>
        <span><span style={{ color: "#22c55e", fontWeight: 700 }}>{traditional}</span> Traditional ({traditionalPct}%)</span>
        <span><span style={{ color: "#ef4444", fontWeight: 700 }}>{nonTraditional}</span> Non-Traditional ({nonTraditionalPct}%)</span>
      </div>
    </SectionCard>
  );
}

export function FullSeasonChart() {
  return (
    <SectionCard id="full-season-grid">
      <SectionTitle>Lakers 2025-26 &middot; Every Game, Every Jersey</SectionTitle>
      <SectionSubtitle>82 Games Tracked &middot; H = Home &middot; A = Away</SectionSubtitle>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        {allGames.map((g) => <GameBox key={g.g} num={g.g} color={g.c} subLabel={g.ha} size={48} />)}
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        {["Gold", "White", "Purple", "Black"].map((c) => (
          <div key={c} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 16, height: 16, backgroundColor: COLORS[c], borderRadius: 3, border: c === "White" ? BORDER_FOR_WHITE : "none" }} />
            <span style={{ fontSize: 13, color: "#a0a0b8", fontWeight: 500 }}>{c}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function TotalAppearancesChart() {
  const totalMax = Math.max(...totalAppearances.map((d) => d.count));
  return (
    <SectionCard id="total-appearances">
      <SectionTitle>Total Uniform Appearances &middot; 82 Games</SectionTitle>
      <div style={{ marginTop: 16 }}>
        {totalAppearances.map((d) => <HorizontalBar key={d.label} label={d.label} count={d.count} max={totalMax} />)}
      </div>
    </SectionCard>
  );
}

export default function LakersCharts() {
  const homeMax = Math.max(...homeBreakdown.map((d) => d.count));
  const awayMax = Math.max(...awayBreakdown.map((d) => d.count));
  const barMax = Math.max(homeMax, awayMax);

  const totalMax = Math.max(...totalAppearances.map((d) => d.count));

  const traditional = homeGames.filter((g) => isTraditional(g.color, g.day)).length;
  const nonTraditional = 41 - traditional;
  const traditionalPct = ((traditional / 41) * 100).toFixed(1);
  const nonTraditionalPct = ((nonTraditional / 41) * 100).toFixed(1);

  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: 720,
        margin: "0 auto",
        padding: "0 16px",
      }}
    >
      {/* Chart 1: Home vs Away */}
      <SectionCard id="home-away-breakdown">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
        >
          <div>
            <SectionTitle>Home &middot; 41 games</SectionTitle>
            <div style={{ marginTop: 16 }}>
              {homeBreakdown.map((d) => (
                <HorizontalBar
                  key={d.label}
                  label={d.label}
                  count={d.count}
                  max={barMax}
                />
              ))}
            </div>
          </div>
          <div>
            <SectionTitle>Away &middot; 41 games</SectionTitle>
            <div style={{ marginTop: 16 }}>
              {awayBreakdown.map((d) => (
                <HorizontalBar
                  key={d.label}
                  label={d.label}
                  count={d.count}
                  max={barMax}
                />
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Chart 2: Home Ratio */}
      <SectionCard id="home-ratio">
        <SectionTitle>
          Home Ratio &middot; {traditional} : {nonTraditional} &middot;{" "}
          {traditionalPct}% in the Right Jersey
        </SectionTitle>
        <SectionSubtitle>
          Each Home Game: Gold or White = Traditional (Green Border) &middot;
          Purple or Black = Non-Traditional (Red Border)
        </SectionSubtitle>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 20,
          }}
        >
          {homeGames.map((g) => {
            const trad = isTraditional(g.color, g.day);
            return (
              <GameBox
                key={g.num}
                num={g.num}
                color={g.color}
                borderColor={trad ? "#22c55e" : "#ef4444"}
              />
            );
          })}
        </div>

        {/* Progress bar */}
        <div
          style={{
            borderRadius: 8,
            overflow: "hidden",
            height: 28,
            display: "flex",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: `${(traditional / 41) * 100}%`,
              backgroundColor: "#22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              transition: "width 0.6s ease",
            }}
          >
            {traditional}
          </div>
          <div
            style={{
              width: `${(nonTraditional / 41) * 100}%`,
              backgroundColor: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              transition: "width 0.6s ease",
            }}
          >
            {nonTraditional}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "#a0a0b8",
          }}
        >
          <span>
            <span style={{ color: "#22c55e", fontWeight: 700 }}>
              {traditional}
            </span>{" "}
            Traditional ({traditionalPct}%)
          </span>
          <span>
            <span style={{ color: "#ef4444", fontWeight: 700 }}>
              {nonTraditional}
            </span>{" "}
            Non-Traditional ({nonTraditionalPct}%)
          </span>
        </div>
      </SectionCard>

      {/* Chart 3: Full Season Grid */}
      <SectionCard id="full-season-grid">
        <SectionTitle>
          Lakers 2025-26 &middot; Every Game, Every Jersey
        </SectionTitle>
        <SectionSubtitle>
          82 Games Tracked &middot; H = Home &middot; A = Away
        </SectionSubtitle>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 20,
          }}
        >
          {allGames.map((g) => (
            <GameBox
              key={g.g}
              num={g.g}
              color={g.c}
              subLabel={g.ha}
              size={48}
            />
          ))}
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: 20,
            flexWrap: "wrap",
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {["Gold", "White", "Purple", "Black"].map((c) => (
            <div
              key={c}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  backgroundColor: COLORS[c],
                  borderRadius: 3,
                  border: c === "White" ? BORDER_FOR_WHITE : "none",
                }}
              />
              <span style={{ fontSize: 13, color: "#a0a0b8", fontWeight: 500 }}>
                {c}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Chart 4: Total Uniform Appearances */}
      <SectionCard id="total-appearances">
        <SectionTitle>Total Uniform Appearances &middot; 82 Games</SectionTitle>
        <div style={{ marginTop: 16 }}>
          {totalAppearances.map((d) => (
            <HorizontalBar
              key={d.label}
              label={d.label}
              count={d.count}
              max={totalMax}
            />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
