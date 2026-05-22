import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import type { AuthUser } from "~/lib/auth/auth.server";
import {
  localUserContext,
  userContext,
} from "~/lib/auth/auth-middleware.server";
import type { User } from "~/database/schema";

/**
 * Test helpers for RR7 actions/loaders.
 *
 * RR7 actions return either:
 *   - `DataWithResponseInit { type, data, init }` from `data(body, init)`
 *   - A real `Response` from `redirect(url, init)`
 *
 * This is an unfortunate design decision that makes testing harder than
 * it needs to be. See discussion:
 * https://github.com/remix-run/react-router/discussions/12840
 */

export function assertIsDataWithResponseInit(value: unknown): asserts value is {
  type: "DataWithResponseInit";
  data: unknown;
  init: ResponseInit;
} {
  if (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "data" in value &&
    "init" in value &&
    (value as { type: unknown }).type === "DataWithResponseInit"
  ) {
    return;
  }
  throw new Error(
    `Expected DataWithResponseInit but got ${
      value === null ? "null" : typeof value
    }`,
  );
}

export function assertIsResponse(value: unknown): asserts value is Response {
  if (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "headers" in value &&
    (value as { headers: unknown }).headers instanceof Headers
  ) {
    return;
  }
  throw new Error(
    `Expected Response but got ${value === null ? "null" : typeof value}`,
  );
}

/** Build a POST Request with form fields, for invoking action() in tests. */
export function postRequest(
  url: string,
  fields: Record<string, string>,
): Request {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return new Request(url, { method: "POST", body: fd });
}

/**
 * Build a populated `ActionFunctionArgs` from a Request.
 */
export function makeActionArgs(
  request: Request,
  pattern = "/",
): ActionFunctionArgs {
  return {
    request,
    url: new URL(request.url),
    pattern,
    params: {},
    // Cast: real RR7 supplies a RouterContextProvider when middleware is
    // enabled; tests don't exercise context so an empty object is fine.
    context: {} as ActionFunctionArgs["context"],
  };
}

export function makeLoaderArgs(
  request: Request,
  pattern = "/",
): LoaderFunctionArgs {
  return {
    request,
    url: new URL(request.url),
    pattern,
    params: {},
    context: {} as LoaderFunctionArgs["context"],
  };
}

/**
 * Invoke an action with form fields as if a browser POSTed them.
 *
 *   submit(action, "/login", { email, password })
 */
export const submit = <R>(
  action: (args: ActionFunctionArgs) => Promise<R>,
  url: string,
  fields: Record<string, string>,
): Promise<R> => action(makeActionArgs(postRequest(url, fields)));

/**
 * Invoke a loader with a GET request.
 *
 *   load(loader, "/dashboard")
 */
export const load = <R>(
  loader: (args: LoaderFunctionArgs) => Promise<R>,
  url: string,
): Promise<R> => loader(makeLoaderArgs(new Request(url, { method: "GET" })));

/**
 * Build a fake context with a populated localUser + authUser, the way
 * requireUserMiddleware would set them in production. Use this for
 * tests that exercise loaders/actions calling getLocalUser/getUser.
 */
export function makeAuthedContext({
  localUser,
  authUser,
}: {
  localUser: User;
  authUser?: Partial<AuthUser>;
}): ActionFunctionArgs["context"] {
  const store = new Map<unknown, unknown>();
  const fullAuthUser: AuthUser = {
    id: localUser.id,
    email: "test@example.com",
    name: "Test User",
    image: null,
    ...authUser,
  } as AuthUser;
  store.set(localUserContext, localUser);
  store.set(userContext, fullAuthUser);
  return {
    get: (c: unknown) => store.get(c) ?? null,
    set: (c: unknown, v: unknown) => {
      store.set(c, v);
    },
  } as unknown as ActionFunctionArgs["context"];
}

/**
 * Build a populated ActionFunctionArgs with an authed context.
 */
export function makeAuthedActionArgs(
  request: Request,
  ctx: { localUser: User; authUser?: Partial<AuthUser> },
  pattern = "/",
  params: Record<string, string> = {},
): ActionFunctionArgs {
  return {
    request,
    url: new URL(request.url),
    pattern,
    params,
    context: makeAuthedContext(ctx),
  };
}

/**
 * Invoke an action as a logged-in user. Combines submit + makeAuthedContext.
 */
export const submitAuthed = <R>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (args: any) => Promise<R>,
  url: string,
  ctx: {
    localUser: User;
    authUser?: Partial<AuthUser>;
    params?: Record<string, string>;
  },
  fields: Record<string, string>,
): Promise<R> =>
  action(
    makeAuthedActionArgs(
      postRequest(url, fields),
      { localUser: ctx.localUser, authUser: ctx.authUser },
      "/",
      ctx.params,
    ),
  );
