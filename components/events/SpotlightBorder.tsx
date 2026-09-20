"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SpotlightBorderProps {
  className?: string;
  radiusClass?: string;
  spotlightColor?: string;
  size?: number;
}

/**
 * High-performance cursor-following spotlight border.
 * Follows CSS variables --mx, --my, --spotlight-opacity updated by useCardSpotlight.
 * Uses 1px border mask technique with smooth fallback.
 */
export function SpotlightBorder({
  className,
  radiusClass = "rounded-2xl",
  spotlightColor = "rgba(56, 189, 248, 0.45)",
  size = 360,
}: SpotlightBorderProps) {
  return (
    <>
      {/* 1. Dynamic Cursor-Following Spotlight Border */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 opacity-0",
          "[media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 motion-reduce:hidden",
          radiusClass,
          className
        )}
        style={{
          padding: "1px",
          background: `radial-gradient(${size}px circle at var(--mx, -999px) var(--my, -999px), ${spotlightColor}, transparent 70%)`,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/* 2. Static focus-visible glow and reduced-motion fallback */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 opacity-0",
          radiusClass,
          "group-focus-visible:opacity-100 group-focus-visible:ring-2 group-focus-visible:ring-brand-cyan/80 group-focus-visible:shadow-[0_0_25px_rgba(56,189,248,0.25)]",
          "motion-reduce:group-hover:opacity-100 motion-reduce:group-hover:border motion-reduce:group-hover:border-brand-cyan/40 motion-reduce:group-hover:shadow-[0_0_20px_rgba(56,189,248,0.15)]"
        )}
      />
    </>
  );
}
