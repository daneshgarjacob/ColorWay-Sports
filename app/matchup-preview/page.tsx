/* eslint-disable @next/next/no-img-element */

export default function MatchupPreview() {
  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", padding: "60px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, marginBottom: 8, color: "#222", fontWeight: 300 }}>
          Body Matchup Card — Sample
        </h1>
        <p style={{ fontSize: 13, color: "#999", marginBottom: 40 }}>
          Same aesthetic as the cover, sized for inline use in a post.
        </p>

        <Matchup
          awayName="Toronto Raptors"
          awayJersey="/images/jerseys/nba/raptors-icon-red.png"
          awayEdition="Icon"
          awayColor="Red"
          homeName="Cleveland Cavaliers"
          homeJersey="/images/jerseys/nba/cavs-classic-blue.png"
          homeEdition="Classic"
          homeColor="Throwback Blue"
          court="/images/courts/nba/cavs-alternate-home.png"
          arena="Rocket Arena · Cleveland"
          tournament="NBA Playoffs · Round 1"
        />
      </div>
    </div>
  );
}

function Matchup({
  awayName,
  awayJersey,
  awayEdition,
  awayColor,
  homeName,
  homeJersey,
  homeEdition,
  homeColor,
  court,
  arena,
  tournament,
}: {
  awayName: string;
  awayJersey: string;
  awayEdition: string;
  awayColor: string;
  homeName: string;
  homeJersey: string;
  homeEdition: string;
  homeColor: string;
  court: string;
  arena: string;
  tournament: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "2 / 1",
        background: "#0a0a0a",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <img
        src={court}
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
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.8) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <span
          style={{
            padding: "5px 14px",
            background: "linear-gradient(90deg, #C8102E 0%, #1D428A 100%)",
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 800,
            color: "#fff",
            textTransform: "uppercase",
            letterSpacing: 2.5,
            display: "inline-block",
          }}
        >
          {tournament}
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          padding: "0 40px",
        }}
      >
        <TeamBlock name={awayName} jersey={awayJersey} edition={awayEdition} color={awayColor} />
        <p
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: 3,
            opacity: 0.85,
            margin: "0 24px",
          }}
        >
          AT
        </p>
        <TeamBlock name={homeName} jersey={homeJersey} edition={homeEdition} color={homeColor} />
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <p
          style={{
            color: "#fff",
            fontSize: 10,
            letterSpacing: 2,
            textTransform: "uppercase",
            opacity: 0.7,
            margin: 0,
            fontWeight: 600,
          }}
        >
          {arena}
        </p>
      </div>
    </div>
  );
}

function TeamBlock({
  name,
  jersey,
  edition,
  color,
}: {
  name: string;
  jersey: string;
  edition: string;
  color: string;
}) {
  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <img
        src={jersey}
        alt={`${name} ${edition} Edition ${color} jersey`}
        style={{ height: 220, maxWidth: "100%", objectFit: "contain", marginBottom: 10 }}
      />
      <p
        style={{
          color: "#fff",
          fontSize: 15,
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
          fontSize: 9,
          letterSpacing: 2,
          textTransform: "uppercase",
          opacity: 0.85,
          marginTop: 4,
          fontWeight: 600,
        }}
      >
        {edition} · {color}
      </p>
    </div>
  );
}
