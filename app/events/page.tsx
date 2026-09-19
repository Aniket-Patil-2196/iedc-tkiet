import { constructMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { PageHeading } from "@/components/ui/PageHeading";
import { EventCard } from "@/components/events/EventCard";
import { getPublishedEvents } from "@/lib/db/queries";
import { getEventStatusInfo } from "@/lib/utils/event-status";
import { Reveal } from "@/components/animation/Reveal";
import { Calendar, Sparkles, History } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = constructMetadata({
  title: "Events & Competitions",
  description:
    "Explore upcoming hackathons, ideathons, workshops, and speaker sessions organized by IEDC TKIET Warananagar.",
  path: "/events",
});

export default async function EventsPage() {
  // 1. Strict published filter: draft events are never shown in public archive
  const publishedEvents = await getPublishedEvents();


  // 2. Separate upcoming/active events from past completed events
  const activeOrUpcomingEvents = publishedEvents.filter((e) => {
    const status = getEventStatusInfo(e);
    return status.label !== "Completed";
  });

  const pastEvents = publishedEvents.filter((e) => {
    const status = getEventStatusInfo(e);
    return status.label === "Completed";
  });

  // Featured spotlight event is the first upcoming/active event or first published event
  const spotlightEvent = activeOrUpcomingEvents[0] || publishedEvents[0];
  const remainingActiveEvents = activeOrUpcomingEvents.filter(
    (e) => e.id !== spotlightEvent?.id
  );

  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden bg-foundation-darkest">
      {/* 1. Editorial Hero */}
      <Section spacing="lg" hasAsymmetricGrid className="border-b border-foundation-slate/50">
        <Container size="lg">
          <PageHeading
            badge="IEDC / Events"
            title="Where Ideas Meet Action."
            subtitle="Engage in technical hackathons, entrepreneurship bootcamps, and innovation showcases at TKIET Warananagar."
          />
        </Container>
      </Section>

      {/* 2. Events Archive Content */}
      <Section spacing="lg" className="bg-foundation-darkest">
        <Container size="lg">
          {publishedEvents.length === 0 ? (
            /* Empty State */
            <div className="py-20 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-foundation-dark border border-foundation-slate flex items-center justify-center mx-auto text-brand-cyan">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-typo-white">
                No upcoming events at the moment.
              </h3>
              <p className="font-sans text-xs sm:text-sm text-typo-gray">
                The cell is coordinating upcoming campus hackathons, bootcamps, and workshops. New schedules will be posted here once announced.
              </p>
            </div>
          ) : (
            <div className="space-y-20">
              {/* Upcoming / Spotlight Feature */}
              {spotlightEvent && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-xs uppercase font-sans tracking-[0.2em] text-brand-cyan font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    Featured Upcoming Showcase
                  </div>

                  <Reveal variant="fade-up">
                    <EventCard event={spotlightEvent} isFeatured={true} />
                  </Reveal>

                  {/* Additional active events if multiple exist */}
                  {remainingActiveEvents.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                      {remainingActiveEvents.map((evt, idx) => (
                        <Reveal key={evt.id} variant="fade-up" delayMs={idx * 80}>
                          <EventCard event={evt} />
                        </Reveal>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Past Events Archive */}
              {pastEvents.length > 0 && (
                <div className="space-y-6 pt-10 border-t border-foundation-slate/60">
                  <div className="flex items-center gap-2 text-xs uppercase font-sans tracking-[0.2em] text-typo-gray font-bold">
                    <History className="w-3.5 h-3.5" />
                    Past Event Archive
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {pastEvents.map((pastEvt, idx) => (
                      <Reveal key={pastEvt.id} variant="fade-up" delayMs={idx * 80}>
                        <EventCard event={pastEvt} />
                      </Reveal>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Container>
      </Section>
    </div>
  );
}
