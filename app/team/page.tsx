import { constructMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { TeamDirectory } from "@/components/team/TeamDirectory";
import { getPublishedTeamMembers } from "@/lib/db/queries";
import { TeamHeroCanvas } from "@/components/team/TeamHeroCanvas";
import { ArrowDown } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = constructMetadata({
  title: "Our Team",
  description:
    "Meet the student leads and faculty coordinators driving the Innovation and Entrepreneurship Development Cell at TKIET Warananagar.",
  path: "/team",
});

export default async function TeamPage() {
  const members = await getPublishedTeamMembers();

  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden bg-foundation-darkest">
      {/* 1. Hero: 100svh minus header height, min-height ~560px with optical vertical centering */}
      <section
        style={{ height: "calc(100svh - var(--header-height, 4rem))" }}
        className="relative min-h-[560px] flex flex-col justify-between items-center text-center overflow-hidden border-b border-foundation-slate/40 px-4 pt-4 pb-6"
      >
        <TeamHeroCanvas section="hero" variant="hero" />

        {/* Ambient radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-blue/15 rounded-full blur-[120px] pointer-events-none" />

        {/* Vertically centered hero content with optical upward shift and subtle text readability backing */}
        <div className="flex-1 flex flex-col justify-center items-center w-full -translate-y-7 sm:-translate-y-9 md:-translate-y-12 lg:-translate-y-14 pointer-events-none">
          <Container size="lg" className="relative z-10 pointer-events-auto">
            <div className="relative max-w-3xl mx-auto py-8 px-6 sm:px-10 rounded-3xl">
              {/* Subtle radial dark gradient + light backdrop blur directly behind text block */}
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_center,rgba(8,10,15,0.76)_0%,rgba(8,10,15,0.38)_60%,transparent_85%)] backdrop-blur-[2px] pointer-events-none -z-10"
              />
              <PageHeading
                badge="Innovation Stewards"
                title="The IEDC Team"
                subtitle="The passionate student innovators and distinguished faculty mentors collaborating across engineering disciplines at TKIET."
              />
            </div>
          </Container>
        </div>

        {/* Scroll cue anchored at bottom */}
        <div className="relative z-10 pb-1 sm:pb-2">
          <a
            href="#directory"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foundation-dark/80 hover:bg-foundation-dark border border-brand-cyan/30 hover:border-brand-cyan text-xs font-mono tracking-wider uppercase text-typo-white hover:text-brand-cyan transition-all shadow-sm group"
          >
            <span>MEET THE CREW ↓</span>
            <ArrowDown className="w-3.5 h-3.5 text-brand-cyan group-hover:translate-y-0.5 transition-transform" />
          </a>
        </div>
      </section>

      {/* Directory Content Sections */}
      <section id="directory" className="bg-foundation-darkest py-12 md:py-20">
        <Container size="lg">
          <TeamDirectory members={members} />
        </Container>
      </section>
    </div>
  );
}
