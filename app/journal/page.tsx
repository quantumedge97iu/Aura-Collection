import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container, PageHeader } from "@/components/ui";
import { editorialPosts } from "@/lib/cms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal",
  description: "Notes from the house on gold, hallmarks, and how a piece is worn.",
};

export default async function JournalPage() {
  const posts = (await editorialPosts()) ?? [];
  return (
    <Container className="py-10 sm:py-14">
      <PageHeader eyebrow="The House" title="Journal" subtitle="Notes on gold, hallmarks, and how a piece is worn." />
      {posts.length === 0 ? (
        <p className="mt-8 text-sm text-mute">Published notes will appear here.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {posts.map((post) => (
            <Link key={post.slug} href={`/journal/${post.slug}`} className="border border-gold/25 bg-card">
              {post.image ? (
                <div className="relative aspect-[16/10]">
                  <Image src={post.image} alt={post.alt || post.title} fill className="object-cover" sizes="(min-width:640px) 50vw, 100vw" />
                </div>
              ) : null}
              <div className="p-5">
                <h2 className="font-serif text-3xl text-cream">{post.title}</h2>
                {post.excerpt ? <p className="mt-2 text-sm leading-6 text-mute">{post.excerpt}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
