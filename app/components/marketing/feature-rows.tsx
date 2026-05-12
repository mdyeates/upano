import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router";
import { Pill, PillIndicator } from "~/components/kibo-ui/pill";
import { Reveal } from "~/components/marketing/reveal";
import { Button } from "~/components/ui/button";

type FeatureRowProps = {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  imageRight?: boolean;
  cta?: { label: string; to: string };
  badge?: string;
  image: { src: string; alt: string };
};

function FeatureRow({
  eyebrow,
  title,
  body,
  bullets,
  imageRight = false,
  cta,
  badge,
  image,
}: FeatureRowProps) {
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

export function FeatureRowsSection() {
  return (
    <section className="bg-brand-50/60 dark:bg-brand-50/60">
      <div className="container mx-auto max-w-6xl px-4 py-20 lg:py-28">
        <div className="space-y-24">
          <FeatureRow
            eyebrow="State machine"
            title="No bug ever skips a state."
            body="Each bug moves through a finite set of statuses with explicit allowed transitions per role. The server defines the graph; the client only renders the buttons the graph allows."
            bullets={[
              "States: New → Triaged → In Progress → In Review → Resolved → Closed.",
              "Per-role rules: Reporters can re-open, only Admins can force close.",
            ]}
            badge="Server-enforced"
            image={{
              src: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=1600&auto=format&fit=crop",
              alt: "A workflow diagram drawn on a whiteboard with sticky notes for each state",
            }}
          />

          <FeatureRow
            imageRight
            eyebrow="Audit trail"
            title="Every change is recorded forever."
            body="Comments and audit events are insert only at the database level. Edits create a new revision row; deletes are soft-deletes. Diff every field, replay any bug's lifetime, satisfy any internal change management review."
            bullets={[
              "Who changed what, when, and to what value. All captured at write time.",
              "Comments are immutable, edits create a new row with a parent_id",
            ]}
            image={{
              src: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop",
              alt: "A motherboard close-up suggesting structured rows of data",
            }}
          />

          <FeatureRow
            eyebrow="Role separation"
            title="Each role sees only what it needs."
            body="Reporter, SDE, and Admin land in different default views, get different actions, and pass through different validation rules. RBAC is checked at the API layer on every request, the UI rendering is a hint, not the source of truth."
            bullets={[
              "Reporter: submit, watch, comment on bugs they reported or watch",
              "SDE: full triage queue, assign, transition states, comment",
              "Admin: manage users, force-close, export audit, override workflow",
            ]}
            image={{
              src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop",
              alt: "A team of engineers around a laptop discussing work",
            }}
          />
        </div>
      </div>
    </section>
  );
}
