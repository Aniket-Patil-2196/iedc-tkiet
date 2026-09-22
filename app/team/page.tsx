import { constructMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { PageHeading } from "@/components/ui/PageHeading";
import { TeamDirectory } from "@/components/team/TeamDirectory";
import { getPublishedTeamMembers } from "@/lib/db/queries";
import { EventHeroCanvas } from "@/components/events/EventHeroCanvas";

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
      {/* Hero Section with calm galaxy starfield */}
      <Section spacing="lg" hasAsymmetricGrid className="relative border-b border-foundation-slate/50 overflow-hidden">
        <EventHeroCanvas variant="calm" />
        <Container size="lg" className="relative z-10">
          <PageHeading
            badge="Innovation Stewards"
            title="The IEDC Team"
            subtitle="The passionate student innovators and distinguished faculty mentors collaborating across engineering disciplines at TKIET."
          />
        </Container>
      </Section>

      {/* Directory Content Sections */}
      <Section spacing="none" className="bg-foundation-darkest py-12 md:py-20">
        <Container size="lg">
          <TeamDirectory members={members} />
        </Container>
      </Section>
    </div>
  );
}
