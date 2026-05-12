import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Reveal } from "~/components/marketing/reveal";

const faqs = [
  {
    q: "What problem is Upano solving?",
    a: 'Most teams track bugs in a mix of Slack channels, a shared Quip, and the occasional ticket. By Friday nobody can answer "when did we change the priority on BUG-487 and who approved it?". Upano replaces that with a single source of truth, giving every stakeholder the visibility to track defects from to resolution.',
  },
  {
    q: "What stack does it use?",
    a: "React Router 7 in framework mode, Tailwind CSS v4, shadcn/ui + Kibo UI + useLayouts for components, Drizzle ORM over Postgres on Neon, packaged as a Docker image, deployed via GitHub Actions CI/CD with separate staging and production environments and required-reviewer protection on production deploys.",
  },
  {
    q: "Why a server-side state machine?",
    a: "A bug cannot move from New straight to Resolved through a stray request, regardless of what the client UI offers. Allowed transitions per role are defined server-side; an attempted invalid transition returns a 409 with the allowed transition set in the response body. The state graph is a single source of truth and the audit trail stays meaningful.",
  },
  {
    q: "How is the audit trail enforced?",
    a: "Audit events are insert-only at the database level, there is no UPDATE statement targeting the audit table anywhere in the data layer. Comments are immutable, edits create a new row with a parent_id pointer. Soft deletes only. Admins can export a time-windowed CSV or JSON of every audit event for compliance review.",
  },
  {
    q: "How is security handled?",
    a: "Server-side input validation on every form (A03 Injection, A04 Insecure Design). Parameterised queries via Drizzle (A03). Role-based access enforced at the API layer (A01 Broken Access Control). Secure session handling with HttpOnly + SameSite cookies (A07 Identification and Authentication Failures). CSRF protection on state-changing endpoints. Full mitigation evidence is in the project repository.",
  },
  {
    q: "How do I run it locally?",
    a: "Clone the repo, copy .env.example to .env (Postgres connection string + auth secret), run npm install && npm run db:migrate && npm run dev. Full instructions live in the README. The CI pipeline runs typecheck, lint, format check, and unit tests on every push and pull request.",
  },
  {
    q: "Does it support real-time updates?",
    a: "Not in the initial release. Server-Sent Events for live status updates and presence are on the roadmap; the architecture leaves the door open. The trade-off was deliberate, the audit trail and state machine were the load-bearing requirements; realtime is decoration.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-20 lg:py-28">
        <Reveal>
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-brand-500">
              Questions
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              Frequently asked
            </h2>
            <p className="mt-4 text-muted-foreground">
              If your question isn&apos;t here, open an issue on the repo.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <Accordion
            type="single"
            collapsible
            className="mx-auto mt-10 max-w-3xl"
          >
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
