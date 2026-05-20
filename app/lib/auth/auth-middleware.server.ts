import { createContext, redirect } from "react-router";
import type { MiddlewareFunction } from "react-router";

import { database } from "~/database/context";
import type { User } from "~/database/schema";
import type { AuthUser } from "./auth.server";
import { getSession } from "./auth.server";
import { ensureLocalUser } from "./upsert-user.server";

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

 */

/**
 * Context key for the authenticated user stashed by the middleware.
 */
export const userContext = createContext<AuthUser | null>(null);
export const localUserContext = createContext<User | null>(null);

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
  const localUser = await ensureLocalUser(database(), session.user);
  context.set(userContext, session.user);
  context.set(localUserContext, localUser);
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

/**
 * Returns the local users row (id + role + displayName + timestamps).
 * Loaders/actions use this for role-based authorisation.
 */
export function getLocalUser(context: {
  get: <T>(c: ReturnType<typeof createContext<T>>) => T;
}): User {
  const user = context.get(localUserContext);
  if (!user) {
    throw new Error(
      "getLocalUser() called without requireUserMiddleware on the route. " +
        "Add `export const middleware = [requireUserMiddleware]` to the route module.",
    );
  }
  return user;
}
