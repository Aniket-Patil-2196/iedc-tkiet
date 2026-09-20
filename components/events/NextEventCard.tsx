"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  ExternalLink,
  Ticket,
  AlertTriangle,
  Tag,
  Maximize2,
  X,
  Sparkles,
} from "lucide-react";
import { IEvent } from "@/types/content";
import { EventStatusResult, getRegistrationAction } from "@/lib/utils/event-status";
import { formatEventDate, formatEventTimeRange } from "@/lib/utils/event-status";
import { EventPoster } from "./EventPoster";
import { EventRegistrationModal } from "./EventRegistrationModal";
import { SpotlightBorder } from "./SpotlightBorder";
import { useCardSpotlight } from "@/lib/hooks/useCardSpotlight";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface UpcomingEventCardProps {
  event: IEvent;
  status: EventStatusResult;
  targetUtcIso?: string | null;
  isNearest?: boolean;
  isOngoing?: boolean;
  isPostponedNoDate?: boolean;
  className?: string;
}

export function UpcomingEventCard({
  event,
  status,
  targetUtcIso,
  isNearest = false,
  isOngoing = false,
  isPostponedNoDate = false,
  className,
}: UpcomingEventCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Shared spotlight & 3D tilt hook
  const { ref: cardRef, isHoverSupported, prefersReducedMotion } = useCardSpotlight<HTMLElement>({
    maxTilt: 5,
    perspective: 900,
  });

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    isPast: boolean;
  } | null>(null);

  useEffect(() => {
    if (!targetUtcIso || isPostponedNoDate || isOngoing) return;

    const calculateTime = () => {
      const target = new Date(targetUtcIso).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);

      setTimeLeft({ days, hours, minutes, isPast: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, [targetUtcIso, isPostponedNoDate, isOngoing]);

  // Lightbox Focus Trapping and Escape Key Listener
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus close button on open
    setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      triggerRef.current?.focus();
    };
  }, [lightboxOpen]);

  const action = getRegistrationAction(event, status);
  const formattedDate = isPostponedNoDate ? "Date to be announced" : formatEventDate(event.startDate || event.date);
  const formattedTime = isPostponedNoDate ? null : formatEventTimeRange(event.startTime, event.endTime);
  const isPlaceholder = event.id.startsWith("evt-placeholder-") || Boolean((event as any).isPlaceholder);

  // Determine button label adhering strictly to rule: fee displayed ONLY on button
  let buttonLabel = action.label;
  if (action.type === "onsite") {
    const fee = typeof event.fee === "number" ? event.fee : 0;
    buttonLabel = fee > 0 ? `Register · ₹${fee}` : "Register for Free";
  }

  // Check if poster is wide / landscape
  const isLandscape = Boolean(
    event.posterWidth &&
    event.posterHeight &&
    event.posterWidth / event.posterHeight > 1.15
  );

  const posterImageSrc = event.coverImage || event.posterUrl;

  // Status badge config
  const statusBadge = (() => {
    if (status.lifecycle === "cancelled") {
      return { text: "Cancelled", variant: "rose", className: "bg-rose-500/10 text-rose-400 border border-rose-500/30" };
    }
    if (status.lifecycle === "postponed") {
      return { text: "Postponed", variant: "amber", className: "bg-amber-500/10 text-amber-400 border border-amber-500/30" };
    }
    if (status.lifecycle === "completed") {
      return { text: "Completed", variant: "slate", className: "bg-foundation-slate/60 text-typo-gray border border-foundation-slate" };
    }
    if (status.lifecycle === "ongoing") {
      return { text: "Ongoing", variant: "emerald", className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" };
    }
    if (status.registration === "open" || status.registration === "external") {
      return { text: "Registration Open", variant: "emerald", className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" };
    }
    if (status.registration === "sold-out") {
      return { text: "Sold Out", variant: "amber", className: "bg-amber-500/10 text-amber-400 border border-amber-500/30" };
    }
    if (status.registration === "closed") {
      return { text: "Registration Closed", variant: "amber", className: "bg-amber-500/10 text-amber-400 border border-amber-500/30" };
    }
    return { text: "Upcoming", variant: "cyan", className: "bg-brand-blue/20 text-brand-cyan border border-brand-blue/40" };
  })();

  return (
    <>
      <article
        ref={cardRef as any}
        className={cn(
          "group relative rounded-2xl bg-foundation-dark/90 p-4 sm:p-5 md:p-6 transition-all duration-300 flex flex-col md:flex-row gap-5 md:gap-7 items-stretch",
          isNearest
            ? "border border-brand-cyan/50 shadow-[0_0_35px_rgba(56,189,248,0.14)]"
            : "border border-foundation-slate/70 hover:border-brand-cyan/40 hover:shadow-[0_0_30px_rgba(56,189,248,0.1)]",
          className
        )}
      >
        {/* Dynamic Spotlight Border that follows cursor */}
        <SpotlightBorder radiusClass="rounded-2xl" />

        {/* Poster Column: 40% desktop width (up to 45% for landscape), max-h ~480px. Mobile: max-h ~320px. */}
        <div
          className={cn(
            "w-full md:shrink-0 flex items-center justify-center overflow-hidden rounded-xl bg-foundation-darkest/60 border border-foundation-slate/60",
            isLandscape ? "md:w-[44%] lg:w-[45%] max-w-[480px]" : "md:w-[38%] lg:w-[40%] max-w-[420px]"
          )}
        >
          {posterImageSrc ? (
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label={`View full size poster for ${event.title}`}
              className="group/poster relative w-full h-full flex items-center justify-center cursor-zoom-in text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan rounded-xl overflow-hidden [perspective:900px]"
            >
              {/* 3D Tilt Container for Poster with smooth transition */}
              <div
                className="relative w-full h-full flex items-center justify-center transition-transform duration-400 ease-out will-change-transform"
                style={{
                  transform:
                    isHoverSupported && !prefersReducedMotion
                      ? "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) scale(var(--poster-scale, 1))"
                      : "none",
                }}
              >
                <EventPoster
                  src={posterImageSrc}
                  alt={event.title}
                  posterWidth={event.posterWidth}
                  posterHeight={event.posterHeight}
                  maxHeight={480}
                  priority={isNearest}
                  interactive={false}
                  className="w-full h-full max-h-[320px] md:max-h-[480px] transition-transform duration-500 ease-out [media(hover:hover)]:group-hover/poster:scale-[1.04]"
                />

                {/* Soft Glare Highlight at Pointer (overlay blend, opacity up to 0.25) */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300 opacity-0 [media(hover:hover)_and_(pointer:fine)]:group-hover/poster:opacity-100 mix-blend-overlay motion-reduce:hidden"
                  style={{
                    background:
                      "radial-gradient(circle 280px at var(--mx, 50%) var(--my, 50%), rgba(255, 255, 255, 0.25), transparent 70%)",
                  }}
                />
              </div>

              {/* Expand Affordance on hover/focus (Touch-safe: visible via tap or active) */}
              <div className="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded-lg bg-foundation-darkest/85 backdrop-blur-md border border-foundation-slate/80 text-typo-white text-[11px] font-mono flex items-center gap-1.5 opacity-0 group-hover/poster:opacity-100 group-focus-visible/poster:opacity-100 transition-opacity duration-300 shadow-lg pointer-events-none motion-reduce:transition-none">
                <Maximize2 className="w-3.5 h-3.5 text-brand-cyan" />
                <span>Expand</span>
              </div>
            </button>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center rounded-xl overflow-hidden">
              <EventPoster
                alt={event.title}
                posterWidth={event.posterWidth}
                posterHeight={event.posterHeight}
                maxHeight={480}
                priority={isNearest}
                className="w-full h-full max-h-[320px] md:max-h-[480px]"
              />
            </div>
          )}
        </div>

        {/* Details Column: Fills remaining width (~55-60%) */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1 space-y-4">
          {/* Top Row: Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {isNearest && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-cyan/15 border border-brand-cyan/40 text-[10px] font-mono font-bold text-brand-cyan tracking-wider uppercase">
                <Sparkles className="w-3 h-3 text-brand-cyan" />
                NEXT
              </span>
            )}

            {isPlaceholder && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono text-amber-300 font-semibold uppercase tracking-wider">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                [Development Placeholder]
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-foundation-slate/50 border border-foundation-slate/80 text-[11px] font-mono text-brand-cyan uppercase tracking-wider">
              <Tag className="w-3 h-3" />
              {event.category}
            </span>

            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider",
                statusBadge.className
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  statusBadge.variant === "emerald" && "bg-emerald-400",
                  statusBadge.variant === "amber" && "bg-amber-400",
                  statusBadge.variant === "rose" && "bg-rose-400",
                  statusBadge.variant === "cyan" && "bg-brand-cyan",
                  statusBadge.variant === "slate" && "bg-typo-gray"
                )}
              />
              {statusBadge.text}
            </span>
          </div>

          {/* Middle: Title & Description */}
          <div className="space-y-2">
            <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-typo-white tracking-tight leading-tight">
              <Link
                href={`/events/${event.slug}`}
                className="hover:text-brand-cyan transition-colors focus-visible:outline-none focus-visible:underline"
              >
                {event.title}
              </Link>
            </h3>

            {event.shortDescription && (
              <p className="font-sans text-xs sm:text-sm text-typo-gray leading-relaxed line-clamp-3">
                {event.shortDescription}
              </p>
            )}
          </div>

          {/* Meta Details Row: Date, Time, Venue */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-sans text-typo-gray pt-1 border-t border-foundation-slate/40">
            <div className="flex items-center gap-1.5 text-typo-white">
              <Calendar className="w-4 h-4 text-brand-cyan shrink-0" />
              <span>{formattedDate}</span>
            </div>

            {formattedTime && (
              <div className="flex items-center gap-1.5 text-typo-gray">
                <Clock className="w-4 h-4 text-brand-cyan/70 shrink-0" />
                <span>{formattedTime}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-typo-gray truncate max-w-full sm:max-w-[280px]">
              <MapPin className="w-4 h-4 text-brand-cyan/70 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>

          {/* Bottom Bar: Countdown or Status + Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Status / Countdown Indicator */}
            <div className="flex items-center gap-2">
              {isPostponedNoDate ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-typo-gray">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Date to be announced
                </span>
              ) : isOngoing ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Happening now
                </span>
              ) : timeLeft && !timeLeft.isPast ? (
                <span className="inline-flex items-center gap-2 text-xs font-mono text-brand-cyan">
                  <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
                  <span>
                    Starts in{" "}
                    <strong className="text-typo-white font-semibold">
                      {timeLeft.days > 0 ? `${timeLeft.days}d ` : ""}
                      {timeLeft.hours}h {timeLeft.minutes}m
                    </strong>
                  </span>
                </span>
              ) : (
                <span className="text-xs font-mono text-typo-gray">
                  Schedule pending
                </span>
              )}
            </div>

            {/* Action CTAs */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              {!isPostponedNoDate && action.type !== "disabled" && (
                <>
                  {action.type === "external" ? (
                    <a
                      href={action.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan hover:opacity-95 text-typo-white text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>{buttonLabel}</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>
                  ) : action.type === "onsite" ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setModalOpen(true)}
                      className="gap-2 text-xs font-semibold"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>{buttonLabel}</span>
                    </Button>
                  ) : null}
                </>
              )}

              <Link
                href={`/events/${event.slug}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-typo-gray hover:text-brand-cyan transition-colors"
              >
                <span>Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </article>

      {/* Lightbox Modal: Natural Proportions, Accessible, Fit Inside Viewport */}
      {lightboxOpen && posterImageSrc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Full size poster view for ${event.title}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 md:p-10 transition-opacity motion-reduce:transition-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxOpen(false);
          }}
        >
          {/* Close Button */}
          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-2.5 rounded-full bg-foundation-dark/80 hover:bg-foundation-dark text-typo-white border border-foundation-slate/80 hover:border-brand-cyan transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan"
            aria-label="Close poster view"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Natural Proportions Lightbox Image Container */}
          <div
            className="relative max-w-[92vw] max-h-[88vh] flex items-center justify-center overflow-hidden rounded-xl border border-foundation-slate/40 shadow-2xl bg-foundation-darkest"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={posterImageSrc}
              alt={event.title}
              className="max-w-[92vw] max-h-[88vh] w-auto h-auto object-contain select-none"
            />
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {action.type === "onsite" && modalOpen && (
        <EventRegistrationModal
          event={event}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

// Backward-compatibility alias
export const NextEventCard = UpcomingEventCard;
