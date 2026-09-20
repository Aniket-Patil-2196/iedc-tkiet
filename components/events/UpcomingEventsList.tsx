"use client";

import React, { useState } from "react";
import { UpcomingEventCard } from "./NextEventCard";
import { IEvent } from "@/types/content";
import { EventStatusResult } from "@/lib/utils/event-status";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface UpcomingItem {
  event: IEvent;
  status: EventStatusResult;
  startUtcIso?: string | null;
  isNearest: boolean;
  isOngoing: boolean;
  isPostponedNoDate: boolean;
}

interface UpcomingEventsListProps {
  items: UpcomingItem[];
}

const DEFAULT_DISPLAY_COUNT = 3;

export function UpcomingEventsList({ items }: UpcomingEventsListProps) {
  const [expanded, setExpanded] = useState(false);

  if (!items || items.length === 0) return null;

  const visibleItems = expanded ? items : items.slice(0, DEFAULT_DISPLAY_COUNT);
  const remainingCount = items.length - DEFAULT_DISPLAY_COUNT;

  return (
    <div className="space-y-6">
      {/* Cards stack with consistent gap */}
      <div className="space-y-6">
        {visibleItems.map((item) => (
          <UpcomingEventCard
            key={item.event.id || item.event.slug}
            event={item.event}
            status={item.status}
            targetUtcIso={item.startUtcIso}
            isNearest={item.isNearest}
            isOngoing={item.isOngoing}
            isPostponedNoDate={item.isPostponedNoDate}
          />
        ))}
      </div>

      {/* Show N more / Show less Button */}
      {items.length > DEFAULT_DISPLAY_COUNT && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-foundation-dark/80 hover:bg-foundation-dark border border-brand-cyan/30 hover:border-brand-cyan text-xs font-mono tracking-wider uppercase text-typo-white hover:text-brand-cyan transition-all shadow-sm group"
          >
            {expanded ? (
              <>
                <span>Show less</span>
                <ChevronUp className="w-3.5 h-3.5 text-brand-cyan group-hover:-translate-y-0.5 transition-transform" />
              </>
            ) : (
              <>
                <span>Show {remainingCount} more upcoming {remainingCount === 1 ? "event" : "events"}</span>
                <ChevronDown className="w-3.5 h-3.5 text-brand-cyan group-hover:translate-y-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
