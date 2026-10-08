import type { CmsBlock } from "@/lib/sanity/types";

function textOf(block: CmsBlock) {
  return (block.children ?? []).map((child) => child.text ?? "").join("");
}

export function Portable({ value }: { value?: CmsBlock[] | null }) {
  if (!value?.length) return null;
  return (
    <div className="space-y-4">
      {value.map((block, index) => {
        const text = textOf(block);
        if (!text) return null;
        const key = block._key ?? `${index}-${text.slice(0, 12)}`;
        if (block.style === "h2") return <h2 key={key} className="font-serif text-3xl text-cream">{text}</h2>;
        if (block.style === "h3") return <h3 key={key} className="font-serif text-2xl text-cream">{text}</h3>;
        if (block.listItem) return <p key={key} className="border-l border-gold/50 pl-3 text-sm leading-7 text-cream/85">{text}</p>;
        return <p key={key} className="text-sm leading-7 text-mute">{text}</p>;
      })}
    </div>
  );
}
