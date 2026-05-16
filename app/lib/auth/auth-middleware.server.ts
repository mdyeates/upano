/**
 * Server-side auth middleware.
 *
 * Pattern: any route that needs an authenticated user adds
 *
 *   `export const middleware = [requireUserMiddleware];`
 *
 * to its module. The middleware reads the session cookie via Neon Auth's
 * REST API, redirects to /login if absent, and stashes the user on the
 * routing context so the loader/action can read it without re-fetching.
 *
 */
import { createContext, redirect } from "react-router";
import type { MiddlewareFunction } from "react-router";

import type { AuthUser } from "./auth.server";
import { getSession } from "./auth.server";

/**
 * Context key for the authenticated user stashed by the middleware.
 */
export const userContext = createContext<AuthUser | null>(null);

/**
 * Middleware: guarantees an authenticated user before the loader runs.
 * Redirects to /login?next=<current-path> if no session.
 */
export const requireUserMiddleware: MiddlewareFunction<Response> = async (
  { request, context },
  next,
) => {
  const session = await getSession(request);
  if (!session?.user) {
    const url = new URL(request.url);
    const next = url.pathname + url.search;
    throw redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  context.set(userContext, session.user);
  return next();
};

/**
 * Helper for loaders/actions that ran behind requireUserMiddleware.
 * Throws if called from a route that didn't gate via the middleware
 */
export function getUser(context: {
  get: <T>(c: ReturnType<typeof createContext<T>>) => T;
}): AuthUser {
  const user = context.get(userContext);
  if (!user) {
    throw new Error(
      "getUser() called without requireUserMiddleware on the route. " +
        "Add `export const middleware = [requireUserMiddleware]` to the route module.",
    );
  }
  return user;
}
