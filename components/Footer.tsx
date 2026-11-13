import Link from "next/link";
import { InstagramIcon, LinkedInIcon, TikTokIcon, XIcon } from "@/components/FollowCard";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Stories", href: "/news" },
  { label: "Tonight's Uniforms", href: "/tonight" },
  { label: "All Stories", href: "/stories" },
  { label: "Newsletter", href: "/newsletter" },
  { label: "About", href: "/about" },
  { label: "Advertise", href: "/advertise" },
  { label: "Contact", href: "/contact" },
];

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
    <footer className="bg-[#0025CC] border-t border-white/10">
      <div className="max-w-[1200px] mx-auto px-5 py-12 flex flex-col items-center text-center">
        {/* Logo — stacked, centered badge: flag icon on top of the wordmark + tagline (matches the social lockup) */}
        <div className="flex flex-col items-center mb-1">
          <svg width="44" height="44" viewBox="92 92 840 840" className="shrink-0 mb-2" aria-hidden="true">
            {/* B3 badge reversed (white) for the royal footer */}
            <circle cx="512" cy="512" r="420" fill="#ffffff" />
            <circle cx="512" cy="512" r="392" fill="#0025CC" />
            <circle cx="512" cy="512" r="340" fill="none" stroke="#ffffff" strokeWidth="15" />
            <g fill="#ffffff">
              <circle cx="411" cy="345" r="26" />
              <rect x="398" y="345" width="29" height="373" rx="14" />
              <path d="M412,387 L427,390 L677,440 L567,500 L677,561 L427,588 L412,590 Z" />
            </g>
          </svg>
          <span className="text-[24px] tracking-[-0.02em] leading-none" style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "#ffffff", whiteSpace: "nowrap" }}>
            ColorWay Sports
          </span>
          <span className="text-[9px] uppercase tracking-[0.18em] mt-[5px]" style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "#C7D2FE", whiteSpace: "nowrap" }}>
            Every Jersey. Every Logo. Every Detail.
          </span>
        </div>

        {/* Follow */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <span
            className="text-[10px] uppercase tracking-[0.18em] text-[#C7D2FE]"
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
                className="w-10 h-10 rounded-full border border-white/25 text-white flex items-center justify-center hover:bg-white hover:text-[#0025CC] transition-colors"
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
          <Link prefetch={false} href="/team-kits" className="text-[#C7D2FE] hover:text-white underline underline-offset-2 transition-colors">
            Custom team kits
          </Link>
          <Link prefetch={false} href="/embed" className="text-[#C7D2FE] hover:text-white underline underline-offset-2 transition-colors">
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

        {/* Affiliate disclosure (Jake 11/5: links are back, as plain text lines) */}
        <p className="text-white/40 text-[10px] mt-5 max-w-[680px] mx-auto leading-relaxed">
          Some links on this site are affiliate links. We may earn a commission if you buy through them, at no extra cost to you.
        </p>

        {/* Copyright */}
        <p className="text-white/40 text-[11px] mt-3">
          &copy; {new Date().getFullYear()} ColorWay Sports. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
