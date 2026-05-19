import Link from "next/link";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Stories", href: "/stories" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-[#f5f5f7] border-t-2 border-[#FF5910]">
      <div className="max-w-[1200px] mx-auto px-5 py-10 flex flex-col items-center text-center">
        {/* Logo */}
        <svg width="40" height="40" viewBox="0 0 512 512" className="mb-2">
          <g transform="translate(256,380)">
            <rect x="-30" y="-300" width="60" height="220" rx="30" fill="#0021A5" transform="rotate(-24)"/>
            <rect x="-30" y="-300" width="60" height="220" rx="30" fill="#4A90D9" transform="rotate(-8)"/>
            <rect x="-30" y="-300" width="60" height="220" rx="30" fill="#FF5910" transform="rotate(8)"/>
            <rect x="-30" y="-300" width="60" height="220" rx="30" fill="#6B9E8F" transform="rotate(24)"/>
            <circle cx="0" cy="0" r="22" fill="#FF5910"/>
          </g>
        </svg>
        <span className="text-[22px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "'Inter', sans-serif" }}>
          <span className="text-[#0021A5]">Color</span><span className="text-orange">Way</span> <span className="text-[#0021A5]">Sports</span><span className="text-orange">.</span>
        </span>
        <p className="text-[#8A8F98] text-[10px] uppercase tracking-[0.15em] mt-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
          Every Uniform. Every Logo. Every Detail.
        </p>

        {/* Nav */}
        <nav className="flex gap-6 mt-5">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[11px] uppercase tracking-widest text-[#8A8F98] hover:text-[#0021A5] transition-colors font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Legal links */}
        <div className="flex gap-4 mt-5">
          <Link
            href="/privacy-policy"
            className="text-[10px] uppercase tracking-widest text-[#b0b4bc] hover:text-[#8A8F98] transition-colors font-medium"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-[10px] uppercase tracking-widest text-[#b0b4bc] hover:text-[#8A8F98] transition-colors font-medium"
          >
            Terms of Service
          </Link>
        </div>

        {/* Affiliate disclosure */}
        <p className="text-[#b0b4bc] text-[10px] mt-4 max-w-[680px] leading-relaxed">
          ColorWay Sports is a participant in the Amazon Services LLC Associates Program and other affiliate programs. As an Amazon Associate we earn from qualifying purchases. Some links on this site may earn us a commission at no extra cost to you.
        </p>

        {/* Copyright */}
        <p className="text-[#b0b4bc] text-[11px] mt-3">
          &copy; {new Date().getFullYear()} ColorWay Sports. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
