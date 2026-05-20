import { redirect } from "react-router";
import { createHash } from "node:crypto";

const AUTH_URL = process.env.VITE_NEON_AUTH_URL;
const SESSION_CACHE_TTL_MS = 30_000;

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  image?: string | null;
};

export type AuthSession = {
  user: AuthUser;
  session: Record<string, unknown>;
};

function originFor(request: Request): string {
  const proto = request.headers.get("x-forwarded-proto");
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (proto && host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

if (!AUTH_URL) {
  console.error("VITE_NEON_AUTH_URL is not set. Auth REST calls will fail.");
}

/**
 * Forward the inbound request's Cookie header to Neon Auth so it can
 * verify the session. Returns null if no session.
 */

const sessionCache = new Map<
  string,
  { session: AuthSession | null; expiresAt: number }
>();

function hashCookie(cookie: string): string {
  return createHash("sha256").update(cookie).digest("hex");
}

export async function getSession(
  request: Request,
): Promise<AuthSession | null> {
  if (!AUTH_URL) return null;
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;

  const cacheKey = hashCookie(cookie);
  const now = Date.now();
  const cached = sessionCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.session;
  }

  const upstream = await fetch(`${AUTH_URL}/get-session`, {
    method: "GET",
    headers: {
      cookie,
      origin: originFor(request),
    },
  });
  if (!upstream.ok) {
    sessionCache.set(cacheKey, {
      session: null,
      expiresAt: now + SESSION_CACHE_TTL_MS,
    });
    return null;
  }
  const session = (await upstream.json()) as AuthSession | null;
  sessionCache.set(cacheKey, {
    session,
    expiresAt: now + SESSION_CACHE_TTL_MS,
  });
  return session;
}

export function invalidateSessionCache(cookie: string): void {
  sessionCache.delete(hashCookie(cookie));
}

/**
 * Redirects to /login if no session.
 * Throwing the redirect is RR7 idiomatic: it short-circuits the
 * loader and the framework treats it as a normal navigation.
 */
export async function requireUser(request: Request): Promise<AuthUser> {
  const session = await getSession(request);
  if (!session?.user) {
    const url = new URL(request.url);
    const next = url.pathname + url.search;
    throw redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  return session.user;
}

/**
 * POST credentials to Neon Auth's REST API.
 */
export async function postAuth(
  request: Request,
  path: "/sign-in/email" | "/sign-up/email" | "/sign-out",
  body: Record<string, unknown>,
): Promise<{ status: number; body: AuthApiBody; setCookie: string | null }> {
  if (!AUTH_URL) {
    return {
      status: 500,
      body: { code: "AUTH_NOT_CONFIGURED", message: "Auth URL is missing." },
      setCookie: null,
    };
  }
  const upstream = await fetch(`${AUTH_URL}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: originFor(request),
      // Forward existing cookies so /sign-out can identify the session.
      ...(request.headers.get("cookie")
        ? { cookie: request.headers.get("cookie") as string }
        : {}),
    },
    body: JSON.stringify(body),
  });
  // Neon's responses always look like { code, message } on error or
  // { user, token, ... } on success.
  let parsed: AuthApiBody;
  try {
    parsed = (await upstream.json()) as AuthApiBody;
  } catch {
    parsed = {
      code: "BAD_RESPONSE",
      message: "Auth backend returned non-JSON.",
    };
  }
  return {
    status: upstream.status,
    body: parsed,
    setCookie: upstream.headers.get("set-cookie"),
  };
}

export type AuthApiBody = {
  code?: string;
  message?: string;
  user?: AuthUser;
  token?: string;
};

/**
 * Maps Neon Auth error codes to our internal user-friendly messages.
 */
export function mapAuthError(
  status: number,
  body: AuthApiBody,
): { code: AuthErrorCode; message: string } {
  const code = body.code ?? "UNKNOWN";
  switch (code) {
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
    case "USER_EMAIL_EXISTS":
      return {
        code: "USER_ALREADY_EXISTS",
        message:
          "An account with that email already exists. Try logging in instead.",
      };
    case "INVALID_EMAIL_OR_PASSWORD":
    case "INVALID_CREDENTIALS":
      return {
        code: "INVALID_EMAIL_OR_PASSWORD",
        message: "Email or password is incorrect.",
      };
    case "INVALID_EMAIL":
      return { code: "INVALID_EMAIL", message: "That email isn’t valid." };
    case "PASSWORD_TOO_SHORT":
      return {
        code: "PASSWORD_TOO_SHORT",
        message: "Password must be at least 8 characters.",
      };
    case "RATE_LIMIT_EXCEEDED":
      return {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many attempts. Wait a minute and try again.",
      };
    default:
      // Fall back to the upstream message if we don't have a mapped one (dev)
      return {
        code: "UNKNOWN",
        message:
          body.message ??
          (status >= 500
            ? "Auth service is temporarily unavailable."
            : "Couldn’t complete the request."),
      };
  }
}

export type AuthErrorCode =
  | "USER_ALREADY_EXISTS"
  | "INVALID_EMAIL_OR_PASSWORD"
  | "INVALID_EMAIL"
  | "PASSWORD_TOO_SHORT"
  | "RATE_LIMIT_EXCEEDED"
  | "UNKNOWN";

/**
 * Build response headers that forward Neon's Set-Cookie to the
 * browser.
 */
export function authCookieHeaders(setCookie: string | null): HeadersInit {
  if (!setCookie) return {};
  return { "set-cookie": setCookie };
}
