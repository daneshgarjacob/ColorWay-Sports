export function XIcon({ className = "w-[15px] h-[15px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

export function LinkedInIcon({ className = "w-[15px] h-[15px]" }: { className?: string }) {
  return (
    <svg viewBox="3 3 18 18" className={className} fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
    </svg>
  );
}

/** End-of-article "Follow ColorWay Sports" card (Jake approved the mock 9/14). */
export default function FollowCard() {
  return (
    <aside
      aria-label="Follow ColorWay Sports"
      className="mt-8 rounded-2xl border border-black/5 bg-white px-6 py-6 sm:px-8 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      style={{ fontFamily: "var(--font-display)" }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#2f6bed] mb-1.5">Follow ColorWay Sports</p>
        <p className="text-[18px] font-extrabold text-black leading-snug tracking-tight">
          Every jersey reveal and uniform schedule update, first.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
        <a
          href="https://x.com/ColorWaySports"
          target="_blank"
          rel="noopener"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2f6bed] px-4 py-2.5 text-[14px] font-bold text-white hover:bg-[#2459c9] transition-colors whitespace-nowrap"
        >
          <XIcon />
          Follow on X
        </a>
        <a
          href="https://www.linkedin.com/company/colorwaysports/"
          target="_blank"
          rel="noopener"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2.5 text-[14px] font-bold text-black hover:border-[#2f6bed] hover:text-[#2f6bed] transition-colors whitespace-nowrap"
        >
          <LinkedInIcon />
          Follow on LinkedIn
        </a>
      </div>
    </aside>
  );
}
