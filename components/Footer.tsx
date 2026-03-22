import Link from "next/link";

const navLinks = [
  { label: "HOME", href: "/" },
  { label: "STORIES", href: "/stories" },
  { label: "ABOUT", href: "/about" },
  { label: "CONTACT", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-[1200px] mx-auto px-5 py-12 flex flex-col items-center text-center">
        {/* Logo */}
        <span className="text-[24px] font-bold tracking-tight">
          Color<span className="text-orange">Way</span> Sports<span className="text-orange">.</span>
        </span>
        <p className="text-gray-light text-sm mt-2">
          All Things Sports, Besides The Game Itself
        </p>

        {/* Nav */}
        <nav className="flex gap-6 mt-6">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs uppercase tracking-widest text-gray-light hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <p className="text-gray-light text-xs mt-8">
          &copy; {new Date().getFullYear()} ColorWay Sports
        </p>
      </div>
    </footer>
  );
}
