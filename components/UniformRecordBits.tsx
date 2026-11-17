// Small shared pieces for the /uniform-records pages: the helmet / jersey / pants
// color chips and the record badge. Plain server markup, no images, so nothing
// shifts and nothing repeats a photo.

const light = (hex: string) => {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 200;
};

export function ComboChips({
  hexes,
  labels,
  size = 22,
}: {
  hexes: [string, string, string];
  labels: [string, string, string];
  size?: number;
}) {
  const parts = ["Helmet", "Jersey", "Pants"];
  return (
    <span className="inline-flex flex-shrink-0 gap-1" role="img" aria-label={`${labels[0]} helmet, ${labels[1]} jersey, ${labels[2]} pants`}>
      {hexes.map((hex, i) => (
        <span
          key={i}
          title={`${parts[i]}: ${labels[i]}`}
          className="block rounded-[5px]"
          style={{
            width: size,
            height: i === 1 ? size * 1.25 : size,
            alignSelf: "center",
            background: hex,
            border: light(hex) ? "1px solid rgba(0,0,0,0.22)" : "1px solid rgba(0,0,0,0.08)",
          }}
        />
      ))}
    </span>
  );
}

export function RecordBadge({ text, tone }: { text: string; tone: "win" | "loss" | "even" }) {
  const color = tone === "win" ? "#0025CC" : tone === "loss" ? "#b42318" : "#0b0b0f";
  return (
    <span className="font-display font-black text-[28px] sm:text-[32px] leading-none tabular-nums tracking-tight whitespace-nowrap flex-shrink-0" style={{ color }}>
      {text}
    </span>
  );
}

/** NHL overtime / shootout losses count on the losing side of the tone. */
export const toneOf = (r: { w: number; l: number; otl?: number }) => {
  const lost = r.l + (r.otl ?? 0);
  return (r.w > lost ? "win" : lost > r.w ? "loss" : "even") as "win" | "loss" | "even";
};
