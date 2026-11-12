// Right side of the /advertise hero (Jake 11/12: "a lot of blank space on the
// right... something moving, something that's unique"). A phone showing what
// fans actually look up on ColorWay: tonight's uniform for their team, cycling
// through four real looks from the week of 11/12. Drawn jerseys, no photos
// (zero image risk), pure CSS animation so there is no JS and no layout shift.
// Swap LOOKS for the current week whenever the page numbers are refreshed.

type Look = { league: string; when: string; team: string; jersey: string; colors: string; game: string; base: string; num: string; trim: string; n: string };

const LOOKS: Look[] = [
  { league: "NFL", when: "Tonight", team: "New York Giants", jersey: "Vintage White", colors: "White, blue numbers outlined in red", game: "vs. Commanders · Thursday Night Football", base: "#f4f4f2", num: "#0b2265", trim: "#a71930", n: "26" },
  { league: "NHL", when: "Tonight", team: "Boston Bruins", jersey: "Brown Varsity Sweater", colors: "All brown, first since 1924", game: "vs. Canadiens · Hometown Remix", base: "#4a2f1c", num: "#ffb81c", trim: "#ffb81c", n: "37" },
  { league: "CFB", when: "Saturday", team: "Kentucky Wildcats", jersey: "Night Ops", colors: "All black, white numbers", game: "vs. Florida", base: "#121212", num: "#ffffff", trim: "#0033a0", n: "1" },
  { league: "NHL", when: "Tonight", team: "Ottawa Senators", jersey: "Hometown Remix", colors: "Black and gold, Parliament Hill details", game: "vs. Avalanche · Hometown Remix debut", base: "#141414", num: "#b79257", trim: "#b79257", n: "18" },
];

const CYCLE = LOOKS.length * 3; // seconds, 3s per look

function Jersey({ l }: { l: Look }) {
  return (
    <svg viewBox="0 0 120 116" className="w-[150px] h-[145px]" aria-hidden="true">
      <path d="M32 8 L50 2 Q60 13 70 2 L88 8 L114 34 L96 50 L90 42 L90 112 L30 112 L30 42 L24 50 L6 34 Z" fill={l.base} stroke={l.trim} strokeWidth="3" strokeLinejoin="round" />
      <path d="M50 2 Q60 13 70 2" fill="none" stroke={l.trim} strokeWidth="5" />
      <text x="60" y="88" textAnchor="middle" fontSize="40" fontWeight="800" fill={l.num} stroke={l.trim} strokeWidth="1.5" style={{ fontFamily: "var(--font-sans)" }}>{l.n}</text>
    </svg>
  );
}

export default function AdvertiseHeroCards() {
  return (
    <div className="hidden lg:flex justify-center" aria-label="Example: a fan checking tonight's uniform on ColorWay Sports">
      <style>{`
        @keyframes cwLook { 0% { opacity: 0; transform: translateY(14px) } 4% { opacity: 1; transform: none } 22% { opacity: 1; transform: none } 26% { opacity: 0; transform: translateY(-14px) } 100% { opacity: 0 } }
        @keyframes cwFloat { 0%, 100% { transform: translateY(0) rotate(-2deg) } 50% { transform: translateY(-10px) rotate(-2deg) } }
        .cw-look { opacity: 0; animation: cwLook ${CYCLE}s infinite both }
        .cw-phone { transform: rotate(-2deg); animation: cwFloat 6s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) { .cw-look, .cw-phone { animation: none } .cw-look:first-child { opacity: 1 } }
      `}</style>
      <div className="cw-phone relative w-[290px] h-[540px] rounded-[44px] bg-[#1b2336] border border-white/15 p-3 shadow-[0_30px_80px_rgba(0,0,0,.5)]">
        <div className="h-full rounded-[34px] bg-white overflow-hidden flex flex-col">
          <div className="px-5 pt-6 pb-3 border-b border-black/10">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-black/45">ColorWay Sports</p>
            <p className="text-[17px] font-extrabold tracking-tight text-[#0d1322] mt-1">What&apos;s my team wearing?</p>
          </div>
          <div className="relative flex-1">
            {LOOKS.map((l, i) => (
              <div key={l.team} className="cw-look absolute inset-0 px-5 pt-5 flex flex-col" style={{ animationDelay: `${i * 3}s` }}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold tracking-[0.14em] text-white bg-[#2f6bed] rounded px-1.5 py-0.5">{l.league}</span>
                  <span className="text-[11px] font-bold text-black/50">{l.when}</span>
                </div>
                <p className="text-[19px] font-extrabold tracking-tight text-[#0d1322] mt-2 leading-tight">{l.team}</p>
                <div className="flex-1 flex items-center justify-center rounded-2xl my-4" style={{ background: `linear-gradient(160deg, ${l.trim}22, ${l.base}18)` }}>
                  <Jersey l={l} />
                </div>
                <p className="text-[15px] font-extrabold text-[#0d1322]">{l.jersey}</p>
                <p className="text-[12.5px] text-black/60 mt-0.5">{l.colors}</p>
                <p className="text-[11.5px] font-semibold text-black/45 mt-2 mb-5">{l.game}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
