"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/animation/Reveal";
import { Button } from "@/components/ui/Button";
import { IEvent } from "@/types/content";
import { formatEventDate } from "@/lib/utils/event-status";

interface EventsShowcaseProps {
  events: IEvent[];
}

export function EventsShowcase({ events }: EventsShowcaseProps) {
  // If no events exist
  if (!events || events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-foundation-slate/60 p-12 text-center text-typo-gray">
        No events currently scheduled. Check back soon for upcoming innovation programs.
      </div>
    );
  }

  // Active event index in the showcase
  const [activeIndex, setActiveIndex] = useState(0);
  const activeEvent = events[activeIndex] || events[0];
  const eventDate = formatEventDate(activeEvent.startDate || activeEvent.date);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : events.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < events.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-8">
      {/* Section Header with Left-Aligned Title and Minimal Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Reveal variant="fade-up">
            <div className="inline-flex items-center gap-2 text-xs uppercase font-sans tracking-[0.2em] text-brand-cyan font-bold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
              FLAGSHIP PLATFORMS
            </div>
          </Reveal>
          <Reveal variant="fade-up" delayMs={100}>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-typo-white">
              Events & Programs
            </h2>
          </Reveal>
        </div>

        {/* Minimal Nav Controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/events"
            className="hidden sm:inline-flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-typo-gray hover:text-brand-cyan transition-colors mr-3"
          >
            <span>All Events Archive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous event"
              className="w-8 h-8 rounded-full border border-foundation-slate bg-foundation-dark/80 flex items-center justify-center text-typo-gray hover:text-brand-cyan hover:border-brand-cyan/60 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next event"
              className="w-8 h-8 rounded-full border border-foundation-slate bg-foundation-dark/80 flex items-center justify-center text-typo-gray hover:text-brand-cyan hover:border-brand-cyan/60 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Horizontal Showcase Container: Strips + Featured Panel */}
      <Reveal variant="fade-up" delayMs={150}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
          {/* Left Column: Narrow Vertical Strip Panels (Desktop / Tablet) */}
          <div className="hidden md:flex lg:col-span-5 gap-2.5 sm:gap-3 h-[420px] lg:h-[480px]">
            {events.slice(0, 5).map((evt, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={evt.id || evt.slug || idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`relative flex-1 rounded-2xl overflow-hidden transition-all duration-500 ease-out border focus:outline-none group text-left ${
                    isSelected
                      ? "ring-2 ring-brand-cyan/80 border-brand-cyan flex-[1.6] shadow-[0_0_25px_rgba(56,189,248,0.2)]"
                      : "border-foundation-slate/80 hover:border-brand-cyan/50 hover:flex-[1.2] opacity-80 hover:opacity-100"
                  }`}
                  aria-label={`View event ${evt.title}`}
                >
                  {/* Internal Image with Smooth Zoom */}
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <Image
                      src={
                        evt.coverImage ||
                        evt.posterUrl ||
                        `/images/placeholders/gallery-${(idx % 6) + 1}.svg`
                      }
                      alt={evt.title}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      sizes="(max-width: 1024px) 150px, 200px"
                    />
                  </div>

                  {/* Dark Vertical Vignette Overlay */}
                  <div
                    className={`absolute inset-0 transition-opacity duration-300 ${
                      isSelected
                        ? "bg-gradient-to-t from-foundation-darkest via-foundation-darkest/50 to-foundation-darkest/20"
                        : "bg-gradient-to-t from-foundation-darkest via-foundation-darkest/75 to-foundation-darkest/50 group-hover:via-foundation-darkest/50"
                    }`}
                  />

                  {/* Top Indicator Badge */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                    <span
                      className={`w-2 h-2 rounded-full block transition-all duration-300 ${
                        isSelected
                          ? "bg-brand-cyan shadow-[0_0_8px_#38BDF8]"
                          : "bg-typo-gray/40 group-hover:bg-typo-white/60"
                      }`}
                    />
                  </div>

                  {/* Vertical Rotated Text Anchor */}
                  <div className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center justify-end pointer-events-none">
                    <span className="[writing-mode:vertical-lr] rotate-180 font-display font-bold uppercase tracking-[0.25em] text-xs sm:text-sm text-typo-white group-hover:text-brand-cyan transition-colors whitespace-nowrap drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                      {evt.title.length > 18
                        ? `${evt.title.slice(0, 16)}...`
                        : evt.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Large Active Featured Showcase Panel */}
          <div className="lg:col-span-7 relative rounded-2xl sm:rounded-3xl border border-foundation-slate/90 overflow-hidden bg-foundation-dark min-h-[420px] lg:h-[480px] flex flex-col justify-between p-6 sm:p-8 md:p-10 group">
            {/* Background Photograph with Internal Hover Zoom */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <Image
                src={
                  activeEvent.coverImage ||
                  activeEvent.posterUrl ||
                  `/images/placeholders/gallery-1.svg`
                }
                alt={activeEvent.title}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-106"
                priority
                sizes="(max-width: 1024px) 100vw, 700px"
              />
            </div>

            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-foundation-darkest via-foundation-darkest/75 to-foundation-darkest/25 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,transparent_0%,rgba(8,10,15,0.85)_80%)] pointer-events-none" />

            {/* Top Meta Bar */}
            <div className="relative z-10 flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foundation-dark/80 backdrop-blur-md border border-brand-cyan/40 text-xs font-sans text-brand-cyan uppercase tracking-wider font-semibold">
                <Tag className="w-3 h-3" />
                {activeEvent.category || "Flagship Initiative"}
              </span>

              <span className="px-3 py-1 rounded-full bg-foundation-dark/60 backdrop-blur-md border border-foundation-slate text-xs font-sans text-typo-gray uppercase tracking-widest">
                {activeEvent.status || "Upcoming"}
              </span>
            </div>

            {/* Bottom Content Area Anchored inside Photograph */}
            <div className="relative z-10 space-y-4 max-w-2xl pt-20">
              <div className="flex flex-wrap items-center gap-3 text-xs font-sans text-typo-gray/90">
                <div className="inline-flex items-center gap-1.5 text-typo-white font-medium bg-foundation-dark/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-foundation-slate/60">
                  <Calendar className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>{eventDate}</span>
                </div>
                {activeEvent.venue && (
                  <div className="inline-flex items-center gap-1.5 text-typo-white font-medium bg-foundation-dark/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-foundation-slate/60">
                    <MapPin className="w-3.5 h-3.5 text-brand-cyan" />
                    <span className="truncate max-w-[200px]">{activeEvent.venue}</span>
                  </div>
                )}
              </div>

              <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-typo-white leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] group-hover:text-brand-cyan transition-colors">
                {activeEvent.title}
              </h3>

              <p className="font-sans text-sm sm:text-base text-typo-gray/90 line-clamp-2 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                {activeEvent.shortDescription || activeEvent.summary || activeEvent.description}
              </p>

              <div className="pt-2 flex items-center gap-4">
                <Button
                  href={`/events/${activeEvent.slug}`}
                  variant="primary"
                  size="md"
                  className="rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] group-hover:shadow-[0_0_25px_rgba(56,189,248,0.5)]"
                >
                  <span>View Event Info</span>
                  <ArrowRight className="w-4 h-4 ml-1.5 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Mobile Strip Carousel Switcher (Below 768px) */}
      <div className="flex md:hidden items-center justify-between pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {events.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Select event ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "w-6 bg-brand-cyan shadow-[0_0_8px_#38BDF8]"
                  : "w-2 bg-foundation-slate"
              }`}
            />
          ))}
        </div>

        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-wider text-brand-cyan font-semibold"
        >
          <span>All Events</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
