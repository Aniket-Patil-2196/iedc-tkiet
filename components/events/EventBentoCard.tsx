"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Tag, ArrowRight } from "lucide-react";
import { IEvent } from "@/types/content";
import { ArchiveEventItem } from "./EventArchive";
import { formatEventDate } from "@/lib/utils/event-status";
import { SpotlightBorder } from "./SpotlightBorder";
import { useCardSpotlight } from "@/lib/hooks/useCardSpotlight";
import { cn } from "@/lib/utils";

interface EventBentoCardProps {
  event: ArchiveEventItem | IEvent;
  variant: "wide" | "half-7" | "half-5";
  className?: string;
  priority?: boolean;
}

export function EventBentoCard({
  event,
  variant,
  className,
  priority = false,
}: EventBentoCardProps) {
  const [imageError, setImageError] = useState(false);

  // Shared spotlight hook for counter-parallax and border glow
  const { ref: cardRef, isHoverSupported, prefersReducedMotion } = useCardSpotlight<HTMLAnchorElement>({
    maxTilt: 0, // Cards lift rather than tilt
  });

  // Card image rule: coverImage ?? posterUrl
  const imageSrc = event.coverImage?.trim() || event.posterUrl?.trim() || null;
  const hasImage = Boolean(imageSrc && !imageError);

  const formattedDate = formatEventDate(event.startDate || event.date);
  const description = event.shortDescription || event.summary || event.description;

  // Grid column span mappings
  const colSpanClass =
    variant === "wide"
      ? "col-span-1 md:col-span-2 lg:col-span-12"
      : variant === "half-7"
      ? "col-span-1 md:col-span-1 lg:col-span-7"
      : "col-span-1 md:col-span-1 lg:col-span-5";

  // Fixed card heights / aspect ratios to ensure hover never shifts layout
  // Wide: 400-460px (mobile 4:3); Half: 310-340px (mobile 16:10)
  const heightClass =
    variant === "wide"
      ? "aspect-[4/3] sm:aspect-[16/10] md:h-[420px] lg:h-[440px]"
      : "aspect-[16/10] md:h-[310px] lg:h-[330px]";

  return (
    <Link
      ref={cardRef as any}
      href={`/events/${event.slug}`}
      style={variant === "wide" ? { gridColumn: "1 / -1" } : undefined}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl overflow-hidden border border-foundation-slate/70 bg-foundation-darkest select-none shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:border-brand-cyan/60",
        "transition-all duration-500 ease-out",
        // Card lifts 3-4px with deeper shadow on desktop hover
        "[media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-1 [media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_20px_45px_rgba(0,0,0,0.8),0_0_25px_rgba(56,189,248,0.18)]",
        colSpanClass,
        heightClass,
        className
      )}
    >
      {/* Dynamic Cursor-Following Spotlight Border */}
      <SpotlightBorder radiusClass="rounded-2xl" />

      {/* Background Layer: Real Image or Generated Galaxy Motif */}
      {hasImage ? (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <Image
            src={imageSrc!}
            alt={event.title}
            fill
            unoptimized
            priority={priority}
            onError={() => setImageError(true)}
            sizes={
              variant === "wide"
                ? "(max-width: 768px) 100vw, 1200px"
                : "(max-width: 768px) 100vw, 600px"
            }
            style={{
              objectPosition: "center 35%",
              transform:
                isHoverSupported && !prefersReducedMotion
                  ? "scale(var(--img-scale, 1.0)) translate3d(calc((var(--px, 0.5) - 0.5) * -16px), calc((var(--py, 0.5) - 0.5) * -16px), 0)"
                  : undefined,
            }}
            className={cn(
              "object-cover w-full h-full transition-transform duration-500 ease-out will-change-transform",
              // Touch-safe: hover zoom to 1.06 applies only on devices supporting hover
              "[media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.06]"
            )}
          />

          {/* One-time diagonal light sweep across the image (~700ms, opacity ~0.18) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 overflow-hidden motion-reduce:hidden"
          >
            <div className="absolute inset-0 -translate-x-full -translate-y-full rotate-[35deg] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 [media(hover:hover)_and_(pointer:fine)]:group-hover:animate-light-sweep" />
          </div>
        </div>
      ) : (
        /* Generated Fallback Galaxy Style (Dark blue gradient, faint stars, real data only) */
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#060D19] via-[#0A1629] to-[#040813] overflow-hidden">
          {/* Subtle starfield and constellation SVG line motif */}
          <svg
            className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id={`stars-${event.id}`}
                width="80"
                height="80"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="12" cy="18" r="1" fill="#38BDF8" opacity="0.6" />
                <circle cx="48" cy="24" r="1.5" fill="#38BDF8" opacity="0.8" />
                <circle cx="68" cy="58" r="1" fill="#60A5FA" opacity="0.4" />
                <circle cx="28" cy="62" r="1.2" fill="#FFFFFF" opacity="0.5" />
                <line
                  x1="12"
                  y1="18"
                  x2="48"
                  y2="24"
                  stroke="#38BDF8"
                  strokeWidth="0.5"
                  strokeDasharray="2 4"
                  opacity="0.25"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#stars-${event.id})`} />
          </svg>

          {/* Ambient cyan backlight glow */}
          <div className="absolute -top-1/4 -right-1/4 w-80 h-80 bg-brand-blue/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-1/4 -left-1/4 w-80 h-80 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      )}

      {/* 4-6 Tiny Twinkling Stars away from text (fading in near edges on hover) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500 opacity-0 [media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 motion-reduce:hidden"
      >
        {/* Star 1: Top Right Area */}
        <span
          className="absolute top-5 right-36 w-1.5 h-1.5 rounded-full bg-brand-cyan shadow-[0_0_6px_#38BDF8] animate-star-twinkle"
          style={{ animationDelay: "0s" }}
        />
        {/* Star 2: Mid Right Edge */}
        <span
          className="absolute top-1/2 right-6 w-1 h-1 rounded-full bg-white shadow-[0_0_4px_#FFF] animate-star-twinkle"
          style={{ animationDelay: "0.35s" }}
        />
        {/* Star 3: Top Mid-Left Area */}
        <span
          className="absolute top-6 left-1/3 w-1.5 h-1.5 rounded-full bg-brand-cyan/80 shadow-[0_0_5px_#38BDF8] animate-star-twinkle"
          style={{ animationDelay: "0.7s" }}
        />
        {/* Star 4: Lower Right Zone */}
        <span
          className="absolute bottom-20 right-10 w-1 h-1 rounded-full bg-sky-200 shadow-[0_0_4px_#38BDF8] animate-star-twinkle"
          style={{ animationDelay: "1.05s" }}
        />
        {/* Star 5: Far Right Upper Zone */}
        <span
          className="absolute top-24 right-14 w-1.5 h-1.5 rounded-full bg-white/90 shadow-[0_0_5px_#FFF] animate-star-twinkle"
          style={{ animationDelay: "1.4s" }}
        />
      </div>

      {/* Top Gradient Scrim: guarantees crystal-clear contrast for title */}
      <div className="relative z-20 w-full bg-gradient-to-b from-black/85 via-black/45 to-transparent pt-4 sm:pt-5 pb-12 px-4 sm:px-6 flex items-start justify-between gap-3">
        <div className="space-y-1 max-w-2xl">
          <h3
            className={cn(
              "font-display font-bold text-typo-white tracking-tight leading-snug drop-shadow-md transition-colors",
              variant === "wide"
                ? "text-xl sm:text-2xl lg:text-3xl line-clamp-2"
                : "text-lg sm:text-xl lg:text-2xl line-clamp-2",
              "[media(hover:hover)]:group-hover:text-brand-cyan"
            )}
          >
            {event.title}
          </h3>
        </div>

        {/* Category Badge */}
        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-foundation-darkest/75 backdrop-blur-md border border-foundation-slate/70 text-[11px] font-mono text-brand-cyan uppercase tracking-wider">
          <Tag className="w-3 h-3" />
          <span className="hidden sm:inline">{event.category}</span>
        </span>
      </div>

      {/* Bottom Gradient Scrim: shifts slightly toward deep blue (#172554) on hover */}
      <div
        className={cn(
          "relative z-20 w-full pt-14 pb-4 sm:pb-5 px-4 sm:px-6 space-y-2.5 transition-colors duration-500",
          "bg-gradient-to-t from-black/95 via-black/75 to-transparent",
          "[media(hover:hover)_and_(pointer:fine)]:group-hover:from-[#172554]/95 [media(hover:hover)_and_(pointer:fine)]:group-hover:via-[#0A1629]/70"
        )}
      >
        {/* Logistics row (Date · Venue) */}
        <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-xs font-sans text-typo-gray/90 drop-shadow-sm">
          <span className="inline-flex items-center gap-1.5 text-typo-white font-medium">
            <Calendar className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
            <span>{formattedDate}</span>
          </span>

          <span className="text-foundation-slate select-none">·</span>

          <span className="inline-flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-[280px]">
            <MapPin className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
            <span className="truncate">{event.venue}</span>
          </span>
        </div>

        {/* 2-line clamped summary description */}
        {description && (
          <p className="font-sans text-xs sm:text-sm text-typo-gray/90 line-clamp-2 leading-relaxed drop-shadow-sm">
            {description}
          </p>
        )}

        {/* Interactive "View recap →" link affordance */}
        <div className="pt-1 flex items-center justify-end">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-sans font-semibold text-brand-cyan drop-shadow-sm transition-all duration-300",
              // On desktop: fades in on hover/focus; on touch: always subtly visible
              "opacity-80 [media(hover:hover)]:opacity-0 [media(hover:hover)]:group-hover:opacity-100",
              // Arrow slides 4px on hover
              "[media(hover:hover)]:group-hover:translate-x-1"
            )}
          >
            <span>View recap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
