export type FeatureIconKey =
  | "users"
  | "workflow"
  | "scrollText"
  | "shieldCheck";

export type NavIconKey = "sparkles" | "workflow" | "helpCircle";

// =============================================================================
// Hero
// =============================================================================

export type HeroContent = {
  title: string[]; // each entry is a line
  body: string;
  primaryCta: { label: string; to: string };
  secondaryCta: { label: string; href: string };
  image: { src: string; alt: string };
};

export const HERO: HeroContent = {
  title: ["Every bug.", "Every change.", "Forever."],
  body: "Upano helps your team track bugs in production. Built for software teams that can't afford to lose context.",
  primaryCta: { label: "Get started", to: "/register" },
  secondaryCta: { label: "See how it compares", href: "#how-it-works" },
  image: {
    src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop",
    alt: "A laptop screen showing a data dashboard with charts and metrics",
  },
};

// =============================================================================
// Stats / Metrics
// =============================================================================

export type MetricFormat = "integer" | "percent" | "literal-zero";

export type Metric = {
  to: number;
  label: string;
  format: MetricFormat;
};

export const METRICS: Metric[] = [
  { to: 6, label: "User roles enforced", format: "integer" },
  { to: 12, label: "Status transitions audited", format: "integer" },
  { to: 100, label: "OWASP top 10 covered", format: "percent" },
  { to: 0, label: "Records ever silently changed", format: "literal-zero" },
];

// =============================================================================
// Features (icon + title + body cards)
// =============================================================================

export type Feature = {
  iconKey: FeatureIconKey;
  title: string;
  body: string;
};

export const FEATURES_HEADER = {
  eyebrow: "What your team gets",
  title: "A platform you'd trust with prod incidents.",
  body: "Four foundations. Visibility is in the detail.",
};

export const FEATURES: Feature[] = [
  {
    iconKey: "users",
    title: "Role-based access control",
    body: "Reporter, SDE, and Admin each see only the views and actions their role permits. Authorisation is checked server-side on every request, not in the UI.",
  },
  {
    iconKey: "workflow",
    title: "Server-enforced state machine",
    body: "A bug cannot skip from New to Resolved through a stray request. The valid transitions for each role are defined server-side and rejected with a 409 if violated.",
  },
  {
    iconKey: "scrollText",
    title: "Append-only audit trail",
    body: "Every status change, comment, and assignment writes a row that can never be edited or deleted. Replay any bug's lifetime, export for compliance.",
  },
  {
    iconKey: "shieldCheck",
    title: "Validated and OWASP-tested",
    body: "Server-side input validation on every form. Parameterised queries, output escaping, secure session handling. Mitigates the OWASP Top 10 categories that apply to a tool of this shape.",
  },
];

// =============================================================================
// Feature Rows (alternating image/text sections)
// =============================================================================

export type FeatureRow = {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  imageRight?: boolean;
  cta?: { label: string; to: string };
  badge?: string;
  image: { src: string; alt: string };
};

export const FEATURE_ROWS: FeatureRow[] = [
  {
    eyebrow: "State machine",
    title: "No bug ever skips a state.",
    body: "Each bug moves through a finite set of statuses with explicit allowed transitions per role. The server defines the graph; the client only renders the buttons the graph allows.",
    bullets: [
      "States: New \u2192 Triaged \u2192 In Progress \u2192 In Review \u2192 Resolved \u2192 Closed.",
      "Per-role rules: Reporters can re-open, only Admins can force close.",
    ],
    badge: "Server-enforced",
    image: {
      src: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=1600&auto=format&fit=crop",
      alt: "A workflow diagram drawn on a whiteboard with sticky notes for each state",
    },
  },
  {
    imageRight: true,
    eyebrow: "Audit trail",
    title: "Every change is recorded forever.",
    body: "Comments and audit events are insert only at the database level. Edits create a new revision row; deletes are soft-deletes. Diff every field, replay any bug's lifetime, satisfy any internal change management review.",
    bullets: [
      "Who changed what, when, and to what value. All captured at write time.",
      "Comments are immutable, edits create a new row with a parent_id",
    ],
    image: {
      src: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop",
      alt: "A motherboard close-up suggesting structured rows of data",
    },
  },
  {
    eyebrow: "Role separation",
    title: "Each role sees only what it needs.",
    body: "Reporter, SDE, and Admin land in different default views, get different actions, and pass through different validation rules. RBAC is checked at the API layer on every request, the UI rendering is a hint, not the source of truth.",
    bullets: [
      "Reporter: submit, watch, comment on bugs they reported or watch",
      "SDE: full triage queue, assign, transition states, comment",
      "Admin: manage users, force-close, export audit, override workflow",
    ],
    image: {
      src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop",
      alt: "A team of engineers around a laptop discussing work",
    },
  },
];

// =============================================================================
// Compare Table
// =============================================================================

export type CompareValue = "yes" | "no" | "partial";

export type CompareRow = {
  feature: string;
  bta: CompareValue;
  alt: CompareValue;
  note?: string;
};

export const COMPARE_HEADER = {
  eyebrow: "How it compares",
  title: "Slack DMs and a shared doc aren't a bug tracker.",
  body: "Here's what you stop losing the day you switch.",
};

export const COMPARE_ROWS: CompareRow[] = [
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
  {
    feature: "Zero setup \u2014 just paste in a channel",
    bta: "no",
    alt: "yes",
  },
];

// =============================================================================
// Carousel
// =============================================================================

export type CarouselItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

export const CAROUSEL_HEADING = "Three views into the same data.";

export const CAROUSEL_ITEMS: CarouselItem[] = [
  {
    id: "01",
    title: "Triage queue",
    description:
      "Group new bugs by priority and severity. Bulk-assign to an SDE, transition state, comment, all without leaving the keyboard.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop",
    imageAlt: "Upano queue view showing prioritised list of open bugs",
  },
  {
    id: "02",
    title: "Bug detail",
    description:
      "Description, attachments, transition history, and the full audit log of every change to the bug, all in one scrollable view.",
    image:
      "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1600&auto=format&fit=crop",
    imageAlt: "Bug detail page with status, assignee, and audit timeline",
  },
  {
    id: "03",
    title: "Audit & reports",
    description:
      "Time-windowed audit export, per-engineer triage throughput, mean-time-to-resolve. Manager-ready out of the box.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1600&auto=format&fit=crop",
    imageAlt: "Reports dashboard showing audit log export and team throughput",
  },
];

// =============================================================================
// FAQ
// =============================================================================

export type FaqItem = { q: string; a: string };

export const FAQ_HEADER = {
  eyebrow: "Questions",
  title: "Frequently asked",
  body: "If your question isn't here, open an issue on the repo.",
};

export const FAQS: FaqItem[] = [
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

// =============================================================================
// CTA
// =============================================================================

export const CTA = {
  title: "Onboard your team in 30 seconds.",
  body: "One account per engineer. The audit trail starts with your first bug \u2014 no setup, no opt-in.",
  primary: { label: "Get started", to: "/register" },
};

// =============================================================================
// Nav
// =============================================================================

export type NavTab = {
  id: string;
  label: string;
  iconKey: NavIconKey;
  anchor: string;
  color: string;
  bg: string;
};

export const NAV_TABS: NavTab[] = [
  {
    id: "features",
    label: "Features",
    iconKey: "sparkles",
    anchor: "features",
    color: "text-primary",
    bg: "bg-secondary",
  },
  {
    id: "how-it-works",
    label: "How it compares",
    iconKey: "workflow",
    anchor: "how-it-works",
    color: "text-primary",
    bg: "bg-secondary",
  },
  {
    id: "faq",
    label: "FAQ",
    iconKey: "helpCircle",
    anchor: "faq",
    color: "text-primary",
    bg: "bg-secondary",
  },
];

// =============================================================================
// Footer
// =============================================================================

export type FooterLink = { label: string; href: string; external?: boolean };
export type FooterColumn = { title: string; links: FooterLink[] };

export const FOOTER_TAGLINE =
  "An internal platform designed to track bugs at scale, giving your team clear visibility to triage them efficiently.";

export const FOOTER_CREDIT = "Personal Project built by Michael Yeates";

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "About the product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it compares", href: "#how-it-compares" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Engineering Links",
    links: [
      {
        label: "Repository",
        href: "https://github.com/mdyeates/BugTriageApp",
        external: true,
      },
      {
        label: "Pull requests",
        href: "https://github.com/mdyeates/BugTriageApp/pulls",
        external: true,
      },
      {
        label: "Issues",
        href: "https://github.com/mdyeates/BugTriageApp/issues",
        external: true,
      },
      {
        label: "CI status",
        href: "https://github.com/mdyeates/BugTriageApp/actions",
        external: true,
      },
    ],
  },
  {
    title: "Your Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/register" },
    ],
  },
];

// =============================================================================
// The full payload returned by home.tsx's loader.
// =============================================================================

export type MarketingContent = {
  hero: HeroContent;
  metrics: Metric[];
  featuresHeader: typeof FEATURES_HEADER;
  features: Feature[];
  featureRows: FeatureRow[];
  compareHeader: typeof COMPARE_HEADER;
  compareRows: CompareRow[];
  carouselHeading: string;
  carouselItems: CarouselItem[];
  faqHeader: typeof FAQ_HEADER;
  faqs: FaqItem[];
  cta: typeof CTA;
  navTabs: NavTab[];
  footerTagline: string;
  footerCredit: string;
  footerColumns: FooterColumn[];
};

export const MARKETING_CONTENT: MarketingContent = {
  hero: HERO,
  metrics: METRICS,
  featuresHeader: FEATURES_HEADER,
  features: FEATURES,
  featureRows: FEATURE_ROWS,
  compareHeader: COMPARE_HEADER,
  compareRows: COMPARE_ROWS,
  carouselHeading: CAROUSEL_HEADING,
  carouselItems: CAROUSEL_ITEMS,
  faqHeader: FAQ_HEADER,
  faqs: FAQS,
  cta: CTA,
  navTabs: NAV_TABS,
  footerTagline: FOOTER_TAGLINE,
  footerCredit: FOOTER_CREDIT,
  footerColumns: FOOTER_COLUMNS,
};
