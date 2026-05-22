import { beforeEach, describe, expect, it, vi } from "vitest";
import { assertIsResponse } from "~/routes/tests/helpers";

const getSessionMock = vi.hoisted(() => vi.fn());
vi.mock("~/lib/auth/auth.server", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("~/lib/auth/auth.server")>();
  return {
    ...actual,
    getSession: getSessionMock,
  };
});

const ensureLocalUserMock = vi.hoisted(() => vi.fn());
vi.mock("~/lib/auth/upsert-user.server", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("~/lib/auth/upsert-user.server")>();
  return {
    ...actual,
    ensureLocalUser: ensureLocalUserMock,
  };
});

vi.mock("~/database/context", () => ({
  database: () => {
    throw new Error(
      "database() should not be called by middleware on the unauth path",
    );
  },
}));

const { requireUserMiddleware } =
  await import("~/lib/auth/auth-middleware.server");

beforeEach(() => {
  getSessionMock.mockReset();
  ensureLocalUserMock.mockReset();
});

describe("requireUserMiddleware", () => {
  it("redirects unauthenticated requests to /login", async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const request = new Request("http://localhost:3000/dashboard", {
      method: "GET",
    });
    const next = vi.fn();

    let thrown: unknown;
    try {
      await requireUserMiddleware(
        {
          request,
          context: {} as Parameters<typeof requireUserMiddleware>[0]["context"],
          params: {},
        } as Parameters<typeof requireUserMiddleware>[0],
        next,
      );
    } catch (e) {
      thrown = e;
    }

    // The middleware throws a redirect Response.
    assertIsResponse(thrown);
    expect(thrown.status).toBe(302);
    expect(thrown.headers.get("Location")).toBe("/login?next=%2Fdashboard");
    // next() must NOT have been invoked. If it had been,
    // unauthenticated requests would proceed to the loader.
    expect(next).not.toHaveBeenCalled();
  });

  it("treats a session with no user as unauthenticated", async () => {
    // Edge case: getSession returns an object, but the user field is
    // missing.(e.g. if Neon's API ever returns 200 with an
    // empty body during an outage). Middleware must redirect.
    getSessionMock.mockResolvedValueOnce({ user: null });

    const request = new Request("http://localhost:3000/admin");
    const next = vi.fn();

    let thrown: unknown;
    try {
      await requireUserMiddleware(
        {
          request,
          context: {} as Parameters<typeof requireUserMiddleware>[0]["context"],
          params: {},
        } as Parameters<typeof requireUserMiddleware>[0],
        next,
      );
    } catch (e) {
      thrown = e;
    }

    assertIsResponse(thrown);
    expect(thrown.status).toBe(302);
    expect(next).not.toHaveBeenCalled();
  });
});
