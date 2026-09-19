import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { constructMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { getPublishedEventBySlug } from "@/lib/db/queries";
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

            {/* Right Column: Registration Card (Google Forms Flow) */}
            <div className="lg:col-span-4 sticky top-28 space-y-6">
              <div className="p-8 rounded-2xl bg-foundation-dark border border-brand-blue/40 shadow-[0_0_35px_rgba(37,99,235,0.12)] space-y-6">
                <div className="space-y-2">
                  <span className="text-xs uppercase font-sans tracking-widest text-brand-cyan font-bold block">
                    Participation
                  </span>
                  <h3 className="font-display text-xl font-bold text-typo-white">
                    Registration Desk
                  </h3>
                </div>

                {/* Conditional Registration States */}
                {statusInfo.label === "Registration Closed" ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-300">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Registrations for this event have officially concluded. Thank you for your interest.
                      </span>
                    </div>
                    <Button disabled variant="secondary" className="w-full">
                      Registration Closed
                    </Button>
                  </div>
                ) : statusInfo.label === "Cancelled" ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>This event has been cancelled by the organizing committee.</span>
                    </div>
                    <Button disabled variant="secondary" className="w-full">
                      Event Cancelled
                    </Button>
                  </div>
                ) : registrationLink ? (
                  <div className="space-y-4">
                    <p className="font-sans text-xs text-typo-gray leading-relaxed">
                      Participants are required to submit their details via the official Google Form.
                    </p>
                    <a
                      href={registrationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full relative inline-flex items-center justify-center font-sans font-medium transition-all duration-200 outline-none px-6 py-3.5 text-sm rounded-lg bg-brand-blue text-typo-white hover:bg-blue-600 hover:shadow-[0_0_20px_rgba(37,99,235,0.35)] border border-brand-cyan/20 group focus-visible:ring-2 focus-visible:ring-brand-cyan"
                    >
                      <span>Register Now (Google Form)</span>
                      <ExternalLink className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-xs text-typo-gray">
                      Registration details will be announced soon by the IEDC executive committee.
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-foundation-slate/60 text-[11px] font-sans text-typo-gray flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>Official IEDC TKIET Event</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
