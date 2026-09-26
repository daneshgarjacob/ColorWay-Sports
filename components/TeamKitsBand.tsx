import Link from "next/link";

// Homepage band for ColorWay Team Kits (Jake, 2026-09-26: "add a section of
// that on the site"). Sits below the stories so it never pushes editorial or
// ad slots down. Same palette and sample spec as the /team-kits hero.
const SWATCHES = [
  { name: "Midnight", hex: "#14203D" },
  { name: "Lagoon", hex: "#2EC4B6" },
  { name: "Ice", hex: "#F4F7FB" },
];

export default function TeamKitsBand() {
  return (
    <section className="bg-[#0d1322] text-white">
      <div className="max-w-[1200px] mx-auto px-5 py-12 sm:py-14 grid grid-cols-1 md:grid-cols-[1.3fr_0.7fr] gap-10 items-center">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8fb0ff] mb-3">ColorWay Team Kits</p>
          <h2 className="text-[28px] sm:text-[38px] font-extrabold leading-[1.08] tracking-[-0.02em]" style={{ color: "#ffffff" }}>
            Custom jerseys for your rec league team.
          </h2>
          <p className="text-[16px] sm:text-[17px] text-white/70 leading-relaxed mt-4 max-w-[560px]">
            Hockey jerseys and soccer kits for adult league teams, designed to the standard we hold the pros to.
            From $85 per player, with names and numbers included.
          </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <Link prefetch={false} href="/team-kits#reserve" className="bg-[#2f6bed] hover:bg-[#2458c9] text-white font-bold px-6 py-3 rounded-lg transition-colors">
              Reserve a spot
            </Link>
            <Link prefetch={false} href="/team-kits" className="border border-white/30 hover:border-white/60 text-white font-bold px-6 py-3 rounded-lg transition-colors">
              How it works
            </Link>
          </div>
        </div>
        <div className="bg-white text-black rounded-2xl overflow-hidden shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]">
          <div className="px-5 pt-4 pb-3 border-b border-black/[0.07]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/45">Kit spec · Sample</p>
            <p className="text-[16px] font-extrabold tracking-tight mt-0.5">Silver Lake Night Owls</p>
            <p className="text-[12px] text-black/55">Hockey · Home sweater</p>
          </div>
          <div className="grid grid-cols-3">
            {SWATCHES.map((s) => (
              <div key={s.hex}>
                <div className="h-[64px] border-b border-black/[0.06]" style={{ background: s.hex }} />
                <div className="px-3 py-2">
                  <p className="text-[12px] font-bold">{s.name}</p>
                  <p className="text-[11px] text-black/45 font-mono">{s.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
