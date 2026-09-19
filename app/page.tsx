import { constructMetadata } from "@/lib/seo/metadata";
import { Hero } from "@/components/hero/Hero";
import { HomeAboutSection } from "@/components/home/HomeAboutSection";
import { EventsAndVoicesSection } from "@/components/home/EventsAndVoicesSection";
import { FinalIdeaCtaSection } from "@/components/home/FinalIdeaCtaSection";
import {
  getPublishedEvents,
  getPublishedPreviousSpeakers,
} from "@/lib/db/queries";

export const metadata = constructMetadata({
  title: "Innovation & Entrepreneurship Platform",
  description:
    "Official platform of the Innovation and Entrepreneurship Development Cell (IEDC) at Tatyasaheb Kore Institute of Engineering and Technology (TKIET). Where ideas gather momentum.",
  path: "/",
});

export default async function HomePage() {
  const [events, speakers] = await Promise.all([
    getPublishedEvents(),
    getPublishedPreviousSpeakers(),
  ]);

  return (
    <div className="flex flex-col flex-1 w-full overflow-x-clip">
      {/* SECTION 01: Signature Interactive Innovation Field Hero */}
      <Hero />

      {/* SECTION 02: Editorial Ecosystem Introduction — Building Ideas. Building Impact. */}
      <HomeAboutSection />

      {/* SECTION 03: Flagship Platforms & Distinguished Voices — Events & Voices Section */}
      <EventsAndVoicesSection events={events} speakers={speakers} />

      {/* SECTION 04: Final Action Invitation — Have an Idea? Let's Build It */}
      <FinalIdeaCtaSection />
    </div>
  );
}
