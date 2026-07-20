// Counts how many alternate / City Connect / throwback jerseys were worn across
// the league on the most recent logged day, parsed from the daily tracker post.
// Feeds <MlbAlternatesWatch /> on the homepage.

const PRIMARY = /^(home white|road gray|home cream|home grey|road grey)$/i;

export type AlternatesDay = {
  day: string;            // "Sunday, July 19"
  totalUniforms: number;  // uniforms logged that day (2 per game)
  alternates: number;     // non-primary uniforms
  games: number;
  topLooks: Array<{ label: string; count: number; color?: string }>;
};

export function buildAlternatesWatch(contentHtml: string): AlternatesDay | null {
  // First h2 that looks like a day heading is the most recent day.
  const dayRe = /<h2[^>]*>([\s\S]*?)<\/h2>/g;
  const strip = (x: string) => x.replace(/<[^>]+>/g, "").trim();
  let m: RegExpExecArray | null;
  let start = -1, end = contentHtml.length, day = "";
  while ((m = dayRe.exec(contentHtml)) !== null) {
    const text = strip(m[1]);
    if (/^[A-Z][a-z]+, [A-Z][a-z]+ \d+/.test(text)) {
      if (start === -1) { start = m.index + m[0].length; day = text; }
      else { end = m.index; break; }
    }
  }
  if (start === -1) return null;

  const slice = contentHtml.slice(start, end);
  const labels = [...slice.matchAll(
    /background: ([^;]+);[^>]*vertical-align: middle;"><\/span>([^<]+)<\/p>/g,
  )].map((u) => ({ color: u[1].trim(), label: u[2].trim() }));
  if (!labels.length) return null;

  const alternates = labels.filter((l) => !PRIMARY.test(l.label));
  const counts = new Map<string, { label: string; count: number; color?: string }>();
  for (const a of alternates) {
    const c = counts.get(a.label) || { label: a.label, count: 0, color: a.color };
    c.count += 1;
    counts.set(a.label, c);
  }

  return {
    day,
    totalUniforms: labels.length,
    alternates: alternates.length,
    games: Math.round(labels.length / 2),
    topLooks: [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 6),
  };
}
