import { Link } from "react-router";

const columns: Array<{
  title: string;
  links: Array<{ label: string; href: string; external?: boolean }>;
}> = [
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

export function FooterSection() {
  return (
    <footer className="bg-brand-100 dark:bg-brand-100">
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <span
                aria-hidden
                className="inline-block size-6 rounded bg-foreground"
              />
              Upano
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              An internal platform designed to track bugs at scale, giving your
              team clear visibility to triage them efficiently.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-brand-900">
                {col.title}
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map((l) =>
                  l.external ? (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground transition-colors hover:text-brand-900"
                      >
                        {l.label}
                      </a>
                    </li>
                  ) : (
                    <li key={l.label}>
                      {l.href.startsWith("#") ? (
                        <a
                          href={l.href}
                          className="text-muted-foreground transition-colors hover:text-brand-900"
                        >
                          {l.label}
                        </a>
                      ) : (
                        <Link
                          to={l.href}
                          className="text-muted-foreground transition-colors hover:text-brand-900"
                        >
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Upano</p>
          <p>Personal Project built by Michael Yeates</p>
        </div>
      </div>
    </footer>
  );
}
