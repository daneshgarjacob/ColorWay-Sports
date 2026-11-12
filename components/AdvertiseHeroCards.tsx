// Right side of the /advertise hero (Jake 11/12: fill the empty space with
// something moving and unique, then "it makes it look like that's all we do",
// so show the range). A phone cycling through four things readers come to
// ColorWay for: tonight's uniforms, our grades, rankings and history, each
// built from a real story on the site. Drawn art only (zero image risk), pure
// CSS animation (no JS, no layout shift). Refresh the scenes when the page
// numbers are refreshed.

const SCENE_SECONDS = 3.5;
const TABS = ["Tonight", "Grades", "Rankings", "History"];
const CYCLE = TABS.length * SCENE_SECONDS;

function Jersey({ base, num, trim, n, size = 132 }: { base: string; num: string; trim: string; n: string; size?: number }) {
  return (
    <svg viewBox="0 0 120 116" width={size} height={size * 0.97} aria-hidden="true">
      <path d="M32 8 L50 2 Q60 13 70 2 L88 8 L114 34 L96 50 L90 42 L90 112 L30 112 L30 42 L24 50 L6 34 Z" fill={base} stroke={trim} strokeWidth="3" strokeLinejoin="round" />
      <path d="M50 2 Q60 13 70 2" fill="none" stroke={trim} strokeWidth="5" />
      <text x="60" y="88" textAnchor="middle" fontSize="40" fontWeight="800" fill={num} stroke={trim} strokeWidth="1.5" style={{ fontFamily: "var(--font-sans)" }}>{n}</text>
    </svg>
  );
}

const eyebrow = "text-[10px] font-extrabold tracking-[0.16em] uppercase";
const title = "text-[18px] font-extrabold tracking-tight text-[#0d1322] leading-tight mt-1";

function Tonight() {
  return (
    <>
      <p className={`${eyebrow} text-[#2f6bed]`}>NFL · Tonight</p>
      <p className={title}>Giants wear Vintage White</p>
      <div className="flex-1 flex items-center justify-center rounded-2xl my-3 bg-gradient-to-br from-[#a7193018] to-[#0b226512]">
        <Jersey base="#f4f4f2" num="#0b2265" trim="#a71930" n="26" />
      </div>
      <p className="text-[12.5px] text-black/60">White, blue numbers outlined in red. vs. Commanders on Thursday Night Football.</p>
    </>
  );
}

function Grades() {
  return (
    <>
      <p className={`${eyebrow} text-[#2f6bed]`}>College football · Graded</p>
      <p className={title}>Kentucky Night Ops</p>
      <div className="flex-1 flex items-center justify-center gap-4 my-3 rounded-2xl bg-[#f1f3f7]">
        <Jersey base="#121212" num="#ffffff" trim="#0033a0" n="1" size={104} />
        <div className="w-[78px] h-[78px] rounded-full border-[5px] border-[#2f6bed] flex flex-col items-center justify-center bg-white">
          <span className="text-[30px] font-extrabold leading-none text-[#0d1322]">B+</span>
          <span className="text-[8.5px] font-bold tracking-[0.14em] text-black/45 mt-1">OUR GRADE</span>
        </div>
      </div>
      <p className="text-[11px] font-bold text-black/50 mb-1.5">What&apos;s your grade?</p>
      <div className="flex gap-1.5">
        {["A", "B", "C", "D", "F"].map((g) => (
          <span key={g} className={`flex-1 text-center text-[13px] font-extrabold rounded-md py-1.5 ${g === "B" ? "bg-[#2f6bed] text-white" : "bg-[#eef1f6] text-[#0d1322]"}`}>{g}</span>
        ))}
      </div>
    </>
  );
}

const TIERS: [string, string, string[]][] = [
  ["S", "#e5484d", ["Penguins", "Capitals", "Flames"]],
  ["A", "#f2933a", ["Sabres", "Sharks", "Kings"]],
  ["B", "#f5c443", ["Predators", "Rangers"]],
  ["F", "#9b6cf0", ["Golden Knights"]],
];

function Rankings() {
  return (
    <>
      <p className={`${eyebrow} text-[#2f6bed]`}>NHL · Ranked</p>
      <p className={title}>Every Hometown Remix jersey</p>
      <div className="flex-1 flex flex-col justify-center gap-1.5 my-3">
        {TIERS.map(([t, c, teams]) => (
          <div key={t} className="flex items-stretch rounded-lg overflow-hidden border border-black/10">
            <span className="w-8 flex items-center justify-center text-white font-extrabold text-[15px]" style={{ background: c }}>{t}</span>
            <span className="flex-1 flex flex-wrap gap-1 p-1.5 bg-white">
              {teams.map((n) => <span key={n} className="text-[10.5px] font-bold bg-[#eef1f6] text-[#0d1322] rounded px-1.5 py-0.5">{n}</span>)}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[12.5px] text-black/60">All 32 from best to worst, plus the debut date for every team.</p>
    </>
  );
}

const ERAS: [string, string][] = [
  ["1892", "Navy blue and gold"],
  ["1926", "Chevron sweaters"],
  ["2008", "Army-Navy specials begin"],
];

function History() {
  return (
    <>
      <p className={`${eyebrow} text-[#2f6bed]`}>College football · History</p>
      <p className={title}>Navy uniforms and logos, since 1892</p>
      <div className="flex-1 flex flex-col justify-center my-3 pl-1">
        {ERAS.map(([y, d], i) => (
          <div key={y} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="w-3.5 h-3.5 rounded-full bg-[#c5b783] border-[3px] border-[#00205b] mt-1" />
              {i < ERAS.length - 1 && <span className="w-[3px] flex-1 bg-[#00205b]/25 my-1" />}
            </div>
            <div className="pb-4">
              <p className="text-[17px] font-extrabold text-[#00205b] leading-none">{y}</p>
              <p className="text-[12px] text-black/60 mt-1">{d}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[12.5px] text-black/60">Every era, every helmet, every rivalry uniform, in one place.</p>
    </>
  );
}

const SCENES = [Tonight, Grades, Rankings, History];

export default function AdvertiseHeroCards() {
  return (
    <div className="hidden lg:flex justify-center" aria-label="What readers find on ColorWay Sports: tonight's uniforms, grades, rankings and history">
      <style>{`
        @keyframes cwScene { 0% { opacity: 0; transform: translateX(18px) } 4% { opacity: 1; transform: none } 22% { opacity: 1; transform: none } 26% { opacity: 0; transform: translateX(-18px) } 100% { opacity: 0 } }
        @keyframes cwTab { 0% { opacity: 0 } 3% { opacity: 1 } 23% { opacity: 1 } 26% { opacity: 0 } 100% { opacity: 0 } }
        @keyframes cwFloat { 0%, 100% { transform: translateY(0) rotate(-2deg) } 50% { transform: translateY(-10px) rotate(-2deg) } }
        .cw-scene { opacity: 0; animation: cwScene ${CYCLE}s infinite both }
        .cw-tab-on { opacity: 0; animation: cwTab ${CYCLE}s infinite both }
        .cw-phone { transform: rotate(-2deg); animation: cwFloat 6s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) { .cw-scene, .cw-tab-on, .cw-phone { animation: none } .cw-scene:first-child, .cw-tab-on.first { opacity: 1 } }
      `}</style>
      <div className="cw-phone relative w-[290px] h-[560px] rounded-[44px] bg-[#1b2336] border border-white/15 p-3 shadow-[0_30px_80px_rgba(0,0,0,.5)]">
        <div className="h-full rounded-[34px] bg-white overflow-hidden flex flex-col">
          <div className="px-5 pt-5 pb-3 bg-[#003087] flex items-center gap-2">
            {/* Same Outline Stamp mark as the site header (components/Header.tsx) */}
            <svg width="26" height="26" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="37" fill="none" stroke="#ffffff" strokeWidth="2.6" />
              <circle cx="50" cy="50" r="31" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.45" />
              <g transform="translate(0,3)">
                <circle cx="40.8" cy="32" r="2.4" fill="#ffffff" />
                <rect x="39.6" y="33" width="2.6" height="33" rx="1.3" fill="#ffffff" />
                <path d="M42.2,36 L65,40.5 L55,46 L65,51.5 L42.2,54 Z" fill="#ffffff" />
              </g>
            </svg>
            <span className="text-white text-[14px] font-extrabold tracking-tight">ColorWay Sports</span>
          </div>
          <div className="relative flex-1">
            {SCENES.map((Scene, i) => (
              <div key={i} className="cw-scene absolute inset-0 px-5 pt-4 pb-3 flex flex-col" style={{ animationDelay: `${i * SCENE_SECONDS}s` }}>
                <Scene />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 border-t border-black/10 px-2 pt-2 pb-4">
            {TABS.map((t, i) => (
              <span key={t} className="relative text-center text-[10.5px] font-bold text-black/40 py-1">
                {t}
                <span className={`cw-tab-on${i === 0 ? " first" : ""} absolute inset-0 flex flex-col items-center justify-start py-1 text-[#003087] bg-white`} style={{ animationDelay: `${i * SCENE_SECONDS}s` }}>
                  {t}
                  <span className="mt-1 w-5 h-[3px] rounded-full bg-[#2f6bed]" />
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
