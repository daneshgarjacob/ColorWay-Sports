import Link from "next/link";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Stories", href: "/stories" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-[#003087] border-t border-white/10">
      <div className="max-w-[1200px] mx-auto px-5 py-12 flex flex-col items-center text-center">
        {/* Logo — Outline Stamp + wordmark lockup (left-aligned so the C and the E line up) */}
        <div className="flex items-center gap-3 mb-1">
          <svg width="48" height="48" viewBox="0 0 100 100" className="shrink-0" aria-hidden="true">
            <circle cx="50" cy="50" r="37" fill="none" stroke="#ffffff" strokeWidth="2.6" />
            <circle cx="50" cy="50" r="31" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.45" />
            <g transform="translate(0,3)">
              <circle cx="40.8" cy="32" r="2.4" fill="#ffffff" />
              <rect x="39.6" y="33" width="2.6" height="33" rx="1.3" fill="#ffffff" />
              <path d="M42.2,36 L65,40.5 L55,46 L65,51.5 L42.2,54 Z" fill="#ffffff" />
            </g>
          </svg>
          <div className="flex flex-col">
            {/* Wordmark sits a hair left (negative indent) so the C's body lines up over the tagline's E; tagline indent is left as-is */}
            <span className="text-[24px] tracking-[-0.02em] leading-none" style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "#ffffff", WebkitTextStroke: "1.4px #2f6bed", paintOrder: "stroke fill", whiteSpace: "nowrap", textIndent: "-0.029em" }}>
              ColorWay Sports
            </span>
            <span className="text-[9px] uppercase tracking-[0.18em] mt-[3px]" style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "#9FB6D6", whiteSpace: "nowrap", textIndent: "-0.05em" }}>
              Every Jersey. Every Logo. Every Detail.
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex gap-6 mt-6">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[11px] uppercase tracking-widest text-white/65 hover:text-white transition-colors font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Legal links */}
        <div className="flex gap-4 mt-5">
          <Link
            href="/privacy-policy"
            className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white/75 transition-colors font-medium"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white/75 transition-colors font-medium"
          >
            Terms of Service
          </Link>
        </div>

        {/* Affiliate disclosure */}
        <p className="text-white/40 text-[10px] mt-5 max-w-[680px] leading-relaxed">
          ColorWay Sports is a participant in the Amazon Services LLC Associates Program and other affiliate programs. As an Amazon Associate we earn from qualifying purchases. Some links on this site may earn us a commission at no extra cost to you.
        </p>

        {/* Copyright */}
        <p className="text-white/40 text-[11px] mt-3">
          &copy; {new Date().getFullYear()} ColorWay Sports. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
