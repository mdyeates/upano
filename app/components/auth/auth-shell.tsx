import { ArrowLeftIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

/**
 * Shared layout for /login and /register.
 *
 */
export function AuthPageShell({
  title,
  description,
  children,
  altAction,
}: {
  title: string;
  description: string;
  children: ReactNode;
  altAction: AltActionConfig;
}) {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto mb-6 max-w-xl px-4 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>

      {children}

      <AuthAltAction {...altAction} />
    </div>
  );
}

type AltActionConfig = {
  prompt: string;
  linkLabel: string;
  to: string;
};

function AuthAltAction({ prompt, linkLabel, to }: AltActionConfig) {
  return (
    <>
      <div className="mx-auto mt-6 max-w-xl px-4 text-center text-sm text-muted-foreground">
        {prompt}{" "}
        <Link to={to} className="text-brand-300 hover:text-brand-900">
          {linkLabel}
        </Link>
      </div>

      <div className="mx-auto mt-4 max-w-xl px-4 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-brand-900"
        >
          <ArrowLeftIcon className="size-3" />
          Back to home
        </Link>
      </div>
    </>
  );
}

export function AuthFormError({ message }: { message: string }) {
  return (
    <div className="mx-auto mb-6 max-w-xl px-4">
      <div
        role="alert"
        aria-live="polite"
        className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      >
        {message}
      </div>
    </div>
  );
}
