import {
  ShieldCheckIcon,
  WorkflowIcon,
  ScrollTextIcon,
  UsersIcon,
} from "lucide-react";

import { Reveal, RevealItem } from "~/components/marketing/reveal";

const features = [
  {
    icon: UsersIcon,
    title: "Role-based access control",
    body: "Reporter, SDE, and Admin each see only the views and actions their role permits. Authorisation is checked server-side on every request, not in the UI.",
  },
  {
    icon: WorkflowIcon,
    title: "Server-enforced state machine",
    body: "A bug cannot skip from New to Resolved through a stray request. The valid transitions for each role are defined server-side and rejected with a 409 if violated.",
  },
  {
    icon: ScrollTextIcon,
    title: "Append-only audit trail",
    body: "Every status change, comment, and assignment writes a row that can never be edited or deleted. Replay any bug's lifetime, export for compliance.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Validated and OWASP-tested",
    body: "Server-side input validation on every form. Parameterised queries, output escaping, secure session handling. Mitigates the OWASP Top 10 categories that apply to a tool of this shape.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-20 lg:py-28">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-brand-500">
              What your team gets
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              A platform you&apos;d trust with prod incidents.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Four foundations. Visibility is in the detail.
            </p>
          </div>
        </Reveal>

        <Reveal
          stagger
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((f) => {
            const Icon = f.icon;
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
