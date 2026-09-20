"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  ExternalLink,
  ArrowRight,
  Tag,
  AlertTriangle,
  Radio,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Users,
} from "lucide-react";
import {
  EventLifecycleStatus,
  EventRegistrationStatus,
  getRegistrationAction,
} from "@/lib/utils/event-status";
import { EventPoster } from "@/components/events/EventPoster";
import { EventRegistrationModal } from "@/components/events/EventRegistrationModal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import gsap from "gsap";

export interface ConstellationEventItem {
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
  fee?: number;
  capacity?: number | null;
  seatsRemaining?: number | null;
  registrationMode?: "external" | "onsite" | "none";
  registrationUrl?: string;
  registrationDeadline?: string | null;
  isPlaceholder?: boolean;
  lifecycle: EventLifecycleStatus;
  registration: EventRegistrationStatus;
  isFeatured: boolean;
  formattedDate: string;
  formattedTime?: string | null;
}

interface EventConstellationProps {
  events: ConstellationEventItem[];
  featuredSlug?: string | null;
  className?: string;
}

interface StarNodePoint {
  event: ConstellationEventItem;
  x: number;
  y: number;
  index: number;
}

function hashSlug(str: string): number {
  let hash = 0;
  for (let j = 0; j < str.length; j++) {
    hash = (hash << 5) - hash + str.charCodeAt(j);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getMobileDateParts(dateStr?: string) {
  if (!dateStr || !dateStr.trim()) return { day: "TBD", month: "TBD" };
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { day: "TBD", month: "TBD" };
  const day = d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric" });
  const month = d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", month: "short" }).toUpperCase();
  return { day, month };
}

export function EventConstellation({
  events,
  featuredSlug,
  className,
}: EventConstellationProps) {
  // 1. Selection & Filter State
  const defaultSlug =
    featuredSlug && events.some((e) => e.slug === featuredSlug)
      ? featuredSlug
      : events[0]?.slug || "";

  const [activeSlug, setActiveSlug] = useState<string>(defaultSlug);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedModalEvent, setSelectedModalEvent] = useState<ConstellationEventItem | null>(null);
  const [expandedMobileSlugs, setExpandedMobileSlugs] = useState<Record<string, boolean>>({
    [defaultSlug]: true,
  });

  const toggleMobileExpand = (slug: string) => {
    setActiveSlug(slug);
    setExpandedMobileSlugs((prev) => ({
      ...prev,
      [slug]: !prev[slug],
    }));
  };

  const previewCardRef = useRef<HTMLDivElement | null>(null);
  const constellationContainerRef = useRef<HTMLDivElement | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add("ALL");
    events.forEach((e) => {
      if (e.category) cats.add(e.category);
    });
    return Array.from(cats);
  }, [events]);

  const activeEvent = useMemo(
    () => events.find((e) => e.slug === activeSlug) || events[0] || null,
    [events, activeSlug]
  );

  const activeIndex = useMemo(
    () => events.findIndex((e) => e.slug === activeSlug),
    [events, activeSlug]
  );

  // 2. Animate preview drawer when active event changes (desktop only)
  useEffect(() => {
    if (!previewCardRef.current) return;
    if (typeof window !== "undefined" && !window.matchMedia("(min-width: 768px)").matches) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      if (previewCardRef.current) {
        gsap.fromTo(
          previewCardRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
        );
      }
    }, constellationContainerRef);

    return () => ctx.revert();
  }, [activeSlug]);

  // 3. Compute deterministic coordinates for each event along celestial spline
  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 380;

  const starPoints: StarNodePoint[] = useMemo(() => {
    const N = events.length;
    if (N === 0) return [];

    if (N === 1) {
      return [{ event: events[0], x: 500, y: 190, index: 0 }];
    }

    if (N === 2) {
      return [
        { event: events[0], x: 320, y: 175, index: 0 },
        { event: events[1], x: 680, y: 205, index: 1 },
      ];
    }

    const marginX = 90;
    const stepX = (SVG_WIDTH - marginX * 2) / (N - 1);

    return events.map((event, i) => {
      const x = marginX + i * stepX;
      // Deterministic harmonic wave + slug hash offset
      const hashVal = (hashSlug(event.slug) % 100) / 100; // 0..1
      const wave = Math.sin((i / (N - 1)) * Math.PI * 2) * 55;
      const jitter = (hashVal - 0.5) * 45;
      const y = Math.max(80, Math.min(300, 190 + wave + jitter));

      return { event, x, y, index: i };
    });
  }, [events]);

  // 4. Construct smooth cubic bezier SVG spline connecting star nodes
  const splinePath = useMemo(() => {
    if (starPoints.length < 2) return "";
    let d = `M ${starPoints[0].x} ${starPoints[0].y}`;

    for (let i = 0; i < starPoints.length - 1; i++) {
      const p0 = starPoints[i];
      const p1 = starPoints[i + 1];
      const dx = p1.x - p0.x;
      const cp1x = p0.x + dx * 0.45;
      const cp1y = p0.y;
      const cp2x = p1.x - dx * 0.45;
      const cp2y = p1.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    return d;
  }, [starPoints]);

  // Keyboard navigation across star nodes (desktop only)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (typeof window !== "undefined" && !window.matchMedia("(min-width: 768px)").matches) {
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIdx = (activeIndex + 1) % events.length;
      setActiveSlug(events[nextIdx].slug);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIdx = (activeIndex - 1 + events.length) % events.length;
      setActiveSlug(events[prevIdx].slug);
    }
  };

  if (!events || events.length === 0) return null;

  const action = activeEvent
    ? getRegistrationAction(activeEvent as any, {
        lifecycle: activeEvent.lifecycle,
        registration: activeEvent.registration,
      })
    : null;

  return (
    <section
      ref={constellationContainerRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Upcoming Events Constellation Navigation"
      className={cn(
        "relative rounded-3xl bg-foundation-dark/70 border border-brand-blue/30 shadow-[0_0_50px_rgba(13,17,26,0.8)] overflow-hidden focus:outline-none focus:ring-1 focus:ring-brand-cyan/40",
        className
      )}
    >
      {/* Background celestial ambient grid & subtle starlight */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(56, 189, 248, 0.35) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Constellation Header & Category Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-foundation-slate/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase font-mono tracking-[0.2em] text-brand-cyan font-bold">
              <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Celestial Navigation Orbit</span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-typo-white">
              Upcoming Event Constellation
            </h3>
            <p className="font-sans text-xs text-typo-gray">
              Select any celestial star node along the trajectory to inspect event logistics.
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider transition-all",
                  selectedCategory === cat
                    ? "bg-brand-blue text-typo-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-brand-cyan/40 font-semibold"
                    : "bg-foundation-slate/40 text-typo-gray hover:text-typo-white hover:bg-foundation-slate/70 border border-foundation-slate/70"
                )}
              >
                {cat === "ALL" ? "All Events" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Constellation Interactive Canvas (SVG Spline + Star Nodes) */}
        <div className="hidden md:flex relative w-full aspect-[21/9] min-h-[300px] sm:min-h-[360px] max-h-[440px] rounded-2xl bg-foundation-darkest/60 border border-foundation-slate/60 overflow-hidden items-center justify-center select-none">
          {/* SVG Spline Background */}
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <defs>
              <linearGradient
                id="constellation-line-grad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
                <stop offset="30%" stopColor="#38BDF8" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#38BDF8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.2" />
              </linearGradient>

              <filter id="constellation-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Faint ambient glow ribbon */}
            {splinePath && (
              <path
                d={splinePath}
                fill="none"
                stroke="rgba(56, 189, 248, 0.18)"
                strokeWidth="6"
                filter="url(#constellation-glow)"
              />
            )}

            {/* Dotted geometric trajectory */}
            {splinePath && (
              <path
                d={splinePath}
                fill="none"
                stroke="url(#constellation-line-grad)"
                strokeWidth="1.5"
                strokeDasharray="4 6"
              />
            )}

            {/* Concentric orbital rings around single event */}
            {starPoints.length === 1 && (
              <>
                <circle
                  cx="500"
                  cy="190"
                  r="60"
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.2)"
                  strokeDasharray="3 5"
                />
                <circle
                  cx="500"
                  cy="190"
                  r="110"
                  fill="none"
                  stroke="rgba(37, 99, 235, 0.15)"
                  strokeDasharray="4 6"
                />
              </>
            )}
          </svg>

          {/* Star Nodes (Positioned over SVG using relative coordinates) */}
          <div className="absolute inset-0 pointer-events-auto">
            {starPoints.map((pt) => {
              const isMatch =
                selectedCategory === "ALL" ||
                pt.event.category === selectedCategory;
              const isActive = pt.event.slug === activeSlug;
              const isFeatured = pt.event.isFeatured;

              const leftPercent = (pt.x / SVG_WIDTH) * 100;
              const topPercent = (pt.y / SVG_HEIGHT) * 100;

              return (
                <button
                  key={pt.event.slug}
                  type="button"
                  onClick={() => setActiveSlug(pt.event.slug)}
                  aria-label={`Select event ${pt.index + 1}: ${pt.event.title}`}
                  aria-pressed={isActive}
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                  }}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none transition-all duration-300 z-20",
                    isMatch ? "opacity-100" : "opacity-25 pointer-events-none scale-75"
                  )}
                >
                  {/* Star Node Container */}
                  <div className="relative flex items-center justify-center">
                    {/* Active Pulsing Celestial Ring */}
                    {isActive && (
                      <span className="absolute -inset-3 rounded-full border border-brand-cyan/60 animate-ping opacity-60 pointer-events-none" />
                    )}

                    {/* Secondary Halo */}
                    <span
                      className={cn(
                        "absolute rounded-full transition-all duration-300 pointer-events-none",
                        isActive
                          ? "w-12 h-12 bg-brand-cyan/20 blur-sm"
                          : "w-8 h-8 bg-brand-blue/0 group-hover:bg-brand-cyan/20 group-hover:blur-sm"
                      )}
                    />

                    {/* Star Core Button */}
                    <div
                      className={cn(
                        "relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-mono text-[10px] font-bold transition-transform duration-200 border shadow-lg",
                        isActive
                          ? "bg-brand-cyan text-foundation-darkest border-white scale-125 shadow-[0_0_25px_rgba(56,189,248,0.8)]"
                          : isFeatured
                          ? "bg-brand-blue text-typo-white border-brand-cyan/80 group-hover:scale-110 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                          : "bg-foundation-dark border-brand-cyan/40 text-brand-cyan group-hover:scale-110 group-hover:border-brand-cyan"
                      )}
                    >
                      {String(pt.index + 1).padStart(2, "0")}
                    </div>

                    {/* Floating Star Label Tooltip */}
                    <div
                      className={cn(
                        "absolute top-full mt-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-foundation-darkest/90 backdrop-blur-md border text-[11px] font-mono whitespace-nowrap transition-all duration-200 pointer-events-none z-30 shadow-xl",
                        isActive
                          ? "border-brand-cyan text-brand-cyan opacity-100 translate-y-0"
                          : "border-foundation-slate/80 text-typo-gray opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0"
                      )}
                    >
                      <span className="font-semibold text-typo-white">{pt.event.title}</span>
                      <span className="text-typo-gray/70 ml-1.5 font-normal">
                        ({pt.event.formattedDate})
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Orbit Navigation Prev/Next Shortcuts */}
          <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 bg-foundation-darkest/80 backdrop-blur-md border border-foundation-slate/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                const prev = (activeIndex - 1 + events.length) % events.length;
                setActiveSlug(events[prev].slug);
              }}
              aria-label="Previous constellation star"
              className="p-1.5 rounded-lg hover:bg-foundation-slate/50 text-typo-gray hover:text-brand-cyan transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-typo-gray font-semibold">
              {String(activeIndex + 1).padStart(2, "0")} / {String(events.length).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => {
                const next = (activeIndex + 1) % events.length;
                setActiveSlug(events[next].slug);
              }}
              aria-label="Next constellation star"
              className="p-1.5 rounded-lg hover:bg-foundation-slate/50 text-typo-gray hover:text-brand-cyan transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop Active Event Preview Drawer Panel */}
        {activeEvent && (
          <div
            ref={previewCardRef}
            className="hidden md:block relative rounded-2xl bg-foundation-darkest/80 border border-brand-blue/40 p-4 sm:p-6 lg:p-8 shadow-[0_0_35px_rgba(13,17,26,0.6)] overflow-hidden"
          >
            {/* Top Cyan Accent Line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/50 to-transparent pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
              {/* Event Poster (4 Cols) */}
              <div className="md:col-span-4 max-w-[280px] mx-auto md:mx-0 w-full aspect-[4/5] rounded-xl overflow-hidden shadow-xl">
                <EventPoster
                  src={activeEvent.coverImage || activeEvent.posterUrl}
                  alt={activeEvent.title}
                  aspectRatio="portrait"
                  className="w-full h-full"
                />
              </div>

              {/* Event Details (8 Cols) */}
              <div className="md:col-span-8 space-y-4">
                {/* Meta Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {activeEvent.isPlaceholder && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-[10px] font-mono uppercase tracking-wider text-amber-300 font-semibold">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      [Development Placeholder]
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-foundation-slate/60 border border-foundation-slate text-xs font-sans text-brand-cyan font-medium">
                    <Tag className="w-3 h-3" />
                    {activeEvent.category}
                  </span>

                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider font-semibold border",
                      activeEvent.lifecycle === "ongoing"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : activeEvent.registration === "open"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : activeEvent.registration === "sold-out"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : "bg-brand-blue/20 text-brand-cyan border-brand-blue/40"
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        activeEvent.lifecycle === "ongoing" || activeEvent.registration === "open"
                          ? "bg-emerald-400 animate-pulse"
                          : "bg-brand-cyan"
                      )}
                    />
                    {activeEvent.lifecycle === "ongoing"
                      ? "Ongoing"
                      : activeEvent.registration === "open"
                      ? "Registration Open"
                      : activeEvent.registration === "sold-out"
                      ? "Sold Out"
                      : "Upcoming"}
                  </span>

                  {/* Seat availability if capacity is set */}
                  {activeEvent.capacity && activeEvent.seatsRemaining !== null && !activeEvent.isPlaceholder && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-foundation-slate/40 border border-foundation-slate text-xs font-mono text-typo-gray ml-auto">
                      <Users className="w-3 h-3 text-brand-cyan" />
                      <span>{activeEvent.seatsRemaining} seats left</span>
                    </span>
                  )}
                </div>

                {/* Title */}
                <h4 className="font-display font-bold text-xl sm:text-2xl lg:text-3xl text-typo-white leading-tight">
                  <Link
                    href={`/events/${activeEvent.slug}`}
                    className="hover:text-brand-cyan transition-colors"
                  >
                    {activeEvent.title}
                  </Link>
                </h4>

                {/* Description */}
                <p className="font-sans text-xs sm:text-sm text-typo-gray line-clamp-3 leading-relaxed">
                  {activeEvent.shortDescription || activeEvent.summary || activeEvent.description}
                </p>

                {/* Logistics Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs font-sans">
                  <div className="flex items-center gap-2 text-typo-gray bg-foundation-dark/60 border border-foundation-slate/50 p-2 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
                    <span className="text-typo-white font-medium truncate">
                      {activeEvent.formattedDate}
                    </span>
                  </div>

                  {activeEvent.formattedTime && (
                    <div className="flex items-center gap-2 text-typo-gray bg-foundation-dark/60 border border-foundation-slate/50 p-2 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
                      <span className="text-typo-white font-medium truncate">
                        {activeEvent.formattedTime}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-typo-gray bg-foundation-dark/60 border border-foundation-slate/50 p-2 rounded-lg sm:col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
                    <span className="text-typo-white font-medium truncate">
                      {activeEvent.venue}
                      {activeEvent.isOnline && (
                        <span className="ml-2 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-brand-blue/30 text-brand-cyan border border-brand-cyan/30">
                          Virtual
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
                  {action && action.type === "external" ? (
                    <a
                      href={action.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue text-typo-white font-sans text-xs sm:text-sm font-semibold hover:bg-brand-blue/90 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>{action.label}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </a>
                  ) : action && action.type === "onsite" ? (
                    <Button
                      onClick={() => {
                        setSelectedModalEvent(activeEvent);
                        setModalOpen(true);
                      }}
                      variant="primary"
                      className="py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>{action.label}</span>
                    </Button>
                  ) : (
                    <Button
                      disabled
                      variant="secondary"
                      className="py-2.5 text-xs sm:text-sm font-semibold cursor-not-allowed opacity-60"
                    >
                      <span>{action?.label || "Registration Closed"}</span>
                    </Button>
                  )}

                  <Link
                    href={`/events/${activeEvent.slug}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-foundation-dark border border-foundation-slate hover:border-brand-cyan/50 text-typo-white hover:text-brand-cyan font-sans text-xs sm:text-sm font-semibold transition-all group"
                  >
                    <span>View Event Details</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Vertical Timeline (< 768px) */}
        <div className="md:hidden relative space-y-6 pt-2">
          {/* Continuous vertical glowing timeline thread */}
          <div className="absolute left-[54px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-brand-cyan via-brand-blue/70 to-foundation-slate/30" />

          {events
            .filter((e) => selectedCategory === "ALL" || e.category === selectedCategory)
            .map((item) => {
              const isExpanded = Boolean(expandedMobileSlugs[item.slug]);
              const { day, month } = getMobileDateParts(item.startDate || item.date);
              const itemAction = getRegistrationAction(item as any, {
                lifecycle: item.lifecycle,
                registration: item.registration,
              });

              return (
                <div key={item.slug} className="relative flex items-start gap-3">
                  {/* Left Column: Date (Month & Day) */}
                  <div className="w-10 shrink-0 text-right pt-2 space-y-0.5 select-none">
                    <div className="font-mono text-sm font-bold text-typo-white">{day}</div>
                    <div className="font-mono text-[10px] font-semibold tracking-wider text-brand-cyan">
                      {month}
                    </div>
                  </div>

                  {/* Center Node on Timeline Thread */}
                  <div className="relative z-10 shrink-0 pt-2.5 flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => toggleMobileExpand(item.slug)}
                      aria-label={`Toggle details for ${item.title}`}
                      aria-expanded={isExpanded}
                      className={cn(
                        "w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center focus:outline-none",
                        isExpanded
                          ? "bg-brand-cyan border-white shadow-[0_0_12px_rgba(56,189,248,0.8)] scale-110"
                          : item.isFeatured
                          ? "bg-brand-blue border-brand-cyan/80"
                          : "bg-foundation-dark border-brand-cyan/50"
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isExpanded ? "bg-foundation-darkest" : "bg-brand-cyan"
                        )}
                      />
                    </button>
                  </div>

                  {/* Right Column: Expandable Timeline Card */}
                  <div
                    className={cn(
                      "flex-1 min-w-0 rounded-xl bg-foundation-darkest/80 border transition-all duration-300 overflow-hidden shadow-md",
                      isExpanded
                        ? "border-brand-cyan/50 shadow-[0_0_25px_rgba(56,189,248,0.15)]"
                        : "border-foundation-slate/60 hover:border-foundation-slate"
                    )}
                  >
                    {/* Card Header (Clickable to expand/collapse) */}
                    <button
                      type="button"
                      onClick={() => toggleMobileExpand(item.slug)}
                      className="w-full p-3.5 text-left focus:outline-none flex items-start justify-between gap-2.5"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-brand-cyan uppercase tracking-wider">
                            <Tag className="w-2.5 h-2.5" />
                            {item.category}
                          </span>
                          {item.lifecycle === "ongoing" && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                              Live Now
                            </span>
                          )}
                        </div>

                        <h4 className="font-display text-sm font-bold text-typo-white leading-snug">
                          {item.title}
                        </h4>

                        {!isExpanded && (
                          <div className="flex items-center gap-1 text-[11px] text-typo-gray truncate">
                            <MapPin className="w-3 h-3 text-brand-cyan shrink-0" />
                            <span className="truncate">{item.venue}</span>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 p-1 text-typo-gray hover:text-brand-cyan transition-colors">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-brand-cyan" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {/* Expandable Details Body */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-1 space-y-3.5 border-t border-foundation-slate/40">
                        {/* Poster */}
                        <div className="w-full aspect-[16/10] rounded-lg overflow-hidden shadow-inner">
                          <EventPoster
                            src={item.coverImage || item.posterUrl}
                            alt={item.title}
                            aspectRatio="landscape"
                            className="w-full h-full"
                          />
                        </div>

                        {/* Description */}
                        <p className="font-sans text-xs text-typo-gray leading-relaxed line-clamp-3">
                          {item.shortDescription || item.summary || item.description}
                        </p>

                        {/* Logistics */}
                        <div className="space-y-1.5 text-xs font-sans text-typo-gray bg-foundation-dark/60 p-2.5 rounded-lg border border-foundation-slate/50">
                          {item.formattedTime && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
                              <span className="text-typo-white truncate">{item.formattedTime}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
                            <span className="text-typo-white truncate">{item.venue}</span>
                          </div>
                          {item.capacity && item.seatsRemaining !== null && !item.isPlaceholder && (
                            <div className="flex items-center gap-2 pt-0.5">
                              <Users className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
                              <span className="text-brand-cyan font-mono text-[11px]">
                                {item.seatsRemaining} seats left
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 pt-1">
                          {itemAction && itemAction.type === "external" ? (
                            <a
                              href={itemAction.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-blue text-typo-white font-sans text-xs font-semibold hover:bg-brand-blue/90 shadow-md transition-all"
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              <span>{itemAction.label}</span>
                              <ExternalLink className="w-3 h-3 opacity-70" />
                            </a>
                          ) : itemAction && itemAction.type === "onsite" ? (
                            <Button
                              onClick={() => {
                                setSelectedModalEvent(item);
                                setModalOpen(true);
                              }}
                              variant="primary"
                              className="py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-md w-full"
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              <span>{itemAction.label}</span>
                            </Button>
                          ) : (
                            <Button
                              disabled
                              variant="secondary"
                              className="py-2 text-xs font-semibold cursor-not-allowed opacity-60 w-full"
                            >
                              <span>{itemAction?.label || "Registration Closed"}</span>
                            </Button>
                          )}

                          <Link
                            href={`/events/${item.slug}`}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-foundation-dark border border-foundation-slate text-typo-white hover:text-brand-cyan font-sans text-xs font-semibold transition-all group"
                          >
                            <span>View Full Details</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Shared On-Site Registration Modal */}
        {(() => {
          const target = selectedModalEvent || activeEvent;
          if (!target) return null;
          const targetAction = getRegistrationAction(target as any, {
            lifecycle: target.lifecycle,
            registration: target.registration,
          });
          if (targetAction.type !== "onsite") return null;

          return (
            <EventRegistrationModal
              isOpen={modalOpen}
              onClose={() => {
                setModalOpen(false);
                setSelectedModalEvent(null);
              }}
              event={{
                id: target.id,
                title: target.title,
                startDate: target.startDate || target.date || "",
                venue: target.venue,
                fee: target.fee,
                capacity: target.capacity || undefined,
                registrationDeadline: target.registrationDeadline || undefined,
              }}
            />
          );
        })()}
      </div>
    </section>
  );
}
