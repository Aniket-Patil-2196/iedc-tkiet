"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.85 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export interface WhatsAppGroupJoinCardProps {
  groupLink?: string | null;
  qrUrl?: string | null;
  className?: string;
  /** Compact layout for tight panels / modals */
  compact?: boolean;
}

/**
 * Join WhatsApp group CTA. Renders nothing when groupLink is blank.
 */
export function WhatsAppGroupJoinCard({
  groupLink,
  qrUrl,
  className,
  compact = false,
}: WhatsAppGroupJoinCardProps) {
  const link = typeof groupLink === "string" ? groupLink.trim() : "";
  if (!link) return null;

  const qr = typeof qrUrl === "string" ? qrUrl.trim() : "";

  return (
    <div
      className={cn(
        "rounded-xl bg-foundation-slate/40 border border-foundation-slate text-left",
        compact ? "p-3.5 space-y-3" : "p-4 space-y-3.5",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
          <WhatsAppIcon className="w-[18px] h-[18px]" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="text-xs font-semibold text-typo-white leading-snug">
            Join the event WhatsApp group for updates
          </p>
          <p className="text-[11px] text-typo-gray leading-relaxed">
            Get reminders, schedule changes, and announcements from the organizers.
          </p>
        </div>
      </div>

      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-sans text-xs font-semibold transition-all"
      >
        <WhatsAppIcon className="w-3.5 h-3.5" />
        <span>Join WhatsApp Group</span>
        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
      </a>

      {qr && (
        <div className="flex flex-col items-center gap-2 pt-1">
          <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-xl overflow-hidden border border-foundation-slate bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr}
              alt="WhatsApp group QR code"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-typo-gray">
            Or scan QR to join
          </span>
        </div>
      )}
    </div>
  );
}
