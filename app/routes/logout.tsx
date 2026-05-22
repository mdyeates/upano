import { redirect } from "react-router";

import {
  authCookieHeaders,
  invalidateSessionCache,
  postAuth,
} from "~/lib/auth/auth.server";

import type { Route } from "./+types/logout";

/**
 * Logout action: logs the user out of the application.
 * POSTs to Neon /sign-out, forwards the cookie,
 * header from the response and sets that as the set-cookie
 * header on the redirect. Uses a loader and action
 * to make it idempotent (calling /logout multiple times is fine).
 */
export async function action({ request }: Route.ActionArgs) {
  const cookie = request.headers.get("cookie");
  const { setCookie } = await postAuth(request, "/sign-out", {});
  if (cookie) {
    invalidateSessionCache(cookie);
  }
  return redirect("/", { headers: authCookieHeaders(setCookie) });
}

export async function loader(_: Route.LoaderArgs) {
  return redirect("/");
}
