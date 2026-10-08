import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, PageHeader } from "@/components/ui";
import { editorialPolicy } from "@/lib/cms";
import { policies } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const published = await editorialPolicy(slug);
  const policy = published?.title ? published : policies[slug];
  if (!policy) return { title: "Policy" };
  return { title: published?.seo?.title || policy.title, description: published?.seo?.description };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const published = await editorialPolicy(slug);
  const policy = published?.title ? published : policies[slug];
  if (!policy) notFound();

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader eyebrow={policy.eyebrow || "Policy"} title={policy.title} />
      <div className="mt-8 max-w-3xl space-y-8">
        {(policy.blocks ?? []).map((block) => (
          <section key={block.heading ?? block.paragraphs?.[0]}>
            {block.heading ? <h2 className="font-serif text-3xl text-cream">{block.heading}</h2> : null}
            {block.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-sm leading-7 text-mute">{paragraph}</p>
            ))}
            {block.list ? (
              <ul className="mt-3 space-y-2 text-sm text-cream/85">
                {block.list.map((item) => (
                  <li key={item} className="border-l border-gold/50 pl-3">{item}</li>
                ))}
              </ul>
            ) : null}
            {block.table ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[280px] text-left text-sm">
                  <thead className="text-[11px] tracking-[0.16em] text-gold uppercase">
                    <tr>{(block.table.headers ?? []).map((header) => <th key={header} className="border-b border-line py-2 pr-4 font-medium">{header}</th>)}</tr>
                  </thead>
                  <tbody>
                    {(block.table.rows ?? []).map((row) => (
                      <tr key={row.join("-")}>
                        {row.map((cell) => <td key={cell} className="border-b border-line/70 py-2 pr-4 text-cream">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </Container>
  );
}
