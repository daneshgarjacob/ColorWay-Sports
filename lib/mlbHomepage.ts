// Homepage parsers for the MLB uniform tracker: the day's Jersey of the Day and
// Matchup of the Day, plus a day-of-week "how often teams go standard" index
// across every day logged. All parsed from the tracker post HTML so they refresh
// automatically each morning.

const STANDARD = /^(home white pinstripes|home white|road gray|road grey|home grey|home cream)$/i;
const LABEL_RE = /background: ([^;]+);[^>]*vertical-align: middle;"><\/span>([^<]+)<\/p>/g;
const strip = (x: string) => x.replace(/<[^>]+>/g, "").trim();

function newestDaySlice(html: string): { day: string; slice: string } | null {
  const dayRe = /<h2[^>]*>([\s\S]*?)<\/h2>/g;
  let m: RegExpExecArray | null;
  let start = -1;
  let end = html.length;
  let day = "";
  while ((m = dayRe.exec(html)) !== null) {
    const text = strip(m[1]);
    if (/^[A-Z][a-z]+, [A-Z][a-z]+ \d+/.test(text)) {
      if (start === -1) {
        start = m.index + m[0].length;
        day = text;
      } else {
        end = m.index;
        break;
      }
    }
  }
  if (start === -1) return null;
  return { day, slice: html.slice(start, end) };
}

export type Jotd = { title: string; day: string; image: string | null } | null;

export function getJotd(html: string): Jotd {
  const d = newestDaySlice(html);
  if (!d) return null;
  const m = d.slice.match(/Jersey of the Day<\/span>\s*<span[^>]*>([^<]+)<\/span>/);
  if (!m) return null;
  const title = strip(m[1]);
  // Find the matching jersey image from that day's game cards, by alt text.
  const esc = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const im = d.slice.match(
    new RegExp(`<img[^>]+src="(\\/images\\/posts\\/mlb-daily-tracker\\/[^"]+)"[^>]*alt="${esc} jersey worn`, "i"),
  );
  return { title, day: d.day, image: im ? im[1] : null };
}

export type Motd = { matchup: string; grade: string; images: string[] } | null;

export function getMotd(html: string): Motd {
  const d = newestDaySlice(html);
  if (!d) return null;
  const bannerIdx = d.slice.indexOf("Jersey Matchup of the Day");
  if (bannerIdx === -1) return null;

  // Matchup = nearest h3 before the banner.
  let matchup = "";
  const h3Re = /<h3[^>]*>([\s\S]*?)<\/h3>/g;
  let h: RegExpExecArray | null;
  while ((h = h3Re.exec(d.slice)) !== null) {
    if (h.index < bannerIdx) matchup = strip(h[1]);
    else break;
  }

  // Two jersey images after the banner.
  const after = d.slice.slice(bannerIdx);
  const imgs = [...after.matchAll(/<img[^>]+src="(\/images\/posts\/mlb-daily-tracker\/[^"]+)"/g)]
    .map((x) => x[1])
    .slice(0, 2);

  const gradeM = after.match(/Matchup Grade:\s*([\d.]+)\s*\/\s*10/);
  const grade = gradeM ? gradeM[1] : "";

  if (!matchup || imgs.length < 2) return null;
  return { matchup, grade, images: imgs };
}

export type WeekdayStat = { weekday: string; short: string; pct: number; days: number };

const ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHORT: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

// Average share of standard (white/gray/cream) jerseys by day of week, across
// every day logged. Surfaces the weekday-vs-weekend pattern.
export function getWeekdayStandard(html: string): WeekdayStat[] {
  const agg = new Map<string, { standard: number; total: number; days: number }>();
  const dayRe = /<h2[^>]*>([\s\S]*?)<\/h2>/g;
  const heads: Array<{ weekday: string; start: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = dayRe.exec(html)) !== null) {
    const text = strip(m[1]);
    const wm = text.match(/^([A-Z][a-z]+), [A-Z][a-z]+ \d+/);
    if (wm) heads.push({ weekday: wm[1], start: m.index + m[0].length });
  }
  for (let i = 0; i < heads.length; i++) {
    const s = heads[i].start;
    const e = i + 1 < heads.length ? html.indexOf("<h2", s) : html.length;
    const slice = html.slice(s, e);
    const labels = [...slice.matchAll(LABEL_RE)].map((u) => u[2].trim());
    if (!labels.length) continue;
    const std = labels.filter((l) => STANDARD.test(l)).length;
    const cur = agg.get(heads[i].weekday) || { standard: 0, total: 0, days: 0 };
    cur.standard += std;
    cur.total += labels.length;
    cur.days += 1;
    agg.set(heads[i].weekday, cur);
  }
  return ORDER.filter((w) => agg.has(w)).map((w) => {
    const a = agg.get(w)!;
    return { weekday: w, short: SHORT[w], pct: Math.round((a.standard / a.total) * 100), days: a.days };
  });
}
