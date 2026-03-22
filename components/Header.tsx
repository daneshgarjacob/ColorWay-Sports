"use client";

import { useState } from "react";
import Link from "next/link";

const navLinks = [
  { label: "HOME", href: "/" },
  { label: "STORIES", href: "/stories" },
  { label: "ABOUT", href: "/about" },
  { label: "CONTACT", href: "/contact" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b-[2.5px] border-orange">
        <div className="max-w-[1200px] mx-auto px-5 flex items-center justify-between h-[100px]">
          {/* Logo */}
          <Link href="/" className="flex flex-col">
            <span className="text-[32px] font-bold tracking-tight leading-tight">
              Color<span className="text-orange">Way</span> Sports<span className="text-orange">.</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.15em] text-gray-light mt-[-2px]">
              All Things Sports, Besides The Game Itself
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[14px] font-medium text-black hover:text-orange transition-colors tracking-wide"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block w-6 h-0.5 bg-black transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-6 h-0.5 bg-black transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block w-6 h-0.5 bg-black transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-white flex flex-col items-center justify-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-2xl font-medium text-black hover:text-orange transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
