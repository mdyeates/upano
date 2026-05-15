import { Form } from "react-router";

import { Button } from "~/components/ui/button";
import { getUser, requireUserMiddleware } from "~/lib/auth-middleware.server";

import type { Route } from "./+types/dashboard";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Dashboard — Upano" },
    { name: "description", content: "Your Upano dashboard." },
  ];
}

/**
 * Auth gate: redirects to /login if no session.
 * Runs server-side; the loader below trusts the user is present.
 */
export const middleware = [requireUserMiddleware];

/**
 * Loader pulls the user off the routing context populated by
 * requireUserMiddleware.
 */
export async function loader({ context }: Route.LoaderArgs) {
  return { user: getUser(context) };
}

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <h1 className="font-heading text-lg font-semibold text-brand-900">
            Upano
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Signed in as <span className="text-foreground">{user.email}</span>
            </span>
            <Form method="post" action="/logout">
              <Button type="submit" size="pill-sm" variant="outline">
                Sign out
              </Button>
            </Form>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
          Welcome{user.name ? `, ${user.name.split(" ")[0]}` : ""}.
        </h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Welcome to your workspace. Start by submitting a bug or browsing your
          team's recent activity.
        </p>
      </main>
    </div>
  );
}
