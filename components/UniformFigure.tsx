/**
 * A whole football uniform drawn as one small inline SVG: helmet over jersey
 * over pants over socks. Shapes are the approved tracker icon set (the same
 * paths as scripts/nfl_uniform_icons.py), so the board and the tracker cards
 * read as one family. No images: this ships as a few hundred bytes of markup.
 *
 * Any piece without a colour is drawn as a dashed, unpainted outline: that is
 * the "not announced yet" look. Pass `tba` to letter the figure as well.
 */

const SHAPES = {
  helmet: {
    body: "M9 41C7 25 17 11 33 11C46 11 54 20 55.5 30L52 33.5H43C40 33.5 38.8 36.6 40.6 39.2L44.5 45C46 47.6 44.6 51 41.4 51H15C11.6 51 9.4 47 9 41Z",
    details: ["M17 20C22 15 27 13 33 13"],
    mask: ["M52 33.5H60.5V47.5H44", "M45.6 40.5H60.5", "M55.5 30L60.5 33.5"],
  },
  jersey: {
    body: "M22 8.5L27 7C28 11 29.8 13.5 32 13.5C34.2 13.5 36 11 37 7L42 8.5L55.5 15.5L58 30.5L47.5 32.5V56.5H16.5V32.5L6 30.5L8.5 15.5Z",
    details: ["M27 7L32 15.5L37 7", "M16.5 32.5L17.4 19", "M47.5 32.5L46.6 19"],
  },
  pants: {
    body: "M15.5 8H48.5L50.5 33L49 55H36.5L32.8 26H31.2L27.5 55H15L13.5 33Z",
    details: ["M15.1 13.5H48.9", "M32 13.5V26"],
  },
  // Two simple socks under the pant legs (pants coordinates).
  socks: {
    body: "M16 54.5H27V67.5Q27 69 25.5 69H17.5Q16 69 16 67.5Z M37 54.5H48V67.5Q48 69 46.5 69H38.5Q37 69 37 67.5Z",
    details: ["M16 59H27", "M37 59H48"],
  },
} as const;

type Part = keyof typeof SHAPES;

// Placement of each piece inside the figure's 64-wide frame.
const PLACE: Record<Part, string> = {
  helmet: "translate(10.5 0) scale(.62)",
  jersey: "translate(0 27)",
  pants: "translate(0 75)",
  socks: "translate(0 75)",
};

function lum(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const ch = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch((n >> 16) & 255) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255);
}

const VALID = /^#[0-9a-f]{6}$/i;

function Piece({ part, fill }: { part: Part; fill?: string }) {
  const s = SHAPES[part];
  const known = !!fill && VALID.test(fill);
  const ns = { vectorEffect: "non-scaling-stroke" as const };
  if (!known) {
    return (
      <path
        d={s.body}
        fill="#FFFFFF"
        stroke="#B9C0CA"
        strokeWidth={1.25}
        strokeDasharray="3 2.5"
        strokeLinejoin="round"
        {...ns}
      />
    );
  }
  const white = fill!.toUpperCase() === "#FFFFFF";
  const detail = lum(fill!) > 0.45 ? "rgba(20,34,63,.22)" : "rgba(255,255,255,.28)";
  return (
    <>
      <path d={s.body} fill={fill} stroke={white ? "#C9CED6" : "rgba(11,31,74,.18)"} strokeWidth={1.25} strokeLinejoin="round" {...ns} />
      {s.details.map((d) => (
        <path key={d} d={d} fill="none" stroke={detail} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" {...ns} />
      ))}
      {part === "helmet" && <circle cx={27} cy={36} r={3.2} fill={detail} />}
      {"mask" in s &&
        s.mask.map((d) => (
          <path key={d} d={d} fill="none" stroke="#9AA3AE" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...ns} />
        ))}
    </>
  );
}

export type UniformColors = { helmet?: string; jersey?: string; pants?: string; socks?: string };

export default function UniformFigure({
  colors,
  facing = "right",
  tba = false,
  label,
  className,
}: {
  colors: UniformColors;
  /** Which way the helmet's facemask points; the home side faces left, toward the away side. */
  facing?: "left" | "right";
  tba?: boolean;
  /** Accessible description, e.g. "Steelers: black helmet, white jersey, gold pants". */
  label: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 4 64 142" className={className} role="img" aria-label={label} style={{ overflow: "visible" }}>
      <g transform={facing === "left" ? "translate(64 0) scale(-1 1)" : undefined}>
        <g transform={PLACE.helmet}>
          <Piece part="helmet" fill={colors.helmet} />
        </g>
      </g>
      <g transform={PLACE.socks}>
        <Piece part="socks" fill={colors.socks} />
      </g>
      <g transform={PLACE.pants}>
        <Piece part="pants" fill={colors.pants} />
      </g>
      <g transform={PLACE.jersey}>
        <Piece part="jersey" fill={colors.jersey} />
      </g>
      {tba && (
        <text
          x={32}
          y={66}
          textAnchor="middle"
          fontSize={9}
          fontWeight={800}
          letterSpacing={1.6}
          fill="#7C8696"
          style={{ fontFamily: "var(--font-display)" }}
        >
          TBA
        </text>
      )}
    </svg>
  );
}
