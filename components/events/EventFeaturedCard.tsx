"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Ticket,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { IEvent } from "@/types/content";
import {
  EventStatusResult,
  getRegistrationAction,
  formatEventDate,
  formatEventTimeRange,
  isDevelopmentPlaceholder,
} from "@/lib/utils/event-status";
import { EventPoster } from "@/components/events/EventPoster";
import { EventCountdown } from "@/components/events/EventCountdown";
import { EventRegistrationModal } from "@/components/events/EventRegistrationModal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface EventFeaturedCardProps {
  event: IEvent;
  status: EventStatusResult;
  targetUtcIso: string | null;
}

export function EventFeaturedCard({
  event,
  status,
  targetUtcIso,
}: EventFeaturedCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const isPlaceholder = isDevelopmentPlaceholder(event);
  const action = getRegistrationAction(event, status);
  const formattedDate = formatEventDate(event.startDate || event.date);
  const formattedTime = formatEventTimeRange(event.startTime, event.endTime);
  const posterSrc = event.coverImage || event.posterUrl || null;
  const feeRupees =
    event.fee !== undefined && event.fee >= 0 ? Math.floor(event.fee) : 0;
  const isFree = feeRupees === 0;

  return (
    <div className="relative rounded-3xl bg-foundation-dark/90 border border-brand-blue/30 shadow-[0_0_50px_rgba(37,99,235,0.14)] overflow-hidden">
      {/* Subtle top accent highlight */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/60 to-transparent pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 p-6 sm:p-8 lg:p-10">
        {/* Left Column: Poster Showcase (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="relative w-full aspect-[4/5] sm:aspect-[4/5] max-h-[460px] mx-auto rounded-2xl overflow-hidden shadow-2xl">
            <EventPoster
              src={posterSrc}
              alt={event.title}
              aspectRatio="portrait"
              priority={true}
              className="w-full h-full"
            />

            {/* Poster Corner Status Badge */}
            <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foundation-darkest/80 backdrop-blur-md border border-brand-cyan/40 text-[11px] font-mono uppercase tracking-wider text-brand-cyan font-bold shadow-lg">
                <Sparkles className="w-3 h-3 text-brand-cyan" />
                Featured Showcase
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Editorial Intelligence (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Development Placeholder Notice */}
              {isPlaceholder && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-[11px] font-mono uppercase tracking-wider text-amber-300 font-semibold">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  [Development Placeholder]
                </span>
              )}

              {/* Category Pill */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foundation-slate/60 border border-foundation-slate text-xs font-sans text-brand-cyan font-medium">
                <Tag className="w-3 h-3" />
                {event.category || "Campus Event"}
              </span>

              {/* Status Pill */}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider font-semibold border",
                  status.lifecycle === "ongoing"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : status.registration === "open"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : status.registration === "sold-out"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-brand-blue/20 text-brand-cyan border-brand-blue/40"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    status.lifecycle === "ongoing" || status.registration === "open"
                      ? "bg-emerald-400 animate-ping"
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

              {/* Fee Pill */}
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-foundation-slate/40 border border-foundation-slate/80 text-xs font-mono text-typo-white font-medium ml-auto">
                {isFree ? "Free Entry" : `Entry Fee: ₹${feeRupees}`}
              </span>
            </div>

            {/* Event Title */}
            <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-typo-white tracking-tight leading-tight hover:text-brand-cyan transition-colors">
              <Link href={`/events/${event.slug}`}>{event.title}</Link>
            </h2>

            {/* Short Description */}
            <p className="font-sans text-sm sm:text-base text-typo-gray leading-relaxed line-clamp-3">
              {event.shortDescription || event.summary || event.description}
            </p>

            {/* Logistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-sans">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-foundation-dark/60 border border-foundation-slate/60 text-typo-gray">
                <Calendar className="w-4 h-4 text-brand-cyan shrink-0" />
                <span className="truncate">
                  <span className="text-typo-white font-medium">{formattedDate}</span>
                </span>
              </div>

              {formattedTime && (
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-foundation-dark/60 border border-foundation-slate/60 text-typo-gray">
                  <Clock className="w-4 h-4 text-brand-cyan shrink-0" />
                  <span className="truncate">
                    <span className="text-typo-white font-medium">{formattedTime}</span>
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-foundation-dark/60 border border-foundation-slate/60 text-typo-gray sm:col-span-2">
                <MapPin className="w-4 h-4 text-brand-cyan shrink-0" />
                <span className="truncate">
                  <span className="text-typo-white font-medium">
                    {event.venue || "TKIET Campus, Warananagar"}
                  </span>
                  {event.isOnline && (
                    <span className="ml-2 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-brand-blue/30 text-brand-cyan border border-brand-cyan/30">
                      Virtual Option
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Countdown & CTA Section */}
          <div className="space-y-5 pt-4 border-t border-foundation-slate/60">
            {/* Live Countdown Ticker */}
            {targetUtcIso && (
              <div className="flex items-center justify-between flex-wrap gap-4">
                <EventCountdown targetUtcIso={targetUtcIso} />
                {event.capacity && (
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-typo-gray block">
                      Capacity
                    </span>
                    <span className="font-mono text-xs text-typo-white font-semibold">
                      {event.capacity} total seats
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Primary Registration Action */}
              {action.type === "external" ? (
                <a
                  href={action.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-blue text-typo-white font-sans text-sm font-semibold hover:bg-brand-blue/90 shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-all"
                >
                  <Ticket className="w-4 h-4" />
                  <span>{action.label}</span>
                  <ExternalLink className="w-4 h-4 opacity-70" />
                </a>
              ) : action.type === "onsite" ? (
                <Button
                  onClick={() => setModalOpen(true)}
                  variant="primary"
                  className="flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(37,99,235,0.4)]"
                >
                  <Ticket className="w-4 h-4" />
                  <span>{action.label}</span>
                </Button>
              ) : (
                <Button
                  disabled
                  variant="secondary"
                  className="flex-1 py-3.5 text-sm font-semibold cursor-not-allowed opacity-60"
                >
                  <span>{action.label}</span>
                </Button>
              )}

              {/* Secondary Details Action */}
              <Link
                href={`/events/${event.slug}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-foundation-dark border border-foundation-slate hover:border-brand-cyan/50 text-typo-white hover:text-brand-cyan font-sans text-sm font-semibold transition-all group"
              >
                <span>View Event Details</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* On-site Registration Modal */}
      {action.type === "onsite" && (
        <EventRegistrationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          event={{
            id: event.id,
            title: event.title,
            startDate: event.startDate || event.date || "",
            venue: event.venue,
            fee: event.fee,
            capacity: event.capacity,
            registrationDeadline: event.registrationDeadline,
          }}
        />
      )}
    </div>
  );
}
