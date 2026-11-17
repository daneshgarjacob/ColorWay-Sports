import Link from "next/link";

// One-line prompt that sends readers to /ask. Shown under Explained stories.
export default function AskColorWayCta({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/ask"
      className={`not-prose group flex items-center justify-between gap-4 rounded-xl border-2 border-[#0025CC]/20 bg-[#0025CC]/[0.04] px-5 py-4 text-[18px] text-black no-underline hover:border-[#0025CC] transition-colors ${className}`}
    >
      <span>
        Have a uniform question? <span className="font-extrabold text-[#0025CC]">Ask ColorWay</span>
      </span>
      <span aria-hidden className="text-[#0025CC] font-bold transition-transform group-hover:translate-x-1">
        &rarr;
      </span>
    </Link>
  );
}
