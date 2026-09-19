"use client";

import React from "react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { EventsShowcase } from "./EventsShowcase";
import { PreviousSpeakersCarousel } from "./PreviousSpeakersCarousel";
import { IEvent, IPreviousSpeaker } from "@/types/content";

interface EventsAndVoicesSectionProps {
  events: IEvent[];
  speakers: IPreviousSpeaker[];
}

export function EventsAndVoicesSection({
  events,
  speakers,
}: EventsAndVoicesSectionProps) {
  return (
    <Section
      id="events-voices"
      spacing="xl"
      className="border-t border-foundation-slate/60 bg-foundation-darkest relative overflow-hidden"
    >
      {/* Subtle Ambient Backdrops */}
      <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand-blue/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute right-0 bottom-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <Container size="lg" className="relative z-10 space-y-24 sm:space-y-28 md:space-y-36">
        {/* Subsection A: Events Quick Glimpse (Matching media_1789748749216.png) */}
        <EventsShowcase events={events} />

        {/* Subsection B: Previous Speakers Carousel (Matching media_1789748749233.png) */}
        <PreviousSpeakersCarousel speakers={speakers} />
      </Container>
    </Section>
  );
}
