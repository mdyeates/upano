import { Link } from "react-router";

import type { FooterColumn } from "~/content/marketing";

export function FooterSection({
  tagline,
  credit,
  columns,
}: {
  tagline: string;
  credit: string;
  columns: FooterColumn[];
}) {
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
            <p className="mt-3 text-sm text-muted-foreground">{tagline}</p>
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
          <p>{credit}</p>
        </div>
      </div>
    </footer>
  );
}
