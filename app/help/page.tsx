import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { Container, PageHeader } from "@/components/ui";
import { editorialFaqs } from "@/lib/cms";
import { faqs as fallbackFaqs } from "@/lib/content";

export const metadata: Metadata = {
  title: "Help",
  description: "Delivery, returns, payments, and how to reach Aura Loom Diamond.",
};

export default async function HelpPage() {
  const published = await editorialFaqs();
  const faqs = published?.length ? published.map((item) => ({ q: item.question, a: item.answer })) : fallbackFaqs;
  return (
    <Container className="py-10 sm:py-14">
      <PageHeader eyebrow="Care" title="Help & FAQ" subtitle="Delivery, hallmarks, returns, and the studio line." />
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="divide-y divide-line border-y border-line">
          {faqs.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="cursor-pointer list-none font-serif text-2xl text-cream">{item.q}</summary>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-mute">{item.a}</p>
            </details>
          ))}
        </div>
        <section id="contact">
          <h2 className="font-serif text-3xl text-cream">Contact the studio</h2>
          <p className="mt-2 text-sm text-mute">fatahfizza07@gmail.com · 03200005764 · Karachi</p>
          <div className="mt-5">
            <ContactForm />
          </div>
        </section>
      </div>
    </Container>
  );
}
