/** Google multicolor "G", drawn inline so it needs no image request. */
function GoogleG({ className = "w-[16px] h-[16px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

// Google "Preferred Sources" (launched globally Dec 2025): readers who pick a site
// see it more in Top Stories and click it about twice as often. Our regulars
// come back by Googling again rather than by bookmark, so this targets exactly
// that habit. The link is Google's own preference page pre-filled with our domain.
export const PREFERRED_SOURCE_URL = "https://www.google.com/preferences/source?q=colorwaysports.com";

/** End-of-article "Add ColorWay as a preferred source on Google" card. */
export default function PreferredSourceCard() {
  return (
    <aside
      aria-label="Add ColorWay Sports as a preferred source on Google"
      className="mt-4 rounded-2xl border border-black/5 bg-white px-6 py-5 sm:px-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      style={{ fontFamily: "var(--font-display)" }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#2f6bed] mb-1.5">See Us First on Google</p>
        <p className="text-[16px] font-extrabold text-black leading-snug tracking-tight">
          Make ColorWay Sports a preferred source and our uniform news shows up higher when you search.
        </p>
      </div>
      <a
        href={PREFERRED_SOURCE_URL}
        target="_blank"
        rel="noopener"
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2.5 text-[14px] font-bold text-black hover:border-[#2f6bed] hover:text-[#2f6bed] transition-colors whitespace-nowrap shrink-0"
      >
        <GoogleG />
        Add on Google
      </a>
    </aside>
  );
}
