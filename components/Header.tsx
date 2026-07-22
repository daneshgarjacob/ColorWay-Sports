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
    label: "Soccer (Fútbol)",
    storiesLink: { label: "All Soccer Stories", href: "/stories?league=soccer" },
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
    label: "Racing",
    storiesLink: { label: "F1 (Formula One)", href: "/stories?league=f1" },
    leagueLogo: "/logos/leagues/racing-f1.png",
    teams: [
      "Alpine", "Aston Martin", "Audi", "Cadillac",
      "Ferrari", "Haas", "McLaren", "Mercedes",
      "Racing Bulls", "Red Bull Racing", "Williams",
    ],
    extraLinks: [{ label: "NASCAR", href: "/stories?league=nascar" }],
  },
];

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Stories", href: "/stories" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileLeague, setMobileLeague] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/stories?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

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
        <div className="max-w-[1200px] mx-auto px-4 sm:px-5 flex items-center justify-between h-[80px] sm:h-[100px]">
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

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-5 ml-auto">
            {/* Regular nav links first */}
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[14px] font-medium text-white/85 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {/* Divider */}
            <div className="w-px h-5 bg-white/20" />

            {/* League dropdowns */}
            {leagues.map((league) => (
              <div
                key={league.label}
                className="relative"
                onMouseEnter={() => handleMouseEnter(league.label)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className="text-[14px] font-medium text-white/85 transition-colors flex items-center gap-1 hover:text-white"
                  style={{ "--league-accent": leagueColor(league.label) } as React.CSSProperties}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Leagues with no team list go straight to their stories page
                    if (league.teams.length === 0) {
                      window.location.href = league.storiesLink.href;
                      return;
                    }
                    setOpenDropdown(openDropdown === league.label ? null : league.label);
                  }}
                >
                  {league.label}
                  {league.teams.length > 0 && (
                    <svg className={`w-3 h-3 transition-transform duration-200 ${openDropdown === league.label ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>

                {/* Dropdown — only for leagues with teams */}
                {league.teams.length > 0 && (
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white supports-[backdrop-filter]:bg-white/[0.96] backdrop-blur-xl rounded-2xl shadow-xl border border-black/10 overflow-hidden transition-all duration-200 origin-top ${
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

          {/* Search icon — desktop */}
          <div
            className="hidden lg:flex items-center ml-2 relative"
            onMouseEnter={() => setSearchOpen(true)}
            onMouseLeave={() => { if (!searchQuery) setTimeout(() => setSearchOpen(false), 150); }}
          >
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-white/85 hover:text-white transition-colors"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {searchOpen && (
              <form
                onSubmit={handleSearch}
                className="absolute right-0 top-full pt-1 z-50"
              >
                <div className="flex items-center gap-2 bg-white supports-[backdrop-filter]:bg-white/[0.96] backdrop-blur-xl border border-black/10 rounded-2xl shadow-lg p-2">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stories..."
                    className="w-[220px] px-3 py-1.5 text-[13px] focus:outline-none"
                    autoFocus
                  />
                  <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-gray-medium hover:text-black p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </form>
            )}
          </div>

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
              {league.teams.length > 0 ? (
                <>
                  <button
                    className="w-full text-xl font-medium text-black transition-colors flex items-center justify-center gap-2 hover:text-[var(--league-accent)]"
                    style={{ "--league-accent": leagueColor(league.label) } as React.CSSProperties}
                    onClick={() => setMobileLeague(mobileLeague === league.label ? null : league.label)}
                  >
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
