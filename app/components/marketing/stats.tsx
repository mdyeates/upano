import { Reveal, RevealItem } from "~/components/marketing/reveal";
import { TickUpNumber } from "~/components/marketing/tick-up-number";
import type { Metric, MetricFormat } from "~/content/marketing";

const formatters: Record<MetricFormat, (n: number) => string> = {
  integer: (n) => `${Math.round(n)}`,
  percent: (n) => `${Math.round(n)}%`,
  "literal-zero": () => "0",
};

export function StatsSection({ metrics }: { metrics: Metric[] }) {
  return (
    <section className="bg-brand-50/60 dark:bg-brand-50/60">
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <Reveal stagger className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {metrics.map((m) => (
            <RevealItem
              key={m.label}
              className="flex flex-col items-center text-center"
            >
              <TickUpNumber
                to={m.to}
                format={formatters[m.format]}
                className="font-heading text-4xl font-bold tracking-tight tabular-nums text-brand-900 sm:text-5xl"
              />
              <div className="mt-2 text-sm text-muted-foreground">
                {m.label}
              </div>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
