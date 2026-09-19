import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/animation/Reveal";
import { PLACEHOLDER_EVENTS } from "@/lib/data/placeholders";
import { Calendar, MapPin, ArrowRight, Sparkles, Tag } from "lucide-react";

import { formatEventDate } from "@/lib/utils/event-status";

interface FeaturedEventSectionProps {
  // Configured to accept future MongoDB event document or fallback to placeholder
  event?: typeof PLACEHOLDER_EVENTS[0];
}

export function FeaturedEventSection({
  event = PLACEHOLDER_EVENTS[0],
}: FeaturedEventSectionProps) {
  if (!event) {
    return null;
  }

  const eventDate = formatEventDate(event.startDate || event.date);

  return (
    <Section spacing="lg" className="border-t border-foundation-slate/50 bg-foundation-dark/40">
      <Container size="lg">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase font-sans tracking-[0.2em] text-brand-cyan font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Featured Initiative
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-typo-white">
              Flagship Initiative
            </h2>
          </div>

          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-typo-gray hover:text-brand-cyan transition-colors"
          >
            <span>View all events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Editorial Asymmetric Event Layout */}
        <Reveal variant="fade-up">
          <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl bg-foundation-dark border border-foundation-slate/80 overflow-hidden hover:border-brand-blue/50 transition-all duration-300 group">
            {/* Visual Poster Frame (Left Column) */}
            <div className="lg:col-span-5 relative min-h-[280px] lg:min-h-[420px] bg-gradient-to-br from-foundation-slate/70 via-foundation-dark to-[#0F172A] p-8 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-foundation-slate/70">
              {/* Subtle geometric line pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#151B26_1px,transparent_1px),linear-gradient(to_bottom,#151B26_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] opacity-30 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue/20 border border-brand-cyan/40 text-xs font-sans text-brand-cyan uppercase tracking-wider font-semibold">
                  <Tag className="w-3 h-3" />
                  {event.category}
                </span>

                <span className="text-xs font-sans text-typo-gray uppercase tracking-widest">
                  {event.status}
                </span>
              </div>

              {/* Graphic Motif */}
              <div className="relative z-10 my-auto py-8">
                <div className="w-16 h-16 rounded-2xl bg-foundation-dark border border-brand-blue/40 flex items-center justify-center shadow-[0_0_25px_rgba(37,99,235,0.25)] group-hover:scale-105 transition-transform duration-300">
                  <div className="w-6 h-6 rounded-full bg-brand-cyan/80 animate-pulse-slow" />
                </div>
              </div>

              <div className="relative z-10 text-xs font-sans text-typo-gray">
                Official Campus Showcase • IEDC TKIET
              </div>
            </div>

            {/* Information Block (Right Column) */}
            <div className="lg:col-span-7 p-8 sm:p-10 md:p-12 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Meta badges */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-typo-gray">
                  <div className="flex items-center gap-1.5 text-typo-white font-medium">
                    <Calendar className="w-4 h-4 text-brand-cyan" />
                    <span>{eventDate}</span>
                  </div>
                  <span className="text-foundation-slate">•</span>
                  <div className="flex items-center gap-1.5 text-typo-white font-medium">
                    <MapPin className="w-4 h-4 text-brand-cyan" />
                    <span>{event.venue}</span>
                  </div>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-typo-white leading-tight group-hover:text-brand-cyan transition-colors">
                  <Link href={`/events/${event.slug}`}>{event.title}</Link>
                </h3>

                <p className="font-sans text-sm sm:text-base text-typo-gray leading-relaxed max-w-xl">
                  {event.summary}
                </p>

                {event.highlights && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {event.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-md bg-foundation-slate/50 border border-foundation-slate text-xs font-sans text-typo-gray"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-foundation-slate/60 flex flex-wrap items-center gap-4">
                <Button href={`/events/${event.slug}`} variant="primary" size="md">
                  <span>View Event Details</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button href="/events" variant="ghost" size="md">
                  All Schedule
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
