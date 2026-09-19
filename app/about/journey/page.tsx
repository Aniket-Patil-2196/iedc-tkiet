import { constructMetadata } from "@/lib/seo/metadata";
import { getJourneyMilestones } from "@/lib/db/queries";
import { JourneySpaceSection } from "@/components/journey/JourneySpaceSection";

export const dynamic = "force-dynamic";

export const metadata = constructMetadata({
  title: "Journey Through Innovation | IEDC TKIET",
  description:
    "Explore the interactive evolutionary milestone journey of IEDC TKIET Warananagar from foundation to ecosystem impact.",
  path: "/about/journey",
});

export default async function JourneyDedicatedPage() {
  const milestones = await getJourneyMilestones();

  return (
    <main className="flex flex-col flex-1 w-full overflow-x-clip bg-[#080A0F]">
      <JourneySpaceSection milestones={milestones} />
    </main>
  );
}
