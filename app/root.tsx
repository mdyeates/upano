import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
  type ShouldRevalidateFunctionArgs,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { Toaster } from "~/components/ui/sonner";
import { ThemeProvider } from "~/lib/theme/theme";
import { getTheme } from "~/lib/theme/theme.server";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap",
  },
];

/**
 * Reads the theme cookie so we can apply theme consistently.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const theme = await getTheme(request);
  return { theme };
}

/**
 * The theme cookie only changes when the user toggles, and the toggle
 * action already updates state optimistically.
 * Without this opt-out, every action on every route would
 * refetch root for no reason.
 */
export function shouldRevalidate({
  formAction,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  // Only revalidate when /theme was the action target.
  if (formAction === "/theme") return true;
  return defaultShouldRevalidate;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root");
  const theme = data?.theme ?? "dark";
  return (
    <html lang="en" className={theme} style={{ colorScheme: theme }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <ThemeProvider initialTheme={loaderData.theme}>
      <Outlet />
      <Toaster position="bottom-right" richColors closeButton duration={5000} />
    </ThemeProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    // Friendly Route error responses thrown from loaders/actions.
    switch (error.status) {
      case 401:
        message = "401: You are not signed in.";
        details =
          "You need to be signed in to view this page. Please sign in or register, and try again.";
        break;
      case 403:
        message = "403: Forbidden";
        details =
          "You do not have permission to view this page. If you think you should, ask an Admin.";
        break;
      case 404:
        message = "404: Page not found";
        details =
          "The requested page could not be found. Please return to the home page.";
        break;
      case 409:
        message = "409: Conflict";
        details =
          error.statusText ||
          "That action conflicts with the current state. Refresh and try again.";
        break;
      default:
        message = `${error.status} — Error`;
        details = error.statusText || details;
    }
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center px-4 py-16">
      <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
        Something went wrong
      </p>
      <h1 className="mt-2 heading-page">{message}</h1>
      <p className="mt-3 text-base text-muted-foreground">{details}</p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href="/dashboard"
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go to dashboard
        </a>
        <a
          href="/"
          className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
        >
          Go home
        </a>
      </div>
      {stack && (
        <pre className="mt-8 w-full overflow-x-auto rounded-md border border-border bg-muted/50 p-4 text-xs">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
