import React from "react";
import { cn } from "@/lib/utils";

interface BrandedLoaderProps {
  className?: string;
}

/**
 * Minimal technical fallback loader.
 * Architecturally prepares the hook for the future IEDC geometric brand identity intro.
 * Strictly avoids generic spinners, percentage bars, or generic loading text.
 */
export function BrandedLoader({ className }: BrandedLoaderProps) {
  return (
    <div
      role="status"
      aria-label="Loading content"
      className={cn(
        "flex items-center justify-center min-h-[200px] w-full",
        className
      )}
    >
      <div className="relative flex items-center justify-center w-12 h-12">
        {/* Subtle geometric node pulse reflecting connected innovation */}
        <div className="absolute w-8 h-8 rounded-full border border-foundation-slate animate-ping opacity-25" />
        <div className="w-3 h-3 rounded-full bg-brand-cyan shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
      </div>
    </div>
  );
}
