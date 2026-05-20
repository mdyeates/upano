import type { ReactNode } from "react";
import { Link } from "react-router";

import { AppNav, type AppNavPage } from "~/components/app-nav";
import { UserMenu } from "~/components/user-menu";
import { cn } from "~/lib/utils/utils";

/**
 * Re-usable application shell for authed pages.
 * Includes the shared top bar (logo, nav, user menu) and left sidebar
 * (logo, nav, user menu) for desktop viewport.
 */
export function AppShell({
  current,
  email,
  role,
  asHeading = false,
  children,
  mainClassName,
}: {
  current: AppNavPage;
  email: string;
  role?: "reporter" | "sde" | "admin";
  asHeading?: boolean;
  children: ReactNode;
  mainClassName?: string;
}) {
  const Logo = asHeading ? (
    <h1 className="font-heading text-lg font-semibold text-brand-900">Upano</h1>
  ) : (
    <Link
      to="/dashboard"
      className="font-heading text-lg font-semibold text-brand-900"
    >
      Upano
    </Link>
  );

  return (
    <div className="min-h-screen bg-background md:flex md:h-screen md:overflow-hidden">
      {/* Mobile / small-screen top bar. */}
      <header className="md:hidden">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            {Logo}
            <AppNav current={current} role={role} />
          </div>
          <UserMenu email={email} />
        </div>
      </header>

      {/* Left sidebar. */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center px-5">{Logo}</div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <AppNav current={current} role={role} orientation="vertical" />
        </div>
        <div className="border-t border-border px-3 py-3">
          <UserMenu email={email} variant="sidebar" />
        </div>
      </aside>

      {/* Main content. */}
      <main
        className={cn(
          "md:flex-1 md:overflow-y-auto",
          mainClassName ?? "container mx-auto max-w-6xl px-4 py-8",
        )}
      >
        {children}
      </main>
    </div>
  );
}
