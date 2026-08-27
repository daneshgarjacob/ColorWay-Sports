// Counts how many alternate / City Connect / throwback jerseys were worn across
// the league on the most recent COMPLETE logged day, parsed from the daily
// tracker post. Feeds <MlbAlternatesWatch /> on the homepage.
//
// ⚠️ Uses newestCompleteDaySlice, the same day the award cards use, so the
// "Last Night · <day>" header, the three awards and this mix always describe
// the same day. Reading the newest day instead published a mix computed off a
// partial slate the moment a day was spliced in (2026-08-27).

import { newestCompleteDaySlice } from "./mlbHomepage";

const PRIMARY = /^(home white pinstripes|home white|road gray|road grey|home grey|home cream)$/i;

export type AlternatesDay = {
  day: string;            // "Sunday, July 19"
  totalUniforms: number;  // uniforms logged that day (2 per game)
  alternates: number;     // non-primary uniforms
  games: number;
  topLooks: Array<{ label: string; count: number; color?: string }>;
  categories: Array<{ label: string; count: number; color: string }>;
};

export function buildAlternatesWatch(contentHtml: string): AlternatesDay | null {
  const d = newestCompleteDaySlice(contentHtml);
  if (!d) return null;
  const { day, slice } = d;

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

  // Category split for the homepage index bars.
  const isSpecial = (l: string) => /city connect|\bcc\b|throwback/i.test(l);
  const standardCount = labels.filter((l) => PRIMARY.test(l.label)).length;
  const specialCount = labels.filter((l) => isSpecial(l.label)).length;
  const altCount = labels.length - standardCount - specialCount;
  const categories = [
    { label: "Standard White & Gray", count: standardCount, color: "#64748b" },
    { label: "Color Alternates", count: altCount, color: "#2f6bed" },
    { label: "City Connect & Throwback", count: specialCount, color: "#f59e0b" },
  ];

  return {
    day,
    totalUniforms: labels.length,
    alternates: alternates.length,
    games: Math.round(labels.length / 2),
    topLooks: [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 6),
    categories,
  };
}
