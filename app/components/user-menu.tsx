import { Form } from "react-router";

import { Button } from "~/components/ui/button";

/**
 * Returns signed-in user + sign-out action.
 */
export function UserMenu({
  email,
  variant = "header",
}: {
  email: string;
  variant?: "header" | "sidebar";
}) {
  if (variant === "sidebar") {
    return (
      <div className="flex w-full min-w-0 flex-col gap-2">
        <div title={email} className="min-w-0 text-xs text-muted-foreground">
          <span className="block uppercase tracking-wide opacity-70">
            Signed in as
          </span>
          <span className="block truncate text-sm font-medium text-foreground">
            {email}
          </span>
        </div>
        <Form method="post" action="/logout" className="w-full">
          <Button
            type="submit"
            size="pill-sm"
            variant="outline"
            className="w-full"
          >
            Sign out
          </Button>
        </Form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-muted-foreground sm:inline">
        Signed in as <span className="text-foreground">{email}</span>
      </span>
      <Form method="post" action="/logout">
        <Button type="submit" size="pill-sm" variant="outline">
          Sign out
        </Button>
      </Form>
    </div>
  );
}
