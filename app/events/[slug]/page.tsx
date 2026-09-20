import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { constructMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { getPublishedEventBySlug } from "@/lib/db/queries";
import { EventRegistrationSection } from "@/components/events/EventRegistrationSection";
import {
  getEventStatusInfo,
  formatEventDate,
  formatEventTimeRange,
} from "@/lib/utils/event-status";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

  return constructMetadata({
    title: event.title,
    description: event.shortDescription || event.summary || event.description,
    path: `/events/${event.slug}`,
  });
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  // Only search published events; draft events must trigger notFound()
  const event = await getPublishedEventBySlug(params.slug);

  if (!event) {
    notFound();
  }


  const statusInfo = getEventStatusInfo(event);
  const formattedDate = formatEventDate(event.startDate || event.date);
  const formattedTime = formatEventTimeRange(event.startTime, event.endTime);
  const registrationLink = event.registrationUrl || event.registrationLink;

  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden bg-foundation-darkest">
      <Section spacing="md" className="border-b border-foundation-slate/50">
        <Container size="lg">
          {/* Back Navigation */}
          <div className="mb-8">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-xs uppercase font-sans tracking-widest text-typo-gray hover:text-brand-cyan transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to all events</span>
            </Link>
          </div>

          {/* Header Strip: Status & Category */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-sans font-semibold uppercase tracking-wider border",
                statusInfo.badgeClass
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", statusInfo.dotClass)} />
              {statusInfo.label}
              {statusInfo.isOverride && (
                <span className="text-[9px] opacity-75 ml-0.5 tracking-tight font-normal">
                  (Override)
                </span>
              )}
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foundation-slate/60 text-xs font-sans text-brand-cyan border border-foundation-slate uppercase tracking-wider font-semibold">
              <Tag className="w-3 h-3" />
              {event.category}
            </span>
          </div>

          {/* Large Editorial Title */}
          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-typo-white leading-[1.08] text-balance max-w-4xl mb-6">
            {event.title}
          </h1>

          {/* Logistics Strip */}
          <div className="flex flex-wrap items-center gap-6 text-sm font-sans text-typo-gray border-t border-foundation-slate/60 pt-6">
            <div className="flex items-center gap-2 text-typo-white font-medium">
              <Calendar className="w-4 h-4 text-brand-cyan shrink-0" />
              <span>{formattedDate}</span>
            </div>

            {formattedTime && (
              <div className="flex items-center gap-2 text-typo-white font-medium">
                <Clock className="w-4 h-4 text-brand-cyan shrink-0" />
                <span>{formattedTime}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-typo-white font-medium">
              <MapPin className="w-4 h-4 text-brand-cyan shrink-0" />
              <span>{event.venue}</span>
            </div>
          </div>
        </Container>
      </Section>

      {/* Main Content & Registration Layout */}
      <Section spacing="lg" className="bg-foundation-darkest">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Description & Highlights */}
            <div className="lg:col-span-8 space-y-10">
              {/* Event Poster / Visual Container */}
              <div className="relative w-full min-h-[260px] sm:min-h-[360px] rounded-2xl bg-gradient-to-br from-foundation-slate/70 via-foundation-dark to-[#0F172A] border border-foundation-slate flex flex-col items-center justify-center p-8 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#151B26_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
                <div className="relative z-10 text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-foundation-dark border border-brand-blue/50 flex items-center justify-center mx-auto shadow-lg">
                    <Calendar className="w-7 h-7 text-brand-cyan" />
                  </div>
                  <span className="text-xs font-sans uppercase tracking-widest text-brand-cyan font-bold block pt-2">
                    Official Event Showcase
                  </span>
                  <p className="text-xs font-sans text-typo-gray">
                    Tatyasaheb Kore Institute of Engineering and Technology
                  </p>
                </div>
              </div>

              {/* Event Description */}
              <div className="space-y-4">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-typo-white">
                  About The Event
                </h2>
                <div className="prose prose-invert max-w-none text-typo-gray leading-relaxed space-y-4">
                  <p className="text-base sm:text-lg text-typo-white/90 font-sans leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>

              {/* Highlights / Tracks */}
              {event.highlights && event.highlights.length > 0 && (
                <div className="p-8 rounded-2xl bg-foundation-dark border border-foundation-slate/80 space-y-4">
                  <h3 className="font-display text-xl font-bold text-typo-white">
                    Event Highlights & Tracks
                  </h3>
                  <ul className="space-y-3">
                    {event.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm font-sans text-typo-gray">
                        <CheckCircle2 className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right Column: Registration Card */}
            <div className="lg:col-span-4 sticky top-28 space-y-6">
              <EventRegistrationSection
                event={{
                  id: (event as any)._id?.toString() || event.id,
                  title: event.title,
                  startDate: event.startDate || event.date || "",
                  venue: event.venue,
                  fee: event.fee,
                  capacity: event.capacity,
                  registrationDeadline: event.registrationDeadline,
                  registrationOpen: event.registrationOpen,
                  registrationUrl: registrationLink,
                  statusOverride: event.statusOverride,
                }}
                statusLabel={statusInfo.label}
              />
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
