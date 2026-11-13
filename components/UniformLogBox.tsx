import Link from "next/link";
import type { UniformLogData } from "@/lib/uniformLog";

// Season-so-far uniform counts at the top of a team schedule post, styled to match
// TeamWearBox right above it. Server-rendered and outside the <article>, so
// Mediavine's in-content ads never land in it.
export default function UniformLogBox({ data }: { data: UniformLogData }) {
  return (
    <section
      aria-label="From The ColorWay Uniform Log"
      className="mb-8 rounded-2xl border border-black/10 overflow-hidden"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="px-5 py-2.5" style={{ background: "#0b0b0f" }}>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white">From The ColorWay Uniform Log</p>
      </div>
      <div className="px-5 sm:px-7 py-6 bg-white">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b0b0f] leading-tight">{data.heading}</h2>
        {data.note && <p className="mt-1 text-[14px] text-[#5b6270]">{data.note}</p>}
        <div
          className="mt-5 grid gap-2"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}
        >
          {data.tiles.map((t) => (
            <div key={t.label} className="min-w-0 rounded-lg px-3 py-3 bg-[#f3f6ff] border border-[#d6dcf5]">
              <div className="text-[30px] font-extrabold leading-none text-[#0b0b0f]">{t.count}</div>
              <div className="mt-2 text-[13px] font-semibold leading-snug break-words text-[#0b0b0f]">{t.label}</div>
            </div>
          ))}
        </div>
        <Link prefetch={false} href={data.href} className="mt-5 inline-block text-[14px] font-bold underline text-[#002fd9]">
          See Every Game
        </Link>
      </div>
    </section>
  );
}
