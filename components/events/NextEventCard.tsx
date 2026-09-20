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
} from "lucide-react";
import { IEvent } from "@/types/content";
import { EventStatusResult, getRegistrationAction } from "@/lib/utils/event-status";
import { formatEventDate, formatEventTimeRange } from "@/lib/utils/event-status";
import { EventPoster } from "./EventPoster";
import { EventRegistrationModal } from "./EventRegistrationModal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface NextEventCardProps {
  event: IEvent;
  status: EventStatusResult;
  targetUtcIso?: string | null;
  className?: string;
}

export function NextEventCard({
  event,
  status,
  targetUtcIso,
  className,
}: NextEventCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    isPast: boolean;
  } | null>(null);

  useEffect(() => {
    if (!targetUtcIso) return;

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
  }, [targetUtcIso]);

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
  const formattedDate = formatEventDate(event.startDate || event.date);
  const formattedTime = formatEventTimeRange(event.startTime, event.endTime);
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

  return (
    <>
      <article
        className={cn(
          "group relative rounded-2xl bg-foundation-dark/90 border border-foundation-slate/70 p-4 sm:p-5 md:p-6 transition-all duration-300 hover:border-brand-cyan/40 hover:shadow-[0_0_35px_rgba(56,189,248,0.12)] flex flex-col md:flex-row gap-5 md:gap-7 items-stretch",
          className
        )}
      >
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
              className="group/poster relative w-full h-full flex items-center justify-center cursor-zoom-in text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan rounded-xl overflow-hidden"
            >
              <EventPoster
                src={posterImageSrc}
                alt={event.title}
                posterWidth={event.posterWidth}
                posterHeight={event.posterHeight}
                maxHeight={480}
                priority
                interactive
                className="w-full h-full max-h-[320px] md:max-h-[480px]"
              />

              {/* Expand Affordance on hover/focus (Touch-safe: visible via tap or active) */}
              <div className="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded-lg bg-foundation-darkest/85 backdrop-blur-md border border-foundation-slate/80 text-typo-white text-[11px] font-mono flex items-center gap-1.5 opacity-0 group-hover/poster:opacity-100 group-focus-visible/poster:opacity-100 transition-opacity shadow-lg pointer-events-none motion-reduce:transition-none">
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
                priority
                className="w-full h-full max-h-[320px] md:max-h-[480px]"
              />
            </div>
          )}
        </div>

        {/* Details Column: Fills remaining width (~55-60%) */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1 space-y-4">
          {/* Top Row: Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {isPlaceholder && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono text-amber-300 font-semibold uppercase tracking-wider">
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
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold border",
                status.lifecycle === "ongoing"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : status.registration === "open"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : status.registration === "sold-out"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : "bg-brand-blue/15 text-brand-cyan border-brand-blue/30"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  status.lifecycle === "ongoing" || status.registration === "open"
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-brand-cyan"
                )}
              />
              {status.lifecycle === "ongoing"
                ? "Ongoing"
                : status.registration === "open"
                ? "Registration Open"
                : status.registration === "sold-out"
                ? "Sold Out"
                : "Upcoming"}
            </span>
          </div>

          {/* Title & Short Description */}
          <div className="space-y-2">
            <h3 className="font-display font-bold text-xl sm:text-2xl lg:text-3xl text-typo-white tracking-tight leading-snug line-clamp-2">
              <Link
                href={`/events/${event.slug}`}
                className="hover:text-brand-cyan transition-colors"
              >
                {event.title}
              </Link>
            </h3>

            <p className="font-sans text-xs sm:text-sm text-typo-gray line-clamp-2 leading-relaxed">
              {event.shortDescription || event.summary || event.description}
            </p>
          </div>

          {/* Single Row of Meta (date · time · venue) */}
          <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1.5 text-xs font-sans text-typo-gray pt-1">
            <span className="inline-flex items-center gap-1.5 text-typo-white font-medium">
              <Calendar className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
              <span>{formattedDate}</span>
            </span>

            {formattedTime && (
              <>
                <span className="text-foundation-slate select-none">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-typo-gray/70 shrink-0" />
                  <span>{formattedTime}</span>
                </span>
              </>
            )}

            <span className="text-foundation-slate select-none">·</span>
            <span className="inline-flex items-center gap-1.5 truncate max-w-[220px] sm:max-w-[320px]">
              <MapPin className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
              <span className="truncate">{event.venue}</span>
            </span>
          </div>

          {/* Inline Countdown & Actions */}
          <div className="pt-3 border-t border-foundation-slate/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Compact inline countdown */}
            <div className="text-xs font-mono">
              {timeLeft && !timeLeft.isPast ? (
                <span className="inline-flex items-center gap-2 text-brand-cyan font-medium">
                  <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping" />
                  <span>
                    Starts in {timeLeft.days}d {String(timeLeft.hours).padStart(2, "0")}h{" "}
                    {String(timeLeft.minutes).padStart(2, "0")}m
                  </span>
                </span>
              ) : status.lifecycle === "ongoing" ? (
                <span className="inline-flex items-center gap-2 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Event In Progress</span>
                </span>
              ) : (
                <span className="text-typo-gray/70">Campus Event Schedule</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              {action.type === "external" ? (
                <a
                  href={action.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue text-typo-white font-sans text-xs font-semibold hover:bg-brand-blue/90 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>{action.label}</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              ) : action.type === "onsite" ? (
                <Button
                  onClick={() => setModalOpen(true)}
                  variant="primary"
                  className="py-2 px-4 text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>{buttonLabel}</span>
                </Button>
              ) : (
                <Button
                  disabled
                  variant="secondary"
                  className="py-2 px-3.5 text-xs font-medium cursor-not-allowed opacity-60"
                >
                  <span>{action.label}</span>
                </Button>
              )}

              <Link
                href={`/events/${event.slug}`}
                className="inline-flex items-center gap-1 text-xs font-sans font-semibold text-typo-gray hover:text-brand-cyan transition-colors"
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
            {/* Plain img used to guarantee zero artificial cropping and unconstrained natural proportions */}
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
