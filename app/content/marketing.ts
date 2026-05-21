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
  { to: 3, label: "Unique role permissions enforced server-side", format: "integer" },
  {
    to: 3,
    label: "CI/CD pipeline workflows running on every change",
    format: "integer",
  },
  { to: 100, label: "OWASP Top 10 addressed", format: "percent" },
  { to: 0, label: "Records silently changed", format: "literal-zero" },
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
  title: "A platform your team should trust with prod incidents.",
  body: "Upano is based on four foundations. ",
};

export const FEATURES: Feature[] = [
  {
    iconKey: "users",
    title: "Role based access control",
    body: "Reporter, SDE, and Admin each see only the views and actions their role permits. Authorisation is checked server-side on every request, and the client only ever renders actions the server will accept.",
  },
  {
    iconKey: "workflow",
    title: "Server enforced state machine",
    body: "A bug cannot skip from New to Resolved through a random request. The valid transitions for each role are enforced server side and rejected if violated. Keeping both the server and client in sync.",
  },
  {
    iconKey: "scrollText",
    title: "Append-only audit trail",
    body: "Every status change, comment, assignment, or role change writes a new audit row to keep track of changes your team has made.",
  },
  {
    iconKey: "shieldCheck",
    title: "Security",
    body: "Server side input validation, parameterised queries, RBAC, secure cookie flags, helmet CSP and HSTS, weekly CodeQL scans.",
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
    eyebrow: "Server side state management with RR7",
    title: "No bug ever skips a state.",
    body: "Each bug moves through a finite set of statuses with explicit allowed transitions per role. The client only renders the CX the server allows.",
    bullets: [
      "States: New \u2192 Triaged \u2192 In Progress \u2192 In Review \u2192 Resolved \u2192 Closed.",
      "Per-role rules: Reporters can re-open. Only Admins can force close.",
    ],
    image: {
      src: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=1600&auto=format&fit=crop",
      alt: "A workflow diagram drawn on a whiteboard with sticky notes for each state",
    },
  },
  {
    imageRight: true,
    eyebrow: "Audit trail",
    title: "Every change is recorded.",
    body: "Comments and audit events are insert only at the database level. Review and satisfy any internal change management reviews.",
    bullets: [
      "Who changed what, when, and to what value. All captured at write time.",
    ],
    image: {
      src: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop",
      alt: "A motherboard close-up suggesting structured rows of data",
    },
  },
  {
    eyebrow: "Role separation",
    title: "Each role sees only what it needs.",
    body: "Reporter, SDE, and Admin land have different available views and actions, and they pass through specific validation rules.",
    bullets: [
      "Reporter: file bugs, watch bugs they reported, comment, re-open",
      "SDE: full triage, assign, drive bugs to resolved",
      "Admin: manage roles, force-close, override workflow",
    ],
    image: {
      src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop",
      alt: "A team of engineers around a laptop discussing work",
    },
  },
  {
    imageRight: true,
    eyebrow: "Admin role management",
    title: "Change user roles and delegate new bugs.",
    body: "Admins manage roles in the UI. Every change writes a role_changed audit row with the actor, target, old role, and new role captured at write time. A self-demotion guard prevents an Admin from accidentally locking the org out of the admin role.",
    bullets: [
      "Server enforced layer to prevent a non-admin changing roles of other users",
      "Self demotion is blocked at the action layer",
      "Audit log shows who altered roles and when, surfaced on the admin page itself",
    ],
    image: {
      src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1600&auto=format&fit=crop",
      alt: "A close-up of a security badge clipped to a lanyard",
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
  slack: CompareValue;
  doc: CompareValue;
  note?: string;
};

export const COMPARE_HEADER = {
  eyebrow: "How it compares",
  title: "Slack DMs and a shared doc aren't a bug tracker.",
  body: "Both work for the first ten bugs. Both fall apart by month two. Here's what you stop losing the day you switch.",
};

export const COMPARE_ROWS: CompareRow[] = [
  {
    feature: "Different views and actions per teammate role",
    bta: "yes",
    slack: "no",
    doc: "no",
    note: "Reporters QA testers file bugs. SDEs work the queue. Admins manage the team.",
  },
  {
    feature: "Reporters see only the bugs they filed",
    bta: "yes",
    slack: "no",
    doc: "no",
    note: "Customer-reported bugs stay private to the reporter and your engineers.",
  },
  {
    feature: "Bug tickets can't skip steps: every change follows the rules",
    bta: "yes",
    slack: "no",
    doc: "no",
    note: "No bug ever silently jumps from 'new' to 'closed'.",
  },
  {
    feature: "Full history of who did what, it's never overwritten",
    bta: "yes",
    slack: "no",
    doc: "no",
    note: "Slack search isn't an audit trail. Docs let anyone edit history.",
  },
  {
    feature: "Comments and edits are kept forever as separate revisions",
    bta: "yes",
    slack: "partial",
    doc: "no",
    note: "Original comments are immutable; edits create a new revision pointing at the original.",
  },
  {
    feature: "Find any past bug by title, status, or reporter",
    bta: "yes",
    slack: "partial",
    doc: "partial",
  },
  {
    feature: "Admins can't accidentally lock the team out",
    bta: "yes",
    slack: "no",
    doc: "no",
  },
  {
    feature: "Works the same on phone, tablet, and desktop",
    bta: "yes",
    slack: "yes",
    doc: "partial",
  },
  {
    feature: "Built-in security testing and hardening",
    bta: "yes",
    slack: "no",
    doc: "no",
    note: "CodeQL SAST, OWASP Top 10 coverage, helmet CSP/HSTS, bcrypt-equivalent hashing, secure cookies, parameterised queries.",
  },
];

// =============================================================================
// FAQ
// =============================================================================

export type FaqItem = { q: string; a: string };

export const FAQ_HEADER = {
  eyebrow: "Questions",
  title: "Frequently asked",
};

export const FAQS: FaqItem[] = [
  {
    q: "What problem is Upano solving?",
    a: 'Most Amazon teams track bugs in a mix of Slack channels, a shared Quip, and the occasional JIRA ticket. By Friday nobody can answer "when did we change the priority on BUG-487 and who approved it?". Upano aims to replace this with a single source of truth, allowing every stakeholder the visibility to track defects from the initial report of a bug to its resolution.',
  },
  {
    q: "What stack does it use?",
    a: "React Router 7 framework mode, Tailwind, shadcn/Kibo/useLayouts for components, Drizzle ORM over Postgres on Neon for data and Neon Auth for identity. Express server with helmet (CSP, HSTS, frame-ancestors=none, form-action=self). Packaged as a Docker image and deployed via GitHub Actions, the pipeline runs typecheck, lint, format, tests, a Docker smoke build, and CodeQL SAST on every push + weekly, with required reviewer protections",
  },
  {
    q: "Why a server side state machine?",
    a: "A bug cannot move from New straight to Resolved through a stray request, regardless of what the client UI offers. Allowed transitions per role are defined server side with RR7; for example an attempted invalid transition returns a 409 with the allowed transition set in the response body. The state graph is a single source of truth and the audit trail stays meaningful.",
  },
  {
    q: "How is the audit trail enforced?",
    a: "Audit events are insert only at the database level there is no UPDATE or DELETE statement targeting the audit table anywhere in the codebase. Comments are immutable; edits create a new revision row pointing at the original via parent_id. Soft-deletes only. A Postgres CHECK constraint enforces the audit log's structural invariants: bug-scoped events have a non-null bug_id, role-changed events have a null bug_id with the target captured in metadata.",
  },
  {
    q: "How is security handled?",
    a: "Server side input validation on every form via Zod. Parameterised queries via Drizzle. Role-based access and authentication middleware enforced server-side on every request. Auth delegated to Neon Auth with HttpOnly + SameSite=Lax cookies. Same-origin form posts plus SameSite cookies handle the common CSRF vectors. Helmet sets a strict Content-Security-Policy, HSTS. CodeQL scans the code and the GitHub Actions workflows on every push, PR, and weekly. Security tested with SQL Map.",
  },
  {
    q: "How do I run it locally?",
    a: "Clone the repo, copy .env.example to .env (Postgres connection string + auth secret), run npm install && npm run db:migrate && npm run dev. Full instructions live in the README. The CI pipeline runs typecheck, lint, format check, and unit tests on every push and pull request.",
  },
];

// =============================================================================
// CTA
// =============================================================================

export const CTA = {
  title: "Onboard your team in 30 seconds.",
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
        href: "https://github.com/mdyeates/upano",
        external: true,
      },
      {
        label: "Pull requests",
        href: "https://github.com/mdyeates/upano/issues",
        external: true,
      },
      {
        label: "Issues",
        href: "https://github.com/mdyeates/BugTriageApp/issues",
        external: true,
      },
      {
        label: "CI status",
        href: "https://github.com/mdyeates/upano/actions",
        external: true,
      },
      {
        label: "Security scanning",
        href: "https://github.com/mdyeates/upano/security/code-scanning",
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
  faqHeader: FAQ_HEADER,
  faqs: FAQS,
  cta: CTA,
  navTabs: NAV_TABS,
  footerTagline: FOOTER_TAGLINE,
  footerCredit: FOOTER_CREDIT,
  footerColumns: FOOTER_COLUMNS,
};
