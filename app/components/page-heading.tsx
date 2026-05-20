import type { ReactNode } from "react";

import { cn } from "~/lib/utils/utils";

export function PageHeading({
  title,
  subtitle,
  actions,
  as: As = "h1",
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Stack on mobile so actions don't squeeze the title; flip to
        // baseline-aligned row on sm+ where the screen has room.
        "flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        <As className="heading-page">{title}</As>
        {subtitle && (
          <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      )}
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
  as: As = "h2",
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  as?: "h2" | "h3";
  className?: string;
}) {
  return (
    <div className={className}>
      <As className="heading-section">{title}</As>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
