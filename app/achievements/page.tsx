import { constructMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { PageHeading } from "@/components/ui/PageHeading";
import { getPublishedAchievements } from "@/lib/db/queries";
import { AchievementsArchive } from "@/components/achievements/AchievementsArchive";

export const dynamic = "force-dynamic";

export const metadata = constructMetadata({
  title: "Achievements & Milestones",
  description:
    "Recognitions, competition awards, patent disclosures, and entrepreneurial milestones accomplished by IEDC TKIET student innovators.",
  path: "/achievements",
});

export default async function AchievementsPage() {
  const achievements = await getPublishedAchievements();

  return (
    <div className="flex flex-col flex-1">
      <Section spacing="lg" hasAsymmetricGrid>
        <Container size="lg">
          <PageHeading
            badge="Verified Institutional Record"
            title="Proof of Possibility."
            subtitle="Celebrating student achievements in national hackathons, intellectual property publications, and entrepreneurial milestones."
          />

          <div className="my-10">
            <AchievementsArchive achievements={achievements} />
          </div>
        </Container>
      </Section>
    </div>
  );
}

