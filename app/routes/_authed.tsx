import { Outlet } from "react-router";

import {
  getLocalUser,
  getUser,
  requireUserMiddleware,
} from "~/lib/auth/auth-middleware.server";

import type { Route } from "./+types/_authed";

/**
 * Layout route for every authenticated page.
 * Auth context is available to every child loader/action via
 * getUser(context) / getLocalUser(context).
 */
export const middleware = [requireUserMiddleware];

export async function loader({ context }: Route.LoaderArgs) {
  const authUser = getUser(context);
  const localUser = getLocalUser(context);
  return {
    currentUserId: localUser.id,
    currentUserEmail: authUser.email,
    currentUserName: authUser.name ?? authUser.email,
    currentUserRole: localUser.role,
  };
}

export default function AuthedLayout() {
  return <Outlet />;
}
