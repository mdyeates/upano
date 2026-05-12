import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router";
import { Reveal } from "~/components/marketing/reveal";
import { Button } from "~/components/ui/button";

export function CtaSection() {
  return (
    <section className="bg-brand-300/30 dark:bg-brand-100/40">
      <div className="container mx-auto max-w-4xl px-4 py-20 text-center lg:py-28">
        <Reveal>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-brand-900 sm:text-5xl">
            Onboard your team in 30 seconds.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            One account per engineer. The audit trail starts with your first bug
            — no setup, no opt-in.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="pill-sm" className="group">
              <Link to="/register">
                Get started
                <ArrowRightIcon className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
