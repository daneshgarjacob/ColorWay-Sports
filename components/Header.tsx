"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// Map of team names to their logo paths — will populate as we add logos per team
const teamLogos: Record<string, string> = {};

const leagues = [
  {
    label: "NFL",
    storiesLink: { label: "NFL Stories", href: "/stories?league=nfl" },
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
    label: "F1",
    storiesLink: { label: "F1 Stories", href: "/stories?league=f1" },
    teams: [
      "Alpine", "Aston Martin", "Audi", "Cadillac",
      "Ferrari", "Haas", "McLaren", "Mercedes",
      "Racing Bulls", "Red Bull Racing", "Williams",
    ],
  },
  {
    label: "Soccer",
    storiesLink: { label: "European Soccer News", href: "/stories?league=soccer" },
    teams: [], // No teams — too many
  },
];

const navLinks = [
  { label: "HOME", href: "/" },
  { label: "STORIES", href: "/stories" },
  { label: "ABOUT", href: "/about" },
  { label: "CONTACT", href: "/contact" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileLeague, setMobileLeague] = useState<string | null>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openDropdown) return;
    const handler = () => setOpenDropdown(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openDropdown]);

  const handleMouseEnter = (label: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setOpenDropdown(label);
  };

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 200);
  };

  return (
    <>
      <header className="bg-white border-b-[2.5px] border-orange relative z-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-5 flex items-center justify-between h-[80px] sm:h-[100px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <svg width="36" height="36" viewBox="0 0 512 512" className="sm:w-[42px] sm:h-[42px] rounded-[6px]" style={{ minWidth: 36 }}>
              <rect width="512" height="512" rx="96" fill="white" stroke="#e5e7eb" strokeWidth="6"/>
              <g transform="translate(256,380)">
                <rect x="-30" y="-300" width="60" height="220" rx="30" fill="#0021A5" transform="rotate(-24)"/>
                <rect x="-30" y="-300" width="60" height="220" rx="30" fill="#4A90D9" transform="rotate(-8)"/>
                <rect x="-30" y="-300" width="60" height="220" rx="30" fill="#FF5910" transform="rotate(8)"/>
                <rect x="-30" y="-300" width="60" height="220" rx="30" fill="#6B9E8F" transform="rotate(24)"/>
                <circle cx="0" cy="0" r="22" fill="#333"/>
              </g>
            </svg>
            <div className="flex flex-col min-w-0">
              <span className="text-[22px] sm:text-[28px] font-extrabold tracking-[-0.02em] leading-none" style={{ fontFamily: "'Inter', sans-serif" }}>
                <span className="text-[#0021A5]">Color</span><span className="text-orange">Way</span> <span className="text-[#0021A5]">Sports</span><span className="text-orange">.</span>
              </span>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.18em] text-[#8A8F98] mt-[2px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                All Things Sports, Besides The Game Itself
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {/* League dropdowns */}
            {leagues.map((league) => (
              <div
                key={league.label}
                className="relative"
                onMouseEnter={() => handleMouseEnter(league.label)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className="text-[14px] font-medium text-black hover:text-orange transition-colors tracking-wide flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Soccer has no teams, just go to stories
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
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-lg shadow-xl border border-border overflow-hidden transition-all duration-200 origin-top ${
                      openDropdown === league.label
                        ? "opacity-100 scale-y-100 pointer-events-auto"
                        : "opacity-0 scale-y-95 pointer-events-none"
                    }`}
                    style={{ width: "280px", maxHeight: "420px" }}
                    onMouseEnter={() => handleMouseEnter(league.label)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="overflow-y-auto max-h-[420px] py-1">
                      {/* Stories link at the top */}
                      <Link
                        href={league.storiesLink.href}
                        className="block px-4 py-2.5 text-[13px] font-bold text-orange hover:bg-orange/5 transition-colors border-b border-border"
                        onClick={() => setOpenDropdown(null)}
                      >
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
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Regular nav links */}
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[14px] font-medium text-black hover:text-orange transition-colors tracking-wide"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden flex flex-col gap-1.5 p-2"
            onClick={() => {
              setMobileOpen(!mobileOpen);
              setMobileLeague(null);
            }}
            aria-label="Toggle menu"
          >
            <span className={`block w-6 h-0.5 bg-black transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-6 h-0.5 bg-black transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block w-6 h-0.5 bg-black transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-40 bg-white transition-all duration-300 overflow-y-auto ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Close button */}
        <div className="flex justify-end p-4">
          <button
            onClick={() => {
              setMobileOpen(false);
              setMobileLeague(null);
            }}
            className="p-2 text-black"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 pt-8 pb-12">
          {/* League sections */}
          {leagues.map((league) => (
            <div key={league.label} className="w-full max-w-[300px]">
              {league.teams.length > 0 ? (
                <>
                  <button
                    className="w-full text-xl font-medium text-black hover:text-orange transition-colors flex items-center justify-center gap-2"
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
                      {/* Stories link first */}
                      <Link
                        href={league.storiesLink.href}
                        className="text-sm font-bold text-orange hover:text-orange/80 transition-colors py-1.5"
                        onClick={() => { setMobileOpen(false); setMobileLeague(null); }}
                      >
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
                    </div>
                  </div>
                </>
              ) : (
                /* Soccer — just a link, no dropdown */
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

          {/* Divider */}
          <hr className="w-16 border-border my-2" />

          {/* Regular nav links */}
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
        </div>
      </div>
    </>
  );
}
