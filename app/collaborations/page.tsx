import { constructMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { PageHeading } from "@/components/ui/PageHeading";
import { CollaborationsShowcase } from "@/components/collaborations/CollaborationsShowcase";
import { getPublishedCollaborations } from "@/lib/db/queries";

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
      <Section spacing="lg" hasAsymmetricGrid className="border-b border-foundation-slate/50">
        <Container size="lg">
          <PageHeading
            badge="Strategic Alliances"
            title="Institutional Collaborations"
            subtitle="Bridging campus innovation with national incubation programs, entrepreneurship councils, and academic ecosystems."
          />
        </Container>
      </Section>

      <Section spacing="lg" className="bg-foundation-darkest">
        <Container size="lg">
          <CollaborationsShowcase collaborations={collaborations} />
        </Container>
      </Section>
    </div>
  );
}
