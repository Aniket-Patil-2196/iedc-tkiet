import { constructMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { PageHeading } from "@/components/ui/PageHeading";
import { getPublishedGalleryImages } from "@/lib/db/queries";
import { GalleryExperience } from "@/components/gallery/GalleryExperience";

export const metadata = constructMetadata({
  title: "Interactive 3D Photo Gallery",
  description:
    "Explore the visual archive and interactive 3D spherical showcase of IEDC TKIET events, workshops, and student prototypes.",
  path: "/gallery",
});

export default async function GalleryPage() {
  const images = await getPublishedGalleryImages();

  return (
    <div className="flex flex-col flex-1">
      <Section spacing="lg" hasAsymmetricGrid>
        <Container size="lg">
          <PageHeading
            badge="Visual Innovation Archive"
            title="Moments in Motion."
            subtitle="An immersive 3D spatial experience celebrating campus ideations, engineering hackathons, and hardware milestones."
          />

          <div className="my-10">
            <GalleryExperience images={images} />
          </div>
        </Container>
      </Section>
    </div>
  );
}

