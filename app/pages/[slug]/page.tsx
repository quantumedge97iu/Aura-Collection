import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialBand, EditorialSplit } from "@/components/editorial-blocks";
import { editorialLanding } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await editorialLanding(slug);
  if (!page) return { title: "Page" };
  return { title: page.seo?.title || page.title, description: page.seo?.description };
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await editorialLanding(slug);
  if (!page) notFound();
  return (
    <>
      {page.sections?.map((section) => {
        if (section._type === "editorialSplit" && section.title) {
          return <EditorialSplit key={section._key} eyebrow={section.eyebrow || page.eyebrow} title={section.title} paragraphs={section.paragraphs} href={section.href} cta={section.cta} image={section.image} alt={section.alt} />;
        }
        if (section._type === "bannerSection" && section.title) {
          return <EditorialBand key={section._key} eyebrow={section.eyebrow} title={section.title} text={section.text} href={section.href} cta={section.cta} image={section.image} alt={section.alt} />;
        }
        return null;
      })}
    </>
  );
}
