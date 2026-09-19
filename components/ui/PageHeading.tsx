import React from "react";
import { cn } from "@/lib/utils";

interface PageHeadingProps {
  badge?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

export function PageHeading({
  badge,
  title,
  subtitle,
  align = "left",
  className,
}: PageHeadingProps) {
  return (
    <div
      className={cn(
        "space-y-4 mb-12 md:mb-16",
        align === "center" ? "text-center mx-auto max-w-3xl" : "max-w-4xl",
        className
      )}
    >
      {badge && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-foundation-slate bg-foundation-dark/80 text-xs font-sans font-medium text-brand-cyan tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse-slow" />
          {badge}
        </div>
      )}
      <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-typo-white leading-[1.1]">
        {title}
      </h1>
      {subtitle && (
        <p className="font-sans text-base sm:text-lg md:text-xl text-typo-gray leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}
