"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Share2,
  Check,
  ExternalLink,
  ShieldCheck,
  History,
  Users,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  EventStatusResult,
  RegistrationAction,
  getRegistrationAction,
} from "@/lib/utils/event-status";
import { EventRegistrationModal } from "@/components/events/EventRegistrationModal";
import { UpiRegistrationModal } from "@/components/events/UpiRegistrationModal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface EventRegistrationPanelProps {
  event: {
    id: string;
    slug: string;
    title: string;
    startDate: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    date?: string;
    venue: string;
    fee?: number;
    capacity?: number | null;
    registrationDeadline?: string | Date | null;
    registrationMode?: "external" | "onsite" | "none";
    registrationUrl?: string;
    isPlaceholder?: boolean;
    registrationOpen?: boolean;
    paymentMode?: "razorpay" | "manual_upi" | "free";
    upiId?: string | null;
    upiQrUrl?: string | null;
    installmentEnabled?: boolean;
    installmentPart1Amount?: number | null;
    installmentPart2Amount?: number | null;
  };
  status: EventStatusResult;
  paidCount: number;
  seatsRemaining: number | null;
  formattedDate: string;
  formattedTime?: string | null;
  formattedDeadline?: string | null;
  initialAction?: RegistrationAction;
}

export function EventRegistrationPanel({
  event,
  status,
  paidCount,
  seatsRemaining,
  formattedDate,
  formattedTime,
  formattedDeadline,
  initialAction,
}: EventRegistrationPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const action = initialAction || getRegistrationAction(event as any, status);

  const handleShare = async () => {
    if (typeof window === "undefined") return;

    const shareData = {
      title: `${event.title} — IEDC TKIET`,
      text: `Register for ${event.title} at IEDC TKIET Warananagar!`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("[Share API Error]", err);
        }
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("[Clipboard Error]", err);
    }
  };

  // 1. Concluded State: Subdued Recap Panel
  if (status.lifecycle === "completed") {
    return (
      <aside
        aria-label="Event Concluded Notice"
        className="rounded-xl bg-foundation-dark/90 border border-foundation-slate/70 p-4 md:p-5 space-y-4 shadow-lg"
      >
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-typo-gray font-semibold">
          <History className="w-4 h-4 text-brand-cyan" />
          <span>Event Archived</span>
        </div>

        <div className="space-y-1.5">
          <h3 className="font-display text-lg sm:text-xl font-bold text-typo-white">
            This Event Has Concluded
          </h3>
          <p className="font-sans text-xs text-typo-gray leading-relaxed">
            This edition concluded on{" "}
            <span className="text-typo-white font-medium">{formattedDate}</span>. Registrations and
            submissions are closed.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-foundation-darkest/60 border border-foundation-slate/50 space-y-1.5 text-xs font-sans text-typo-gray">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
            <span className="text-typo-white truncate">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
            <span className="text-typo-white truncate">{event.venue}</span>
          </div>
        </div>

        <div className="pt-1 space-y-2.5">
          <Link
            href="/events"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-typo-white font-sans text-xs font-semibold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            <Sparkles className="w-4 h-4 text-brand-cyan" />
            <span>Explore Upcoming Events</span>
          </Link>

          <button
            type="button"
            onClick={handleShare}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-foundation-dark border border-foundation-slate hover:border-brand-cyan/40 text-typo-white hover:text-brand-cyan font-sans text-xs font-medium transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Event Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Archive Link</span>
              </>
            )}
          </button>
        </div>
      </aside>
    );
  }

  // 2. Active / Upcoming / Ongoing State
  const feeRupees = event.fee !== undefined && event.fee > 0 ? Math.floor(event.fee) : 0;

  return (
    <aside
      aria-label="Event Registration and Logistics"
      className="relative rounded-xl bg-foundation-dark/90 border border-foundation-slate/70 p-4 md:p-5 space-y-4 shadow-lg overflow-hidden"
    >
      {/* Pricing Header */}
      <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-foundation-slate/50">
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-typo-gray">
            Registration Fee
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-extrabold text-typo-white">
              {feeRupees > 0 ? `₹${feeRupees}` : "Free"}
            </span>
            <span className="font-sans text-xs text-typo-gray">
              {feeRupees > 0 ? "per attendee / team" : "open registration"}
            </span>
          </div>
          {event.paymentMode === "manual_upi" && feeRupees > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-blue/30 text-brand-cyan border border-brand-cyan/40 font-semibold">
                UPI Payment
              </span>
              {event.installmentEnabled && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  2-Part Installment
                </span>
              )}
            </div>
          )}
        </div>

        {/* Capacity / Remaining Seats Status */}
        {event.capacity && seatsRemaining !== null && !event.isPlaceholder && (
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase tracking-wider text-typo-gray block">
              Availability
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded-full mt-1 border",
                seatsRemaining === 0
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  : seatsRemaining <= 10
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              )}
            >
              <Users className="w-3 h-3" />
              <span>{seatsRemaining === 0 ? "Sold Out" : `${seatsRemaining} left`}</span>
            </span>
          </div>
        )}
      </div>

      {/* Key Logistics */}
      <div className="space-y-3 text-xs font-sans">
        <div className="flex items-start gap-2.5 text-typo-gray">
          <Calendar className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" />
          <div>
            <span className="text-typo-white font-medium block">{formattedDate}</span>
            <span className="text-[11px] text-typo-gray/70">Indian Standard Time (IST)</span>
          </div>
        </div>

        {formattedTime && (
          <div className="flex items-center gap-2.5 text-typo-gray">
            <Clock className="w-4 h-4 text-brand-cyan shrink-0" />
            <span className="text-typo-white font-medium">{formattedTime}</span>
          </div>
        )}

        <div className="flex items-start gap-2.5 text-typo-gray">
          <MapPin className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" />
          <span className="text-typo-white font-medium">{event.venue}</span>
        </div>

        {formattedDeadline && (
          <div className="flex items-start gap-2.5 text-typo-gray pt-1 border-t border-foundation-slate/40">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 font-semibold block">
                Registration Deadline
              </span>
              <span className="text-xs text-typo-gray">{formattedDeadline}</span>
            </div>
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="space-y-3 pt-2">
        {action.type === "external" ? (
          <a
            href={action.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-typo-white font-sans text-xs sm:text-sm font-semibold transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            <Ticket className="w-4 h-4" />
            <span>{action.label}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        ) : action.type === "onsite" ? (
          <Button
            onClick={() => setModalOpen(true)}
            variant="primary"
            className="w-full py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            <Ticket className="w-4 h-4" />
            <span>{action.label}</span>
          </Button>
        ) : (
          <div className="space-y-1.5">
            <Button
              disabled
              variant="secondary"
              className="w-full py-3 text-xs sm:text-sm font-semibold cursor-not-allowed opacity-60"
            >
              <span>{action.label}</span>
            </Button>
            {action.reason && (
              <p className="font-sans text-[11px] text-typo-gray text-center">{action.reason}</p>
            )}
          </div>
        )}

        {/* Share Button with Native API or Clipboard Fallback */}
        <button
          type="button"
          onClick={handleShare}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-foundation-dark border border-foundation-slate hover:border-brand-cyan/40 text-typo-white hover:text-brand-cyan font-sans text-xs font-medium transition-all"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Event Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Event</span>
            </>
          )}
        </button>
      </div>

      {/* On-site mode receipt note */}
      {action.type === "onsite" && (
        <div className="pt-3 border-t border-foundation-slate/50 flex items-center gap-2 text-[11px] font-sans text-typo-gray/70">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
          <span>
            {event.paymentMode === "manual_upi"
              ? "Submit payment proof via UPI. Verified manually by admin with digital receipt."
              : "A digital receipt can be downloaded after payment confirmation."}
          </span>
        </div>
      )}

      {/* Onsite Checkout Modal - Razorpay or Manual UPI */}
      {action.type === "onsite" && (
        event.paymentMode === "manual_upi" ? (
          <UpiRegistrationModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            event={{
              id: event.id,
              title: event.title,
              startDate: event.startDate || event.date || "",
              venue: event.venue,
              fee: event.fee,
              upiId: event.upiId,
              upiQrUrl: event.upiQrUrl,
              installmentEnabled: event.installmentEnabled,
              installmentPart1Amount: event.installmentPart1Amount,
              installmentPart2Amount: event.installmentPart2Amount,
              capacity: event.capacity || undefined,
              registrationDeadline: event.registrationDeadline || undefined,
            }}
          />
        ) : (
          <EventRegistrationModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            event={{
              id: event.id,
              title: event.title,
              startDate: event.startDate || event.date || "",
              venue: event.venue,
              fee: event.fee,
              capacity: event.capacity || undefined,
              registrationDeadline: event.registrationDeadline || undefined,
            }}
          />
        )
      )}
    </aside>
  );
}
