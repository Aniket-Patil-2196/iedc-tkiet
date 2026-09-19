import React from "react";
import Link from "next/link";
import { IEvent } from "@/types/content";
import {
  getEventStatusInfo,
  formatEventDate,
  formatEventTimeRange,
} from "@/lib/utils/event-status";
import { Calendar, MapPin, ArrowRight, Tag, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: IEvent;
  isFeatured?: boolean;
}

export function EventCard({ event, isFeatured = false }: EventCardProps) {
  const statusInfo = getEventStatusInfo(event);
  const formattedDate = formatEventDate(event.startDate || event.date);
  const formattedTime = formatEventTimeRange(event.startTime, event.endTime);

  return (
    <article
      className={cn(
        "rounded-2xl bg-foundation-dark border transition-all duration-300 flex flex-col justify-between overflow-hidden group",
        isFeatured
          ? "border-brand-blue/40 shadow-[0_0_30px_rgba(37,99,235,0.1)] p-8 sm:p-10"
          : "border-foundation-slate/80 hover:border-brand-blue/50 p-6 sm:p-8"
      )}
    >
      <div className="space-y-4">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foundation-slate/60 border border-foundation-slate text-xs font-sans text-brand-cyan uppercase tracking-wider font-semibold">
            <Tag className="w-3 h-3" />
            {event.category}
          </span>

          {/* Status Badge: explicitly distinguishes automatic vs admin override */}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-semibold uppercase tracking-wider border",
              statusInfo.badgeClass
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", statusInfo.dotClass)} />
            {statusInfo.label}
            {statusInfo.isOverride && (
              <span className="text-[9px] opacity-75 ml-0.5 tracking-tight font-normal">
                (Override)
              </span>
            )}
          </span>
        </div>

        {/* Title */}
        <h3
          className={cn(
            "font-display font-bold text-typo-white group-hover:text-brand-cyan transition-colors leading-tight",
            isFeatured ? "text-2xl sm:text-3xl md:text-4xl" : "text-xl sm:text-2xl"
          )}
        >
          <Link href={`/events/${event.slug}`}>{event.title}</Link>
        </h3>

        {/* Short Description */}
        <p className="font-sans text-sm sm:text-base text-typo-gray leading-relaxed">
          {event.shortDescription || event.summary}
        </p>

        {/* Logistics Metadata */}
        <div className="space-y-2 pt-2 text-xs font-sans text-typo-gray">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-cyan shrink-0" />
            <span>{formattedDate}</span>
          </div>

          {formattedTime && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-cyan shrink-0" />
              <span>{formattedTime}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-cyan shrink-0" />
            <span>{event.venue}</span>
          </div>
        </div>
      </div>

      {/* Footer CTA Strip */}
      <div className="pt-6 mt-6 border-t border-foundation-slate/60 flex items-center justify-between">
        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-2 text-xs uppercase font-sans font-bold tracking-widest text-typo-white group-hover:text-brand-cyan transition-colors"
        >
          <span>View Event Details</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>

        {statusInfo.canRegister && (
          <span className="text-[11px] font-sans text-emerald-400 font-semibold uppercase tracking-wider">
            Registration Active
          </span>
        )}
      </div>
    </article>
  );
}
