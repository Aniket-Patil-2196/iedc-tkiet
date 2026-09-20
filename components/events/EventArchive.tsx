"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Calendar,
  MapPin,
  Tag,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
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
  formattedDate: string;
  formattedTime?: string | null;
  year: number;
}

interface EventArchiveProps {
  events: ArchiveEventItem[];
  className?: string;
}

export function EventArchive({ events, className }: EventArchiveProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState<number | "ALL">("ALL");

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

  // Track collapsed state for each year accordion
  const [collapsedYears, setCollapsedYears] = useState<Record<number, boolean>>({});

  const toggleYearCollapse = (year: number) => {
    setCollapsedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  // Extract distinct categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add("ALL");
    events.forEach((e) => {
      if (e.category) cats.add(e.category);
    });
    return Array.from(cats);
  }, [events]);

  // Filter events based on search query, category, and selected year
  const filteredEvents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return events.filter((e) => {
      // Category filter
      if (selectedCategory !== "ALL" && e.category !== selectedCategory) {
        return false;
      }
      // Year filter
      if (selectedYear !== "ALL" && e.year !== selectedYear) {
        return false;
      }
      // Search query filter
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
  }, [events, searchQuery, selectedCategory, selectedYear]);

  // Group filtered events by year
  const eventsByYear = useMemo(() => {
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

  if (!events || events.length === 0) return null;

  return (
    <section
      id="archive"
      aria-label="Past Event Constellation Archive"
      className={cn("space-y-8 pt-6", className)}
    >
      {/* Archive Header with Starlight Badge */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-foundation-slate/60">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs uppercase font-mono tracking-[0.2em] text-typo-gray font-bold">
            <History className="w-3.5 h-3.5 text-brand-cyan" />
            <span>Institutional Repository</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-typo-white tracking-tight">
            Past Event Constellation
          </h2>
          <p className="font-sans text-xs sm:text-sm text-typo-gray max-w-xl leading-relaxed">
            Archive of completed student hackathons, innovation conclaves, and technological workshops hosted by IEDC TKIET.
          </p>
        </div>

        {/* Total Events Count Badge */}
        <div className="shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-foundation-slate/40 border border-foundation-slate text-xs font-mono text-typo-gray self-start md:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan/60" />
          <span>
            {filteredEvents.length} {filteredEvents.length === 1 ? "Event" : "Events"} Archived
          </span>
        </div>
      </div>

      {/* Interactive Controls: Search Bar + Year Pills + Category Pills */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-typo-gray pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search past events by name, topic, or venue..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-foundation-dark/80 border border-foundation-slate focus:border-brand-cyan/60 focus:outline-none text-xs sm:text-sm text-typo-white placeholder:text-typo-gray/60 transition-all font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-typo-gray hover:text-typo-white hover:bg-foundation-slate/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Bar: Years + Categories */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          {/* Year Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono uppercase tracking-wider text-typo-gray mr-1">
              Year:
            </span>
            <button
              type="button"
              onClick={() => setSelectedYear("ALL")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-mono transition-all",
                selectedYear === "ALL"
                  ? "bg-brand-blue text-typo-white font-semibold border border-brand-cyan/40 shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                  : "bg-foundation-slate/40 text-typo-gray hover:text-typo-white hover:bg-foundation-slate/70 border border-foundation-slate/60"
              )}
            >
              All Years
            </button>
            {availableYears.map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-mono transition-all",
                  selectedYear === yr
                    ? "bg-brand-blue text-typo-white font-semibold border border-brand-cyan/40 shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                    : "bg-foundation-slate/40 text-typo-gray hover:text-typo-white hover:bg-foundation-slate/70 border border-foundation-slate/60"
                )}
              >
                {yr}
              </button>
            ))}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono uppercase tracking-wider text-typo-gray mr-1">
              Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider transition-all",
                  selectedCategory === cat
                    ? "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/40 font-semibold"
                    : "bg-foundation-dark text-typo-gray hover:text-typo-white hover:bg-foundation-slate/40 border border-foundation-slate/60"
                )}
              >
                {cat === "ALL" ? "All" : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Archive Content Grouped by Year */}
      {eventsByYear.length > 0 ? (
        <div className="space-y-10">
          {eventsByYear.map(({ year, events: yrEvents }) => {
            const isCollapsed = Boolean(collapsedYears[year]);

            return (
              <div
                key={year}
                className="rounded-2xl bg-foundation-dark/40 border border-foundation-slate/50 p-4 sm:p-6 lg:p-8 space-y-6 transition-colors"
              >
                {/* Year Header / Accordion Toggle */}
                <button
                  type="button"
                  onClick={() => toggleYearCollapse(year)}
                  aria-expanded={!isCollapsed}
                  className="w-full flex items-center justify-between pb-4 border-b border-foundation-slate/40 text-left group focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-display text-2xl sm:text-3xl font-extrabold text-typo-white group-hover:text-brand-cyan transition-colors">
                      {year}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-foundation-slate/60 text-typo-gray text-xs font-mono font-medium">
                      {yrEvents.length} {yrEvents.length === 1 ? "event" : "events"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-mono text-typo-gray group-hover:text-brand-cyan transition-colors">
                    <span>{isCollapsed ? "Expand Year" : "Collapse"}</span>
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {/* Event Cards Grid for the Year */}
                {!isCollapsed && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {yrEvents.map((evt) => (
                      <article
                        key={evt.id}
                        className="group relative rounded-xl bg-foundation-darkest/70 border border-foundation-slate/60 hover:border-brand-cyan/40 p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_25px_rgba(13,17,26,0.8)] overflow-hidden"
                      >
                        <div className="space-y-4">
                          {/* Event Poster with Grayscale-to-Color Transition (Scoped to hover-capable devices) */}
                          <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden bg-foundation-slate/30 shadow-inner">
                            <div className="w-full h-full grayscale-0 opacity-100 [@media(hover:hover)]:grayscale [@media(hover:hover)]:opacity-80 [@media(hover:hover)]:group-hover:grayscale-0 [@media(hover:hover)]:group-hover:opacity-100 transition-all duration-500 transform [@media(hover:hover)]:group-hover:scale-105">
                              <EventPoster
                                src={evt.coverImage || evt.posterUrl}
                                alt={evt.title}
                                aspectRatio="landscape"
                                className="w-full h-full"
                              />
                            </div>

                            {/* Completed Status Watermark Badge */}
                            <div className="absolute top-2.5 right-2.5">
                              <span className="px-2 py-0.5 rounded-full bg-foundation-darkest/90 backdrop-blur-md border border-foundation-slate text-[10px] font-mono uppercase tracking-wider text-typo-gray">
                                Concluded
                              </span>
                            </div>
                          </div>

                          {/* Meta Badges */}
                          <div className="flex items-center justify-between gap-2 text-xs font-sans">
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-brand-cyan uppercase tracking-wider">
                              <Tag className="w-3 h-3" />
                              {evt.category}
                            </span>
                            <span className="text-[11px] font-mono text-typo-gray">
                              {evt.formattedDate}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="font-display font-bold text-base sm:text-lg text-typo-white group-hover:text-brand-cyan transition-colors leading-snug line-clamp-2">
                            <Link href={`/events/${evt.slug}`} className="focus:outline-none">
                              {evt.title}
                            </Link>
                          </h3>

                          {/* Description snippet */}
                          <p className="font-sans text-xs text-typo-gray line-clamp-2 leading-relaxed">
                            {evt.shortDescription || evt.summary || evt.description}
                          </p>

                          {/* Venue metadata */}
                          <div className="flex items-center gap-1.5 text-xs text-typo-gray/80 font-sans truncate pt-1">
                            <MapPin className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
                            <span className="truncate">{evt.venue}</span>
                          </div>
                        </div>

                        {/* Card Footer: Details Link */}
                        <div className="pt-4 mt-4 border-t border-foundation-slate/50 flex items-center justify-between">
                          <Link
                            href={`/events/${evt.slug}`}
                            className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-brand-cyan hover:text-white transition-colors group/btn"
                          >
                            <span>View Event Recap</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty Archive Search State */
        <div className="py-16 text-center max-w-md mx-auto space-y-4 rounded-2xl bg-foundation-dark/40 border border-foundation-slate/60 p-8">
          <div className="w-12 h-12 rounded-xl bg-foundation-slate/40 border border-foundation-slate flex items-center justify-center mx-auto text-typo-gray">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="font-display text-lg font-bold text-typo-white">
            No archived events match your filter.
          </h3>
          <p className="font-sans text-xs text-typo-gray leading-relaxed">
            Try adjusting your search query, switching categories, or viewing All Years.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("ALL");
              setSelectedYear("ALL");
            }}
            className="px-4 py-2 rounded-xl bg-foundation-slate/60 hover:bg-foundation-slate text-xs font-mono text-typo-white transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </section>
  );
}
