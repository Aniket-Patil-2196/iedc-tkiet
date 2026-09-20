"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Ticket, ExternalLink, Tag } from "lucide-react";
import { IEvent } from "@/types/content";
import { EventStatusResult, getRegistrationAction } from "@/lib/utils/event-status";
import { formatEventDate } from "@/lib/utils/event-status";
import { EventPoster } from "./EventPoster";
import { EventRegistrationModal } from "./EventRegistrationModal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface UpcomingEventRowProps {
  event: IEvent;
  status: EventStatusResult;
}

export function UpcomingEventRow({ event, status }: UpcomingEventRowProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const action = getRegistrationAction(event, status);
  const formattedDate = formatEventDate(event.startDate || event.date);

  let buttonLabel = action.label;
  if (action.type === "onsite") {
    const fee = typeof event.fee === "number" ? event.fee : 0;
    buttonLabel = fee > 0 ? `Register · ₹${fee}` : "Register for Free";
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-xl bg-foundation-dark/70 border border-foundation-slate/60 hover:border-brand-cyan/30 transition-all duration-200">
        {/* Left: Thumbnail (72-96px) + Date & Info */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
          {/* Thumbnail */}
          <div className="w-18 h-18 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-foundation-darkest border border-foundation-slate/60">
            <EventPoster
              src={event.coverImage || event.posterUrl}
              alt={event.title}
              posterWidth={event.posterWidth}
              posterHeight={event.posterHeight}
              interactive={false}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono uppercase tracking-wider">
              <span className="text-brand-cyan font-semibold">{formattedDate}</span>
              <span className="text-foundation-slate">·</span>
              <span className="inline-flex items-center gap-1 text-typo-gray">
                <Tag className="w-2.5 h-2.5" />
                {event.category}
              </span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded font-semibold",
                  status.registration === "open"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-foundation-slate/40 text-typo-gray"
                )}
              >
                {status.registration === "open" ? "Open" : "Upcoming"}
              </span>
            </div>

            <h4 className="font-display font-bold text-sm sm:text-base text-typo-white truncate hover:text-brand-cyan transition-colors">
              <Link href={`/events/${event.slug}`}>{event.title}</Link>
            </h4>

            <p className="text-xs text-typo-gray truncate">{event.venue}</p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          {action.type === "external" ? (
            <a
              href={action.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-blue text-typo-white font-sans text-xs font-semibold hover:bg-brand-blue/90 shadow-sm transition-all"
            >
              <Ticket className="w-3 h-3" />
              <span>{action.label}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </a>
          ) : action.type === "onsite" ? (
            <Button
              onClick={() => setModalOpen(true)}
              variant="primary"
              className="py-1.5 px-3 text-xs font-semibold flex items-center gap-1 shadow-sm"
            >
              <Ticket className="w-3 h-3" />
              <span>{buttonLabel}</span>
            </Button>
          ) : (
            <span className="text-[11px] font-mono text-typo-gray/60 px-2 py-1">
              {action.label}
            </span>
          )}

          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-1 text-xs font-sans font-semibold text-typo-gray hover:text-brand-cyan transition-colors px-2 py-1"
          >
            <span>Details</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

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
