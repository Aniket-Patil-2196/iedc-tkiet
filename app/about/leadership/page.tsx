import { constructMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { PageHeading } from "@/components/ui/PageHeading";
import { LeadershipList } from "@/components/leadership/LeadershipList";
import { getLeadershipMessages } from "@/lib/db/queries";

export const metadata = constructMetadata({
  title: "Leadership Messages",
  description:
    "Institutional leadership messages guiding the Innovation & Entrepreneurship Development Cell at TKIET Warananagar.",
  path: "/about/leadership",
});

export default async function LeadershipPage() {
  const messages = await getLeadershipMessages();

  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden bg-foundation-darkest">
      <Section spacing="lg" hasAsymmetricGrid className="border-b border-foundation-slate/50">
        <Container size="lg">
          <PageHeading
            badge="Executive Guidance"
            title="Messages from Leadership"
            subtitle="Visionary statements from the institutional governance of TKIET and cell leadership on cultivating future-ready engineers and entrepreneurs."
          />
        </Container>
      </Section>

      <Section spacing="lg" className="bg-foundation-darkest">
        <Container size="lg">
          <LeadershipList messages={messages} />
        </Container>
      </Section>
    </div>
  );
}
