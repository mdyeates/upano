import { CheckIcon, MinusIcon, XIcon } from "lucide-react";

import { Reveal } from "~/components/marketing/reveal";
import type { CompareRow, CompareValue } from "~/content/marketing";

const Mark = ({ value }: { value: CompareValue }) => {
  if (value === "yes") return <CheckIcon className="size-5 text-emerald-500" />;
  if (value === "partial")
    return <MinusIcon className="size-5 text-amber-500" />;
  return <XIcon className="size-5 text-rose-500" />;
};

export function CompareSection({
  header,
  rows,
}: {
  header: { eyebrow: string; title: string; body: string };
  rows: CompareRow[];
}) {
  return (
    <section id="how-it-works" className="bg-brand-50/60 dark:bg-brand-50/60">
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

        <Reveal className="mt-12 overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Feature
                </th>
                <th className="w-[120px] px-6 py-4 text-center text-sm font-medium text-brand-900">
                  Upano
                </th>
                <th className="w-[120px] px-6 py-4 text-center text-sm font-medium text-muted-foreground">
                  Slack
                </th>
                <th className="w-[140px] px-6 py-4 text-center text-sm font-medium text-muted-foreground">
                  Shared&nbsp;doc
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
                  <td className="px-6 py-4 text-center align-middle">
                    <div className="flex justify-center">
                      <Mark value={r.bta} />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center align-middle">
                    <div className="flex justify-center">
                      <Mark value={r.slack} />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center align-middle">
                    <div className="flex justify-center">
                      <Mark value={r.doc} />
                    </div>
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
