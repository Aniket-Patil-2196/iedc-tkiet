import { constructMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { getPublishedEvents, getPaidRegistrationCounts } from "@/lib/db/queries";
import {
  getEventStatus,
  getEventDateUtc,
  formatEventDate,
  formatEventTimeRange,
  isDevelopmentPlaceholder,
  resolveRegistrationMode,
  isEventDateValid,
} from "@/lib/utils/event-status";
import { EventHeroCanvas } from "@/components/events/EventHeroCanvas";
import { EventFeaturedCard } from "@/components/events/EventFeaturedCard";
import {
  EventConstellation,
  ConstellationEventItem,
} from "@/components/events/EventConstellation";
import {
  EventArchive,
  ArchiveEventItem,
} from "@/components/events/EventArchive";
import { Reveal } from "@/components/animation/Reveal";
import { Calendar, Sparkles, ArrowDown, Compass } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = constructMetadata({
  title: "Event Constellation — IEDC TKIET",
  description:
    "Explore upcoming hackathons, ideathons, innovation bootcamps, and technical showcases at TKIET Warananagar.",
  path: "/events",
});

export default async function EventsPage() {
  // 1. Strict published filter: draft events are never shown in public archive
  const publishedEvents = await getPublishedEvents();

  // 2. Fetch paid registration counts in a single server aggregation query
  const paidCounts = await getPaidRegistrationCounts();

  const now = new Date();

  // 3. Compute status and start date for each event
  const eventsWithStatus = publishedEvents.map((evt) => {
    const count = paidCounts[evt.id] || 0;
    const status = getEventStatus(evt, count, now);
    const startUtc = getEventDateUtc(evt.startDate || evt.date, evt.startTime);
    return {
      event: evt,
      status,
      paidCount: count,
      startUtc,
    };
  });

  // 4. Determine featured showcase event:
  // Nearest upcoming published event, excluding cancelled and completed events,
  // and excluding postponed events without a confirmed date or any missing/invalid date.
  const eligibleForFeatured = eventsWithStatus.filter(({ status, startUtc }) => {
    if (status.lifecycle === "cancelled") return false;
    if (status.lifecycle === "completed") return false;
    // Missing or invalid date events can never become featured
    if (!startUtc || Number.isNaN(startUtc.getTime())) {
      return false;
    }
    return true;
  });

  eligibleForFeatured.sort((a, b) => {
    const timeA =
      !a.startUtc || Number.isNaN(a.startUtc.getTime())
        ? Infinity
        : a.startUtc.getTime();
    const timeB =
      !b.startUtc || Number.isNaN(b.startUtc.getTime())
        ? Infinity
        : b.startUtc.getTime();
    return timeA - timeB;
  });

  const featuredItem = eligibleForFeatured[0] || null;
  const featuredEvent = featuredItem?.event || null;
  const featuredStatus = featuredItem?.status || null;
  const featuredCountdownTarget = featuredItem?.startUtc
    ? featuredItem.startUtc.toISOString()
    : null;

  // 5. Build serializable public payload for active upcoming events in Constellation
  // Exclude events with an invalid/missing date (that are not postponed)
  const activeConstellationEvents: ConstellationEventItem[] = eventsWithStatus
    .filter((item) => {
      if (item.status.lifecycle === "completed") return false;
      const hasValidDate = Boolean(item.startUtc && !Number.isNaN(item.startUtc.getTime()));
      if (!hasValidDate && item.status.lifecycle !== "postponed") return false;
      return true;
    })
    .map((item) => {
      const e = item.event;
      const isPlaceholder = isDevelopmentPlaceholder(e);
      const seatsRemaining =
        e.capacity && !isPlaceholder
          ? Math.max(0, e.capacity - item.paidCount)
          : null;

      return {
        id: e.id,
        slug: e.slug,
        title: e.title,
        shortDescription: e.shortDescription,
        summary: e.summary,
        description: e.description,
        startDate: e.startDate,
        startTime: e.startTime,
        endDate: e.endDate,
        endTime: e.endTime,
        date: e.date,
        venue: e.venue,
        isOnline: e.isOnline,
        category: e.category,
        coverImage: e.coverImage,
        posterUrl: e.posterUrl,
        fee: e.fee,
        capacity: isPlaceholder ? null : e.capacity,
        seatsRemaining,
        registrationMode: resolveRegistrationMode(e),
        registrationUrl: e.registrationUrl,
        registrationDeadline: e.registrationDeadline
          ? new Date(e.registrationDeadline).toISOString()
          : null,
        isPlaceholder,
        lifecycle: item.status.lifecycle,
        registration: item.status.registration,
        isFeatured: e.id === featuredEvent?.id,
        formattedDate: formatEventDate(e.startDate || e.date),
        formattedTime: formatEventTimeRange(e.startTime, e.endTime),
      };
    });

  // Sort constellation events chronologically
  activeConstellationEvents.sort((a, b) => {
    const tA = getEventDateUtc(a.startDate || a.date, a.startTime)?.getTime() ?? Infinity;
    const tB = getEventDateUtc(b.startDate || b.date, b.startTime)?.getTime() ?? Infinity;
    return tA - tB;
  });

  // 6. Completed past events for the Archive
  const pastEvents: ArchiveEventItem[] = eventsWithStatus
    .filter((item) => item.status.lifecycle === "completed")
    .map((item) => {
      const e = item.event;
      const parsedDate = getEventDateUtc(e.startDate || e.date, e.startTime);
      const year =
        parsedDate && !Number.isNaN(parsedDate.getTime())
          ? parsedDate.getFullYear()
          : new Date().getFullYear();

      return {
        id: e.id,
        slug: e.slug,
        title: e.title,
        shortDescription: e.shortDescription,
        summary: e.summary,
        description: e.description,
        startDate: e.startDate || e.date || "",
        startTime: e.startTime,
        endDate: e.endDate,
        endTime: e.endTime,
        date: e.date,
        venue: e.venue,
        isOnline: e.isOnline,
        category: e.category,
        coverImage: e.coverImage,
        posterUrl: e.posterUrl,
        formattedDate: formatEventDate(e.startDate || e.date),
        formattedTime: formatEventTimeRange(e.startTime, e.endTime),
        year,
      };
    });

  // Sort past events reverse-chronologically (newest past event first)
  pastEvents.sort((a, b) => {
    const tA = getEventDateUtc(a.startDate || a.date, a.startTime)?.getTime() ?? 0;
    const tB = getEventDateUtc(b.startDate || b.date, b.startTime)?.getTime() ?? 0;
    return tB - tA;
  });

  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden bg-foundation-darkest">
      {/* 1. Celestial Hero with 2D Canvas */}
      <section className="relative min-h-[460px] lg:min-h-[520px] flex items-center justify-center border-b border-foundation-slate/50 overflow-hidden pt-24 pb-16">
        <EventHeroCanvas />

        {/* Ambient radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-blue/15 rounded-full blur-[120px] pointer-events-none" />

        <Container size="lg" className="relative z-10 text-center space-y-6">
          {/* Institutional Constellation Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-foundation-slate/50 border border-brand-blue/30 backdrop-blur-md text-xs font-mono tracking-widest uppercase text-brand-cyan shadow-[0_0_20px_rgba(56,189,248,0.15)]">
            <Compass className="w-3.5 h-3.5 text-brand-cyan animate-pulse" />
            <span>IEDC TKIET • Event Constellation</span>
          </div>

          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-typo-white tracking-tight leading-[1.1] max-w-3xl mx-auto">
            Where Ideas Meet Action.
          </h1>

          <p className="font-sans text-sm sm:text-base text-typo-gray max-w-2xl mx-auto leading-relaxed">
            Navigate through our constellation of technical hackathons, venture showcases, and entrepreneurship bootcamps at TKIET Warananagar.
          </p>

          <div className="pt-2">
            <a
              href="#constellation"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foundation-dark/80 hover:bg-foundation-dark border border-brand-cyan/30 hover:border-brand-cyan text-xs font-mono tracking-wider uppercase text-typo-white hover:text-brand-cyan transition-all shadow-sm group"
            >
              <span>Explore The Event Constellation</span>
              <ArrowDown className="w-3.5 h-3.5 text-brand-cyan group-hover:translate-y-0.5 transition-transform" />
            </a>
          </div>
        </Container>
      </section>

      {/* 2. Featured Spotlight Showcase */}
      <Section id="constellation" spacing="lg" className="bg-foundation-darkest">
        <Container size="lg" className="space-y-16">
          {featuredEvent && featuredStatus ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2 text-xs uppercase font-mono tracking-[0.2em] text-brand-cyan font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>Featured Upcoming Showcase</span>
                </div>
                <span className="text-xs font-mono text-typo-gray/60">
                  Schedule in Indian Standard Time (IST)
                </span>
              </div>

              <Reveal variant="fade-up">
                <EventFeaturedCard
                  event={featuredEvent}
                  status={featuredStatus}
                  targetUtcIso={featuredCountdownTarget}
                />
              </Reveal>
            </div>
          ) : (
            /* Celestial Empty State when no upcoming events */
            <div className="py-20 text-center max-w-md mx-auto space-y-4 rounded-3xl bg-foundation-dark/50 border border-foundation-slate/60 p-8">
              <div className="w-14 h-14 rounded-2xl bg-foundation-dark border border-brand-cyan/30 flex items-center justify-center mx-auto text-brand-cyan shadow-[0_0_25px_rgba(56,189,248,0.15)]">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-typo-white">
                No upcoming events on the radar.
              </h3>
              <p className="font-sans text-xs sm:text-sm text-typo-gray leading-relaxed">
                The cell is coordinating upcoming campus hackathons, bootcamps, and workshops. New schedules will be announced here once finalized.
              </p>
            </div>
          )}

          {/* 3. Phase 2: Interactive Upcoming Events Constellation */}
          {activeConstellationEvents.length > 0 && (
            <div className="space-y-6 pt-4">
              <Reveal variant="fade-up">
                <EventConstellation
                  events={activeConstellationEvents}
                  featuredSlug={featuredEvent?.slug}
                />
              </Reveal>
            </div>
          )}

          {/* 4. Past Events Archive */}
          {pastEvents.length > 0 && (
            <div className="pt-8 border-t border-foundation-slate/60">
              <Reveal variant="fade-up">
                <EventArchive events={pastEvents} />
              </Reveal>
            </div>
          )}
        </Container>
      </Section>
    </div>
  );
}
