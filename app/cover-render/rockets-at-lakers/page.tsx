/* eslint-disable @next/next/no-img-element */

export default function RocketsAtLakersCover() {
  return (
    <div
      style={{
        background: "#2a2a2a",
        minHeight: "100vh",
        padding: "40px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <p style={{ color: "#fff", fontSize: 13, marginBottom: 16, textAlign: "center" }}>
        Screenshot everything inside the white border. Cmd+Shift+4 → drag to select → release.
      </p>

      <div style={{ border: "2px dashed #fff", padding: 4 }}>
        <div
          style={{
            position: "relative",
            width: 1500,
            height: 1000,
            background: "#0a0a0a",
            overflow: "hidden",
          }}
        >
          <img
            src="/images/courts/nba/lakers-home.png"
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.25,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.85) 100%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 50,
              left: "50%",
              transform: "translateX(-50%)",
              textAlign: "center",
            }}
          >
            <span
              style={{
                padding: "10px 28px",
                background: "linear-gradient(90deg, #C8102E 0%, #1D428A 100%)",
                borderRadius: 999,
                fontSize: 20,
                fontWeight: 800,
                color: "#fff",
                textTransform: "uppercase",
                letterSpacing: 4,
                display: "inline-block",
              }}
            >
              NBA Playoffs · Round 1
            </span>
            <p
              style={{
                color: "#fff",
                fontSize: 18,
                letterSpacing: 4,
                textTransform: "uppercase",
                opacity: 0.8,
                marginTop: 18,
                fontWeight: 600,
              }}
            >
              April 18, 2026
            </p>
          </div>

          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              padding: "0 100px",
            }}
          >
            <CoverTeam
              name="Houston Rockets"
              jerseyLabel="Statement"
              jerseyColor="Black"
              jerseyImage="/images/jerseys/nba/rockets-statement-black.png"
            />
            <p
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: 6,
                opacity: 0.85,
                margin: "0 40px",
              }}
            >
              AT
            </p>
            <CoverTeam
              name="Los Angeles Lakers"
              jerseyLabel="Icon"
              jerseyColor="Gold"
              jerseyImage="/images/jerseys/nba/lakers-icon-gold.png"
            />
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 36,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <svg width="72" height="72" viewBox="0 0 512 512">
              <g transform="translate(256,380)">
                <rect x="-30" y="-300" width="60" height="220" rx="30" fill="#0021A5" transform="rotate(-24)" />
                <rect x="-30" y="-300" width="60" height="220" rx="30" fill="#4A90D9" transform="rotate(-8)" />
                <rect x="-30" y="-300" width="60" height="220" rx="30" fill="#2f6bed" transform="rotate(8)" />
                <rect x="-30" y="-300" width="60" height="220" rx="30" fill="#6B9E8F" transform="rotate(24)" />
                <circle cx="0" cy="0" r="22" fill="#2f6bed" />
              </g>
            </svg>
            <span
              style={{
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                fontFamily: "var(--font-sans)",
              }}
            >
              <span style={{ color: "#fff" }}>Color</span>
              <span style={{ color: "#2f6bed" }}>Way</span>
              <span style={{ color: "#fff" }}> Sports</span>
              <span style={{ color: "#2f6bed" }}>.</span>
            </span>
          </div>
        </div>
      </div>

      <p style={{ color: "#999", fontSize: 12, marginTop: 16, textAlign: "center", lineHeight: 1.6 }}>
        Save the screenshot as <strong style={{ color: "#fff" }}>rockets-lakers-round1.png</strong> and place it at
        <br />
        <strong style={{ color: "#fff" }}>/public/images/posts/NBA-Playoffs-Jersey-Matchups/</strong> (replace existing)
      </p>
    </div>
  );
}

function CoverTeam({
  name,
  jerseyLabel,
  jerseyColor,
  jerseyImage,
}: {
  name: string;
  jerseyLabel: string;
  jerseyColor: string;
  jerseyImage: string;
}) {
  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <img
        src={jerseyImage}
        alt={`${name} jersey`}
        style={{ height: 460, maxWidth: "100%", objectFit: "contain", marginBottom: 24 }}
      />
      <p
        style={{
          color: "#fff",
          fontSize: 34,
          fontWeight: 900,
          margin: 0,
          lineHeight: 1.1,
          textShadow: "0 2px 8px rgba(0,0,0,0.6)",
        }}
      >
        {name.toUpperCase()}
      </p>
      <p
        style={{
          color: "#fff",
          fontSize: 16,
          letterSpacing: 3,
          textTransform: "uppercase",
          opacity: 0.85,
          marginTop: 10,
          fontWeight: 600,
        }}
      >
        {jerseyLabel} · {jerseyColor}
      </p>
    </div>
  );
}
