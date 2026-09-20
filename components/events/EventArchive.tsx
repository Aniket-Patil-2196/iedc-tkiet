"use client";

import React, { useState, useMemo } from "react";
import { Search, Tag, X, CalendarDays, ChevronDown } from "lucide-react";
import { EventBentoCard } from "./EventBentoCard";
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
  coverImageWidth?: number;
  coverImageHeight?: number;
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

interface BentoBlockItem {
  event: ArchiveEventItem;
  variant: "wide" | "half-7" | "half-5";
}

/**
 * Builds bento blocks for a list of events according to the mathematical packing rule:
 * - If >= 3 remain: [wide (12), half, half]
 * - If == 2 remain: [half, half]
 * - If == 1 remain: [wide]
 * Alternates the pair split (7/5 vs 5/7) across blocks so there are never gaps.
 */
function buildBentoBlocks(items: ArchiveEventItem[]): BentoBlockItem[] {
  const result: BentoBlockItem[] = [];
  let i = 0;
  let blockIndex = 0;

  while (i < items.length) {
    const remaining = items.length - i;
    const isEvenBlock = blockIndex % 2 === 0;

    if (remaining >= 3) {
      // Wide card (12 cols)
      result.push({ event: items[i], variant: "wide" });
      // Alternating split for the pair (7/5 on even blocks, 5/7 on odd blocks)
      result.push({
        event: items[i + 1],
        variant: isEvenBlock ? "half-7" : "half-5",
      });
      result.push({
        event: items[i + 2],
        variant: isEvenBlock ? "half-5" : "half-7",
      });
      i += 3;
      blockIndex++;
    } else if (remaining === 2) {
      // Pair of halves (7/5 or 5/7)
      result.push({
        event: items[i],
        variant: isEvenBlock ? "half-7" : "half-5",
      });
      result.push({
        event: items[i + 1],
        variant: isEvenBlock ? "half-5" : "half-7",
      });
      i += 2;
      blockIndex++;
    } else {
      // Exactly 1 remains: Wide card (12 cols)
      result.push({ event: items[i], variant: "wide" });
      i += 1;
      blockIndex++;
    }
  }

  return result;
}

const DEFAULT_PAGE_SIZE = 6;

export function EventArchive({ events, className }: EventArchiveProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  // Track expanded state for years with > 6 cards
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});

  // 1. Extract unique categories and years
  const categories = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set).sort();
  }, [events]);

  const uniqueYears = useMemo(() => {
    const set = new Set<number>();
    events.forEach((e) => {
      if (e.year) set.add(e.year);
    });
    return Array.from(set).sort((a, b) => b - a); // newest year first
  }, [events]);

  // 2. Filter events by search query, category, and year
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Search matching title, venue, or summary
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchVenue = e.venue.toLowerCase().includes(q);
        const matchSummary = (e.shortDescription || e.summary || e.description || "")
          .toLowerCase()
          .includes(q);
        if (!matchTitle && !matchVenue && !matchSummary) return false;
      }

      // Category filter
      if (selectedCategory !== "all" && e.category !== selectedCategory) {
        return false;
      }

      // Year filter
      if (selectedYear !== "all" && e.year !== parseInt(selectedYear, 10)) {
        return false;
      }

      return true;
    });
  }, [events, searchQuery, selectedCategory, selectedYear]);

  // 3. Group filtered events by year (newest first)
  const groupedByYear = useMemo(() => {
    const groups: { year: number; events: ArchiveEventItem[] }[] = [];
    const map = new Map<number, ArchiveEventItem[]>();

    filteredEvents.forEach((evt) => {
      const yr = evt.year;
      if (!map.has(yr)) {
        map.set(yr, []);
      }
      map.get(yr)!.push(evt);
    });

    // Sort years descending
    const sortedYears = Array.from(map.keys()).sort((a, b) => b - a);
    sortedYears.forEach((yr) => {
      groups.push({
        year: yr,
        events: map.get(yr)!,
      });
    });

    return groups;
  }, [filteredEvents]);

  const hasSearch = searchQuery.trim().length > 0;
  const hasCategoryFilter = selectedCategory !== "all";

  return (
    <section id="archive" className={cn("w-full space-y-8", className)}>
      {/* 1. Compact Section Header (Past Events + Count inline) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-foundation-slate/50">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-typo-white tracking-tight flex items-center gap-3">
            <span>Past Events</span>
          </h2>
          <span className="text-xs font-mono text-typo-gray px-2.5 py-0.5 rounded-full bg-foundation-slate/50 border border-foundation-slate/80 font-medium">
            {filteredEvents.length}
          </span>
        </div>

        {/* Search Field (Rendered ONLY when there are > 8 past events) */}
        {events.length > 8 && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-typo-gray/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past events..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-foundation-dark/80 border border-foundation-slate/60 text-typo-white text-xs placeholder:text-typo-gray/60 focus:outline-none focus:border-brand-cyan transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-typo-gray hover:text-typo-white p-0.5"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Filter Pills Row (Shown only when conditions met) */}
      {(uniqueYears.length > 1 || categories.length > 1) && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* Year Pills (Rendered ONLY when > 1 year exists) */}
          {uniqueYears.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-typo-gray/70 mr-1 flex items-center gap-1">
                <CalendarDays className="w-3 h-3 text-brand-cyan" />
                <span>Year:</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedYear("all")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-mono transition-colors",
                  selectedYear === "all"
                    ? "bg-brand-blue text-typo-white font-medium shadow-sm"
                    : "bg-foundation-dark text-typo-gray hover:text-typo-white border border-foundation-slate/60"
                )}
              >
                All
              </button>

              {uniqueYears.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYear(String(yr))}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-mono transition-colors",
                    selectedYear === String(yr)
                      ? "bg-brand-blue text-typo-white font-medium shadow-sm"
                      : "bg-foundation-dark text-typo-gray hover:text-typo-white border border-foundation-slate/60"
                  )}
                >
                  {yr}
                </button>
              ))}
            </div>
          )}

          {/* Separator between Year and Category pills if both exist */}
          {uniqueYears.length > 1 && categories.length > 1 && (
            <span className="text-foundation-slate hidden sm:inline select-none">|</span>
          )}

          {/* Category Filter Pills (Rendered ONLY when > 1 category exists) */}
          {categories.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-typo-gray/70 mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-brand-cyan" />
                <span>Category:</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-sans transition-colors",
                  selectedCategory === "all"
                    ? "bg-brand-cyan/20 border border-brand-cyan text-brand-cyan font-medium"
                    : "bg-foundation-dark text-typo-gray hover:text-typo-white border border-foundation-slate/60"
                )}
              >
                All
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-sans transition-colors",
                    selectedCategory === cat
                      ? "bg-brand-cyan/20 border border-brand-cyan text-brand-cyan font-medium"
                      : "bg-foundation-dark text-typo-gray hover:text-typo-white border border-foundation-slate/60"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Empty State */}
      {groupedByYear.length === 0 && (
        <div className="py-16 text-center rounded-2xl bg-foundation-dark/40 border border-dashed border-foundation-slate/60 space-y-3">
          <p className="font-sans text-sm text-typo-gray">
            No past events match your selected filters.
          </p>
          {(hasSearch || hasCategoryFilter || selectedYear !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedYear("all");
              }}
              className="text-xs font-mono text-brand-cyan hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>
      )}

      {/* 4. Grouped Bento Grids by Year */}
      <div className="space-y-12">
        {groupedByYear.map(({ year, events: yearEvents }, groupIdx) => {
          const isYearExpanded = Boolean(expandedYears[year]);
          // When filtering or searching, show all; otherwise show first 6 cards by default
          const shouldLimit = !hasSearch && !hasCategoryFilter && !isYearExpanded && yearEvents.length > DEFAULT_PAGE_SIZE;
          const displayEvents = shouldLimit ? yearEvents.slice(0, DEFAULT_PAGE_SIZE) : yearEvents;
          const bentoItems = buildBentoBlocks(displayEvents);
          const remainingCount = yearEvents.length - displayEvents.length;

          return (
            <div key={year} className="space-y-6">
              {/* Slim Year Label with Thin Divider Line */}
              <div className="flex items-center gap-4 pt-2">
                <span className="text-base sm:text-lg font-mono font-bold tracking-wider text-brand-cyan">
                  {year}
                </span>
                <div className="flex-1 h-px bg-foundation-slate/50" />
                <span className="text-xs font-mono text-typo-gray/80">
                  {yearEvents.length} {yearEvents.length === 1 ? "event" : "events"}
                </span>
              </div>

              {/* 12-Column Desktop / 2-Column Tablet / 1-Column Mobile Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 sm:gap-6">
                {bentoItems.map(({ event, variant }, idx) => (
                  <EventBentoCard
                    key={event.id || event.slug}
                    event={event}
                    variant={variant}
                    priority={groupIdx === 0 && idx === 0}
                  />
                ))}
              </div>

              {/* "Show more" Button (shown when > 6 cards exist for this year and not yet expanded) */}
              {shouldLimit && remainingCount > 0 && (
                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedYears((prev) => ({ ...prev, [year]: true }))
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foundation-dark/80 hover:bg-foundation-dark border border-foundation-slate/70 hover:border-brand-cyan/40 text-xs font-mono text-typo-white transition-all shadow-sm group"
                  >
                    <span>Show more events ({remainingCount} more in {year})</span>
                    <ChevronDown className="w-3.5 h-3.5 text-brand-cyan group-hover:translate-y-0.5 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
