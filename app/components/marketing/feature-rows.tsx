import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router";

import { Pill, PillIndicator } from "~/components/kibo-ui/pill";
import { Reveal } from "~/components/marketing/reveal";
import { Button } from "~/components/ui/button";
import type { FeatureRow as FeatureRowData } from "~/content/marketing";

function FeatureRow({
  eyebrow,
  title,
  body,
  bullets,
  imageRight = false,
  cta,
  badge,
  image,
}: FeatureRowData) {
  return (
    <Reveal>
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className={imageRight ? "lg:order-1" : "lg:order-2"}>
          <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-border">
            <img
              src={image.src}
              alt={image.alt}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        <div className={imageRight ? "lg:order-2" : "lg:order-1"}>
          {badge && (
            <Pill className="mb-4 w-fit">
              <PillIndicator variant="success" pulse />
              {badge}
            </Pill>
          )}
          <p className="text-sm font-medium uppercase tracking-wide text-brand-500">
            {eyebrow}
          </p>
          <h3 className="mt-2 font-heading text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
            {title}
          </h3>
          <p className="mt-4 text-muted-foreground">{body}</p>
          <ul className="mt-6 space-y-2 text-sm text-foreground">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span
                  aria-hidden
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500"
                />
                {b}
              </li>
            ))}
          </ul>
          {cta && (
            <Button asChild variant="outline" className="mt-8">
              <Link to={cta.to}>
                {cta.label}
                <ArrowRightIcon className="ml-1 size-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Reveal>
  );
}

export function FeatureRowsSection({ rows }: { rows: FeatureRowData[] }) {
  return (
    <section className="bg-brand-50/60 dark:bg-brand-50/60">
      <div className="container mx-auto max-w-6xl px-4 py-20 lg:py-28">
        <div className="space-y-24">
          {rows.map((row) => (
            <FeatureRow key={row.title} {...row} />
          ))}
        </div>
      </div>
    </section>
  );
}
