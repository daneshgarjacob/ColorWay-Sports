// Right side of the /advertise hero. Jake 11/12 wanted the empty space filled
// with something moving; he passed on a phone mockup ("doesn't show the actual
// jerseys... looks cheap and AI-like") and asked for our logo moving instead,
// nothing interactive. This is the header's Outline Stamp mark, large: the flag
// waves, a dashed ring turns slowly, a glow breathes, and the tagline lights up
// word group by word group. Pure CSS (no JS, no layout shift), still for
// reduced-motion readers.

export default function AdvertiseHeroCards() {
  return (
    <div className="hidden lg:flex flex-col items-center pointer-events-none select-none" aria-hidden="true">
      <style>{`
        @keyframes cwSpin { to { transform: rotate(360deg) } }
        @keyframes cwWave { 0%, 100% { transform: skewY(0deg) scaleX(1) } 50% { transform: skewY(-5deg) scaleX(.94) } }
        @keyframes cwGlow { 0%, 100% { opacity: .35; transform: scale(.92) } 50% { opacity: .7; transform: scale(1.05) } }
        @keyframes cwPulse { 0%, 100% { opacity: .25 } 50% { opacity: .6 } }
        @keyframes cwWord { 0%, 8% { opacity: .25 } 14%, 30% { opacity: 1 } 38%, 100% { opacity: .25 } }
        .cw-glow { animation: cwGlow 6s ease-in-out infinite }
        .cw-spin { transform-origin: 50px 50px; animation: cwSpin 40s linear infinite }
        .cw-spin-rev { transform-origin: 50px 50px; animation: cwSpin 70s linear infinite reverse }
        .cw-inner { animation: cwPulse 4s ease-in-out infinite }
        .cw-flag { transform-origin: 42.2px 45px; animation: cwWave 2.8s ease-in-out infinite }
        .cw-word { opacity: .25; animation: cwWord 6s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) { .cw-glow, .cw-spin, .cw-spin-rev, .cw-inner, .cw-flag, .cw-word { animation: none } .cw-word { opacity: 1 } }
      `}</style>
      <div className="relative w-[320px] h-[320px]">
        <div className="cw-glow absolute inset-6 rounded-full" style={{ background: "radial-gradient(circle, rgba(47,107,237,.55) 0%, rgba(47,107,237,0) 70%)" }} />
        {/* Same Outline Stamp geometry as the site header (components/Header.tsx), plus two decorative orbit rings */}
        <svg viewBox="0 0 100 100" className="relative w-full h-full">
          <g className="cw-spin-rev">
            <circle cx="50" cy="50" r="47.5" fill="none" stroke="#8fb0ff" strokeWidth=".35" strokeDasharray="1 3" opacity=".7" />
          </g>
          <g className="cw-spin">
            <circle cx="50" cy="50" r="43" fill="none" stroke="#ffffff" strokeWidth=".5" strokeDasharray="22 8 4 8" opacity=".55" />
          </g>
          <circle cx="50" cy="50" r="37" fill="none" stroke="#ffffff" strokeWidth="2.6" />
          <circle className="cw-inner" cx="50" cy="50" r="31" fill="none" stroke="#ffffff" strokeWidth="1" />
          <g transform="translate(0,3)">
            <circle cx="40.8" cy="32" r="2.4" fill="#ffffff" />
            <rect x="39.6" y="33" width="2.6" height="33" rx="1.3" fill="#ffffff" />
            <path className="cw-flag" d="M42.2,36 L65,40.5 L55,46 L65,51.5 L42.2,54 Z" fill="#ffffff" />
          </g>
        </svg>
      </div>
      <p className="mt-4 whitespace-nowrap text-[10.5px] font-bold tracking-[0.22em] uppercase text-white">
        {["Every jersey.", "Every logo.", "Every detail."].map((w, i) => (
          <span key={w} className="cw-word" style={{ animationDelay: `${i * 2}s` }}>{w}{i < 2 ? " " : ""}</span>
        ))}
      </p>
    </div>
  );
}
