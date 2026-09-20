"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Ticket,
  Calendar,
  Clock,
  Coins,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Search,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EventRegistrationModal } from "@/components/events/EventRegistrationModal";
import { formatDateIST } from "@/lib/utils/date-ist";

interface EventRegistrationSectionProps {
  event: {
    id: string;
    title: string;
    startDate: string;
    venue: string;
    fee?: number;
    capacity?: number | null;
    registrationDeadline?: string | Date;
    registrationOpen?: boolean;
    registrationUrl?: string;
    statusOverride?: string | null;
  };
  statusLabel: string;
}

export function EventRegistrationSection({
  event,
  statusLabel,
}: EventRegistrationSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const feeRupees = event.fee !== undefined && event.fee >= 0 ? Math.floor(event.fee) : 0;
  const isFree = feeRupees === 0;

  // Deadline check
  const isDeadlinePassed = event.registrationDeadline
    ? Date.now() > new Date(event.registrationDeadline).getTime()
    : false;

  const isClosed =
    event.registrationOpen === false ||
    statusLabel === "Registration Closed" ||
    isDeadlinePassed;

  const isCancelled = statusLabel === "Cancelled";

  return (
    <div className="p-8 rounded-2xl bg-foundation-dark border border-brand-blue/40 shadow-[0_0_35px_rgba(37,99,235,0.12)] space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-sans tracking-widest text-brand-cyan font-bold block">
            Participation
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-brand-blue/20 text-brand-cyan border border-brand-cyan/30 text-xs font-mono font-semibold">
            {isFree ? "Free Entry" : `₹${feeRupees}`}
          </span>
        </div>
        <h3 className="font-display text-xl font-bold text-typo-white">
          Registration Desk
        </h3>
      </div>

      {/* Deadline or Capacity Notices */}
      {(event.registrationDeadline || event.capacity) && (
        <div className="space-y-2 text-xs font-sans">
          {event.registrationDeadline && (
            <div className="flex items-center gap-2 text-typo-gray">
              <Clock className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
              <span>
                Deadline: <span className="text-typo-white font-medium">{formatDateIST(event.registrationDeadline)}</span>
              </span>
            </div>
          )}
          {event.capacity && (
            <div className="flex items-center gap-2 text-typo-gray">
              <Ticket className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
              <span>
                Capacity: <span className="text-typo-white font-medium">{event.capacity} total seats</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* State Transitions */}
      {isCancelled ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>This event has been cancelled by the organizing committee.</span>
          </div>
          <Button disabled variant="secondary" className="w-full">
            Event Cancelled
          </Button>
        </div>
      ) : isClosed ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {isDeadlinePassed
                ? "The registration deadline for this event has passed."
                : "Registrations for this event are currently closed."}
            </span>
          </div>
          <Button disabled variant="secondary" className="w-full">
            Registration Closed
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Button
            onClick={() => setModalOpen(true)}
            variant="primary"
            className="w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(37,99,235,0.4)]"
          >
            <Ticket className="w-4 h-4" />
            <span>{isFree ? "Register for Free" : `Register Now • ₹${feeRupees}`}</span>
          </Button>

          {event.registrationUrl && (
            <div className="pt-2 text-center">
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-typo-gray hover:text-brand-cyan transition-colors inline-flex items-center gap-1.5"
              >
                <span>Or submit via Google Form</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Find My Receipt Link */}
      <div className="pt-3 border-t border-foundation-slate/60 flex items-center justify-between text-xs font-sans">
        <Link
          href="/receipt/find"
          className="text-typo-gray hover:text-brand-cyan transition-colors flex items-center gap-1.5 group"
        >
          <Search className="w-3.5 h-3.5 text-brand-cyan group-hover:scale-110 transition-transform" />
          <span>Find My Receipt</span>
        </Link>
        <span className="text-[11px] text-typo-gray/60 font-mono">IEDC TKIET</span>
      </div>

      <div className="pt-2 border-t border-foundation-slate/60 text-[11px] font-sans text-typo-gray flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-brand-cyan" />
        <span>Official IEDC TKIET Gateway • 256-bit SSL</span>
      </div>

      {/* Registration Modal Dialog */}
      <EventRegistrationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        event={{
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          venue: event.venue,
          fee: event.fee,
          capacity: event.capacity,
          registrationDeadline: event.registrationDeadline,
        }}
      />
    </div>
  );
}
