import Link from "next/link";
import { LinkedInIcon, XIcon } from "@/components/FollowCard";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "News", href: "/news" },
  { label: "Stories", href: "/stories" },
  { label: "Newsletter", href: "/newsletter" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

function InstagramIcon({ className = "w-[16px] h-[16px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon({ className = "w-[15px] h-[15px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.6 2h-3.3v13.4a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.2a6.3 6.3 0 1 0 5.3 6.2V8.6a7.9 7.9 0 0 0 4.4 1.4V6.6A4.6 4.6 0 0 1 16.6 2Z" />
    </svg>
  );
}

function FacebookIcon({ className = "w-[17px] h-[17px]" }: { className?: string }) {
  return (
    <svg viewBox="5 4 14 19" className={className} fill="currentColor" aria-hidden="true">
      <path d="M13.5 21.9v-7.4h2.5l.4-2.9h-2.9V9.8c0-.8.3-1.4 1.5-1.4h1.5V5.8a20 20 0 0 0-2.2-.1c-2.2 0-3.7 1.3-3.7 3.8v2.1H8.1v2.9h2.5v7.4h2.9Z" />
    </svg>
  );
}

const socials = [
  { label: "Instagram", href: "https://www.instagram.com/colorwaysports/", icon: <InstagramIcon /> },
  { label: "TikTok", href: "https://www.tiktok.com/@colorway.sports", icon: <TikTokIcon /> },
  { label: "X", href: "https://x.com/ColorWaySports", icon: <XIcon /> },
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61595102422539", icon: <FacebookIcon /> },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/colorwaysports/", icon: <LinkedInIcon /> },
];

export default function Footer() {
  return (
    <footer className="bg-[#003087] border-t border-white/10">
      <div className="max-w-[1200px] mx-auto px-5 py-12 flex flex-col items-center text-center">
        {/* Logo — stacked, centered badge: flag icon on top of the wordmark + tagline (matches the social lockup) */}
        <div className="flex flex-col items-center mb-1">
          <svg width="52" height="52" viewBox="0 0 100 100" className="shrink-0 mb-2.5" aria-hidden="true">
            <circle cx="50" cy="50" r="37" fill="none" stroke="#ffffff" strokeWidth="2.6" />
            <circle cx="50" cy="50" r="31" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.45" />
            <g transform="translate(0,3)">
              <circle cx="40.8" cy="32" r="2.4" fill="#ffffff" />
              <rect x="39.6" y="33" width="2.6" height="33" rx="1.3" fill="#ffffff" />
              <path d="M42.2,36 L65,40.5 L55,46 L65,51.5 L42.2,54 Z" fill="#ffffff" />
            </g>
          </svg>
          <span className="text-[24px] tracking-[-0.02em] leading-none" style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "#ffffff", WebkitTextStroke: "1.4px #2f6bed", paintOrder: "stroke fill", whiteSpace: "nowrap" }}>
            ColorWay Sports
          </span>
          <span className="text-[9px] uppercase tracking-[0.18em] mt-[5px]" style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "#9FB6D6", whiteSpace: "nowrap" }}>
            Every Jersey. Every Logo. Every Detail.
          </span>
        </div>

        {/* Follow */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <span
            className="text-[10px] uppercase tracking-[0.18em] text-[#9FB6D6]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            Follow Us
          </span>
          <div className="flex items-center gap-2.5">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener"
                aria-label={`ColorWay Sports on ${s.label}`}
                className="w-10 h-10 rounded-full border border-white/25 text-white flex items-center justify-center hover:bg-white hover:text-[#003087] transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-8">
          {navLinks.map((link) => (
            <Link prefetch={false}
              key={link.label}
              href={link.href}
              className="text-[11px] uppercase tracking-widest text-white/65 hover:text-white transition-colors font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Secondary links */}
        <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[12px]">
          <Link prefetch={false} href="/team-kits" className="text-[#9FB6D6] hover:text-white underline underline-offset-2 transition-colors">
            Custom team kits
          </Link>
          <Link prefetch={false} href="/embed" className="text-[#9FB6D6] hover:text-white underline underline-offset-2 transition-colors">
            Embed our uniform tracker
          </Link>
        </div>

        {/* Legal links */}
        <div className="flex gap-4 mt-5">
          <Link prefetch={false}
            href="/privacy-policy"
            className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white/75 transition-colors font-medium"
          >
            Privacy Policy
          </Link>
          <Link prefetch={false}
            href="/terms"
            className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white/75 transition-colors font-medium"
          >
            Terms of Service
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-white/40 text-[11px] mt-3">
          &copy; {new Date().getFullYear()} ColorWay Sports. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
