import { constructMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { getPublishedEvents, getPaidRegistrationCounts } from "@/lib/db/queries";
import {
  getEventStatus,
  getEventDateUtc,
  formatEventDate,
  formatEventTimeRange,
} from "@/lib/utils/event-status";
import { EventHeroCanvas } from "@/components/events/EventHeroCanvas";
import {
  UpcomingEventsList,
  UpcomingItem,
} from "@/components/events/UpcomingEventsList";
import {
  EventArchive,
  ArchiveEventItem,
} from "@/components/events/EventArchive";
import { Reveal } from "@/components/animation/Reveal";
import { Calendar, Sparkles, ArrowDown } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = constructMetadata({
  title: "Events & Showcases — IEDC TKIET",
  description:
    "Explore upcoming hackathons, ideathons, innovation bootcamps, and technical showcases at TKIET Warananagar.",
  path: "/events",
});

export default async function EventsPage() {
  // 1. Strict published filter: draft events are never shown in public listings
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

  // 4. Unified Upcoming Events list:
  // Rules:
  // - Cancelled or completed events are NOT listed.
  // - Scheduled upcoming events sorted chronologically (earliest first).
  // - Postponed events without a confirmed date are listed LAST with "Date to be announced" and no countdown or registration button.
  // - Ongoing events show "Happening now".
  const scheduledUpcoming = eventsWithStatus.filter(({ status, startUtc }) => {
    if (status.lifecycle === "cancelled") return false;
    if (status.lifecycle === "completed") return false;
    if (!startUtc || Number.isNaN(startUtc.getTime())) return false;
    return true;
  });

  scheduledUpcoming.sort((a, b) => {
    const tA = a.startUtc!.getTime();
    const tB = b.startUtc!.getTime();
    return tA - tB;
  });

  const postponedNoDate = eventsWithStatus.filter(({ status, startUtc }) => {
    if (status.lifecycle === "cancelled") return false;
    if (status.lifecycle === "completed") return false;
    if (status.lifecycle === "postponed" && (!startUtc || Number.isNaN(startUtc.getTime()))) {
      return true;
    }
    return false;
  });

  const combinedUpcoming = [...scheduledUpcoming, ...postponedNoDate];

  const upcomingItems: UpcomingItem[] = combinedUpcoming.map((item, idx) => {
    const isNearest = idx === 0 && scheduledUpcoming.length > 0;
    const isOngoing = item.status.lifecycle === "ongoing";
    const isPostponedNoDate =
      item.status.lifecycle === "postponed" &&
      (!item.startUtc || Number.isNaN(item.startUtc.getTime()));

    return {
      event: item.event,
      status: item.status,
      startUtcIso:
        item.startUtc && !isPostponedNoDate ? item.startUtc.toISOString() : null,
      isNearest,
      isOngoing,
      isPostponedNoDate,
    };
  });

  // 5. Completed past events for Bento Grid Archive
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
        coverImageWidth: e.coverImageWidth,
        coverImageHeight: e.coverImageHeight,
        posterUrl: e.posterUrl,
        posterWidth: e.posterWidth,
        posterHeight: e.posterHeight,
        formattedDate: formatEventDate(e.startDate || e.date),
        formattedTime: formatEventTimeRange(e.startTime, e.endTime),
        year,
      };
    });

  // Sort past events reverse-chronologically
  pastEvents.sort((a, b) => {
    const tA = getEventDateUtc(a.startDate || a.date, a.startTime)?.getTime() ?? 0;
    const tB = getEventDateUtc(b.startDate || b.date, b.startTime)?.getTime() ?? 0;
    return tB - tA;
  });

  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden bg-foundation-darkest">
      {/* 1. Hero: 100svh minus header height, min-height ~560px with optical vertical centering (~47%) */}
      <section
        style={{ height: "calc(100svh - var(--header-height, 4rem))" }}
        className="relative min-h-[560px] flex flex-col justify-between items-center text-center overflow-hidden border-b border-foundation-slate/40 px-4 pt-4 pb-6"
      >
        <EventHeroCanvas />

        {/* Ambient radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-blue/15 rounded-full blur-[120px] pointer-events-none" />

        {/* Vertically centered hero content with optical upward shift sitting at ~47% of screen height */}
        <div className="flex-1 flex flex-col justify-center items-center w-full -translate-y-7 sm:-translate-y-9 md:-translate-y-12 lg:-translate-y-14 pointer-events-none">
          <Container size="lg" className="relative z-10 space-y-6 pointer-events-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-foundation-slate/50 border border-brand-blue/30 backdrop-blur-md text-xs font-mono tracking-widest uppercase text-brand-cyan shadow-[0_0_20px_rgba(56,189,248,0.15)]">
              <Sparkles className="w-3.5 h-3.5 text-brand-cyan animate-pulse" />
              <span>IEDC TKIET • EVENTS</span>
            </div>

            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-typo-white tracking-tight leading-[1.1] max-w-3xl mx-auto [text-wrap:balance]">
              Where Ideas Meet Action.
            </h1>

            <p className="font-sans text-sm sm:text-base text-typo-gray max-w-2xl mx-auto leading-relaxed">
              Technical hackathons, venture showcases, and entrepreneurship bootcamps organized by the Innovation &amp; Entrepreneurship Development Cell at TKIET Warananagar.
            </p>
          </Container>
        </div>

        {/* Scroll cue anchored at bottom */}
        <div className="relative z-10 pb-1 sm:pb-2">
          <a
            href="#upcoming"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foundation-dark/80 hover:bg-foundation-dark border border-brand-cyan/30 hover:border-brand-cyan text-xs font-mono tracking-wider uppercase text-typo-white hover:text-brand-cyan transition-all shadow-sm group"
          >
            <span>VIEW UPCOMING EVENTS ↓</span>
            <ArrowDown className="w-3.5 h-3.5 text-brand-cyan group-hover:translate-y-0.5 transition-transform" />
          </a>
        </div>
      </section>

      {/* 2. Upcoming Section: One unified cards list */}
      <Section id="upcoming" spacing="md" className="py-12 md:py-16 bg-foundation-darkest">
        <Container size="lg" className="space-y-8">
          {upcomingItems.length > 0 ? (
            <div className="space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-foundation-slate/40">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono tracking-[0.2em] text-brand-cyan uppercase font-bold">
                    UPCOMING
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-typo-white tracking-tight flex items-center gap-3">
                    <span>Upcoming Event{upcomingItems.length > 1 ? "s" : ""}</span>
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
                      {upcomingItems.length}
                    </span>
                  </h2>
                </div>
                <span className="text-xs font-mono text-typo-gray/60">
                  Schedule in Indian Standard Time (IST)
                </span>
              </div>

              {/* Unified Upcoming Events List with Pagination */}
              <Reveal variant="fade-up">
                <UpcomingEventsList items={upcomingItems} />
              </Reveal>
            </div>
          ) : (
            /* Empty State: Zero upcoming events */
            <div className="py-16 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-xl bg-foundation-dark border border-brand-cyan/30 flex items-center justify-center mx-auto text-brand-cyan shadow-[0_0_20px_rgba(56,189,248,0.15)]">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-typo-white">
                No upcoming events on the radar.
              </h3>
              <p className="font-sans text-xs sm:text-sm text-typo-gray leading-relaxed">
                The cell is coordinating upcoming campus hackathons, bootcamps, and workshops. New schedules will be announced here once finalized.
              </p>
              {pastEvents.length > 0 && (
                <div className="pt-2">
                  <a
                    href="#archive"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-brand-cyan hover:underline"
                  >
                    <span>Explore Past Events Archive ↓</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* 3. Past Events Bento Grid Archive */}
          {pastEvents.length > 0 && (
            <div id="archive" className="pt-12 border-t border-foundation-slate/60">
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
