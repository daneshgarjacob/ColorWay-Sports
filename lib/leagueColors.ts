// League accent colors — used by the header nav hover states and the
// story card category tags. Keys cover both nav labels and post categories.
export const leagueColors: Record<string, string> = {
  NFL: "#013369",
  NBA: "#C8102E",
  MLB: "#002D72",
  NHL: "#418FDE",
  Soccer: "#00A859",
  "Soccer (Fútbol)": "#00A859",
  Cricket: "#0E7C4A",
  Rugby: "#1B3A2B",
  F1: "#E10600",
  NASCAR: "#007AC2",
  Motorsports: "#007AC2",
};

export const DEFAULT_ACCENT = "#FF5910"; // ColorWay orange

export function leagueColor(key?: string): string {
  if (!key) return DEFAULT_ACCENT;
  return leagueColors[key] ?? DEFAULT_ACCENT;
}
