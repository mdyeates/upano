import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router";

import { Button } from "~/components/ui/button";
import type { HeroContent } from "~/content/marketing";

export function HeroSection({ content }: { content: HeroContent }) {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <h1 className="font-heading text-balance text-5xl font-bold tracking-tight text-brand-900 sm:text-6xl lg:text-7xl">
              {content.title.map((line, i) => (
                <span key={line}>
                  {line}
                  {i < content.title.length - 1 && <br />}
                </span>
              ))}
            </h1>

            <p className="max-w-xl text-lg text-muted-foreground">
              {content.body}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="pill-sm" variant="outline" asChild>
                <a href={content.secondaryCta.href}>
                  {content.secondaryCta.label}
                </a>
              </Button>
              <Button asChild size="pill-sm" className="group">
                <Link to={content.primaryCta.to} prefetch="intent">
                  {content.primaryCta.label}
                  <ArrowRightIcon className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-border shadow-xl">
              <img
                src={content.image.src}
                alt={content.image.alt}
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
            <div
              aria-hidden
              className="absolute -inset-x-12 -inset-y-12 -z-10 rounded-3xl bg-gradient-to-tr from-primary/5 via-transparent to-primary/10 blur-3xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
