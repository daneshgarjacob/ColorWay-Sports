// Rooting Guide pieces (approved mockup 11/20). Newspaper sports page, not
// cards: one row design for every game, thin rules, the "Root For" line
// carries it. Data comes from lib/rootingGuide (live ESPN feeds).

import type { DoneGame, RootGame } from "@/lib/rootingGuide/types";

export type { DoneGame, RootGame };

export const LABEL = "font-display text-[12px] font-black tracking-[0.16em] uppercase";

// The level steps down in weight: Big is a solid royal tag on a heavy rule,
// Helps an outlined tag, A Little plain gray words.
const LEVEL_TAG: Record<RootGame["level"], string> = {
  Big: "bg-[#0025CC] text-white border-[#0025CC]",
  Helps: "bg-white text-[#0025CC] border-[#0025CC]",
  "A Little": "bg-white text-[#5b6472] border-[#c9ced6]",
};
const LEVEL_RULE: Record<RootGame["level"], string> = {
  Big: "border-t-[3px] border-[#0b0b0f]",
  Helps: "border-t border-[#0b0b0f]/40",
  "A Little": "border-t border-border",
};

// Keep "(6-4)" and "No. 14" from breaking across lines.
export function NoBreak({ text }: { text: string }) {
  const parts = text.split(/(\([^)]*\)|No\. \d+)/g);
  return <>{parts.map((t, i) => (i % 2 === 1 ? <span key={i} className="whitespace-nowrap">{t}</span> : t))}</>;
}

function Logo({ src, alt, cls }: { src: string; alt: string; cls: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} width={68} height={68} loading="lazy" className={`object-contain shrink-0 ${cls}`} />;
}

export function GameRow({ g, quiet }: { g: RootGame; quiet?: boolean }) {
  const logo = g.rootLogo;
  return (
    <li className={`${LEVEL_RULE[g.level]} py-6 sm:grid sm:grid-cols-[76px_1fr] sm:gap-x-6`}>
      <div className="hidden sm:block pt-1">
        {logo && <Logo src={logo} alt={`${g.root} logo`} cls={quiet ? "w-[56px] h-[56px]" : "w-[68px] h-[68px]"} />}
      </div>
      <div className="min-w-0">
        <span className={`inline-block rounded-full border-[1.5px] px-2.5 py-[3px] ${LABEL} text-[11px] leading-none ${LEVEL_TAG[g.level]}`}>
          {g.level}
        </span>
        <div className="mt-2.5 sm:mt-2 flex items-center gap-3">
          {logo && <Logo src={logo} alt="" cls={`sm:hidden ${quiet ? "w-[34px] h-[34px]" : "w-[40px] h-[40px]"}`} />}
          <h3
            className={`font-display font-black text-[#0b0b0f] leading-[1.05] tracking-[-0.01em] ${
              quiet ? "text-[24px] sm:text-[30px]" : "text-[28px] sm:text-[38px]"
            }`}
          >
            Root For {g.root}
          </h3>
        </div>
        <div className="mt-2.5 sm:mt-2 text-[16px] sm:text-[17px] leading-snug text-[#4a4f57]">
          <span className="font-semibold text-[#1a1a1a]"><NoBreak text={g.matchup} /></span>
          <span className="block sm:inline sm:before:content-['·'] sm:before:mx-2 sm:before:text-[#9aa1ab]">{g.when}</span>
        </div>
        <p className="mt-2.5 text-[17px] sm:text-[18px] leading-[1.55] text-[#2a2a2a] max-w-[62ch]">{g.reason}</p>
      </div>
    </li>
  );
}

export function DoneRow({ d }: { d: DoneGame }) {
  return (
    <div className="border-t border-border pt-5">
      <div className={`${LABEL} text-steel`}>Already Played · {d.when}</div>
      <div className="mt-2 font-display font-black text-[22px] sm:text-[26px] leading-tight text-[#6b717b]">{d.result}</div>
      <div className="mt-1 font-display font-extrabold text-[17px] text-[#3d424a]">{d.verdict}</div>
      <p className="mt-1.5 text-[17px] leading-[1.55] text-[#5a5f67] max-w-[62ch]">{d.reason}</p>
    </div>
  );
}
