import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Portable } from "@/components/portable";
import { Container, PageHeader } from "@/components/ui";
import { editorialPost } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await editorialPost(slug);
  if (!post) return { title: "Journal" };
  return { title: post.seo?.title || post.title, description: post.seo?.description || post.excerpt };
}

export default async function JournalPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await editorialPost(slug);
  if (!post) notFound();
  return (
    <Container className="py-10 sm:py-14">
      <PageHeader eyebrow={post.author || "The House"} title={post.title} subtitle={post.excerpt} />
      {post.image ? (
        <div className="relative mt-8 aspect-[16/8] overflow-hidden border border-gold/25">
          <Image src={post.image} alt={post.alt || post.title} fill className="object-cover" sizes="100vw" priority />
        </div>
      ) : null}
      <div className="mt-8 max-w-3xl">
        <Portable value={post.body} />
      </div>
    </Container>
  );
}
