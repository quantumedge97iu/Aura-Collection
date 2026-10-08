import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialSplit } from "@/components/editorial-blocks";
import { Portable } from "@/components/portable";
import { Container } from "@/components/ui";
import { editorialCampaign } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await editorialCampaign(slug);
  if (!campaign) return { title: "Campaign" };
  return { title: campaign.seo?.title || campaign.title, description: campaign.seo?.description || campaign.summary };
}

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = await editorialCampaign(slug);
  if (!campaign) notFound();
  return (
    <>
      <EditorialSplit eyebrow={campaign.eyebrow} title={campaign.title} paragraphs={campaign.summary ? [campaign.summary] : []} href={campaign.href} cta={campaign.cta} image={campaign.image} alt={campaign.alt} />
      {campaign.body?.length ? (
        <Container className="pb-14">
          <div className="max-w-3xl">
            <Portable value={campaign.body} />
          </div>
        </Container>
      ) : null}
    </>
  );
}
