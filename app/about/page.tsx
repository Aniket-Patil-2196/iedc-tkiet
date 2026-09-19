import { constructMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/animation/Reveal";
import { GravityMeshCanvas } from "@/components/ui/GravityMeshCanvas";
import { IedcOrbitalNode } from "@/components/ui/IedcOrbitalNode";
import { CelestialDirectionSection } from "@/components/about/CelestialDirectionSection";
import { ArrowRight, Users } from "lucide-react";
import { getAboutContent, getJourneyMilestones } from "@/lib/db/queries";
import { JourneySpaceSection } from "@/components/journey/JourneySpaceSection";

export const dynamic = "force-dynamic";

export const metadata = constructMetadata({
  title: "About IEDC",
  description:
    "Learn about the mission, vision, and institutional innovation ecosystem of the Innovation and Entrepreneurship Development Cell at TKIET Warananagar.",
  path: "/about",
});

export default async function AboutPage() {
  const [content, milestones] = await Promise.all([
    getAboutContent(),
    getJourneyMilestones(),
  ]);

  return (
    <div className="flex flex-col flex-1 w-full overflow-x-clip">
      {/* 1. Editorial Page Opening: Two-Column Composition with Interactive Gravity Mesh */}
      <Section
        spacing="none"
        className="border-b border-slate-800/80 bg-[#080A0F] relative overflow-hidden select-none min-h-[70vh] lg:min-h-[75vh] flex items-center"
        style={{
          paddingTop: "clamp(64px, 6vw, 96px)",
          paddingBottom: "clamp(70px, 8vw, 120px)",
        }}
      >
        {/* Interactive Technical Gravity Mesh Canvas */}
        <GravityMeshCanvas gridStep={44} influenceRadius={165} maxDisplacement={13} />

        {/* Soft Ambient Radial Illumination */}
        <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-[550px] h-[420px] bg-brand-blue/5 rounded-full blur-[140px] pointer-events-none" />

        <Container size="lg" className="relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: ~55% Width (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Eyebrow */}
              <Reveal variant="fade-up">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-cyan/30 bg-brand-blue/10 text-xs font-bold text-brand-cyan tracking-[0.25em] uppercase shadow-[0_0_12px_rgba(56,189,248,0.1)]">
                  <span>✦</span>
                  <span>IEDC / ABOUT</span>
                </div>
              </Reveal>

              {/* Main Heading in Syne */}
              <Reveal variant="fade-up" delayMs={100}>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-typo-white leading-[1.08] text-balance">
                  Building a Culture of
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-brand-cyan/90">
                    Systematic Innovation.
                  </span>
                </h1>
              </Reveal>

              {/* Concise Primary & Secondary Editorial Descriptions */}
              <Reveal variant="fade-up" delayMs={200}>
                <div className="space-y-3.5 max-w-2xl">
                  <p className="font-sans text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                    The Innovation and Entrepreneurship Development Cell (IEDC) at Tatyasaheb Kore Institute of Engineering and Technology (TKIET), Warananagar, nurtures student innovators, engineering thinkers, and emerging venture creators.
                  </p>
                  <p className="font-sans text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
                    We connect students with mentors, resources, and opportunities that help transform academic ideas into practical innovation.
                  </p>
                </div>
              </Reveal>
            </div>

            {/* Right Column: ~45% Width (lg:col-span-5) - Interactive IEDC Innovation Node */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <Reveal variant="fade-in" delayMs={200}>
                <IedcOrbitalNode />
              </Reveal>
            </div>

          </div>
        </Container>
      </Section>

      {/* 2. Celestial Direction: Unified Vision + Mission with Interactive Observatory Telescope */}
      <CelestialDirectionSection vision={content.vision} mission={content.mission} />


      {/* 3. The Road of Evolution: Interactive Space Exploration Journey */}
      <JourneySpaceSection milestones={milestones} />

      {/* 5. Leadership Teaser Section */}
      <Section spacing="xl" className="bg-foundation-darkest">
        <Container size="lg">
          <div className="max-w-3xl space-y-6">
            <Reveal variant="fade-up">
              <div className="inline-flex items-center gap-2 text-xs uppercase font-sans tracking-[0.2em] text-brand-cyan font-bold">
                <Users className="w-3.5 h-3.5" />
                Institutional Direction
              </div>
            </Reveal>

            <Reveal variant="fade-up" delayMs={100}>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-typo-white tracking-tight">
                Leadership Messages
              </h2>
            </Reveal>

            <Reveal variant="fade-up" delayMs={200}>
              <p className="font-sans text-base sm:text-lg text-typo-gray leading-relaxed">
                Guidance and visionary perspectives from the CEO, Principal, Dean, Faculty Coordinator, and Student President on steering entrepreneurial culture at TKIET.
              </p>
            </Reveal>

            <Reveal variant="fade-up" delayMs={300}>
              <div className="pt-2">
                <Button href="/about/leadership" variant="outline" size="md">
                  <span>Read Leadership Messages</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>
    </div>
  );
}
