"use client";

import React from "react";
import Link from "next/link";
import { Menu, Shield, ExternalLink } from "lucide-react";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onToggleSidebar: () => void;
}

export function AdminHeader({
  title,
  subtitle,
  onToggleSidebar,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-foundation-space/90 backdrop-blur-md border-b border-foundation-slate/70">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-foundation-dark border border-foundation-slate text-typo-gray hover:text-typo-white hover:border-brand-blue transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono tracking-wider text-brand-cyan font-semibold">
              Admin Module
            </span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-typo-white">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden sm:block text-xs font-sans text-typo-gray mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-foundation-dark border border-foundation-slate text-xs font-sans text-typo-gray">
          <Shield className="w-3.5 h-3.5 text-brand-cyan" />
          <span>Single Admin Mode</span>
        </div>

        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foundation-dark hover:bg-foundation-slate border border-foundation-slate text-xs font-sans text-typo-white hover:text-brand-cyan transition-colors"
        >
          <span>View Site</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </header>
  );
}
