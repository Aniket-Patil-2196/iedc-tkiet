"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Tag,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  History,
  X,
} from "lucide-react";
import { EventPoster } from "@/components/events/EventPoster";
import { cn } from "@/lib/utils";

export interface ArchiveEventItem {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  summary?: string;
  description: string;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  date?: string;
  venue: string;
  isOnline?: boolean;
  category: string;
  coverImage?: string;
  posterUrl?: string;
  posterWidth?: number;
  posterHeight?: number;
  formattedDate: string;
  formattedTime?: string | null;
  year: number;
}

interface EventArchiveProps {
  events: ArchiveEventItem[];
  className?: string;
}

// Starlight timeline item with progressive draw
function ArchiveTimelineItem({
  event,
  isLast,
}: {
  event: ArchiveEventItem;
  isLast: boolean;
}) {
  const itemRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={itemRef} className="relative flex items-start gap-4 sm:gap-6 group">
      {/* Galaxy timeline vertical thread & star node */}
      <div className="relative flex flex-col items-center self-stretch shrink-0 pt-2.5">
        {/* Star node (galaxy motif) */}
        <div
          className={cn(
            "relative z-10 w-2.5 h-2.5 rounded-full border-2 transition-all duration-500",
            inView
              ? "bg-brand-cyan border-foundation-darkest shadow-[0_0_10px_rgba(56,189,248,0.8)] scale-110"
              : "bg-foundation-slate border-foundation-slate scale-90 opacity-60"
          )}
        />

        {/* Thin vertical thread drawn progressively */}
        {!isLast && (
          <div
            className={cn(
              "w-px flex-1 bg-gradient-to-b from-brand-cyan/40 via-foundation-slate/50 to-foundation-slate/20 transition-all duration-700 origin-top",
              inView ? "scale-y-100 opacity-100" : "scale-y-0 opacity-20"
            )}
          />
        )}
      </div>

      {/* Slim Row Container */}
      <div className="flex-1 pb-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-foundation-dark/60 border border-foundation-slate/50 hover:border-brand-cyan/40 hover:bg-foundation-dark/80 transition-all duration-200">
          {/* Left: Thumbnail (80-96px) + Meta + Title */}
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
            {/* Small Thumbnail (80-96px) */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-foundation-darkest border border-foundation-slate/60">
              <div className="w-full h-full grayscale-0 opacity-100 [@media(hover:hover)]:grayscale [@media(hover:hover)]:opacity-85 [@media(hover:hover)]:group-hover:grayscale-0 [@media(hover:hover)]:group-hover:opacity-100 transition-all duration-300">
                <EventPoster
                  src={event.coverImage || event.posterUrl}
                  alt={event.title}
                  posterWidth={event.posterWidth}
                  posterHeight={event.posterHeight}
                  interactive={false}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Details */}
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono uppercase tracking-wider">
                <span className="text-brand-cyan font-semibold">
                  {event.formattedDate}
                </span>
                <span className="text-foundation-slate select-none">·</span>
                <span className="inline-flex items-center gap-1 text-typo-gray">
                  <Tag className="w-2.5 h-2.5" />
                  {event.category}
                </span>
              </div>

              <h4 className="font-display font-bold text-sm sm:text-base text-typo-white truncate hover:text-brand-cyan transition-colors">
                <Link href={`/events/${event.slug}`}>{event.title}</Link>
              </h4>

              <p className="text-xs text-typo-gray truncate">{event.venue}</p>
            </div>
          </div>

          {/* Right: "View recap →" link */}
          <div className="shrink-0 self-end sm:self-center pl-2">
            <Link
              href={`/events/${event.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-brand-cyan hover:text-white transition-colors group/link px-2.5 py-1.5 rounded-lg bg-foundation-slate/30 hover:bg-brand-blue/20"
            >
              <span>View recap</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventArchive({ events, className }: EventArchiveProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Extract distinct available years (sorted descending: 2026, 2025, 2024...)
  const availableYears = useMemo(() => {
    const yrSet = new Set<number>();
    events.forEach((e) => {
      if (e.year && !Number.isNaN(e.year)) {
        yrSet.add(e.year);
      }
    });
    return Array.from(yrSet).sort((a, b) => b - a);
  }, [events]);

  const currentYear = new Date().getFullYear();

  // Rule: Current year expanded, older years collapsed by default
  const [collapsedYears, setCollapsedYears] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    availableYears.forEach((yr) => {
      // Current year (or newest available year if no events for current year) is expanded (false); older collapsed (true)
      const isExpanded = yr === currentYear || yr === availableYears[0];
      initial[yr] = !isExpanded;
    });
    return initial;
  });

  const toggleYearCollapse = (year: number) => {
    setCollapsedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  // Distinct categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add("ALL");
    events.forEach((e) => {
      if (e.category) cats.add(e.category);
    });
    return Array.from(cats);
  }, [events]);

  // Conditional search & categories visibility rules:
  // - Search input only when > 8 past events
  // - Category pills only when > 1 category exists (excluding "ALL")
  const showSearch = events.length > 8;
  const showCategories = categories.length > 2;

  // Filter events
  const filteredEvents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return events.filter((e) => {
      if (selectedCategory !== "ALL" && e.category !== selectedCategory) {
        return false;
      }
      if (q) {
        const titleMatch = e.title?.toLowerCase().includes(q);
        const descMatch = (e.shortDescription || e.summary || e.description || "")
          .toLowerCase()
          .includes(q);
        const venueMatch = e.venue?.toLowerCase().includes(q);
        const catMatch = e.category?.toLowerCase().includes(q);
        return titleMatch || descMatch || venueMatch || catMatch;
      }
      return true;
    });
  }, [events, searchQuery, selectedCategory]);

  // Group filtered events by year
  const eventsByYear = useMemo(() => {
    const map = new Map<number, ArchiveEventItem[]>();

    filteredEvents.forEach((evt) => {
      const yr = evt.year;
      if (!map.has(yr)) {
        map.set(yr, []);
      }
      map.get(yr)!.push(evt);
    });

    const sortedYears = Array.from(map.keys()).sort((a, b) => b - a);
    return sortedYears.map((yr) => ({
      year: yr,
      events: map.get(yr)!,
    }));
  }, [filteredEvents]);

  if (!events || events.length === 0) return null;

  return (
    <section
      id="archive"
      aria-label="Past Events Archive"
      className={cn("space-y-6 pt-4", className)}
    >
      {/* Archive Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-foundation-slate/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs uppercase font-mono tracking-[0.2em] text-brand-cyan font-bold">
            <History className="w-3.5 h-3.5 text-brand-cyan" />
            <span>Institutional Repository</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-typo-white tracking-tight">
            Past Events Archive
          </h2>
          <p className="font-sans text-xs sm:text-sm text-typo-gray max-w-xl leading-relaxed">
            Archive of completed student hackathons, innovation conclaves, and technological workshops hosted by IEDC TKIET.
          </p>
        </div>

        {/* Total Events Count Badge */}
        <div className="shrink-0 flex items-center gap-2 px-3 py-1 rounded-full bg-foundation-slate/40 border border-foundation-slate text-xs font-mono text-typo-gray self-start md:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan/60" />
          <span>{events.length} {events.length === 1 ? "Event" : "Events"} Archived</span>
        </div>
      </div>

      {/* Conditional Search and Filters */}
      {(showSearch || showCategories) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Search Input (only when > 8 events) */}
          {showSearch && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-typo-gray" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search archive by topic, title, or venue..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-foundation-dark/80 border border-foundation-slate/60 text-typo-white placeholder:text-typo-gray/60 text-xs focus:outline-none focus:border-brand-cyan/60 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-typo-gray hover:text-typo-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Category Filter Pills (only when > 1 category exists) */}
          {showCategories && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider transition-all",
                    selectedCategory === cat
                      ? "bg-brand-blue text-typo-white font-semibold shadow-sm border border-brand-cyan/40"
                      : "bg-foundation-slate/40 text-typo-gray hover:text-typo-white hover:bg-foundation-slate/60 border border-foundation-slate/60"
                  )}
                >
                  {cat === "ALL" ? "All" : cat}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grouped Years */}
      <div className="space-y-6 pt-2">
        {eventsByYear.length === 0 ? (
          <div className="py-12 text-center rounded-xl bg-foundation-dark/40 border border-foundation-slate/40 text-xs text-typo-gray space-y-1">
            <p>No past events matched your query.</p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("ALL");
                }}
                className="text-brand-cyan hover:underline font-mono text-[11px]"
              >
                Reset Search Filters
              </button>
            )}
          </div>
        ) : (
          eventsByYear.map(({ year, events: yrEvents }) => {
            const isCollapsed = Boolean(collapsedYears[year]);

            return (
              <div
                key={year}
                className="rounded-2xl bg-foundation-dark/40 border border-foundation-slate/50 overflow-hidden"
              >
                {/* Year Header / Accordion Trigger */}
                <button
                  type="button"
                  onClick={() => toggleYearCollapse(year)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 bg-foundation-dark/70 hover:bg-foundation-slate/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-display text-xl sm:text-2xl font-extrabold text-typo-white">
                      {year}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-foundation-slate/60 text-typo-gray border border-foundation-slate/80">
                      {yrEvents.length} {yrEvents.length === 1 ? "Event" : "Events"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono text-typo-gray hover:text-brand-cyan">
                    <span>{isCollapsed ? "Expand" : "Collapse"}</span>
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {/* Event rows inside year (with thin vertical thread & star node) */}
                {!isCollapsed && (
                  <div className="p-4 sm:p-6 border-t border-foundation-slate/40">
                    <div className="space-y-0">
                      {yrEvents.map((evt, idx) => (
                        <ArchiveTimelineItem
                          key={evt.slug}
                          event={evt}
                          isLast={idx === yrEvents.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
