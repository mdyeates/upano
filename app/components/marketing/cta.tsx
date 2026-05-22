import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router";

import { Reveal } from "~/components/marketing/reveal";
import { Button } from "~/components/ui/button";
import type { CTA as CtaContent } from "~/content/marketing";

export function CtaSection({ content }: { content: typeof CtaContent }) {
  return (
    <section className="bg-brand-300/30 dark:bg-brand-100/40">
      <div className="container mx-auto max-w-4xl px-4 py-20 text-center lg:py-28">
        <Reveal>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-brand-900 sm:text-5xl">
            {content.title}
          </h2>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="pill-sm" className="group">
              <Link to={content.primary.to} prefetch="intent">
                {content.primary.label}
                <ArrowRightIcon className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
