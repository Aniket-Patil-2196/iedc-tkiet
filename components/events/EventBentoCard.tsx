"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Tag, ArrowRight, Sparkles } from "lucide-react";
import { IEvent } from "@/types/content";
import { ArchiveEventItem } from "./EventArchive";
import { formatEventDate } from "@/lib/utils/event-status";
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
  // Wide: ~360-400px; Half: ~300-340px
  const heightClass =
    variant === "wide"
      ? "aspect-[4/3] sm:aspect-[16/10] md:h-[360px] lg:h-[390px]"
      : "aspect-[16/10] md:h-[300px] lg:h-[330px]";

  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl overflow-hidden border border-foundation-slate/70 bg-foundation-darkest select-none shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:border-brand-cyan/60",
        colSpanClass,
        heightClass,
        className
      )}
    >
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
            className={cn(
              "object-cover object-center w-full h-full transition-transform duration-500 ease-out will-change-transform",
              // Touch-safe: hover zoom only applies on devices supporting hover
              "[media(hover:hover)]:group-hover:scale-105"
            )}
          />
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

      {/* Top Gradient Scrim: guarantees crystal-clear contrast for title */}
      <div className="relative z-10 w-full bg-gradient-to-b from-black/85 via-black/45 to-transparent pt-4 sm:pt-5 pb-12 px-4 sm:px-6 flex items-start justify-between gap-3">
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

        {/* Recap badge or category icon */}
        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-foundation-darkest/75 backdrop-blur-md border border-foundation-slate/70 text-[11px] font-mono text-brand-cyan uppercase tracking-wider">
          <Tag className="w-3 h-3" />
          <span className="hidden sm:inline">{event.category}</span>
        </span>
      </div>

      {/* Bottom Gradient Scrim: guarantees crystal-clear contrast for info */}
      <div className="relative z-10 w-full bg-gradient-to-t from-black/95 via-black/75 to-transparent pt-14 pb-4 sm:pb-5 px-4 sm:px-6 space-y-2.5">
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
        <div className="pt-1 flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-typo-gray/60">
            Archive Record
          </span>

          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-sans font-semibold text-brand-cyan drop-shadow-sm transition-all duration-300",
              // On desktop: fades in on hover/focus; on touch: always subtly visible
              "opacity-80 [media(hover:hover)]:opacity-0 [media(hover:hover)]:group-hover:opacity-100 [media(hover:hover)]:group-hover:translate-x-1"
            )}
          >
            <span>View recap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Touch-Safe Interactive Frame Glow: applied only on hover-supporting devices */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300",
          "[media(hover:hover)]:group-hover:border-brand-cyan/40",
          "[media(hover:hover)]:group-hover:shadow-[inset_0_0_20px_rgba(56,189,248,0.15)]"
        )}
      />
    </Link>
  );
}
