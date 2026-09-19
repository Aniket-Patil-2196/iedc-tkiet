"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";

const NavOverlay = dynamic(
  () => import("./NavOverlay").then((mod) => mod.NavOverlay),
  { ssr: false }
);

export function Header() {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#080A0F]/65 backdrop-blur-[10px] border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.15)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 h-16 md:h-20 flex items-center justify-between">
          {/* Brand Identity: Official IEDC Badge & Name */}
          <Link
            href="/"
            className="flex items-center gap-3.5 group focus:outline-none focus:ring-2 focus:ring-brand-cyan rounded-md p-1"
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-brand-cyan/40 transition-all duration-300 group-hover:border-brand-cyan group-hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]">
              <Image
                src="/images/iedc-logo.png"
                alt="IEDC TKIET Badge"
                fill
                className="object-contain"
                priority
              />
            </div>

            <div className="flex flex-col">
              <span className="font-display font-bold text-base sm:text-lg tracking-wider text-typo-white group-hover:text-brand-cyan transition-colors">
                IEDC
              </span>
              <span className="font-sans text-[10px] sm:text-xs text-typo-gray tracking-tight">
                TKIET Warananagar
              </span>
            </div>
          </Link>

          {/* Action: Menu Icon Trigger */}
          <button
            type="button"
            onClick={() => setIsNavOpen(true)}
            aria-label="Open main menu"
            aria-expanded={isNavOpen}
            className="group flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-[#0D111A]/85 border border-foundation-slate/80 text-typo-white hover:text-brand-cyan hover:border-brand-cyan/50 hover:bg-[#151B26] transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan active:scale-95 shadow-sm"
          >
            <span className="text-xs uppercase font-sans tracking-widest font-semibold hidden sm:inline text-typo-gray group-hover:text-typo-white transition-colors">
              Menu
            </span>
            <Menu className="w-5 h-5 text-brand-cyan transition-transform duration-200 group-hover:scale-110" />
          </button>
        </div>
      </header>

      <NavOverlay isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
    </>
  );
}
