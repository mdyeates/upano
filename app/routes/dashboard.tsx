import { Form, useLoaderData } from "react-router";

import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { requireUser } from "~/lib/auth.server";

import type { Route } from "./+types/dashboard";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Dashboard — Upano" },
    { name: "description", content: "Your Upano dashboard." },
  ];
}

/**
 * Loader: server-side auth gate. `requireUser` throws redirect("/login")
 * if there's no session to the login page.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  return { user };
}

export default function DashboardPage() {
  const { user } = useLoaderData<typeof loader>();

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

/**
 * RR7 renders this during the loader's network round-trip and during
 * client side hydration before the loader's data is hydrated.
 */
export function HydrateFallback() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Skeleton className="h-6 w-20" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-12">
        <Skeleton className="h-10 w-72" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-4 w-3/4 max-w-xl" />
          <Skeleton className="h-4 w-5/6 max-w-xl" />
        </div>
      </main>
    </div>
  );
}
