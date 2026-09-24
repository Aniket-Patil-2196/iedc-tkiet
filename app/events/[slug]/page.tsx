import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import {
  getPublishedEventBySlug,
  getPaidRegistrationCounts,
  getPublishedEvents,
} from "@/lib/db/queries";
import {
  getEventStatus,
  getRegistrationAction,
  getEventDateUtc,
  formatEventDate,
  formatEventTimeRange,
  isDevelopmentPlaceholder,
  resolveRegistrationMode,
} from "@/lib/utils/event-status";
import { EventPoster } from "@/components/events/EventPoster";
import { EventCountdown } from "@/components/events/EventCountdown";
import { EventRegistrationPanel } from "@/components/events/EventRegistrationPanel";
import { Reveal } from "@/components/animation/Reveal";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface EventDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const event = await getPublishedEventBySlug(params.slug);

  if (!event) {
    return constructMetadata({
      title: "Event Not Found",
      path: `/events/${params.slug}`,
      noIndex: true,
    });
  }

  const isPlaceholder = isDevelopmentPlaceholder(event);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://iedc.tkiet.ac.in").replace(/\/$/, "");
  const rawPoster = event.coverImage || event.posterUrl || "/images/og-event-default.jpg";
  const posterAbsolute = rawPoster.startsWith("http")
    ? rawPoster
    : `${siteUrl}${rawPoster.startsWith("/") ? "" : "/"}${rawPoster}`;

  const description =
    event.shortDescription ||
    event.summary ||
    event.description?.slice(0, 160) ||
    "Official event at IEDC TKIET Warananagar.";

  return constructMetadata({
    title: `${event.title} — IEDC TKIET`,
    description,
    image: posterAbsolute,
    path: `/events/${event.slug}`,
    noIndex: isPlaceholder,
  });
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  // 1. Fetch event, registration counts, and all published events in parallel
  const [event, paidCounts, allPublishedEvents] = await Promise.all([
    getPublishedEventBySlug(params.slug),
    getPaidRegistrationCounts(),
    getPublishedEvents(),
  ]);

  if (!event) {
    notFound();
  }

  const now = new Date();
  const paidCount = paidCounts[event.id] || 0;
  const status = getEventStatus(event, paidCount, now);
  const action = getRegistrationAction(event, status);
  const startUtc = getEventDateUtc(event.startDate || event.date, event.startTime);
  const isPlaceholder = isDevelopmentPlaceholder(event);

  const seatsRemaining =
    event.capacity && !isPlaceholder ? Math.max(0, event.capacity - paidCount) : null;

  const formattedDate = formatEventDate(event.startDate || event.date);
  const formattedTime = formatEventTimeRange(event.startTime, event.endTime);
  const countdownTarget =
    status.lifecycle === "upcoming" && startUtc && !Number.isNaN(startUtc.getTime())
      ? startUtc.toISOString()
      : null;

  const formattedDeadline = event.registrationDeadline
    ? new Date(event.registrationDeadline).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  // 2. Related events (excluding current event)
  const relatedEvents = allPublishedEvents
    .filter((e) => e.slug !== event.slug)
    .sort((a, b) => {
      const isSameCatA = a.category === event.category ? -1 : 1;
      const isSameCatB = b.category === event.category ? -1 : 1;
      return isSameCatA - isSameCatB;
    })
    .slice(0, 3);

  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden bg-foundation-darkest">
      {/* Top Hero & Logistics Header */}
      <section className="relative pt-24 pb-10 sm:pb-12 border-b border-foundation-slate/50 overflow-hidden">
        {/* Ambient Starlight Glow */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-brand-blue/15 rounded-full blur-[100px] pointer-events-none" />

        <Container size="lg" className="relative z-10 space-y-5">
          {/* Back to Events Link */}
          <div>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-xs uppercase font-mono tracking-wider text-typo-gray hover:text-brand-cyan transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Events</span>
            </Link>
          </div>

          {/* Header Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {isPlaceholder && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono uppercase tracking-wider text-amber-300 font-semibold">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                [Development Placeholder]
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-foundation-slate/60 text-xs font-mono text-brand-cyan border border-foundation-slate uppercase tracking-wider font-semibold">
              <Tag className="w-3 h-3" />
              {event.category}
            </span>

            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider font-semibold border",
                status.lifecycle === "ongoing"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : status.lifecycle === "completed"
                  ? "bg-foundation-slate/50 text-typo-gray border-foundation-slate"
                  : status.lifecycle === "cancelled"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  : status.lifecycle === "postponed"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : status.registration === "sold-out"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : status.registration === "open"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-brand-blue/20 text-brand-cyan border-brand-blue/40"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  status.lifecycle === "ongoing" || status.registration === "open"
                    ? "bg-emerald-400 animate-pulse"
                    : status.lifecycle === "completed"
                    ? "bg-typo-gray"
                    : "bg-brand-cyan"
                )}
              />
              {status.lifecycle === "ongoing"
                ? "Live Now"
                : status.lifecycle === "completed"
                ? "Event Concluded"
                : status.lifecycle === "cancelled"
                ? "Event Cancelled"
                : status.lifecycle === "postponed"
                ? "Event Postponed"
                : status.registration === "sold-out"
                ? "Sold Out"
                : status.registration === "open"
                ? "Registration Open"
                : "Upcoming"}
            </span>
          </div>

          {/* Large Editorial Title */}
          <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold text-typo-white tracking-tight leading-[1.1] max-w-4xl [text-wrap:balance]">
            {event.title}
          </h1>

          {/* Compact Meta Row (date · time · venue · format) */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm font-sans text-typo-gray border-t border-foundation-slate/50 pt-4">
            <span className="inline-flex items-center gap-1.5 text-typo-white font-medium">
              <Calendar className="w-4 h-4 text-brand-cyan shrink-0" />
              <span>{formattedDate}</span>
            </span>

            {formattedTime && (
              <>
                <span className="text-foundation-slate select-none">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-typo-gray/70 shrink-0" />
                  <span>{formattedTime}</span>
                </span>
              </>
            )}

            <span className="text-foundation-slate select-none">·</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-cyan shrink-0" />
              <span>{event.venue}</span>
            </span>

            {event.isOnline && (
              <>
                <span className="text-foundation-slate select-none">·</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-brand-blue/30 text-brand-cyan border border-brand-cyan/30">
                  Virtual
                </span>
              </>
            )}
          </div>

          {/* Countdown Ticker for Upcoming Events */}
          {countdownTarget && (
            <div className="pt-1 max-w-md">
              <div className="p-3.5 rounded-xl bg-foundation-dark/70 border border-foundation-slate/60 shadow-sm">
                <span className="text-[10px] font-mono uppercase tracking-wider text-typo-gray block mb-1.5">
                  Starts in:
                </span>
                <EventCountdown targetUtcIso={countdownTarget} />
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* Main Split Layout */}
      <Section spacing="md" className="py-10 md:py-14 bg-foundation-darkest">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left Column (8 Cols): Poster, Description, Highlights */}
            <div className="lg:col-span-8 space-y-8">
              {/* Event Poster with Real Aspect Ratio Clamping (no artificial 21:9 stretch) */}
              <div className="w-full max-w-3xl rounded-xl overflow-hidden shadow-xl border border-foundation-slate/60 bg-foundation-darkest flex items-center justify-center">
                <EventPoster
                  src={event.coverImage || event.posterUrl}
                  alt={event.title}
                  posterWidth={event.posterWidth}
                  posterHeight={event.posterHeight}
                  maxHeight={480}
                  priority
                  className="w-full h-full max-h-[480px]"
                />
              </div>

              {/* Event Editorial Description */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-xs uppercase font-mono tracking-[0.2em] text-brand-cyan font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Event Overview</span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-typo-white">
                  About The Event
                </h2>
                <div className="prose prose-invert max-w-none text-typo-gray leading-relaxed text-xs sm:text-sm space-y-3 font-sans">
                  <p className="whitespace-pre-line leading-relaxed text-typo-gray/90">
                    {event.description}
                  </p>
                </div>
              </div>

              {/* Highlights / Tracks */}
              {event.highlights && event.highlights.length > 0 && (
                <div className="p-4 sm:p-6 rounded-xl bg-foundation-dark/60 border border-foundation-slate/60 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 text-xs uppercase font-mono tracking-wider text-brand-cyan font-semibold">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Focus Areas</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-typo-white">
                    Event Tracks &amp; Highlights
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {event.highlights.map((h, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs font-sans text-typo-gray bg-foundation-darkest/60 p-2.5 rounded-lg border border-foundation-slate/50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan shrink-0 mt-0.5" />
                        <span className="leading-snug">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right Column (4 Cols): Sticky Compact Registration & Logistics Panel */}
            <div className="lg:col-span-4 sticky top-24 space-y-4">
              <EventRegistrationPanel
                event={{
                  id: event.id,
                  slug: event.slug,
                  title: event.title,
                  startDate: event.startDate || event.date || "",
                  startTime: event.startTime,
                  endDate: event.endDate,
                  endTime: event.endTime,
                  date: event.date,
                  venue: event.venue,
                  fee: event.fee,
                  capacity: isPlaceholder ? null : event.capacity,
                  registrationDeadline: event.registrationDeadline,
                  registrationMode: resolveRegistrationMode(event),
                  registrationUrl: event.registrationUrl || event.registrationLink,
                  isPlaceholder,
                  registrationOpen: event.registrationOpen,
                  paymentMode: (event as any).paymentMode || "razorpay",
                  upiId: (event as any).upiId || null,
                  upiQrUrl: (event as any).upiQrUrl || null,
                  installmentEnabled: Boolean((event as any).installmentEnabled),
                  installmentPart1Amount: (event as any).installmentPart1Amount || null,
                  installmentPart2Amount: (event as any).installmentPart2Amount || null,
                }}
                status={status}
                paidCount={paidCount}
                seatsRemaining={seatsRemaining}
                formattedDate={formattedDate}
                formattedTime={formattedTime}
                formattedDeadline={formattedDeadline}
                initialAction={action}
              />
            </div>
          </div>

          {/* Related Events */}
          {relatedEvents.length > 0 && (
            <div className="pt-14 mt-12 border-t border-foundation-slate/50 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono tracking-[0.2em] text-brand-cyan uppercase font-bold">
                    Recommendations
                  </span>
                  <h3 className="font-display text-xl font-bold text-typo-white">
                    More Events from IEDC
                  </h3>
                </div>

                <Link
                  href="/events"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-brand-cyan hover:text-white transition-colors"
                >
                  <span>View All Events</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {relatedEvents.map((rel) => (
                  <article
                    key={rel.id}
                    className="group relative rounded-xl bg-foundation-dark/60 border border-foundation-slate/60 hover:border-brand-cyan/40 p-4 flex flex-col justify-between transition-all duration-200"
                  >
                    <div className="space-y-3">
                      <div className="w-full aspect-[16/10] rounded-lg overflow-hidden bg-foundation-slate/30">
                        <EventPoster
                          src={rel.coverImage || rel.posterUrl}
                          alt={rel.title}
                          posterWidth={rel.posterWidth}
                          posterHeight={rel.posterHeight}
                          interactive={false}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs font-sans">
                        <span className="text-[10px] font-mono text-brand-cyan uppercase tracking-wider">
                          {rel.category}
                        </span>
                        <span className="text-[11px] font-mono text-typo-gray">
                          {formatEventDate(rel.startDate || rel.date)}
                        </span>
                      </div>

                      <h4 className="font-display font-bold text-sm sm:text-base text-typo-white group-hover:text-brand-cyan transition-colors leading-snug line-clamp-2">
                        <Link href={`/events/${rel.slug}`}>{rel.title}</Link>
                      </h4>

                      <p className="font-sans text-xs text-typo-gray line-clamp-2 leading-relaxed">
                        {rel.shortDescription || rel.summary || rel.description}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-foundation-slate/50">
                      <Link
                        href={`/events/${rel.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-brand-cyan hover:text-white transition-colors group/btn"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </Container>
      </Section>
    </div>
  );
}
