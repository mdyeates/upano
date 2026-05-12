import { CheckIcon, MinusIcon, XIcon } from "lucide-react";
import { Reveal } from "~/components/marketing/reveal";

const rows: Array<{
  feature: string;
  bta: "yes" | "no" | "partial";
  alt: "yes" | "no" | "partial";
  note?: string;
}> = [
  {
    feature: "Role-based access (Reporter / SDE / Admin)",
    bta: "yes",
    alt: "no",
  },
  { feature: "Enforced state machine on transitions", bta: "yes", alt: "no" },
  {
    feature: "Append-only audit trail",
    bta: "yes",
    alt: "partial",
    note: "Slack search isn't an audit trail",
  },
  { feature: "Searchable bug history", bta: "yes", alt: "partial" },
  { feature: "Server-side input validation", bta: "yes", alt: "no" },
  { feature: "OWASP-mitigated by design", bta: "yes", alt: "no" },
  { feature: "Bulk-action triage on multiple bugs", bta: "yes", alt: "no" },
  { feature: "Zero setup — just paste in a channel", bta: "no", alt: "yes" },
];

const Mark = ({ value }: { value: "yes" | "no" | "partial" }) => {
  if (value === "yes") return <CheckIcon className="size-5 text-emerald-500" />;
  if (value === "partial")
    return <MinusIcon className="size-5 text-amber-500" />;
  return <XIcon className="size-5 text-rose-500" />;
};

export function CompareSection() {
  return (
    <section id="how-it-works" className="bg-brand-50/60 dark:bg-brand-50/60">
      <div className="container mx-auto max-w-6xl px-4 py-20 lg:py-28">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-brand-500">
              How it compares
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              Slack DMs and a shared doc aren&apos;t a bug tracker.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Here&apos;s what you stop losing the day you switch.
            </p>
          </div>
        </Reveal>

        <Reveal className="mt-12 overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Feature
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-brand-900">
                  Upano
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-muted-foreground">
                  Slack&nbsp;+&nbsp;shared&nbsp;doc
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.feature}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="px-6 py-4 text-sm text-foreground">
                    {r.feature}
                    {r.note && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {r.note}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Mark value={r.bta} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Mark value={r.alt} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}
