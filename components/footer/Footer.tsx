import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { SITE_CONFIG, PUBLIC_NAV_ITEMS } from "@/lib/constants/site";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-foundation-dark border-t border-foundation-slate/60 pt-16 pb-12 transition-colors">
      <Container size="lg">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-foundation-slate/40">
          {/* Institution & Cell Details */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full overflow-hidden border border-brand-cyan/40">
                <Image
                  src="/images/iedc-logo.png"
                  alt="IEDC Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-display font-bold text-lg text-typo-white tracking-wide">
                {SITE_CONFIG.name}
              </span>
            </div>

            <p className="font-sans text-sm text-typo-white font-medium max-w-md">
              {SITE_CONFIG.fullName}
            </p>

            <p className="font-sans text-xs text-typo-gray max-w-md leading-relaxed">
              {SITE_CONFIG.institution}
              <br />
              {SITE_CONFIG.location}
            </p>

            <div className="pt-2 flex items-center gap-3 text-xs text-typo-gray">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-foundation-slate/50 border border-foundation-slate text-typo-gray">
                NEC Participant
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-foundation-slate/50 border border-foundation-slate text-typo-gray">
                IIC Established
              </span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-sans font-semibold uppercase tracking-widest text-brand-cyan">
              Navigation
            </h4>
            <ul className="space-y-2">
              {PUBLIC_NAV_ITEMS.slice(0, 5).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-xs font-sans text-typo-gray hover:text-typo-white transition-colors"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Secondary Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-sans font-semibold uppercase tracking-widest text-brand-cyan">
              Ecosystem
            </h4>
            <ul className="space-y-2">
              {PUBLIC_NAV_ITEMS.slice(5).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-xs font-sans text-typo-gray hover:text-typo-white transition-colors"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Attribution */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-typo-gray">
          <p>
            © {currentYear} {SITE_CONFIG.fullName}, {SITE_CONFIG.institutionShort}. All rights reserved.
          </p>
          <p className="text-[11px] text-typo-gray/70">
            Official Innovation & Incubation Platform
          </p>
        </div>
      </Container>
    </footer>
  );
}
