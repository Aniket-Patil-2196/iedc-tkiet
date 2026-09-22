import { constructMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { PageHeading } from "@/components/ui/PageHeading";
import { CollaborationsShowcase } from "@/components/collaborations/CollaborationsShowcase";
import { getPublishedCollaborations } from "@/lib/db/queries";
import { TeamHeroCanvas } from "@/components/team/TeamHeroCanvas";
import { ArrowDown } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = constructMetadata({
  title: "Collaborations",
  description:
    "Institutional partnerships and strategic networks of IEDC TKIET, including NEC and IIC.",
  path: "/collaborations",
});

export default async function CollaborationsPage() {
  const collaborations = await getPublishedCollaborations();

  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden bg-foundation-darkest">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden border-b border-foundation-slate/40 flex flex-col justify-between items-center text-center px-4 pt-4 pb-6 min-h-[560px]"
        style={{ height: "calc(100svh - var(--header-height, 4rem))" }}
      >
        {/* Starfield canvas — Gemini + Boötes constellations */}
        <TeamHeroCanvas section="collaborations" variant="hero" />

        {/* Ambient radial glow */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          aria-hidden="true"
        >
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-brand-blue/15 blur-[120px]" />
        </div>

        {/* Vertically-centred heading with readability scrim */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full -translate-y-7 sm:-translate-y-9 md:-translate-y-12 lg:-translate-y-14">
          <div className="rounded-3xl px-6 py-8 sm:px-10 sm:py-10 [background:radial-gradient(ellipse_at_center,rgba(8,10,15,0.76)_0%,rgba(8,10,15,0.52)_55%,transparent_100%)] backdrop-blur-[2px]">
            <PageHeading
              badge="Strategic Alliances"
              title="Institutional Collaborations"
              subtitle="Bridging campus innovation with national incubation programs, entrepreneurship councils, and academic ecosystems."
            />
          </div>
        </div>

        {/* Scroll cue */}
        <a
          href="#collaborations-list"
          aria-label="Scroll to collaborations"
          className="relative z-10 flex flex-col items-center gap-1 text-foundation-muted/60 hover:text-brand-cyan transition-colors duration-200 pb-2"
        >
          <span className="text-[10px] tracking-[0.2em] uppercase font-medium">
            Explore
          </span>
          <ArrowDown size={14} className="animate-bounce" />
        </a>
      </section>

      {/* ── Collaborations List ───────────────────────────────────────────── */}
      <Section
        spacing="lg"
        className="bg-foundation-darkest"
        id="collaborations-list"
      >
        <Container size="lg">
          <CollaborationsShowcase collaborations={collaborations} />
        </Container>
      </Section>
    </div>
  );
}
