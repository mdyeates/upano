import {
  ScrollTextIcon,
  ShieldCheckIcon,
  UsersIcon,
  WorkflowIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Reveal, RevealItem } from "~/components/marketing/reveal";
import type { Feature, FeatureIconKey } from "~/content/marketing";

const ICONS: Record<FeatureIconKey, LucideIcon> = {
  users: UsersIcon,
  workflow: WorkflowIcon,
  scrollText: ScrollTextIcon,
  shieldCheck: ShieldCheckIcon,
};

export function FeaturesSection({
  header,
  features,
}: {
  header: { eyebrow: string; title: string; body: string };
  features: Feature[];
}) {
  return (
    <section id="features" className="bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-20 lg:py-28">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-brand-500">
              {header.eyebrow}
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              {header.title}
            </h2>
            <p className="mt-4 text-muted-foreground">{header.body}</p>
          </div>
        </Reveal>

        <Reveal
          stagger
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((f) => {
            const Icon = ICONS[f.iconKey];
            return (
              <RevealItem
                key={f.title}
                className="group relative rounded-xl border border-border bg-card p-6 transition-colors hover:border-foreground/20"
              >
                <Icon className="size-6 text-brand-900" strokeWidth={1.5} />
                <h3 className="mt-4 font-heading text-lg font-semibold text-brand-900">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </RevealItem>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
