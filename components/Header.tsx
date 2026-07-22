"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { leagueColor } from "@/lib/leagueColors";
import { TEAM_LOGOS, COMPETITION_LOGOS } from "@/lib/teamLogos";

// Nav rows look up team logos first, then soccer competitions / racing series.
const teamLogos: Record<string, string> = { ...TEAM_LOGOS, ...COMPETITION_LOGOS };

// Team logos come from the shared lib/teamLogos map (single source of truth).

type NavLeague = {
  label: string;
  storiesLink: { label: string; href: string };
  teams: string[];
  leagueLogo?: string;
  extraLinks?: { label: string; href: string }[];
};

const leagues: NavLeague[] = [
  {
    label: "NFL",
    storiesLink: { label: "NFL Stories", href: "/stories?league=nfl" },
    leagueLogo: "/logos/leagues/nfl.png",
    teams: [
      "Arizona Cardinals", "Atlanta Falcons", "Baltimore Ravens", "Buffalo Bills",
      "Carolina Panthers", "Chicago Bears", "Cincinnati Bengals", "Cleveland Browns",
      "Dallas Cowboys", "Denver Broncos", "Detroit Lions", "Green Bay Packers",
      "Houston Texans", "Indianapolis Colts", "Jacksonville Jaguars", "Kansas City Chiefs",
      "Las Vegas Raiders", "Los Angeles Chargers", "Los Angeles Rams", "Miami Dolphins",
      "Minnesota Vikings", "New England Patriots", "New Orleans Saints", "New York Giants",
      "New York Jets", "Philadelphia Eagles", "Pittsburgh Steelers", "San Francisco 49ers",
      "Seattle Seahawks", "Tampa Bay Buccaneers", "Tennessee Titans", "Washington Commanders",
    ],
  },
  {
    label: "NBA",
    storiesLink: { label: "NBA Stories", href: "/stories?league=nba" },
    leagueLogo: "/logos/leagues/nba.png",
    teams: [
      "Atlanta Hawks", "Boston Celtics", "Brooklyn Nets", "Charlotte Hornets",
      "Chicago Bulls", "Cleveland Cavaliers", "Dallas Mavericks", "Denver Nuggets",
      "Detroit Pistons", "Golden State Warriors", "Houston Rockets", "Indiana Pacers",
      "LA Clippers", "Los Angeles Lakers", "Memphis Grizzlies", "Miami Heat",
      "Milwaukee Bucks", "Minnesota Timberwolves", "New Orleans Pelicans", "New York Knicks",
      "Oklahoma City Thunder", "Orlando Magic", "Philadelphia 76ers", "Phoenix Suns",
      "Portland Trail Blazers", "Sacramento Kings", "San Antonio Spurs", "Toronto Raptors",
      "Utah Jazz", "Washington Wizards",
    ],
  },
  {
    label: "MLB",
    storiesLink: { label: "MLB Stories", href: "/stories?league=mlb" },
    leagueLogo: "/logos/leagues/mlb.png",
    teams: [
      "Arizona Diamondbacks", "Atlanta Braves", "Baltimore Orioles", "Boston Red Sox",
      "Chicago Cubs", "Chicago White Sox", "Cincinnati Reds", "Cleveland Guardians",
      "Colorado Rockies", "Detroit Tigers", "Houston Astros", "Kansas City Royals",
      "Los Angeles Angels", "Los Angeles Dodgers", "Miami Marlins", "Milwaukee Brewers",
      "Minnesota Twins", "New York Mets", "New York Yankees", "Oakland Athletics",
      "Philadelphia Phillies", "Pittsburgh Pirates", "San Diego Padres", "San Francisco Giants",
      "Seattle Mariners", "St. Louis Cardinals", "Tampa Bay Rays", "Texas Rangers",
      "Toronto Blue Jays", "Washington Nationals",
    ],
  },
  {
    label: "NHL",
    storiesLink: { label: "NHL Stories", href: "/stories?league=nhl" },
    leagueLogo: "/logos/leagues/nhl.png",
    teams: [
      "Anaheim Ducks", "Boston Bruins", "Buffalo Sabres", "Calgary Flames",
      "Carolina Hurricanes", "Chicago Blackhawks", "Colorado Avalanche", "Columbus Blue Jackets",
      "Dallas Stars", "Detroit Red Wings", "Edmonton Oilers", "Florida Panthers",
      "Los Angeles Kings", "Minnesota Wild", "Montreal Canadiens", "Nashville Predators",
      "New Jersey Devils", "New York Islanders", "New York Rangers", "Ottawa Senators",
      "Philadelphia Flyers", "Pittsburgh Penguins", "San Jose Sharks", "Seattle Kraken",
      "St. Louis Blues", "Tampa Bay Lightning", "Toronto Maple Leafs", "Utah Hockey Club",
      "Vancouver Canucks", "Vegas Golden Knights", "Washington Capitals", "Winnipeg Jets",
    ],
  },
  {
    label: "Soccer",
    storiesLink: { label: "All Soccer Stories", href: "/stories?league=soccer" },
    leagueLogo: "/logos/leagues/soccer-ball.svg",
    teams: [
      "International Competitions",
      "UEFA Champions League",
      "Premier League",
      "La Liga",
      "Serie A",
      "Bundesliga",
      "Ligue 1",
      "MLS",
    ],
  },
  {
    label: "F1",
    storiesLink: { label: "All F1 Stories", href: "/stories?league=f1" },
    leagueLogo: "/logos/leagues/racing-f1.png",
    teams: [
      "Alpine", "Aston Martin", "Audi", "Cadillac",
      "Ferrari", "Haas", "McLaren", "Mercedes",
      "Racing Bulls", "Red Bull Racing", "Williams",
    ],
  },
  {
    label: "NASCAR",
    storiesLink: { label: "All NASCAR Stories", href: "/stories?league=nascar" },
    leagueLogo: "/logos/leagues/racing-nascar.png",
    teams: [],
  },
  {
    // The long tail. Each of these graduates to its own rail item once it has
    // enough stories to be worth a permanent slot.
    label: "More",
    storiesLink: { label: "All Stories", href: "/stories" },
    teams: [],
    extraLinks: [
      { label: "College", href: "/stories?league=college" },
      { label: "Rugby", href: "/stories?league=rugby" },
      { label: "Cricket", href: "/stories?league=cricket" },
      { label: "UFL", href: "/stories?league=ufl" },
    ],
  },
];

// "Home" is deliberately absent: the ColorWay Sports wordmark is the home link.
const navLinks = [
  { label: "Stories", href: "/stories" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

type SearchIndex = {
  posts: { t: string; s: string; l: string; e?: string }[];
  teams: { n: string; s: string; g?: string }[];
};

// Rank matches so a typed "lakers" surfaces the Los Angeles Lakers team page
// above any story that merely mentions them: word-start beats mid-word, and
// teams outrank stories at equal quality.
//
// Multi-word queries match on EVERY term rather than the exact phrase, because
// nobody types a headline verbatim — "roof status" has to find "Is the Globe
// Life Field Roof Open Today? Rangers 2026 Roof Schedule".
function scoreMatch(haystack: string, query: string) {
  const h = haystack.toLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);
  if (!terms.length) return -1;
  let worst = 0;
  for (const t of terms) {
    const i = h.indexOf(t);
    if (i < 0) return -1;
    const rank = i === 0 ? 0 : /\s|-|\(/.test(h[i - 1]) ? 1 : 2;
    if (rank > worst) worst = rank;
  }
  return worst;
}

const hasDropdown = (l: NavLeague) => l.teams.length > 0 || (l.extraLinks?.length ?? 0) > 0;

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileLeague, setMobileLeague] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [sugOpen, setSugOpen] = useState(false);
  const [activeSug, setActiveSug] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/stories?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  // Pull the index on first focus only — no cost for readers who never search.
  const loadIndex = () => {
    if (index) return;
    fetch("/search-index.json")
      .then((r) => r.json())
      .then(setIndex)
      .catch(() => {});
  };

  // Dismiss suggestions on an outside click.
  useEffect(() => {
    if (!sugOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!searchBoxRef.current?.contains(e.target as Node)) setSugOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [sugOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openDropdown) return;
    const handler = () => setOpenDropdown(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openDropdown]);

  // Solid navy at the top, frosted liquid glass once you scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Teams first, then stories. Both capped so the panel never runs off-screen.
  const q = searchQuery.trim().toLowerCase();
  const suggestions = (() => {
    if (!index || q.length < 2) return { teams: [], posts: [] };
    const teams = index.teams
      .map((t) => ({ t, r: scoreMatch(t.n, q) }))
      .filter((x) => x.r >= 0)
      .sort((a, b) => a.r - b.r || a.t.n.length - b.t.n.length)
      .slice(0, 4)
      .map((x) => x.t);
    const posts = index.posts
      .map((p) => {
        const inTitle = scoreMatch(p.t, q);
        if (inTitle >= 0) return { p, r: inTitle };
        // Excerpt hits still surface, just below everything matched by title.
        const inBody = scoreMatch(`${p.t} ${p.e ?? ""}`, q);
        return { p, r: inBody < 0 ? -1 : inBody + 10 };
      })
      .filter((x) => x.r >= 0)
      .sort((a, b) => a.r - b.r)
      .slice(0, 6)
      .map((x) => x.p);
    return { teams, posts };
  })();
  const flatSuggestions = [
    ...suggestions.teams.map((t) => `/stories?team=${encodeURIComponent(t.s)}`),
    ...suggestions.posts.map((p) => `/stories/${p.s}`),
  ];
  const hasSuggestions = flatSuggestions.length > 0;

  const onSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!sugOpen || !hasSuggestions) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSug((i) => (i + 1) % flatSuggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSug((i) => (i <= 0 ? flatSuggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeSug >= 0) {
      e.preventDefault();
      window.location.href = flatSuggestions[activeSug];
    } else if (e.key === "Escape") {
      setSugOpen(false);
    }
  };

  const handleMouseEnter = (label: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setOpenDropdown(label);
  };

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 200);
  };

  return (
    <>
      <header className={`sticky top-0 z-50 border-b border-white/10 transition-[background-color,box-shadow,backdrop-filter] duration-300 ${scrolled ? "bg-[#003087]/72 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_2px_18px_rgba(10,23,51,0.22)]" : "bg-[#003087] shadow-none"}`}>
        <div className="w-full px-4 sm:px-8 xl:px-12 flex items-center justify-between h-[80px] sm:h-[100px] gap-6">
          {/* Logo — Outline Stamp + Hanken wordmark */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <svg width="38" height="38" viewBox="0 0 100 100" className="sm:w-[46px] sm:h-[46px]" style={{ minWidth: 38 }} aria-hidden="true">
              <circle cx="50" cy="50" r="37" fill="none" stroke="#ffffff" strokeWidth="2.6" />
              <circle cx="50" cy="50" r="31" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.45" />
              <g transform="translate(0,3)">
                <circle cx="40.8" cy="32" r="2.4" fill="#ffffff" />
                <rect x="39.6" y="33" width="2.6" height="33" rx="1.3" fill="#ffffff" />
                <path d="M42.2,36 L65,40.5 L55,46 L65,51.5 L42.2,54 Z" fill="#ffffff" />
              </g>
            </svg>
            <div className="flex flex-col min-w-0">
              {/* Wordmark nudged left (Jake-tuned to -0.118em in the alignment sandbox) so the C optically lines up over the tagline's E; tagline indent left as-is */}
              <span className="text-[22px] sm:text-[28px] tracking-[-0.02em] leading-none" style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "#ffffff", WebkitTextStroke: "1.5px #2f6bed", paintOrder: "stroke fill", whiteSpace: "nowrap", textIndent: "-0.118em" }}>
                ColorWay Sports
              </span>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.18em] mt-[3px]" style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "#9FB6D6", whiteSpace: "nowrap", textIndent: "-0.04em" }}>
                Every Jersey. Every Logo. Every Detail.
              </span>
            </div>
          </Link>

          {/* Row 1 centre — persistent search. Sits between the wordmark and the
              utility links so the masthead reads brand / find / about, and the
              league rail below carries all the section navigation. */}
          <div ref={searchBoxRef} className="hidden lg:block flex-1 max-w-[620px] mx-auto relative">
            <form onSubmit={handleSearch}>
              <div className="flex items-center gap-2 w-full bg-white/[0.12] hover:bg-white/[0.17] focus-within:bg-white/[0.19] border border-white/15 rounded-full px-4 py-2 transition-colors">
                <svg className="w-4 h-4 text-white/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onFocus={() => { loadIndex(); setSugOpen(true); }}
                  onChange={(e) => { loadIndex(); setSearchQuery(e.target.value); setSugOpen(true); setActiveSug(-1); }}
                  onKeyDown={onSearchKeyDown}
                  placeholder="Discover"
                  aria-label="Discover stories and teams"
                  aria-expanded={sugOpen && hasSuggestions}
                  role="combobox"
                  aria-controls="discover-suggestions"
                  className="w-full bg-transparent text-[13.5px] text-white placeholder:text-white/50 focus:outline-none"
                />
              </div>
            </form>

            {sugOpen && hasSuggestions && (
              <div
                id="discover-suggestions"
                role="listbox"
                className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-black/10 overflow-hidden z-50 py-1"
              >
                {suggestions.teams.length > 0 && (
                  <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-medium">Teams</p>
                )}
                {suggestions.teams.map((t, i) => (
                  <Link
                    key={t.s}
                    href={`/stories?team=${encodeURIComponent(t.s)}`}
                    role="option"
                    aria-selected={activeSug === i}
                    onClick={() => setSugOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-2 text-[13.5px] font-semibold text-black transition-colors ${activeSug === i ? "bg-[#2f6bed]/10" : "hover:bg-[#2f6bed]/[0.06]"}`}
                  >
                    {t.g && <img src={t.g} alt="" className="w-5 h-5 object-contain flex-shrink-0" />}
                    {t.n}
                  </Link>
                ))}

                {suggestions.posts.length > 0 && (
                  <p className="px-4 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-medium border-t border-border mt-1">Stories</p>
                )}
                {suggestions.posts.map((p, i) => (
                  <Link
                    key={p.s}
                    href={`/stories/${p.s}`}
                    role="option"
                    aria-selected={activeSug === suggestions.teams.length + i}
                    onClick={() => setSugOpen(false)}
                    className={`block px-4 py-2 text-[13px] text-black/85 leading-snug transition-colors ${activeSug === suggestions.teams.length + i ? "bg-[#2f6bed]/10" : "hover:bg-[#2f6bed]/[0.06]"}`}
                  >
                    {p.t}
                  </Link>
                ))}

                <button
                  type="button"
                  onClick={handleSearch}
                  className="w-full text-left px-4 py-2.5 mt-1 text-[12.5px] font-bold text-[#2f6bed] border-t border-border hover:bg-[#2f6bed]/[0.06] transition-colors"
                >
                  See all results for “{searchQuery.trim()}” →
                </button>
              </div>
            )}
          </div>

          {/* Row 1 right — utility links only */}
          <nav className="hidden lg:flex items-center gap-1 flex-shrink-0">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[13.5px] font-semibold tracking-[0.01em] text-white/80 hover:text-white hover:bg-white/10 rounded-full px-3 py-1.5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger — three absolutely centered bars so the open
              state forms a geometrically exact X with no stray pixels */}
          <button
            className="lg:hidden relative w-10 h-10"
            onClick={() => {
              setMobileOpen(!mobileOpen);
              setMobileLeague(null);
            }}
            aria-label="Toggle menu"
          >
            <span className={`absolute left-2 block w-6 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? "top-[19px] rotate-45" : "top-[12px]"}`} />
            <span className={`absolute left-2 top-[19px] block w-6 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? "opacity-0 scale-x-0" : ""}`} />
            <span className={`absolute left-2 block w-6 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? "top-[19px] -rotate-45" : "top-[26px]"}`} />
          </button>
        </div>

        {/* Row 2 — the league rail. Light so the full-colour league marks read
            properly, horizontally scrollable so new sports just join the end
            instead of breaking the layout. */}
        <div className="hidden lg:block bg-white border-t border-black/[0.06]">
          <nav className="hidden lg:flex items-center justify-center gap-1 w-full px-4 sm:px-8 xl:px-12 h-[48px]">
            {/* League dropdowns */}
            {leagues.map((league) => (
              <div
                key={league.label}
                className="relative"
                onMouseEnter={() => handleMouseEnter(league.label)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className="text-[13.5px] font-bold text-[#14223f]/85 transition-colors flex items-center gap-1.5 hover:text-[#2f6bed] whitespace-nowrap rounded-full px-3 py-1.5 hover:bg-[#2f6bed]/[0.07]"
                  style={{ "--league-accent": leagueColor(league.label) } as React.CSSProperties}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Leagues with no team list go straight to their stories page
                    if (!hasDropdown(league)) {
                      window.location.href = league.storiesLink.href;
                      return;
                    }
                    setOpenDropdown(openDropdown === league.label ? null : league.label);
                  }}
                >
                  {league.leagueLogo && (
                    <img src={league.leagueLogo} alt="" className="w-[18px] h-[18px] object-contain flex-shrink-0" />
                  )}
                  {league.label}
                  {hasDropdown(league) && (
                    <svg className={`w-3 h-3 transition-transform duration-200 ${openDropdown === league.label ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>

                {/* Dropdown — only for leagues with teams */}
                {hasDropdown(league) && (
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 max-w-[calc(100vw-2rem)] bg-white supports-[backdrop-filter]:bg-white/[0.96] backdrop-blur-xl rounded-2xl shadow-xl border border-black/10 overflow-hidden transition-all duration-200 origin-top ${
                      openDropdown === league.label
                        ? "opacity-100 scale-y-100 pointer-events-auto"
                        : "opacity-0 scale-y-95 pointer-events-none"
                    }`}
                    style={{ width: "280px", maxHeight: "420px" }}
                    onMouseEnter={() => handleMouseEnter(league.label)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="overflow-y-auto max-h-[420px] py-1">
                      {/* Stories link at the top, with the league logo */}
                      <Link
                        href={league.storiesLink.href}
                        className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold text-orange hover:bg-orange/5 transition-colors border-b border-border"
                        onClick={() => setOpenDropdown(null)}
                      >
                        {league.leagueLogo && (
                          <img src={league.leagueLogo} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                        )}
                        {league.storiesLink.label}
                      </Link>

                      {/* Teams */}
                      {league.teams.map((team) => (
                        <Link
                          key={team}
                          href={`/stories?team=${encodeURIComponent(team.toLowerCase().replace(/\s+/g, "-"))}`}
                          className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-medium hover:bg-orange/5 hover:text-orange transition-colors"
                          onClick={() => setOpenDropdown(null)}
                        >
                          {teamLogos[team] ? (
                            <img src={teamLogos[team]} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                          ) : (
                            <span className="w-5 h-5 flex-shrink-0" />
                          )}
                          {team}
                        </Link>
                      ))}

                      {/* Extra series links (e.g., NASCAR under Racing) */}
                      {league.extraLinks?.map((l) => (
                        <Link
                          key={l.label}
                          href={l.href}
                          className="block px-4 py-2.5 text-[13px] font-bold text-orange hover:bg-orange/5 transition-colors border-t border-border"
                          onClick={() => setOpenDropdown(null)}
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile menu — frosted glass sheet that starts below the sticky header.
          z-50 so it wins over the sticky TrackerJumpNav (z-40) on long tracker
          posts; the drawer starts at top:80px so it never overlaps the header
          visually even though both share z-50. */}
      <div
        className={`fixed inset-x-0 bottom-0 top-[80px] sm:top-[100px] z-50 bg-white supports-[backdrop-filter]:bg-white/80 backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 overflow-y-auto ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center gap-4 pt-10 pb-12">
          {/* Mobile search */}
          <form onSubmit={handleSearch} className="w-full max-w-[300px] mb-4">
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stories..."
                className="flex-1 px-4 py-2.5 text-[15px] focus:outline-none"
              />
              <button type="submit" className="px-3 py-2.5 text-gray-medium hover:text-orange transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Regular nav links first — matches desktop order */}
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xl font-medium text-black hover:text-orange transition-colors"
              onClick={() => { setMobileOpen(false); setMobileLeague(null); }}
            >
              {link.label}
            </Link>
          ))}

          {/* Divider */}
          <hr className="w-16 border-border my-2" />

          {/* League sections */}
          {leagues.map((league) => (
            <div key={league.label} className="w-full max-w-[300px]">
              {hasDropdown(league) ? (
                <>
                  <button
                    className="w-full text-xl font-medium text-black transition-colors flex items-center justify-center gap-2 hover:text-[var(--league-accent)]"
                    style={{ "--league-accent": leagueColor(league.label) } as React.CSSProperties}
                    onClick={() => setMobileLeague(mobileLeague === league.label ? null : league.label)}
                  >
                    {league.leagueLogo && (
                      <img src={league.leagueLogo} alt="" className="w-[22px] h-[22px] object-contain flex-shrink-0" />
                    )}
                    {league.label}
                    <svg className={`w-4 h-4 transition-transform duration-200 ${mobileLeague === league.label ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      mobileLeague === league.label ? "max-h-[1000px] opacity-100 mt-2" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1 pb-2">
                      <Link
                        href={league.storiesLink.href}
                        className="flex items-center gap-2 text-sm font-bold text-orange hover:text-orange/80 transition-colors py-1.5"
                        onClick={() => { setMobileOpen(false); setMobileLeague(null); }}
                      >
                        {league.leagueLogo && (
                          <img src={league.leagueLogo} alt="" className="w-4 h-4 object-contain" />
                        )}
                        {league.storiesLink.label}
                      </Link>
                      {league.teams.map((team) => (
                        <Link
                          key={team}
                          href={`/stories?team=${encodeURIComponent(team.toLowerCase().replace(/\s+/g, "-"))}`}
                          className="flex items-center gap-2 text-sm text-gray-medium hover:text-orange transition-colors py-1"
                          onClick={() => { setMobileOpen(false); setMobileLeague(null); }}
                        >
                          {teamLogos[team] && (
                            <img src={teamLogos[team]} alt="" className="w-4 h-4 object-contain" />
                          )}
                          {team}
                        </Link>
                      ))}
                      {league.extraLinks?.map((l) => (
                        <Link
                          key={l.label}
                          href={l.href}
                          className="text-sm font-bold text-orange hover:text-orange/80 transition-colors py-1.5"
                          onClick={() => { setMobileOpen(false); setMobileLeague(null); }}
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  href={league.storiesLink.href}
                  className="block text-xl font-medium text-black hover:text-orange transition-colors text-center"
                  onClick={() => { setMobileOpen(false); setMobileLeague(null); }}
                >
                  {league.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
