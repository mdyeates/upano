import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Reveal } from "~/components/marketing/reveal";
import type { FaqItem } from "~/content/marketing";

export function FaqSection({
  header,
  items,
}: {
  header: { eyebrow: string; title: string; };
  items: FaqItem[];
}) {
  return (
    <section id="faq" className="bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-20 lg:py-28">
        <Reveal>
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-brand-500">
              {header.eyebrow}
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              {header.title}
            </h2>
          </div>
        </Reveal>

        <Reveal>
          <Accordion
            type="single"
            collapsible
            className="mx-auto mt-10 max-w-3xl"
          >
            {items.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
