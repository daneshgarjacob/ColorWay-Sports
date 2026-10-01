import { isHex, luminance, type UniformTrim } from "@/lib/nflTeamColors";

/**
 * A full football uniform, front view, drawn as one inline SVG: helmet in
 * three-quarter side profile (shell, centre stripe, ear hole, facemask cage),
 * jersey over shoulder pads (V collar, sleeve stripes, outlined number),
 * belted pants with a side stripe, striped socks and cleats.
 *
 * Fills come only from the tracker (`colors`); trim comes from the club's
 * identity colours (`trim`, lib/nflTeamColors.ts). Any piece without a colour
 * is left as white line art, and the helmet / jersey / pants that are unknown
 * sit under a soft grey "TBA" panel. No logos, wordmarks or decals: a plain
 * number and stripes only. No images, so it costs a few KB of markup.
 */

export type UniformColors = { helmet?: string; jersey?: string; pants?: string; socks?: string };

const W = 120;
const H = 252;
const TOP = -5;

// ---- geometry (helmet faces right; mirrored for the home side) --------------

const HELMET = {
  shell:
    "M38 54C31 44 30 26 42 15C52 6 68 4 79 11C87 16 91 24 91 32L90 36H80C76 36 74 39 75.5 42.5L78.5 49.5C79.5 52 78 54 75 54Z",
  back: "M38 54C31 44 30 26 42 15C38.5 26 39.5 42 47 54Z",
  stripe: "M91 30C89 17 76 7.5 60 7.5C45 8 34 19 32.5 38",
  shine: "M50 14C56 10.5 64 9.5 71 11.5",
  strap: "M64 51.5Q72 58 83 52.5",
  cage: ["M80 36L97 37.5V52H79.5", "M88 36.8V52", "M76.5 44.5H97", "M91 32.5L97 37.5"],
};

const JERSEY = {
  body: "M45 59L60 74L75 59L97 65C105 67 110 73 110.5 81L112.5 104L95.5 107.5L92.5 95L91.5 132H28.5L27.5 95L24.5 107.5L7.5 104L9.5 81C10 73 15 67 23 65Z",
  neck: "M45 59C50 56.5 70 56.5 75 59L60 74Z",
  collar: "M44.5 59.5L60 75L75.5 59.5",
  sides: ["M27.5 95L34.5 92.5L34 132H28.5Z", "M92.5 95L85.5 92.5L86 132H91.5Z"],
  sleeveUnder: ["M24.5 107.5L27.5 95L21.5 86Z", "M95.5 107.5L92.5 95L98.5 86Z"],
  seams: ["M23 65C27.5 70 29.5 81 27.5 95", "M97 65C92.5 70 90.5 81 92.5 95"],
  // Sleeve stripes run parallel to the cuff.
  sleeveStripes: ["M6 96.6L26.5 100.6", "M114 96.6L93.5 100.6"],
};

const PANTS = {
  body: "M28.8 131H91.2L93.6 160L91 198H65L61.2 160H58.8L55 198H29L26.4 160Z",
  belt: "M28.8 131H91.2L91.7 138.5H28.3Z",
  shade: ["M28.3 138.5L26.4 160L29 198H33L31 160L32.2 138.5Z", "M91.7 138.5L93.6 160L91 198H87L89 160L87.8 138.5Z"],
  inseam: "M55 198L58.8 160L60 151.5L61.2 160L65 198",
  fly: "M60 138.5V151",
  stripes: ["M32.4 139L30.6 160L32.6 197", "M87.6 139L89.4 160L87.4 197"],
  cuffs: ["M29.4 193.5H55.5", "M64.5 193.5H90.6"],
};

const SOCKS = {
  body: "M32.5 196H53.5L52.2 234H34Z M66.5 196H87.5L86 234H67.8Z",
  shade: "M48.5 196H53.5L52.2 234H48Z M66.5 196H71.5L72 234H67.8Z",
  bands: [205, 211.5],
};

const CLEATS = {
  body: "M34 232.5H52.6C53.6 237.5 53.6 241.5 52.6 244H27.5C24.4 244 24 239.8 27.8 238.4Z M86 232.5H67.4C66.4 237.5 66.4 241.5 67.4 244H92.5C95.6 244 96 239.8 92.2 238.4Z",
  sole: "M26 244H53 M67 244H94",
};

// ---- colour helpers ---------------------------------------------------------

function mix(hex: string, to: string, f: number) {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(to.slice(1), 16);
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - f) + ((b >> s) & 255) * f);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}

/** Side-panel tone: darker for most fills, lighter for near-black so it still reads. */
function shade(hex: string) {
  const l = luminance(hex);
  if (l > 0.85) return "#DDE2E9";
  if (l < 0.02) return mix(hex, "#FFFFFF", 0.16);
  return mix(hex, "#000000", 0.24);
}

const INK = "#1C2230"; // outline on painted pieces
const LINE = "#BCC4CF"; // outline on unpainted (TBA) pieces
const LINE_SOFT = "#D5DBE3";
const SW = 1.25;

type Paint = { fill: string; stroke: string; shade: string; known: boolean };

function paint(c?: string): Paint {
  if (isHex(c)) return { fill: c, stroke: INK, shade: shade(c), known: true };
  return { fill: "#FFFFFF", stroke: LINE, shade: "#F3F5F8", known: false };
}

// Two-tone stripe: a wider flank underneath, the main colour on top.
function Stripe({ d, main, flank, width }: { d: string; main: string; flank: string; width: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={flank} strokeWidth={width + 2.6} />
      <path d={d} fill="none" stroke={main} strokeWidth={width} />
    </>
  );
}

// Unknown pieces: where the soft TBA panels go (viewBox units), top to bottom.
const ZONES = {
  helmet: { x: 22, y: -4, w: 80, h: 62 },
  jersey: { x: 3, y: 57, w: 114, h: 76 },
  pants: { x: 21, y: 133.5, w: 78, h: 113.5 },
};

export default function UniformFigure({
  uid,
  colors,
  trim,
  facing = "right",
  number = "11",
  label,
  className,
}: {
  /** Unique per figure on the page (clip-path ids). */
  uid: string;
  colors: UniformColors;
  /** Club trim colours; without them painted pieces are drawn plain. */
  trim?: UniformTrim | null;
  /** Which way the facemask points; the home side faces left, toward the away side. */
  facing?: "left" | "right";
  number?: string;
  /** Accessible description, e.g. "Steelers: black helmet, white jersey, gold pants". */
  label: string;
  className?: string;
}) {
  const id = `uf-${uid.replace(/[^a-z0-9-]/gi, "")}`;
  const helmet = paint(colors.helmet);
  const jersey = paint(colors.jersey);
  const pants = paint(colors.pants);
  const socks = paint(colors.socks);
  const t = trim ?? null;
  const mask = helmet.known ? (t?.facemask ?? "#8E98A6") : "#D3D9E1";
  // Cleats are only drawn in colour when the lower half of the look is known.
  const cleatKnown = pants.known;
  const cleat = cleatKnown ? "#20252E" : "#FFFFFF";

  // Contiguous unknown pieces share one panel.
  const unknown = (["helmet", "jersey", "pants"] as const).filter(
    (p) => !{ helmet, jersey, pants }[p].known,
  );
  const panels: { x: number; y: number; w: number; h: number }[] = [];
  const order = ["helmet", "jersey", "pants"] as const;
  for (const p of unknown) {
    const z = ZONES[p];
    const prev = panels[panels.length - 1];
    const prevPart = order[order.indexOf(p) - 1];
    if (prev && prevPart && unknown.includes(prevPart)) {
      const x = Math.min(prev.x, z.x);
      const right = Math.max(prev.x + prev.w, z.x + z.w);
      panels[panels.length - 1] = { x, y: prev.y, w: right - x, h: z.y + z.h - prev.y };
    } else panels.push({ ...z });
  }

  const common = { strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

  return (
    <svg viewBox={`0 ${TOP} ${W} ${H}`} className={className} role="img" aria-label={label}>
      <defs>
        <clipPath id={`${id}-h`}>
          <path d={HELMET.shell} />
        </clipPath>
        <clipPath id={`${id}-j`}>
          <path d={JERSEY.body} />
        </clipPath>
        <clipPath id={`${id}-p`}>
          <path d={PANTS.body} />
        </clipPath>
        <clipPath id={`${id}-s`}>
          <path d={SOCKS.body} />
        </clipPath>
      </defs>

      <g {...common} strokeWidth={SW}>
        {/* Cleats and socks sit behind the pants. */}
        <path d={CLEATS.body} fill={cleat} stroke={cleatKnown ? INK : LINE} />
        <path d={CLEATS.sole} fill="none" stroke={cleatKnown ? "#0E1118" : LINE} strokeWidth={2.2} />

        <path d={SOCKS.body} fill={socks.fill} stroke={socks.stroke} />
        <g clipPath={`url(#${id}-s)`}>
          <path d={SOCKS.shade} fill={socks.shade} stroke="none" />
          {socks.known && t &&
            SOCKS.bands.map((y) => (
              <Stripe key={y} d={`M30 ${y}H90`} main={t.socks[0]} flank={t.socks[1]} width={2.6} />
            ))}
        </g>
        <path d={SOCKS.body} fill="none" stroke={socks.stroke} />

        {/* Pants */}
        <path d={PANTS.body} fill={pants.fill} stroke={pants.stroke} />
        <g clipPath={`url(#${id}-p)`}>
          {PANTS.shade.map((d) => (
            <path key={d} d={d} fill={pants.shade} stroke="none" />
          ))}
          {pants.known && t &&
            PANTS.stripes.map((d) => <Stripe key={d} d={d} main={t.pants[0]} flank={t.pants[1]} width={2.8} />)}
          <path d={PANTS.belt} fill={pants.known ? mix(pants.shade, "#000000", 0.12) : "#EEF1F5"} stroke="none" />
        </g>
        <path d={PANTS.belt} fill="none" stroke={pants.known ? INK : LINE_SOFT} />
        {pants.known && <rect x={56.5} y={132.6} width={7} height={4.4} rx={0.8} fill="#C9CFD8" stroke={INK} strokeWidth={0.8} />}
        <path d={PANTS.fly} fill="none" stroke={pants.known ? pants.shade : LINE_SOFT} />
        {PANTS.cuffs.map((d) => (
          <path key={d} d={d} fill="none" stroke={pants.known ? pants.shade : LINE_SOFT} />
        ))}
        <path d={PANTS.inseam} fill="none" stroke={pants.stroke} />
        <path d={PANTS.body} fill="none" stroke={pants.stroke} />

        {/* Jersey over shoulder pads */}
        <path d={JERSEY.body} fill={jersey.fill} stroke={jersey.stroke} />
        <g clipPath={`url(#${id}-j)`}>
          {[...JERSEY.sides, ...JERSEY.sleeveUnder].map((d) => (
            <path key={d} d={d} fill={jersey.shade} stroke="none" />
          ))}
          {jersey.known && t &&
            JERSEY.sleeveStripes.map((d) => (
              <Stripe key={d} d={d} main={t.sleeve[0]} flank={t.sleeve[1]} width={3.2} />
            ))}
        </g>
        <path d={JERSEY.neck} fill={jersey.known ? mix(jersey.shade, "#000000", 0.18) : "#EEF1F5"} stroke="none" />
        {JERSEY.seams.map((d) => (
          <path key={d} d={d} fill="none" stroke={jersey.known ? jersey.shade : LINE_SOFT} />
        ))}
        <path
          d={JERSEY.collar}
          fill="none"
          stroke={jersey.known && t ? t.sleeve[0] : jersey.known ? jersey.shade : LINE_SOFT}
          strokeWidth={2.6}
        />
        <path d={JERSEY.body} fill="none" stroke={jersey.stroke} />
        {jersey.known && (
          <text
            x={60}
            y={121}
            textAnchor="middle"
            fontSize={38}
            fontWeight={800}
            letterSpacing={-1.5}
            fill={t?.number ?? (luminance(jersey.fill) > 0.5 ? "#101820" : "#FFFFFF")}
            stroke={t?.numberOutline ?? "none"}
            strokeWidth={2.4}
            paintOrder="stroke"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {number}
          </text>
        )}

        {/* Helmet */}
        <g transform={`${facing === "left" ? `translate(${W} 0) scale(-1 1) ` : ""}translate(61 56) scale(1.13) translate(-61 -56)`}>
          <path d={HELMET.shell} fill={helmet.fill} stroke={helmet.stroke} />
          <g clipPath={`url(#${id}-h)`}>
            <path d={HELMET.back} fill={helmet.shade} stroke="none" />
            {helmet.known && t?.helmetStripe && (
              <Stripe d={HELMET.stripe} main={t.helmetStripe} flank={helmet.shade} width={4} />
            )}
          </g>
          {helmet.known && <path d={HELMET.shine} fill="none" stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={2} />}
          <path d={HELMET.shell} fill="none" stroke={helmet.stroke} />
          <circle cx={60} cy={38} r={3.1} fill={helmet.known ? mix(helmet.shade, "#000000", 0.35) : "#EEF1F5"} stroke={helmet.stroke} strokeWidth={0.9} />
          <path d={HELMET.strap} fill="none" stroke={helmet.known ? "#3A4150" : LINE_SOFT} strokeWidth={1.6} />
          {HELMET.cage.map((d) => (
            <g key={d}>
              {helmet.known && <path d={d} fill="none" stroke={INK} strokeWidth={3.4} />}
              <path d={d} fill="none" stroke={mask} strokeWidth={helmet.known ? 1.9 : 1.6} />
            </g>
          ))}
        </g>
      </g>

      {panels.map((p) => (
        <g key={p.y}>
          <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={9} fill="#D3D9E2" fillOpacity={0.5} stroke="#C3CBD6" strokeWidth={0.8} />
          <text
            x={p.x + p.w / 2}
            y={p.y + p.h / 2 + 5}
            textAnchor="middle"
            fontSize={14}
            fontWeight={800}
            letterSpacing={2.5}
            fill="#2f6bed"
            style={{ fontFamily: "var(--font-display)" }}
          >
            TBA
          </text>
        </g>
      ))}
    </svg>
  );
}
